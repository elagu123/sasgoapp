/**
 * Redis Caching Service
 * Provides centralized caching functionality for performance optimization
 */

import Redis from 'ioredis';
import type { Trip, User, Expense } from '@prisma/client';

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  maxRetriesPerRequest?: number;
}

export class CacheService {
  private redis: Redis;
  private isConnected: boolean = false;

  constructor(config?: CacheConfig) {
    const defaultConfig: CacheConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: 'sasgoapp:',
      maxRetriesPerRequest: 3
    };

    const finalConfig = { ...defaultConfig, ...config };

    this.redis = new Redis({
      host: finalConfig.host,
      port: finalConfig.port,
      password: finalConfig.password,
      db: finalConfig.db,
      keyPrefix: finalConfig.keyPrefix,
      maxRetriesPerRequest: finalConfig.maxRetriesPerRequest,
      lazyConnect: true
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      console.log('🔗 Redis connected');
      this.isConnected = true;
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis error:', error);
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      console.log('🔌 Redis connection closed');
      this.isConnected = false;
    });

    this.redis.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });
  }

  public async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.redis.connect();
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.redis.disconnect();
    }
  }

  public isHealthy(): boolean {
    return this.isConnected && this.redis.status === 'ready';
  }

  // Generic cache operations
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        return await this.redis.del(...keys);
      }
      return 0;
    } catch (error) {
      console.error(`Cache invalidate pattern error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  // User-specific cache operations
  async getUserTrips(userId: string): Promise<Trip[] | null> {
    return this.get<Trip[]>(`user:${userId}:trips`);
  }

  async setUserTrips(userId: string, trips: Trip[], ttl: number = 300): Promise<boolean> {
    return this.set(`user:${userId}:trips`, trips, ttl);
  }

  async invalidateUserTrips(userId: string): Promise<boolean> {
    return this.del(`user:${userId}:trips`);
  }

  // Trip-specific cache operations
  async getTripDetails(tripId: string): Promise<Trip | null> {
    return this.get<Trip>(`trip:${tripId}:details`);
  }

  async setTripDetails(tripId: string, trip: Trip, ttl: number = 600): Promise<boolean> {
    return this.set(`trip:${tripId}:details`, trip, ttl);
  }

  async getTripExpenses(tripId: string): Promise<Expense[] | null> {
    return this.get<Expense[]>(`trip:${tripId}:expenses`);
  }

  async setTripExpenses(tripId: string, expenses: Expense[], ttl: number = 300): Promise<boolean> {
    return this.set(`trip:${tripId}:expenses`, expenses, ttl);
  }

  async invalidateTripCache(tripId: string): Promise<void> {
    await Promise.all([
      this.del(`trip:${tripId}:details`),
      this.del(`trip:${tripId}:expenses`),
      this.invalidatePattern(`trip:${tripId}:*`)
    ]);
  }

  // Session cache operations
  async getSession(sessionId: string): Promise<any | null> {
    return this.get(`session:${sessionId}`);
  }

  async setSession(sessionId: string, sessionData: any, ttl: number = 3600): Promise<boolean> {
    return this.set(`session:${sessionId}`, sessionData, ttl);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.del(`session:${sessionId}`);
  }

  // Permission cache operations
  async getUserPermissions(userId: string, tripId: string): Promise<string | null> {
    return this.get<string>(`permissions:${userId}:${tripId}`);
  }

  async setUserPermissions(userId: string, tripId: string, permissions: string, ttl: number = 600): Promise<boolean> {
    return this.set(`permissions:${userId}:${tripId}`, permissions, ttl);
  }

  async invalidateUserPermissions(userId: string, tripId?: string): Promise<void> {
    if (tripId) {
      await this.del(`permissions:${userId}:${tripId}`);
    } else {
      await this.invalidatePattern(`permissions:${userId}:*`);
    }
  }

  // AI/External API cache operations
  async getAIResponse(cacheKey: string): Promise<any | null> {
    return this.get(`ai:${cacheKey}`);
  }

  async setAIResponse(cacheKey: string, response: any, ttl: number = 1800): Promise<boolean> {
    return this.set(`ai:${cacheKey}`, response, ttl);
  }

  // Weather cache operations
  async getWeatherData(location: string): Promise<any | null> {
    return this.get(`weather:${location}`);
  }

  async setWeatherData(location: string, weatherData: any, ttl: number = 3600): Promise<boolean> {
    return this.set(`weather:${location}`, weatherData, ttl);
  }

  // Rate limiting operations
  async incrementRateLimit(key: string, windowSize: number, limit: number): Promise<{ count: number; resetTime: number; allowed: boolean }> {
    try {
      const multi = this.redis.multi();
      const now = Date.now();
      const window = Math.floor(now / (windowSize * 1000));
      const rateLimitKey = `ratelimit:${key}:${window}`;

      multi.incr(rateLimitKey);
      multi.expire(rateLimitKey, windowSize);
      
      const results = await multi.exec();
      const count = results?.[0]?.[1] as number || 0;
      const resetTime = (window + 1) * windowSize * 1000;
      
      return {
        count,
        resetTime,
        allowed: count <= limit
      };
    } catch (error) {
      console.error(`Rate limit error for key ${key}:`, error);
      return { count: 0, resetTime: Date.now() + windowSize * 1000, allowed: true };
    }
  }

  // Alias for backward compatibility
  async delPattern(pattern: string): Promise<number> {
    return this.invalidatePattern(pattern);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; latency?: number }> {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency
      };
    } catch (error) {
      return {
        status: 'unhealthy'
      };
    }
  }
}

// Singleton instance
let cacheService: CacheService;

export const getCacheService = (): CacheService => {
  if (!cacheService) {
    cacheService = new CacheService();
  }
  return cacheService;
};

export const initializeCache = async (): Promise<CacheService> => {
  const service = getCacheService();
  await service.connect();
  return service;
};