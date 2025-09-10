/**
 * Enhanced Trip Routes with Caching
 * High-performance routes with Redis caching middleware
 */

import { Router } from 'express';
import { EnhancedTripController } from '../controllers/enhanced-trip.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { csrfProtection } from '../middleware/csrf.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { cacheMiddleware, invalidateCacheMiddleware, CacheConfigs } from '../middleware/cache.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Cache statistics endpoint (no caching needed)
router.get('/cache-stats', 
  rateLimitMiddleware({ maxRequests: 10, windowMs: 60000 }), // 10 requests per minute
  EnhancedTripController.getCacheStats
);

// GET /api/enhanced-trips - Get user trips (cached)
router.get('/',
  rateLimitMiddleware({ maxRequests: 100, windowMs: 60000 }), // 100 requests per minute
  cacheMiddleware({
    ...CacheConfigs.userSpecific,
    ttl: 300, // 5 minutes
    keyGenerator: (req) => {
      const userId = (req as any).user?.id;
      return `enhanced:user:${userId}:trips`;
    }
  }),
  EnhancedTripController.getUserTrips
);

// GET /api/enhanced-trips/:id - Get specific trip (cached)
router.get('/:id',
  rateLimitMiddleware({ maxRequests: 200, windowMs: 60000 }), // 200 requests per minute
  cacheMiddleware({
    ...CacheConfigs.tripSpecific,
    ttl: 600, // 10 minutes
    keyGenerator: (req) => {
      const userId = (req as any).user?.id;
      const tripId = req.params.id;
      return `enhanced:trip:${tripId}:user:${userId}:details`;
    }
  }),
  EnhancedTripController.getTripById
);

// GET /api/enhanced-trips/:id/expenses - Get trip expenses (cached)
router.get('/:id/expenses',
  rateLimitMiddleware({ maxRequests: 150, windowMs: 60000 }), // 150 requests per minute
  cacheMiddleware({
    ...CacheConfigs.tripSpecific,
    ttl: 300, // 5 minutes
    keyGenerator: (req) => {
      const userId = (req as any).user?.id;
      const tripId = req.params.id;
      return `enhanced:trip:${tripId}:user:${userId}:expenses`;
    }
  }),
  EnhancedTripController.getTripExpenses
);

// POST /api/enhanced-trips - Create trip (invalidates user cache)
router.post('/',
  rateLimitMiddleware({ maxRequests: 20, windowMs: 60000 }), // 20 requests per minute
  csrfProtection,
  invalidateCacheMiddleware((req) => {
    const userId = (req as any).user?.id;
    return [
      `enhanced:user:${userId}:trips`,
      `user:${userId}:*` // Invalidate all user-related caches
    ];
  }),
  EnhancedTripController.createTrip
);

// PUT /api/enhanced-trips/:id - Update trip (invalidates trip and user caches)
router.put('/:id',
  rateLimitMiddleware({ maxRequests: 50, windowMs: 60000 }), // 50 requests per minute
  csrfProtection,
  invalidateCacheMiddleware((req) => {
    const userId = (req as any).user?.id;
    const tripId = req.params.id;
    return [
      `enhanced:trip:${tripId}:*`,
      `enhanced:user:${userId}:trips`,
      `trip:${tripId}:*`,
      `user:${userId}:*`,
      `permissions:*:${tripId}` // Invalidate all permissions for this trip
    ];
  }),
  EnhancedTripController.updateTrip
);

// DELETE /api/enhanced-trips/:id - Delete trip (invalidates all related caches)
router.delete('/:id',
  rateLimitMiddleware({ maxRequests: 10, windowMs: 60000 }), // 10 requests per minute
  csrfProtection,
  invalidateCacheMiddleware((req) => {
    const userId = (req as any).user?.id;
    const tripId = req.params.id;
    return [
      `enhanced:trip:${tripId}:*`,
      `enhanced:user:*:trips`, // Invalidate trips for all users (shared users)
      `trip:${tripId}:*`,
      `user:*:trips`, // Invalidate for all shared users
      `permissions:*:${tripId}`
    ];
  }),
  EnhancedTripController.deleteTrip
);

// POST /api/enhanced-trips/:id/share - Share trip (invalidates multiple user caches)
router.post('/:id/share',
  rateLimitMiddleware({ maxRequests: 10, windowMs: 60000 }), // 10 requests per minute
  csrfProtection,
  invalidateCacheMiddleware((req) => {
    const userId = (req as any).user?.id;
    const tripId = req.params.id;
    return [
      `enhanced:trip:${tripId}:*`,
      `enhanced:user:*:trips`, // All users might be affected
      `trip:${tripId}:*`,
      `user:*:trips`,
      `permissions:*:${tripId}`
    ];
  }),
  EnhancedTripController.shareTrip
);

// POST /api/enhanced-trips/:id/expenses - Add expense (invalidates expense cache)
router.post('/:id/expenses',
  rateLimitMiddleware({ maxRequests: 50, windowMs: 60000 }), // 50 requests per minute
  csrfProtection,
  invalidateCacheMiddleware((req) => {
    const tripId = req.params.id;
    return [
      `enhanced:trip:${tripId}:*:expenses`,
      `trip:${tripId}:expenses`
    ];
  }),
  EnhancedTripController.addTripExpense
);

export default router;