/**
 * Centralized Logging Service
 * Provides structured logging with Winston and monitoring capabilities
 */

import winston from 'winston';
import path from 'path';

// Log levels with corresponding numeric values
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Color scheme for console output
const LOG_COLORS = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Custom format for structured logging
const createLogFormat = () => {
  return winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf((info) => {
      const { timestamp, level, message, service, userId, tripId, requestId, duration, statusCode, method, url, ip, userAgent, stack, ...meta } = info;
      
      const logEntry: any = {
        timestamp,
        level: level.toUpperCase(),
        message,
        service: service || 'sasgoapp-backend',
      };

      // Add request context if available
      if (requestId) logEntry.requestId = requestId;
      if (userId) logEntry.userId = userId;
      if (tripId) logEntry.tripId = tripId;
      if (method) logEntry.method = method;
      if (url) logEntry.url = url;
      if (statusCode) logEntry.statusCode = statusCode;
      if (duration) logEntry.duration = `${duration}ms`;
      if (ip) logEntry.ip = ip;
      if (userAgent) logEntry.userAgent = userAgent;

      // Add error stack if available
      if (stack) logEntry.stack = stack;

      // Add any additional metadata
      if (Object.keys(meta).length > 0) {
        logEntry.meta = meta;
      }

      return JSON.stringify(logEntry);
    })
  );
};

// Console format for development
const createConsoleFormat = () => {
  return winston.format.combine(
    winston.format.timestamp({
      format: 'HH:mm:ss'
    }),
    winston.format.colorize({ all: true }),
    winston.format.printf((info) => {
      const { timestamp, level, message, requestId, userId, duration, statusCode, method, url } = info;
      
      let logMessage = `[${timestamp}] ${level}: ${message}`;
      
      if (requestId) logMessage += ` [${requestId}]`;
      if (userId) logMessage += ` [user:${userId}]`;
      if (method && url) logMessage += ` ${method} ${url}`;
      if (statusCode) logMessage += ` (${statusCode})`;
      if (duration) logMessage += ` +${duration}ms`;
      
      return logMessage;
    })
  );
};

export class LoggingService {
  private logger: winston.Logger;
  private metricsLogger: winston.Logger;
  private auditLogger: winston.Logger;

