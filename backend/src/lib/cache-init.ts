/**
 * Cache Initialization
 * Handles Redis connection and graceful shutdown
 */

import { initializeCache, getCacheService } from '../services/cache.service';

export class CacheManager {
  private static instance: CacheManager;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔄 Cache already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing Redis cache...');
      
      await initializeCache();
      
      const cacheService = getCacheService();
      const healthCheck = await cacheService.healthCheck();
      
      if (healthCheck.status === 'healthy') {
        console.log(`✅ Redis cache initialized successfully (latency: ${healthCheck.latency}ms)`);
        this.isInitialized = true;
        
        // Log cache configuration
        this.logCacheConfig();
      } else {
        console.warn('⚠️  Redis cache initialized but not healthy');
      }
    } catch (error) {
      console.error('❌ Failed to initialize Redis cache:', error);
      console.log('📝 Application will continue without caching');
      
      // Don't throw error - allow app to continue without cache
      this.isInitialized = false;
    }
  }

  private logCacheConfig(): void {
    const config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || '6379',
      db: process.env.REDIS_DB || '0',
      hasPassword: !!process.env.REDIS_PASSWORD
    };

    console.log('📊 Cache Configuration:', {
      ...config,
      password: config.hasPassword ? '***' : 'none'
    });
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      console.log('🔄 Shutting down Redis cache...');
      
      const cacheService = getCacheService();
      await cacheService.disconnect();
      
      console.log('✅ Redis cache shutdown complete');
      this.isInitialized = false;
    } catch (error) {
      console.error('❌ Error during cache shutdown:', error);
    }
  }

  isHealthy(): boolean {
    if (!this.isInitialized) {
      return false;
    }

    const cacheService = getCacheService();
    return cacheService.isHealthy();
  }

  async getHealthStatus(): Promise<{
    initialized: boolean;
    healthy: boolean;
    latency?: number;
    error?: string;
  }> {
    try {
      if (!this.isInitialized) {
        return {
          initialized: false,
          healthy: false,
          error: 'Cache not initialized'
        };
      }

      const cacheService = getCacheService();
      const healthCheck = await cacheService.healthCheck();
      
      return {
        initialized: this.isInitialized,
        healthy: healthCheck.status === 'healthy',
        latency: healthCheck.latency
      };
    } catch (error) {
      return {
        initialized: this.isInitialized,
        healthy: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Graceful shutdown handler
export const setupCacheShutdownHandlers = (): void => {
  const shutdownHandler = async (signal: string) => {
    console.log(`\n📨 Received ${signal}, shutting down cache gracefully...`);
    await cacheManager.shutdown();
  };

  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
  process.on('SIGINT', () => shutdownHandler('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('💥 Uncaught Exception:', error);
    await cacheManager.shutdown();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    await cacheManager.shutdown();
    process.exit(1);
  });
};