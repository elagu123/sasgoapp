/**
 * Rate Limiting Middleware
 * Configurable rate limiting for different endpoints
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export const rateLimitMiddleware = (options: RateLimitOptions) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.maxRequests,
    message: {
      error: options.message || 'Demasiadas peticiones. Por favor intente de nuevo más tarde.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise use IP
      const user = (req as any).user;
      return user?.id || req.ip || 'unknown';
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: options.message || 'Demasiadas peticiones. Por favor intente de nuevo más tarde.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    }
  });
};

// Predefined rate limit configurations
export const RateLimitConfigs = {
  // Very strict - for sensitive operations
  strict: {
    maxRequests: 5,
    windowMs: 60000, // 1 minute
    message: 'Límite de peticiones estricto alcanzado. Intente de nuevo en 1 minuto.'
  },
  
  // Standard API rate limit
  standard: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    message: 'Límite de peticiones estándar alcanzado. Intente de nuevo en 1 minuto.'
  },
  
  // Relaxed for monitoring endpoints
  monitoring: {
    maxRequests: 30,
    windowMs: 60000, // 1 minute
    message: 'Límite de peticiones de monitoreo alcanzado.'
  },
  
  // For authentication endpoints
  auth: {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    message: 'Demasiados intentos de autenticación. Intente de nuevo en 1 minuto.'
  },
  
  // For booking operations
  booking: {
    maxRequests: 20,
    windowMs: 60000, // 1 minute
    message: 'Límite de operaciones de reserva alcanzado.'
  }
};