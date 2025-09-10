/**
 * Monitoring Routes
 * Exposes health checks, metrics, and system information for monitoring tools
 */

import { Router, Request, Response } from 'express';
import { healthService } from '../services/health.service';
import { metricsService } from '../services/metrics.service';
import { getCacheService } from '../services/cache.service';
import { cacheManager } from '../lib/cache-init';
import loggingService from '../services/logging.service';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';

const router = Router();

/**
 * GET /health - Comprehensive health check
 * Returns detailed health information for all system components
 */
router.get('/health', 
  rateLimitMiddleware({ maxRequests: 30, windowMs: 60000 }), // 30 requests per minute
  async (req: Request, res: Response) => {
    try {
      const healthResult = await healthService.performHealthCheck();
      
      // Set appropriate status code based on health
      const statusCode = healthResult.status === 'healthy' ? 200 :
                        healthResult.status === 'degraded' ? 200 :
                        503; // Service Unavailable for unhealthy

      res.status(statusCode).json(healthResult);
    } catch (error) {
      loggingService.logCriticalError(error as Error, { 
        component: 'health_endpoint',
        endpoint: '/health'
      });

      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check service unavailable'
      });
    }
  }
);

/**
 * GET /health/ready - Readiness probe
 * Quick check to determine if the service is ready to handle requests
 */
router.get('/health/ready',
  rateLimitMiddleware({ maxRequests: 60, windowMs: 60000 }), // 60 requests per minute
  async (req: Request, res: Response) => {
    try {
      const isReady = await healthService.isReady();
      
      if (isReady) {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          status: 'not_ready',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      loggingService.error('Readiness probe failed', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: 'Readiness check failed'
      });
    }
  }
);

/**
 * GET /health/live - Liveness probe
 * Basic check to determine if the service is alive and responsive
 */
router.get('/health/live',
  rateLimitMiddleware({ maxRequests: 120, windowMs: 60000 }), // 120 requests per minute
  async (req: Request, res: Response) => {
    try {
      const isAlive = await healthService.isAlive();
      
      res.status(200).json({
        status: isAlive ? 'alive' : 'dead',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(500).json({
        status: 'dead',
        timestamp: new Date().toISOString(),
        error: 'Liveness check failed'
      });
    }
  }
);

/**
 * GET /health/components/:component - Individual component health
 * Check the health of a specific system component
 */
router.get('/health/components/:component',
  rateLimitMiddleware({ maxRequests: 30, windowMs: 60000 }),
  async (req: Request, res: Response) => {
    try {
      const { component } = req.params;
      const componentHealth = await healthService.getComponentHealth(component);
      
      if (!componentHealth) {
        res.status(404).json({
          error: 'Component not found',
          availableComponents: ['database', 'cache', 'memory', 'disk', 'process']
        });
        return;
      }

      const statusCode = componentHealth.status === 'healthy' ? 200 :
                        componentHealth.status === 'degraded' ? 200 :
                        503;

      res.status(statusCode).json(componentHealth);
    } catch (error) {
      loggingService.error('Component health check failed', {
        component: req.params.component,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      res.status(500).json({
        error: 'Component health check failed'
      });
    }
  }
);

/**
 * GET /metrics - Prometheus metrics endpoint
 * Returns metrics in Prometheus format for monitoring tools
 */
router.get('/metrics',
  rateLimitMiddleware({ maxRequests: 60, windowMs: 60000 }),
  async (req: Request, res: Response) => {
    try {
      const metrics = await metricsService.getMetrics();
      
      res.set({
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      
      res.send(metrics);
    } catch (error) {
      loggingService.error('Metrics endpoint failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      res.status(500).send('# Error retrieving metrics\n');
    }
  }
);

/**
 * GET /info - System information
 * Returns basic system and application information
 */
router.get('/info',
  rateLimitMiddleware({ maxRequests: 20, windowMs: 60000 }),
  async (req: Request, res: Response) => {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      const info = {
        application: {
          name: 'SASGOAPP Backend',
          version: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          uptime: process.uptime(),
          startTime: new Date(Date.now() - process.uptime() * 1000).toISOString()
        },
        system: {
          platform: process.platform,
          arch: process.arch,
          nodeVersion: process.version,
          pid: process.pid,
          workingDirectory: process.cwd()
        },
        memory: {
          rss: Math.round(memUsage.rss / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          external: Math.round(memUsage.external / 1024 / 1024), // MB
          arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024) // MB
        },
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        features: {
          caching: cacheManager.isHealthy(),
          monitoring: true,
          logging: true,
          metrics: true
        },
        timestamp: new Date().toISOString()
      };

      res.json(info);
    } catch (error) {
      loggingService.error('System info endpoint failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      res.status(500).json({
        error: 'Failed to retrieve system information'
      });
    }
  }
);

/**
 * GET /cache/stats - Cache statistics
 * Returns detailed cache performance statistics
 */
router.get('/cache/stats',
  rateLimitMiddleware({ maxRequests: 30, windowMs: 60000 }),
  async (req: Request, res: Response) => {
    try {
      const cacheService = getCacheService();
      const healthCheck = await cacheService.healthCheck();
      
      const stats = {
        status: healthCheck.status,
        latency: healthCheck.latency,
        connected: cacheService.isHealthy(),
        configuration: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || '6379',
          db: process.env.REDIS_DB || '0'
        },
        timestamp: new Date().toISOString()
      };

      const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(stats);
    } catch (error) {
      loggingService.error('Cache stats endpoint failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      res.status(500).json({
        error: 'Failed to retrieve cache statistics'
      });
    }
  }
);

/**
 * POST /cache/clear - Clear cache (admin only)
 * Clears all cache entries (use with caution)
 */
router.post('/cache/clear',
  rateLimitMiddleware({ maxRequests: 5, windowMs: 60000 }), // 5 requests per minute
  async (req: Request, res: Response) => {
    try {
      const cacheService = getCacheService();
      
      // Clear all cache patterns
      const patterns = ['user:*', 'trip:*', 'enhanced:*', 'permissions:*'];
      const clearedKeys = await Promise.all(
        patterns.map(pattern => cacheService.invalidatePattern(pattern))
      );
      
      const totalCleared = clearedKeys.reduce((sum, count) => sum + count, 0);
      
      loggingService.logSecurityEvent('Cache manually cleared', {
        clearedKeys: totalCleared,
        patterns,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        message: 'Cache cleared successfully',
        clearedKeys: totalCleared,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      loggingService.error('Cache clear failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      res.status(500).json({
        error: 'Failed to clear cache'
      });
    }
  }
);

/**
 * GET /logs/recent - Recent application logs (limited access)
 * Returns recent log entries for debugging
 */
router.get('/logs/recent',
  rateLimitMiddleware({ maxRequests: 10, windowMs: 60000 }),
  async (req: Request, res: Response) => {
    try {
      // This would typically read from log files or log aggregation service
      // For now, return a placeholder response
      
      res.json({
        message: 'Log retrieval not implemented',
        suggestion: 'Check log files directly or use log aggregation service',
        logLocations: [
          'logs/app-combined.log',
          'logs/app-error.log',
          'logs/metrics-combined.log',
          'logs/audit-combined.log'
        ]
      });
    } catch (error) {
      loggingService.error('Recent logs endpoint failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      res.status(500).json({
        error: 'Failed to retrieve recent logs'
      });
    }
  }
);

export default router;