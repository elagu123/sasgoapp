/**
 * Authentication Domain Service
 * Encapsulates all authentication-related business logic
 * This is the first step towards microservices - creating domain boundaries
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma';
import { getCacheService } from '../../services/cache.service';
import loggingService from '../../services/logging.service';
import { businessMonitoring } from '../../middleware/monitoring.middleware';
import type { User } from '@prisma/client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  tokens: AuthTokens;
}

export class AuthService {
  private cache = getCacheService();
  private readonly ACCESS_TOKEN_EXPIRE = '15m';
  private readonly REFRESH_TOKEN_EXPIRE = '7d';

  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse | null> {
    const { email, password } = credentials;

    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        loggingService.logSecurityEvent('Failed login attempt - user not found', {
          email,
          timestamp: new Date().toISOString()
        });
        businessMonitoring.logAuthOperation('login', undefined, false);
        return null;
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        loggingService.logSecurityEvent('Failed login attempt - invalid password', {
          userId: user.id,
          email,
          timestamp: new Date().toISOString()
        });
        businessMonitoring.logAuthOperation('login', user.id, false);
        return null;
      }

      // Generate tokens
      const tokens = await this.generateTokens(user.id);
      
      // Store refresh token in cache
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;

      loggingService.logAuthEvent('LOGIN', user.id, {
        email: user.email,
        timestamp: new Date().toISOString()
      });

      businessMonitoring.logAuthOperation('login', user.id, true);

      return {
        user: userWithoutPassword,
        tokens
      };
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'login',
        email,
        component: 'auth-service'
      });
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const { name, email, password } = data;

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword
        }
      });

      // Generate tokens
      const tokens = await this.generateTokens(user.id);
      
      // Store refresh token
      await this.storeRefreshToken(user.id, tokens.refreshToken);

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;

      loggingService.logAuthEvent('REGISTER', user.id, {
        email: user.email,
        timestamp: new Date().toISOString()
      });

      businessMonitoring.logAuthOperation('register', user.id, true);

      return {
        user: userWithoutPassword,
        tokens
      };
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'register',
        email,
        component: 'auth-service'
      });
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens | null> {
    try {
      // Verify refresh token
      const payload = this.verifyRefreshToken(refreshToken);
      if (!payload || typeof payload === 'string') {
        return null;
      }

      const userId = payload.sub as string;

      // Check if refresh token exists in cache
      const storedToken = await this.cache.get(`refresh_token:${userId}`);
      if (!storedToken || storedToken !== refreshToken) {
        loggingService.logSecurityEvent('Invalid refresh token used', {
          userId,
          timestamp: new Date().toISOString()
        });
        return null;
      }

      // Verify user still exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true }
      });

      if (!user) {
        await this.invalidateRefreshToken(userId);
        return null;
      }

      // Generate new tokens
      const newTokens = await this.generateTokens(userId);
      
      // Store new refresh token
      await this.storeRefreshToken(userId, newTokens.refreshToken);

      loggingService.logAuthEvent('TOKEN_REFRESH', userId, {
        email: user.email,
        timestamp: new Date().toISOString()
      });

      return newTokens;
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'refresh_token',
        component: 'auth-service'
      });
      return null;
    }
  }

  /**
   * Logout user by invalidating refresh token
   */
  async logout(userId: string): Promise<boolean> {
    try {
      await this.invalidateRefreshToken(userId);

      loggingService.logAuthEvent('LOGOUT', userId, {
        timestamp: new Date().toISOString()
      });

      businessMonitoring.logAuthOperation('logout', userId, true);

      return true;
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'logout',
        userId,
        component: 'auth-service'
      });
      return false;
    }
  }

  /**
   * Verify access token and return user
   */
  async verifyAccessToken(token: string): Promise<User | null> {
    try {
      const payload = this.verifyAccessTokenSignature(token);
      if (!payload || typeof payload === 'string') {
        return null;
      }

      const userId = payload.sub as string;

      // Check cache first
      const cachedUser = await this.cache.get<User>(`user:${userId}`);
      if (cachedUser) {
        return cachedUser;
      }

      // Fetch from database
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (user) {
        // Cache user for 5 minutes
        await this.cache.set(`user:${userId}`, user, 300);
      }

      return user;
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'verify_access_token',
        component: 'auth-service'
      });
      return null;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return false;
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        loggingService.logSecurityEvent('Failed password change - invalid current password', {
          userId,
          timestamp: new Date().toISOString()
        });
        return false;
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      // Invalidate all refresh tokens for this user
      await this.invalidateRefreshToken(userId);

      loggingService.logSecurityEvent('Password changed successfully', {
        userId,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'change_password',
        userId,
        component: 'auth-service'
      });
      return false;
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<Omit<User, 'password'> | null> {
    try {
      // Check cache first
      const cachedUser = await this.cache.get<User>(`user:${userId}`);
      if (cachedUser) {
        const { password, ...userWithoutPassword } = cachedUser;
        return userWithoutPassword;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return null;
      }

      // Cache user
      await this.cache.set(`user:${userId}`, user, 300);

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'get_user_profile',
        userId,
        component: 'auth-service'
      });
      throw error;
    }
  }

  // Private methods

  private async generateTokens(userId: string): Promise<AuthTokens> {
    const accessTokenSecret = process.env.JWT_ACCESS_SECRET;
    const refreshTokenSecret = process.env.JWT_REFRESH_SECRET;

    if (!accessTokenSecret || !refreshTokenSecret) {
      throw new Error('JWT secrets are not configured');
    }

    const accessToken = jwt.sign(
      { 
        sub: userId,
        type: 'access'
      },
      accessTokenSecret,
      { 
        expiresIn: this.ACCESS_TOKEN_EXPIRE,
        issuer: 'sasgoapp',
        audience: 'sasgoapp-frontend'
      }
    );

    const refreshToken = jwt.sign(
      {
        sub: userId,
        type: 'refresh'
      },
      refreshTokenSecret,
      {
        expiresIn: this.REFRESH_TOKEN_EXPIRE,
        issuer: 'sasgoapp',
        audience: 'sasgoapp-frontend'
      }
    );

    return {
      accessToken,
      refreshToken
    };
  }

  private verifyAccessTokenSignature(token: string): any {
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new Error('JWT access secret is not configured');
    }

    return jwt.verify(token, secret, {
      issuer: 'sasgoapp',
      audience: 'sasgoapp-frontend'
    });
  }

  private verifyRefreshToken(token: string): any {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      throw new Error('JWT refresh secret is not configured');
    }

    return jwt.verify(token, secret, {
      issuer: 'sasgoapp',
      audience: 'sasgoapp-frontend'
    });
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    // Store refresh token with expiration (7 days)
    await this.cache.set(`refresh_token:${userId}`, refreshToken, 7 * 24 * 60 * 60);
  }

  private async invalidateRefreshToken(userId: string): Promise<void> {
    await this.cache.del(`refresh_token:${userId}`);
    
    // Also invalidate user cache
    await this.cache.del(`user:${userId}`);
  }
}

// Export singleton instance
export const authService = new AuthService();