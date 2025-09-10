/**
 * Cache Middleware
 * Provides automatic caching for HTTP responses
 */

import { Request, Response, NextFunction } from 'express';
import { getCacheService } from '../services/cache.service';
import crypto from 'crypto';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request, res: Response) => boolean;
  varyBy?: string[]; // Headers to vary cache by (e.g., ['user-id', 'authorization'])
  keyPrefix?: string; // Prefix for cache keys
}

/**
 * Creates a cache middleware for HTTP responses
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator,
    condition,
    varyBy = [],
    keyPrefix
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheService = getCacheService();
    
    // Check if cache service is healthy
    if (!cacheService.isHealthy()) {
      return next();
    }

    // Generate cache key
    const baseKey = keyGenerator ? keyGenerator(req) : generateDefaultCacheKey(req, varyBy);
    const cacheKey = keyPrefix ? `${keyPrefix}:${baseKey}` : baseKey;

    try {
      // Try to get cached response
      const cachedData = await cacheService.get<{
        body: any;
        headers: Record<string, string>;
        statusCode: number;
      }>(cacheKey);

      if (cachedData) {
        // Set cached headers
        Object.entries(cachedData.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        
        // Add cache hit header
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        
        return res.status(cachedData.statusCode).json(cachedData.body);
      }

      // Cache miss - intercept response
      const originalJson = res.json.bind(res);
      const originalStatus = res.status.bind(res);
      let statusCode = 200;

      res.status = function(code: number) {
        statusCode = code;
        return originalStatus(code);
      };

      res.json = function(body: any) {
        // Check condition before caching
        if (condition && !condition(req, res)) {
          res.setHeader('X-Cache', 'SKIP');
          return originalJson(body);
        }

        // Only cache successful responses
        if (statusCode >= 200 && statusCode < 300) {
          const responseData = {
            body,
            headers: extractCacheableHeaders(res),
            statusCode
          };

          // Cache the response asynchronously
          cacheService.set(cacheKey, responseData, ttl).catch(error => {
            console.error('Cache set error:', error);
          });
        }

        res.setHeader('X-Cache', 'MISS');
        res.setHeader('X-Cache-Key', cacheKey);
        
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Generates a default cache key based on request properties
 */
function generateDefaultCacheKey(req: Request, varyBy: string[]): string {
  const baseKey = `${req.method}:${req.path}`;
  
  // Add query parameters
  const queryKey = Object.keys(req.query).length > 0 
    ? crypto.createHash('md5').update(JSON.stringify(req.query)).digest('hex')
    : '';

  // Add vary headers
  const varyKey = varyBy.length > 0
    ? crypto.createHash('md5').update(
        varyBy.map(header => req.headers[header.toLowerCase()] || '').join(':')
      ).digest('hex')
    : '';

  return `http:${baseKey}:${queryKey}:${varyKey}`;
}

/**
 * Extracts cacheable headers from response
 */
function extractCacheableHeaders(res: Response): Record<string, string> {
  const cacheableHeaders = [
    'content-type',
    'content-language',
    'last-modified',
    'etag'
  ];

  const headers: Record<string, string> = {};
  
  cacheableHeaders.forEach(headerName => {
    const value = res.getHeader(headerName);
    if (value && typeof value === 'string') {
      headers[headerName] = value;
    }
  });

  return headers;
}

/**
 * Cache invalidation middleware for write operations
 */
export const invalidateCacheMiddleware = (patterns: string[] | ((req: Request) => string[])) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const cacheService = getCacheService();
    
    if (!cacheService.isHealthy()) {
      return next();
    }

    // Store original response methods
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);
    let statusCode = 200;

    res.status = function(code: number) {
      statusCode = code;
      return originalStatus(code);
    };

    res.json = function(body: any) {
      // Only invalidate cache on successful responses
      if (statusCode >= 200 && statusCode < 300) {
        const invalidationPatterns = Array.isArray(patterns) 
          ? patterns 
          : patterns(req);

        // Invalidate cache patterns asynchronously
        Promise.all(
          invalidationPatterns.map(pattern => cacheService.invalidatePattern(pattern))
        ).catch(error => {
          console.error('Cache invalidation error:', error);
        });
      }

      return originalJson(body);
    };

    next();
  };
};

/**
 * Predefined cache configurations for common use cases
 */
export const CacheConfigs = {
  // Short cache for frequently changing data
  short: { ttl: 60 }, // 1 minute

  // Medium cache for semi-static data
  medium: { ttl: 300 }, // 5 minutes

  // Long cache for static data
  long: { ttl: 3600 }, // 1 hour

  // User-specific cache
  userSpecific: {
    ttl: 300,
    varyBy: ['authorization'],
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.id;
      return `user:${userId}:${req.path}:${JSON.stringify(req.query)}`;
    }
  },

  // Trip-specific cache
  tripSpecific: {
    ttl: 600,
    varyBy: ['authorization'],
    keyGenerator: (req: Request) => {
      const userId = (req as any).user?.id;
      const tripId = req.params.id || req.params.tripId;
      return `trip:${tripId}:user:${userId}:${req.path}:${JSON.stringify(req.query)}`;
    }
  }
};