  constructor() {
    winston.addColors(LOG_COLORS);

    // Main application logger
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      levels: LOG_LEVELS,
      format: createLogFormat(),
      defaultMeta: {
        service: 'sasgoapp-backend',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0'
      },
      transports: this.createTransports('app')
    });

    // Metrics logger for performance data
    this.metricsLogger = winston.createLogger({
      level: 'info',
      format: createLogFormat(),
      defaultMeta: {
        service: 'sasgoapp-metrics',
        type: 'metrics'
      },
      transports: this.createTransports('metrics')
    });

    // Audit logger for security events
    this.auditLogger = winston.createLogger({
      level: 'info',
      format: createLogFormat(),
      defaultMeta: {
        service: 'sasgoapp-audit',
        type: 'audit'
      },
      transports: this.createTransports('audit')
    });

    this.setupErrorHandling();
  }

  private createTransports(logType: 'app' | 'metrics' | 'audit'): winston.transport[] {
    const transports: winston.transport[] = [];

    // Console transport for development
    if (process.env.NODE_ENV !== 'production') {
      transports.push(new winston.transports.Console({
        format: createConsoleFormat()
      }));
    }

    // File transports
    const logsDir = process.env.LOGS_DIR || 'logs';
    
    // Error log (only errors)
    transports.push(new winston.transports.File({
      filename: path.join(logsDir, `${logType}-error.log`),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }));

    // Combined log (all levels)
    transports.push(new winston.transports.File({
      filename: path.join(logsDir, `${logType}-combined.log`),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true
    }));

    // Daily rotating file for production
    if (process.env.NODE_ENV === 'production') {
      const DailyRotateFile = require('winston-daily-rotate-file');
      
      transports.push(new DailyRotateFile({
        filename: path.join(logsDir, `${logType}-%DATE%.log`),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d'
      }));
    }

    return transports;
  }

  private setupErrorHandling(): void {
    this.logger.on('error', (error) => {
      console.error('Logger error:', error);
    });

    // Handle uncaught exceptions
    this.logger.exceptions.handle(
      new winston.transports.File({
        filename: path.join(process.env.LOGS_DIR || 'logs', 'exceptions.log'),
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5
      })
    );

    // Handle unhandled promise rejections
    this.logger.rejections.handle(
      new winston.transports.File({
        filename: path.join(process.env.LOGS_DIR || 'logs', 'rejections.log'),
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5
      })
    );
  }

  // Main logging methods
  error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  http(message: string, meta?: any): void {
    this.logger.http(message, meta);
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  // Request logging
  logRequest(req: any, res: any, duration: number): void {
    const meta = {
      requestId: req.id || req.headers['x-request-id'],
      userId: req.user?.id,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer,
      contentLength: res.get('content-length')
    };

    const level = res.statusCode >= 400 ? 'error' : res.statusCode >= 300 ? 'warn' : 'http';
    const message = `${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${duration}ms`;

    this.logger.log(level, message, meta);
  }

  // Business logic logging
  logTripOperation(operation: string, tripId: string, userId: string, meta?: any): void {
    this.info(`Trip ${operation}`, {
      operation,
      tripId,
      userId,
      ...meta
    });
  }

  logCacheOperation(operation: 'HIT' | 'MISS' | 'SET' | 'DEL', key: string, meta?: any): void {
    this.debug(`Cache ${operation}`, {
      operation,
      cacheKey: key,
      ...meta
    });
  }

  logDatabaseQuery(query: string, duration: number, meta?: any): void {
    this.debug('Database query', {
      query: query.substring(0, 200), // Truncate long queries
      duration,
      ...meta
    });
  }

  // Security/Audit logging
  logSecurityEvent(event: string, meta?: any): void {
    this.auditLogger.info(event, {
      timestamp: new Date().toISOString(),
      event,
      ...meta
    });
  }

  logAuthEvent(event: 'LOGIN' | 'LOGOUT' | 'TOKEN_REFRESH' | 'FAILED_LOGIN' | 'REGISTER', userId?: string, meta?: any): void {
    this.logSecurityEvent(`Auth: ${event}`, {
      userId,
      ...meta
    });
  }

  logPermissionDenied(resource: string, userId: string, meta?: any): void {
    this.logSecurityEvent('Permission denied', {
      resource,
      userId,
      ...meta
    });
  }

  // Performance metrics logging
  logMetrics(metric: string, value: number, unit: string, meta?: any): void {
    this.metricsLogger.info(`Metric: ${metric}`, {
      metric,
      value,
      unit,
      timestamp: new Date().toISOString(),
      ...meta
    });
  }

  logApiMetrics(endpoint: string, method: string, duration: number, statusCode: number, meta?: any): void {
    this.logMetrics('api_response_time', duration, 'ms', {
      endpoint,
      method,
      statusCode,
      ...meta
    });
  }

  logCacheMetrics(hitRate: number, evictions: number, keyCount: number): void {
    this.logMetrics('cache_hit_rate', hitRate, 'percentage');
    this.logMetrics('cache_evictions', evictions, 'count');
    this.logMetrics('cache_keys', keyCount, 'count');
  }

  // Error logging with context
  logError(error: Error, context?: any): void {
    this.error(error.message, {
      stack: error.stack,
      name: error.name,
      ...context
    });
  }

  logCriticalError(error: Error, context?: any): void {
    this.error(`CRITICAL: ${error.message}`, {
      stack: error.stack,
      name: error.name,
      critical: true,
      ...context
    });

    // Also log to audit for critical errors
    this.logSecurityEvent('Critical error occurred', {
      error: error.message,
      stack: error.stack,
      ...context
    });
  }

  // Utility methods
  createChildLogger(service: string, meta?: any): winston.Logger {
    return this.logger.child({
      service,
      ...meta
    });
  }

  getLogger(): winston.Logger {
    return this.logger;
  }

  getMetricsLogger(): winston.Logger {
    return this.metricsLogger;
  }

  getAuditLogger(): winston.Logger {
    return this.auditLogger;
  }
}

// Singleton instance
export const loggingService = new LoggingService();

// Export for middleware and other services
export default loggingService;