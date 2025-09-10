/**
 * Performance Optimization Service
 * Provides advanced performance monitoring and optimization features
 */

import { getCacheService } from './cache.service';
import loggingService from './logging.service';
import metricsService from './metrics.service';

interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  activeConnections: number;
  cacheHitRate: number;
  dbQueryTime: number;
}

interface OptimizationRule {
  name: string;
  condition: (metrics: PerformanceMetrics) => boolean;
  action: (metrics: PerformanceMetrics) => Promise<void>;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export class PerformanceService {
  private cache = getCacheService();
  private optimizationRules: OptimizationRule[] = [];
  private performanceHistory: PerformanceMetrics[] = [];
  private readonly MAX_HISTORY_LENGTH = 100;
  private isOptimizing = false;

  constructor() {
    this.registerOptimizationRules();
    this.startPerformanceMonitoring();
  }

  /**
   * Register default optimization rules
   */
  private registerOptimizationRules(): void {
    // Memory optimization rules
    this.optimizationRules.push({
      name: 'high_memory_usage',
      condition: (metrics) => {
        const memoryUsagePercent = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
        return memoryUsagePercent > 85;
      },
      action: async (metrics) => {
        loggingService.warn('High memory usage detected, triggering garbage collection', {
          heapUsed: metrics.memoryUsage.heapUsed,
          heapTotal: metrics.memoryUsage.heapTotal,
          percentage: (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100
        });

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }

        // Clear some cache entries
        await this.cache.invalidatePattern('*:temp:*');
        
        metricsService.recordError('memory_optimization_triggered', 'medium');
      },
      priority: 'high'
    });

    // Cache optimization rules
    this.optimizationRules.push({
      name: 'low_cache_hit_rate',
      condition: (metrics) => metrics.cacheHitRate < 50,
      action: async (metrics) => {
        loggingService.warn('Low cache hit rate detected', {
          hitRate: metrics.cacheHitRate,
          action: 'preload_frequent_data'
        });

        // Preload frequently accessed data
        await this.preloadFrequentData();
        
        metricsService.recordError('cache_optimization_triggered', 'medium');
      },
      priority: 'medium'
    });

    // Response time optimization
    this.optimizationRules.push({
      name: 'slow_response_time',
      condition: (metrics) => metrics.responseTime > 2000, // 2 seconds
      action: async (metrics) => {
        loggingService.warn('Slow response time detected', {
          responseTime: metrics.responseTime,
          action: 'enable_aggressive_caching'
        });

        // Enable more aggressive caching
        await this.enableAggressiveCaching();
        
        metricsService.recordError('response_time_optimization_triggered', 'high');
      },
      priority: 'high'
    });

    // Database performance optimization
    this.optimizationRules.push({
      name: 'slow_database_queries',
      condition: (metrics) => metrics.dbQueryTime > 1000, // 1 second
      action: async (metrics) => {
        loggingService.warn('Slow database queries detected', {
          queryTime: metrics.dbQueryTime,
          action: 'optimize_queries'
        });

        // Log slow queries for analysis
        await this.analyzeSlowQueries();
        
        metricsService.recordError('db_optimization_triggered', 'high');
      },
      priority: 'high'
    });

    // Connection optimization
    this.optimizationRules.push({
      name: 'high_connection_count',
      condition: (metrics) => metrics.activeConnections > 1000,
      action: async (metrics) => {
        loggingService.warn('High connection count detected', {
          connections: metrics.activeConnections,
          action: 'implement_connection_pooling'
        });

        // Implement connection management strategies
        await this.optimizeConnections();
        
        metricsService.recordError('connection_optimization_triggered', 'medium');
      },
      priority: 'medium'
    });
  }

  /**
   * Start continuous performance monitoring
   */
  private startPerformanceMonitoring(): void {
    setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        this.performanceHistory.push(metrics);

        // Keep history within limits
        if (this.performanceHistory.length > this.MAX_HISTORY_LENGTH) {
          this.performanceHistory.shift();
        }

        // Check optimization rules
        await this.checkOptimizationRules(metrics);

        // Update performance metrics
        this.updatePerformanceMetrics(metrics);

      } catch (error) {
        loggingService.logError(error as Error, {
          component: 'performance_monitoring',
          operation: 'collect_metrics'
        });
      }
    }, 10000); // Every 10 seconds
  }

  /**
   * Collect current performance metrics
   */
  private async collectMetrics(): Promise<PerformanceMetrics> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Calculate average response time from recent history
    const recentMetrics = this.performanceHistory.slice(-10);
    const avgResponseTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
      : 0;

    // Mock values for demonstration - in real implementation, these would be actual measurements
    const metrics: PerformanceMetrics = {
      responseTime: avgResponseTime,
      memoryUsage,
      cpuUsage,
      activeConnections: this.getActiveConnectionCount(),
      cacheHitRate: await this.calculateCacheHitRate(),
      dbQueryTime: this.getAverageDbQueryTime()
    };

    return metrics;
  }

  /**
   * Check optimization rules and trigger actions
   */
  private async checkOptimizationRules(metrics: PerformanceMetrics): Promise<void> {
    if (this.isOptimizing) {
      return; // Avoid concurrent optimizations
    }

    const triggeredRules = this.optimizationRules.filter(rule => 
      rule.condition(metrics)
    );

    if (triggeredRules.length === 0) {
      return;
    }

    this.isOptimizing = true;

    try {
      // Sort by priority and execute
      const sortedRules = triggeredRules.sort((a, b) => {
        const priorities = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorities[b.priority] - priorities[a.priority];
      });

      for (const rule of sortedRules) {
        try {
          await rule.action(metrics);
          
          loggingService.info('Performance optimization rule triggered', {
            rule: rule.name,
            priority: rule.priority,
            metrics
          });
        } catch (error) {
          loggingService.logError(error as Error, {
            component: 'performance_optimization',
            rule: rule.name
          });
        }
      }
    } finally {
      this.isOptimizing = false;
    }
  }

  /**
   * Update metrics for monitoring systems
   */
  private updatePerformanceMetrics(metrics: PerformanceMetrics): void {
    // Update system metrics
    metricsService.updateSystemMetrics();

    // Custom performance metrics
    const memoryUsagePercent = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
    
    loggingService.logMetrics('memory_usage_percent', memoryUsagePercent, 'percentage');
    loggingService.logMetrics('response_time', metrics.responseTime, 'ms');
    loggingService.logMetrics('cache_hit_rate', metrics.cacheHitRate, 'percentage');
    loggingService.logMetrics('active_connections', metrics.activeConnections, 'count');
    loggingService.logMetrics('db_query_time', metrics.dbQueryTime, 'ms');
  }

  /**
   * Preload frequently accessed data
   */
  private async preloadFrequentData(): Promise<void> {
    try {
      // This would preload commonly accessed data patterns
      const frequentPatterns = [
        'user:popular:*',
        'trip:recent:*',
        'destination:trending:*'
      ];

      loggingService.info('Preloading frequent data patterns', {
        patterns: frequentPatterns
      });

      // Implementation would depend on your specific data patterns
      // For now, this is a placeholder
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'preload_frequent_data'
      });
    }
  }

  /**
   * Enable more aggressive caching strategies
   */
  private async enableAggressiveCaching(): Promise<void> {
    try {
      // Increase cache TTL for certain data types
      const aggressiveCacheSettings = {
        userProfile: 1800,    // 30 minutes instead of 5
        tripDetails: 3600,    // 1 hour instead of 10 minutes
        staticData: 7200      // 2 hours instead of 1
      };

      loggingService.info('Enabling aggressive caching', {
        settings: aggressiveCacheSettings
      });

      // In real implementation, this would update cache configurations
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'enable_aggressive_caching'
      });
    }
  }

  /**
   * Analyze slow queries for optimization opportunities
   */
  private async analyzeSlowQueries(): Promise<void> {
    try {
      // This would analyze recent slow queries and suggest optimizations
      loggingService.info('Analyzing slow queries', {
        threshold: '1000ms',
        action: 'optimization_analysis'
      });

      // In real implementation, this would:
      // 1. Query slow query logs
      // 2. Identify common patterns
      // 3. Suggest index optimizations
      // 4. Generate optimization reports
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'analyze_slow_queries'
      });
    }
  }

  /**
   * Optimize connection management
   */
  private async optimizeConnections(): Promise<void> {
    try {
      loggingService.info('Optimizing connection management', {
        currentConnections: this.getActiveConnectionCount(),
        action: 'connection_pooling'
      });

      // In real implementation, this would:
      // 1. Analyze connection patterns
      // 2. Adjust connection pool settings
      // 3. Implement connection recycling
      // 4. Close idle connections
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'optimize_connections'
      });
    }
  }

  /**
   * Get current performance summary
   */
  async getPerformanceSummary(): Promise<{
    current: PerformanceMetrics;
    averages: {
      responseTime: number;
      memoryUsage: number;
      cacheHitRate: number;
      dbQueryTime: number;
    };
    trends: {
      responseTime: 'improving' | 'declining' | 'stable';
      memoryUsage: 'improving' | 'declining' | 'stable';
      cacheHitRate: 'improving' | 'declining' | 'stable';
    };
    recommendations: string[];
  }> {
    const current = await this.collectMetrics();
    
    // Calculate averages from history
    const averages = this.calculateAverages();
    
    // Analyze trends
    const trends = this.analyzeTrends();
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(current);

    return {
      current,
      averages,
      trends,
      recommendations
    };
  }

  /**
   * Register custom optimization rule
   */
  registerOptimizationRule(rule: OptimizationRule): void {
    this.optimizationRules.push(rule);
    
    loggingService.info('Custom optimization rule registered', {
      ruleName: rule.name,
      priority: rule.priority
    });
  }

  // Helper methods

  private calculateAverages() {
    if (this.performanceHistory.length === 0) {
      return { responseTime: 0, memoryUsage: 0, cacheHitRate: 0, dbQueryTime: 0 };
    }

    const sum = this.performanceHistory.reduce((acc, metrics) => ({
      responseTime: acc.responseTime + metrics.responseTime,
      memoryUsage: acc.memoryUsage + (metrics.memoryUsage.heapUsed / 1024 / 1024),
      cacheHitRate: acc.cacheHitRate + metrics.cacheHitRate,
      dbQueryTime: acc.dbQueryTime + metrics.dbQueryTime
    }), { responseTime: 0, memoryUsage: 0, cacheHitRate: 0, dbQueryTime: 0 });

    const count = this.performanceHistory.length;
    return {
      responseTime: sum.responseTime / count,
      memoryUsage: sum.memoryUsage / count,
      cacheHitRate: sum.cacheHitRate / count,
      dbQueryTime: sum.dbQueryTime / count
    };
  }

  private analyzeTrends() {
    if (this.performanceHistory.length < 10) {
      return { responseTime: 'stable', memoryUsage: 'stable', cacheHitRate: 'stable' } as const;
    }

    const recent = this.performanceHistory.slice(-5);
    const older = this.performanceHistory.slice(-10, -5);

    const recentAvgResponse = recent.reduce((sum, m) => sum + m.responseTime, 0) / recent.length;
    const olderAvgResponse = older.reduce((sum, m) => sum + m.responseTime, 0) / older.length;

    const recentAvgMemory = recent.reduce((sum, m) => sum + m.memoryUsage.heapUsed, 0) / recent.length;
    const olderAvgMemory = older.reduce((sum, m) => sum + m.memoryUsage.heapUsed, 0) / older.length;

    const recentAvgCache = recent.reduce((sum, m) => sum + m.cacheHitRate, 0) / recent.length;
    const olderAvgCache = older.reduce((sum, m) => sum + m.cacheHitRate, 0) / older.length;

    return {
      responseTime: this.getTrend(recentAvgResponse, olderAvgResponse),
      memoryUsage: this.getTrend(recentAvgMemory, olderAvgMemory),
      cacheHitRate: this.getTrend(recentAvgCache, olderAvgCache, true) // Higher is better for cache
    };
  }

  private getTrend(recent: number, older: number, higherIsBetter = false): 'improving' | 'declining' | 'stable' {
    const changePercent = ((recent - older) / older) * 100;
    
    if (Math.abs(changePercent) < 5) {
      return 'stable';
    }
    
    if (higherIsBetter) {
      return changePercent > 0 ? 'improving' : 'declining';
    } else {
      return changePercent < 0 ? 'improving' : 'declining';
    }
  }

  private generateRecommendations(current: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    // Memory recommendations
    const memoryUsagePercent = (current.memoryUsage.heapUsed / current.memoryUsage.heapTotal) * 100;
    if (memoryUsagePercent > 70) {
      recommendations.push('Consider implementing memory optimization strategies');
    }

    // Cache recommendations
    if (current.cacheHitRate < 60) {
      recommendations.push('Improve caching strategy to increase hit rate');
    }

    // Response time recommendations
    if (current.responseTime > 1000) {
      recommendations.push('Optimize slow endpoints to improve response times');
    }

    // Database recommendations
    if (current.dbQueryTime > 500) {
      recommendations.push('Review and optimize database queries');
    }

    return recommendations;
  }

  private getActiveConnectionCount(): number {
    // This would return actual connection count
    // For now, return a mock value
    return Math.floor(Math.random() * 100) + 50;
  }

  private async calculateCacheHitRate(): Promise<number> {
    try {
      // This would calculate actual cache hit rate
      // For now, return a mock value
      return Math.floor(Math.random() * 40) + 60; // 60-100%
    } catch {
      return 0;
    }
  }

  private getAverageDbQueryTime(): number {
    // This would return actual database query time
    // For now, return a mock value
    return Math.floor(Math.random() * 200) + 50; // 50-250ms
  }
}

// Export singleton instance
export const performanceService = new PerformanceService();