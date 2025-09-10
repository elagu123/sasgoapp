/**
 * Database Optimization Service
 * Provides database performance monitoring and optimization features
 */

import prisma from '../lib/prisma';
import loggingService from './logging.service';
import { getCacheService } from './cache.service';
import metricsService from './metrics.service';

interface QueryAnalytics {
  query: string;
  executionTime: number;
  rowsAffected: number;
  timestamp: Date;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
}

interface DatabaseStats {
  totalQueries: number;
  averageQueryTime: number;
  slowQueries: number;
  cacheHitRate: number;
  connectionPoolStats: {
    active: number;
    idle: number;
    waiting: number;
  };
  tableStats: {
    [tableName: string]: {
      size: number;
      queryCount: number;
      averageQueryTime: number;
    };
  };
}

interface OptimizationSuggestion {
  type: 'index' | 'query' | 'schema' | 'cache';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  table?: string;
  query?: string;
  suggestedAction: string;
  potentialImpact: string;
}

export class DatabaseOptimizationService {
  private cache = getCacheService();
  private queryAnalytics: QueryAnalytics[] = [];
  private readonly MAX_ANALYTICS_HISTORY = 1000;
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second

  constructor() {
    this.setupQueryMonitoring();
    this.startPeriodicOptimization();
  }

  /**
   * Set up query monitoring hooks
   */
  private setupQueryMonitoring(): void {
    // In a real implementation, this would hook into Prisma's query events
    // For demonstration, we'll use a simplified approach
    
    loggingService.info('Database query monitoring initialized', {
      slowQueryThreshold: this.SLOW_QUERY_THRESHOLD,
      maxHistoryLength: this.MAX_ANALYTICS_HISTORY
    });
  }

  /**
   * Start periodic optimization checks
   */
  private startPeriodicOptimization(): void {
    // Run optimization analysis every 5 minutes
    setInterval(async () => {
      try {
        await this.analyzePerformance();
        await this.generateOptimizationSuggestions();
        await this.autoOptimizeQueries();
      } catch (error) {
        loggingService.logError(error as Error, {
          component: 'database_optimization',
          operation: 'periodic_optimization'
        });
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Record query execution for analysis
   */
  recordQuery(query: string, executionTime: number, rowsAffected: number = 0): void {
    const analytics: QueryAnalytics = {
      query: this.sanitizeQuery(query),
      executionTime,
      rowsAffected,
      timestamp: new Date(),
      operation: this.extractOperation(query),
      table: this.extractTable(query)
    };

    this.queryAnalytics.push(analytics);

    // Keep analytics history within limits
    if (this.queryAnalytics.length > this.MAX_ANALYTICS_HISTORY) {
      this.queryAnalytics.shift();
    }

    // Log slow queries immediately
    if (executionTime > this.SLOW_QUERY_THRESHOLD) {
      loggingService.warn('Slow query detected', {
        query: analytics.query,
        executionTime,
        table: analytics.table,
        operation: analytics.operation
      });

      metricsService.recordError('slow_query', 'medium');
    }

    // Record metrics
    metricsService.recordDatabaseQuery(analytics.operation, analytics.table, executionTime, true);
  }

  /**
   * Get current database performance statistics
   */
  async getDatabaseStats(): Promise<DatabaseStats> {
    try {
      const recentQueries = this.queryAnalytics.filter(
        q => Date.now() - q.timestamp.getTime() < 60 * 60 * 1000 // Last hour
      );

      const totalQueries = recentQueries.length;
      const averageQueryTime = totalQueries > 0 
        ? recentQueries.reduce((sum, q) => sum + q.executionTime, 0) / totalQueries
        : 0;

      const slowQueries = recentQueries.filter(
        q => q.executionTime > this.SLOW_QUERY_THRESHOLD
      ).length;

      // Calculate cache hit rate (simplified)
      const cacheHitRate = await this.calculateCacheHitRate();

      // Get connection pool stats (would be actual in real implementation)
      const connectionPoolStats = await this.getConnectionPoolStats();

      // Calculate table statistics
      const tableStats = this.calculateTableStats(recentQueries);

      const stats: DatabaseStats = {
        totalQueries,
        averageQueryTime,
        slowQueries,
        cacheHitRate,
        connectionPoolStats,
        tableStats
      };

      loggingService.info('Database stats calculated', stats);

      return stats;
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'get_database_stats'
      });
      throw error;
    }
  }

  /**
   * Analyze database performance and identify issues
   */
  private async analyzePerformance(): Promise<void> {
    try {
      const stats = await this.getDatabaseStats();

      // Check for performance issues
      if (stats.averageQueryTime > 500) {
        loggingService.warn('High average query time detected', {
          averageQueryTime: stats.averageQueryTime,
          recommendation: 'Review query optimization'
        });
      }

      if (stats.slowQueries > 0) {
        const slowQueryRate = (stats.slowQueries / stats.totalQueries) * 100;
        loggingService.warn('Slow queries detected', {
          slowQueries: stats.slowQueries,
          totalQueries: stats.totalQueries,
          slowQueryRate: `${slowQueryRate.toFixed(2)}%`
        });
      }

      if (stats.cacheHitRate < 60) {
        loggingService.warn('Low cache hit rate', {
          hitRate: stats.cacheHitRate,
          recommendation: 'Review caching strategy'
        });
      }

    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'analyze_performance'
      });
    }
  }

