/**
 * Health Check Service
 * Monitors the health of all system components
 */

import { getCacheService } from './cache.service';
import prisma from '../lib/prisma';
import loggingService from './logging.service';
import fs from 'fs/promises';
import path from 'path';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  components: {
    [key: string]: ComponentHealth;
  };
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency?: number;
  message?: string;
  lastChecked: string;
  details?: any;
}

export class HealthService {
  private healthChecks: Map<string, () => Promise<ComponentHealth>> = new Map();

  constructor() {
    this.registerDefaultHealthChecks();
  }

  private registerDefaultHealthChecks(): void {
    this.healthChecks.set('database', this.checkDatabase.bind(this));
    this.healthChecks.set('cache', this.checkCache.bind(this));
    this.healthChecks.set('memory', this.checkMemory.bind(this));
    this.healthChecks.set('disk', this.checkDisk.bind(this));
    this.healthChecks.set('process', this.checkProcess.bind(this));
  }

  /**
   * Register a custom health check
   */
  registerHealthCheck(name: string, checkFn: () => Promise<ComponentHealth>): void {
    this.healthChecks.set(name, checkFn);
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const components: { [key: string]: ComponentHealth } = {};
    
    // Run all health checks in parallel
    const checkPromises = Array.from(this.healthChecks.entries()).map(async ([name, checkFn]) => {
      try {
        const result = await Promise.race([
          checkFn(),
          this.timeoutPromise(5000) // 5 second timeout
        ]);
        components[name] = result;
      } catch (error) {
        components[name] = {
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Health check failed',
          lastChecked: new Date().toISOString()
        };
      }
    });

    await Promise.all(checkPromises);

    // Calculate summary
    const summary = this.calculateSummary(components);
    
    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (summary.unhealthy > 0) {
      overallStatus = 'unhealthy';
    } else if (summary.degraded > 0) {
      overallStatus = 'degraded';
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      components,
      summary
    };

    // Log health check results
    loggingService.info('Health check completed', {
      status: overallStatus,
      duration: Date.now() - startTime,
      summary
    });

    return result;
  }

  /**
   * Check database connectivity and performance
   */
  private async checkDatabase(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      // Simple connectivity test
      await prisma.$queryRaw`SELECT 1`;
      
      // Performance test
      const userCount = await prisma.user.count();
      const latency = Date.now() - startTime;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = 'Database is responsive';

      if (latency > 1000) {
        status = 'degraded';
        message = 'Database response is slow';
      } else if (latency > 5000) {
        status = 'unhealthy';
        message = 'Database response is very slow';
      }

      return {
        status,
        latency,
        message,
        lastChecked: new Date().toISOString(),
        details: {
          userCount,
          connectionPool: {
            // Add connection pool stats if available
          }
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Check Redis cache connectivity and performance
   */
  private async checkCache(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      const cacheService = getCacheService();
      
      if (!cacheService.isHealthy()) {
        return {
          status: 'unhealthy',
          message: 'Cache service is not connected',
          lastChecked: new Date().toISOString()
        };
      }

      // Test cache operations
      const testKey = 'health_check_test';
      const testValue = { timestamp: Date.now() };
      
      await cacheService.set(testKey, testValue, 10); // 10 second TTL
      const retrieved = await cacheService.get(testKey);
      await cacheService.del(testKey);
      
      const latency = Date.now() - startTime;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      let message = 'Cache is responsive';

      if (latency > 100) {
        status = 'degraded';
        message = 'Cache response is slow';
      } else if (latency > 500) {
        status = 'unhealthy';
        message = 'Cache response is very slow';
      }

      if (!retrieved || retrieved.timestamp !== testValue.timestamp) {
        status = 'degraded';
        message = 'Cache operations are not functioning correctly';
      }

      return {
        status,
        latency,
        message,
        lastChecked: new Date().toISOString(),
        details: {
          operationsTest: retrieved ? 'passed' : 'failed'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Cache health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<ComponentHealth> {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let message = 'Memory usage is normal';

    if (memoryUsagePercent > 85) {
      status = 'unhealthy';
      message = 'Memory usage is critically high';
    } else if (memoryUsagePercent > 70) {
      status = 'degraded';
      message = 'Memory usage is high';
    }

    return {
      status,
      message,
      lastChecked: new Date().toISOString(),
      details: {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapTotal: Math.round(totalMemory / 1024 / 1024), // MB
        heapUsed: Math.round(usedMemory / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
        usagePercent: Math.round(memoryUsagePercent * 100) / 100
      }
    };
  }

  /**
   * Check disk space
   */
  private async checkDisk(): Promise<ComponentHealth> {
    try {
      const stats = await fs.stat(process.cwd());
      
      // Note: Node.js doesn't have built-in disk space checking
      // This is a simplified check - in production, you'd use a library like 'statvfs'
      
      return {
        status: 'healthy',
        message: 'Disk access is functioning',
        lastChecked: new Date().toISOString(),
        details: {
          workingDirectory: process.cwd(),
          accessible: true
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Disk access failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastChecked: new Date().toISOString()
      };
    }
  }

  /**
   * Check process health
   */
  private async checkProcess(): Promise<ComponentHealth> {
    const uptime = process.uptime();
    const cpuUsage = process.cpuUsage();
    
    // Convert CPU usage to percentage (this is simplified)
    const cpuPercent = (cpuUsage.system / 1000000) / uptime * 100;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let message = 'Process is running normally';

    if (cpuPercent > 90) {
      status = 'unhealthy';
      message = 'CPU usage is critically high';
    } else if (cpuPercent > 70) {
      status = 'degraded';
      message = 'CPU usage is high';
    }

    return {
      status,
      message,
      lastChecked: new Date().toISOString(),
      details: {
        uptime: Math.round(uptime),
        cpuUsage: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
  }

  /**
   * Quick health check for readiness probes
   */
  async isReady(): Promise<boolean> {
    try {
      // Quick database check
      await prisma.$queryRaw`SELECT 1`;
      
      // Quick cache check if available
      const cacheService = getCacheService();
      if (cacheService.isHealthy()) {
        await cacheService.get('readiness_check');
      }
      
      return true;
    } catch (error) {
      loggingService.error('Readiness check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  /**
   * Liveness check for basic application responsiveness
   */
  async isAlive(): Promise<boolean> {
    // Basic liveness check - just ensure the process is responsive
    return true;
  }

  /**
   * Get specific component health
   */
  async getComponentHealth(component: string): Promise<ComponentHealth | null> {
    const healthCheck = this.healthChecks.get(component);
    if (!healthCheck) {
      return null;
    }

    try {
      return await healthCheck();
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Health check failed',
        lastChecked: new Date().toISOString()
      };
    }
  }

  private calculateSummary(components: { [key: string]: ComponentHealth }): {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  } {
    const summary = { total: 0, healthy: 0, degraded: 0, unhealthy: 0 };
    
    Object.values(components).forEach(component => {
      summary.total++;
      summary[component.status]++;
    });

    return summary;
  }

  private timeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), timeoutMs);
    });
  }
}

// Singleton instance
export const healthService = new HealthService();
export default healthService;