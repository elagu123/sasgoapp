/**
 * Monitoring Middleware
 * Integrates logging and metrics collection for comprehensive monitoring
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import loggingService from '../services/logging.service';
import metricsService from '../services/metrics.service';
import { performance } from 'perf_hooks';

// Extend Request interface to include monitoring data
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
      user?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}

/**
 * Request ID middleware - adds unique ID to each request
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

/**
 * Request timing middleware - tracks request duration
 */
export const timingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.startTime = performance.now();
  next();
};

/**
 * Comprehensive request logging middleware
 */
export const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = performance.now();
  req.startTime = startTime;

  // Log incoming request
  loggingService.http('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    contentLength: req.headers['content-length'],
    userId: req.user?.id
  });

  // Capture response data
  const originalSend = res.send;
  res.send = function(data: any) {
    const duration = performance.now() - startTime;
    const contentLength = Buffer.byteLength(data || '', 'utf8');
    
    // Log response
    loggingService.logRequest(req, res, duration);
    
    // Record metrics
    const endpoint = normalizeEndpoint(req.route?.path || req.path);
    metricsService.recordHttpRequest(
      req.method,
      endpoint,
      res.statusCode,
      duration,
      req.user?.id
    );

    // Record request/response sizes
    if (req.headers['content-length']) {
      metricsService.recordHttpRequestSize(
        req.method,
        endpoint,
        parseInt(req.headers['content-length'] as string)
      );
    }
    
    metricsService.recordHttpResponseSize(
      req.method,
      endpoint,
      res.statusCode,
      contentLength
    );

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Error tracking middleware
 */
export const errorTrackingMiddleware = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  const endpoint = normalizeEndpoint(req.route?.path || req.path);
  
  // Log error with context
  loggingService.logError(error, {
    requestId: req.requestId,
    userId: req.user?.id,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Record error metrics
  metricsService.recordError('http_error', 'medium');
  metricsService.recordEndpointError(req.method, endpoint, error.name);

  // Determine error response
  let statusCode = 500;
  let message = 'Error interno del servidor';

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Datos de entrada inválidos';
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'No autorizado';
  } else if (error.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Acceso denegado';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Recurso no encontrado';
  }

  res.status(statusCode).json({
    error: message,
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });
};

/**
 * Security event logging middleware
 */
export const securityLoggingMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Log potential security events
  const suspiciousPatterns = [
    /\.\./,           // Path traversal
    /<script/i,       // XSS attempts
    /union.*select/i, // SQL injection
    /\bor\b.*\b1=1\b/i // SQL injection
  ];

  const url = req.originalUrl || req.url;
  const body = JSON.stringify(req.body || {});
  
  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(url) || pattern.test(body)) {
      loggingService.logSecurityEvent('Suspicious request detected', {
        requestId: req.requestId,
        pattern: pattern.source,
        method: req.method,
        url,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: req.user?.id
      });
    }
  });

  next();
};

/**
 * Rate limiting monitoring middleware
 */
export const rateLimitMonitoringMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    // Log rate limit hits
    if (res.statusCode === 429) {
      loggingService.logSecurityEvent('Rate limit exceeded', {
        requestId: req.requestId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: req.user?.id,
        endpoint: req.originalUrl || req.url
      });

      metricsService.recordError('rate_limit_exceeded', 'medium');
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Database operation monitoring
 */
export const createDatabaseMonitoring = () => {
  return {
    logQuery: (query: string, duration: number, success: boolean = true) => {
      const operation = extractOperationType(query);
      const table = extractTableName(query);
      
      loggingService.logDatabaseQuery(query, duration, { operation, table });
      metricsService.recordDatabaseQuery(operation, table, duration, success);
    },

    logConnection: (active: number, idle: number) => {
      metricsService.updateDatabaseConnections(active, idle);
    }
  };
};

/**
 * Cache operation monitoring
 */
export const createCacheMonitoring = () => {
  return {
    logOperation: (operation: 'hit' | 'miss' | 'set' | 'del', key: string, success: boolean = true) => {
      loggingService.logCacheOperation(operation.toUpperCase() as 'HIT' | 'MISS' | 'SET' | 'DEL', key, { success });
      metricsService.recordCacheOperation(operation, success);
    },

    updateMetrics: (hitRate: number, memoryUsage: number, connections: number) => {
      loggingService.logCacheMetrics(hitRate, 0, connections);
      metricsService.updateCacheMetrics(hitRate, memoryUsage, connections);
    }
  };
};

/**
 * Business operation monitoring
 */
export const createBusinessMonitoring = () => {
  return {
    logTripOperation: (operation: string, tripId: string, userId: string, meta?: any) => {
      loggingService.logTripOperation(operation, tripId, userId, meta);
      
      if (operation === 'create') {
        metricsService.recordTripCreated(userId, meta?.destinationType);
      } else if (operation === 'share') {
        metricsService.recordTripShared(meta?.permissionLevel || 'VIEWER');
      }
    },

    logExpenseOperation: (tripId: string, category: string, amount: number) => {
      metricsService.recordExpenseAdded(category, tripId);
      loggingService.info('Expense added', { tripId, category, amount });
    },

    logAuthOperation: (operation: 'login' | 'register' | 'logout', userId?: string, success: boolean = true) => {
      loggingService.logAuthEvent(operation.toUpperCase() as any, userId);
      
      if (operation === 'login') {
        metricsService.recordUserLogin(success);
      } else if (operation === 'register') {
        metricsService.recordUserRegistration();
      }
    }
  };
};

/**
 * Health check middleware with detailed metrics
 */
export const healthCheckMiddleware = async (req: Request, res: Response): Promise<void> => {
  try {
    const healthData = await metricsService.getHealthMetrics();
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: healthData.uptime,
      memory: {
        rss: Math.round(healthData.memoryUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(healthData.memoryUsage.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(healthData.memoryUsage.heapUsed / 1024 / 1024), // MB
        external: Math.round(healthData.memoryUsage.external / 1024 / 1024) // MB
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    res.status(200).json(health);
  } catch (error) {
    loggingService.logCriticalError(error as Error, { component: 'health_check' });
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
};

/**
 * Metrics endpoint middleware
 */
export const metricsEndpointMiddleware = async (req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await metricsService.getMetrics();
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(metrics);
  } catch (error) {
    loggingService.logError(error as Error, { component: 'metrics_endpoint' });
    res.status(500).send('Error retrieving metrics');
  }
};

// Utility functions
function normalizeEndpoint(path: string): string {
  if (!path) return '/unknown';
  
  // Replace dynamic segments with placeholders
  return path
    .replace(/\/[0-9a-fA-F-]{36}/g, '/:id') // UUIDs
    .replace(/\/\d+/g, '/:id') // Numeric IDs
    .replace(/\/[^/]+@[^/]+/g, '/:email') // Email addresses
    .toLowerCase();
}

function extractOperationType(query: string): string {
  const operation = query.trim().split(' ')[0].toLowerCase();
  return ['select', 'insert', 'update', 'delete'].includes(operation) ? operation : 'unknown';
}

function extractTableName(query: string): string {
  const match = query.match(/(?:from|into|update)\s+`?(\w+)`?/i);
  return match ? match[1].toLowerCase() : 'unknown';
}

// Export monitoring utilities
export const databaseMonitoring = createDatabaseMonitoring();
export const cacheMonitoring = createCacheMonitoring();
export const businessMonitoring = createBusinessMonitoring();