  /**
   * Generate optimization suggestions based on query patterns
   */
  async generateOptimizationSuggestions(): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    try {
      const recentQueries = this.queryAnalytics.filter(
        q => Date.now() - q.timestamp.getTime() < 24 * 60 * 60 * 1000 // Last 24 hours
      );

      // Analyze slow queries
      const slowQueries = recentQueries.filter(q => q.executionTime > this.SLOW_QUERY_THRESHOLD);
      
      if (slowQueries.length > 0) {
        const groupedByTable = this.groupQueriesByTable(slowQueries);
        
        Object.entries(groupedByTable).forEach(([table, queries]) => {
          if (queries.length > 5) { // Multiple slow queries on same table
            suggestions.push({
              type: 'index',
              priority: 'high',
              description: `Multiple slow queries detected on table "${table}"`,
              table,
              suggestedAction: `Consider adding indexes on frequently queried columns in ${table}`,
              potentialImpact: 'Could reduce query time by 50-90%'
            });
          }
        });
      }

      // Analyze frequently accessed tables without caching
      const frequentlyAccessedTables = this.getFrequentlyAccessedTables(recentQueries);
      
      frequentlyAccessedTables.forEach(({ table, count, avgTime }) => {
        if (count > 100 && avgTime > 200) { // Frequently accessed but slow
          suggestions.push({
            type: 'cache',
            priority: 'medium',
            description: `Table "${table}" is frequently accessed but has slow queries`,
            table,
            suggestedAction: `Implement caching for ${table} queries`,
            potentialImpact: 'Could reduce database load by 70-80%'
          });
        }
      });

      // Analyze N+1 query patterns
      const n1Patterns = this.detectN1QueryPatterns(recentQueries);
      
      n1Patterns.forEach(pattern => {
        suggestions.push({
          type: 'query',
          priority: 'high',
          description: 'N+1 query pattern detected',
          query: pattern.query,
          suggestedAction: 'Use join queries or batch loading instead of multiple individual queries',
          potentialImpact: 'Could reduce query count by 90% and improve response time'
        });
      });

      loggingService.info('Optimization suggestions generated', {
        suggestionCount: suggestions.length,
        suggestions: suggestions.map(s => ({ type: s.type, priority: s.priority, table: s.table }))
      });

      return suggestions;

    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'generate_optimization_suggestions'
      });
      return [];
    }
  }

  /**
   * Auto-optimize common query patterns
   */
  private async autoOptimizeQueries(): Promise<void> {
    try {
      // Clear expired query cache entries
      await this.cache.invalidatePattern('query:*:expired');

      // Preload frequently accessed data
      await this.preloadFrequentData();

      // Optimize connection pool if needed
      await this.optimizeConnectionPool();

      loggingService.info('Auto-optimization completed');

    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'auto_optimize_queries'
      });
    }
  }

  /**
   * Cache frequently accessed query results
   */
  async cacheQueryResult(cacheKey: string, result: any, ttl: number = 300): Promise<void> {
    try {
      await this.cache.set(cacheKey, result, ttl);
      loggingService.debug('Query result cached', { cacheKey, ttl });
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'cache_query_result',
        cacheKey
      });
    }
  }

  /**
   * Get cached query result
   */
  async getCachedQueryResult<T>(cacheKey: string): Promise<T | null> {
    try {
      const result = await this.cache.get<T>(cacheKey);
      if (result) {
        loggingService.debug('Cache hit for query', { cacheKey });
        metricsService.recordCacheOperation('hit');
      } else {
        metricsService.recordCacheOperation('miss');
      }
      return result;
    } catch (error) {
      loggingService.logError(error as Error, {
        operation: 'get_cached_query_result',
        cacheKey
      });
      return null;
    }
  }

  /**
   * Execute query with automatic caching
   */
  async executeWithCache<T>(
    cacheKey: string,
    queryFn: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    // Try cache first
    const cached = await this.getCachedQueryResult<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Execute query
    const startTime = Date.now();
    try {
      const result = await queryFn();
      const executionTime = Date.now() - startTime;

      // Record query analytics
      this.recordQuery(cacheKey, executionTime);

      // Cache result
      await this.cacheQueryResult(cacheKey, result, ttl);

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.recordQuery(cacheKey, executionTime);
      throw error;
    }
  }

  // Helper methods

  private sanitizeQuery(query: string): string {
    // Remove sensitive data and normalize query for analysis
    return query
      .replace(/\$\d+/g, '?') // Replace parameter placeholders
      .replace(/\s+/g, ' ')   // Normalize whitespace
      .trim()
      .substring(0, 200);     // Limit length
  }

  private extractOperation(query: string): 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' {
    const firstWord = query.trim().split(' ')[0].toUpperCase();
    return ['SELECT', 'INSERT', 'UPDATE', 'DELETE'].includes(firstWord) 
      ? firstWord as any 
      : 'SELECT';
  }

  private extractTable(query: string): string {
    // Simple table extraction - would be more sophisticated in real implementation
    const match = query.match(/(?:FROM|INTO|UPDATE)\s+`?(\w+)`?/i);
    return match ? match[1] : 'unknown';
  }

  private async calculateCacheHitRate(): Promise<number> {
    // This would calculate actual cache hit rate
    // For now, return a mock value
    return Math.floor(Math.random() * 40) + 60; // 60-100%
  }

  private async getConnectionPoolStats() {
    // This would return actual connection pool statistics
    // For now, return mock values
    return {
      active: Math.floor(Math.random() * 10) + 5,
      idle: Math.floor(Math.random() * 5) + 2,
      waiting: Math.floor(Math.random() * 3)
    };
  }

  private calculateTableStats(queries: QueryAnalytics[]) {
    const tableStats: { [tableName: string]: any } = {};

    queries.forEach(query => {
      if (!tableStats[query.table]) {
        tableStats[query.table] = {
          size: Math.floor(Math.random() * 1000) + 100, // Mock size
          queryCount: 0,
          totalTime: 0
        };
      }

      tableStats[query.table].queryCount++;
      tableStats[query.table].totalTime += query.executionTime;
    });

    // Calculate averages
    Object.keys(tableStats).forEach(table => {
      const stats = tableStats[table];
      stats.averageQueryTime = stats.totalTime / stats.queryCount;
      delete stats.totalTime; // Remove intermediate value
    });

    return tableStats;
  }

  private groupQueriesByTable(queries: QueryAnalytics[]) {
    return queries.reduce((acc, query) => {
      if (!acc[query.table]) {
        acc[query.table] = [];
      }
      acc[query.table].push(query);
      return acc;
    }, {} as { [table: string]: QueryAnalytics[] });
  }

  private getFrequentlyAccessedTables(queries: QueryAnalytics[]) {
    const tableStats = this.calculateTableStats(queries);
    
    return Object.entries(tableStats)
      .map(([table, stats]) => ({
        table,
        count: stats.queryCount,
        avgTime: stats.averageQueryTime
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 most accessed tables
  }

  private detectN1QueryPatterns(queries: QueryAnalytics[]): { query: string; count: number }[] {
    // Simplified N+1 detection - look for repeated similar queries
    const queryPatterns: { [pattern: string]: number } = {};

    queries.forEach(query => {
      // Normalize query to detect patterns
      const pattern = query.query.replace(/\d+/g, 'N');
      queryPatterns[pattern] = (queryPatterns[pattern] || 0) + 1;
    });

    return Object.entries(queryPatterns)
      .filter(([_, count]) => count > 10) // More than 10 similar queries
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count);
  }

  private async preloadFrequentData(): Promise<void> {
    // This would preload commonly accessed data
    loggingService.debug('Preloading frequent data patterns');
  }

  private async optimizeConnectionPool(): Promise<void> {
    // This would optimize database connection pool settings
    loggingService.debug('Optimizing connection pool settings');
  }
}

// Export singleton instance
export const databaseOptimizationService = new DatabaseOptimizationService();