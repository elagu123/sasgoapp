/**
 * Prometheus Metrics Service
 * Provides application metrics for monitoring and alerting
 */

import { register, collectDefaultMetrics, Counter, Histogram, Gauge, Summary } from 'prom-client';

export class MetricsService {
  // HTTP request metrics
  private httpRequestsTotal: Counter<string>;
  private httpRequestDuration: Histogram<string>;
  private httpRequestSizeBytes: Histogram<string>;
  private httpResponseSizeBytes: Histogram<string>;

  // Database metrics
  private dbQueriesTotal: Counter<string>;
  private dbQueryDuration: Histogram<string>;
  private dbConnectionsActive: Gauge<string>;
  private dbConnectionsIdle: Gauge<string>;

  // Cache metrics
  private cacheOperationsTotal: Counter<string>;
  private cacheHitRate: Gauge<string>;
  private cacheMemoryUsage: Gauge<string>;
  private cacheConnectionsActive: Gauge<string>;

  // Business metrics
  private tripsCreated: Counter<string>;
  private tripsShared: Counter<string>;
  private expensesAdded: Counter<string>;
  private userRegistrations: Counter<string>;
  private userLogins: Counter<string>;

  // System metrics
  private memoryUsage: Gauge<string>;
  private cpuUsage: Gauge<string>;
  private diskUsage: Gauge<string>;
  private uptime: Gauge<string>;

  // Error metrics
  private errorsTotal: Counter<string>;
  private errorsByEndpoint: Counter<string>;
  private criticalErrors: Counter<string>;

  // WebSocket metrics
  private websocketConnections: Gauge<string>;
  private websocketMessages: Counter<string>;

  constructor() {
    // Enable default metrics collection (CPU, memory, etc.)
    collectDefaultMetrics({
      register,
      prefix: 'sasgoapp_',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
    });

    this.initializeHttpMetrics();
    this.initializeDatabaseMetrics();
    this.initializeCacheMetrics();
    this.initializeBusinessMetrics();
    this.initializeSystemMetrics();
    this.initializeErrorMetrics();
    this.initializeWebSocketMetrics();
  }

  private initializeHttpMetrics(): void {
    this.httpRequestsTotal = new Counter({
      name: 'sasgoapp_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'endpoint', 'status_code', 'user_id'],
      registers: [register]
    });

    this.httpRequestDuration = new Histogram({
      name: 'sasgoapp_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'endpoint', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [register]
    });

    this.httpRequestSizeBytes = new Histogram({
      name: 'sasgoapp_http_request_size_bytes',
      help: 'Size of HTTP requests in bytes',
      labelNames: ['method', 'endpoint'],
      buckets: [1, 100, 1000, 10000, 100000, 1000000],
      registers: [register]
    });

    this.httpResponseSizeBytes = new Histogram({
      name: 'sasgoapp_http_response_size_bytes',
      help: 'Size of HTTP responses in bytes',
      labelNames: ['method', 'endpoint', 'status_code'],
      buckets: [1, 100, 1000, 10000, 100000, 1000000],
      registers: [register]
    });
  }

  private initializeDatabaseMetrics(): void {
    this.dbQueriesTotal = new Counter({
      name: 'sasgoapp_db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'table', 'status'],
      registers: [register]
    });

    this.dbQueryDuration = new Histogram({
      name: 'sasgoapp_db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2],
      registers: [register]
    });

    this.dbConnectionsActive = new Gauge({
      name: 'sasgoapp_db_connections_active',
      help: 'Number of active database connections',
      registers: [register]
    });

    this.dbConnectionsIdle = new Gauge({
      name: 'sasgoapp_db_connections_idle',
      help: 'Number of idle database connections',
      registers: [register]
    });
  }

  private initializeCacheMetrics(): void {
    this.cacheOperationsTotal = new Counter({
      name: 'sasgoapp_cache_operations_total',
      help: 'Total number of cache operations',
      labelNames: ['operation', 'status'],
      registers: [register]
    });

    this.cacheHitRate = new Gauge({
      name: 'sasgoapp_cache_hit_rate',
      help: 'Cache hit rate percentage',
      registers: [register]
    });

    this.cacheMemoryUsage = new Gauge({
      name: 'sasgoapp_cache_memory_usage_bytes',
      help: 'Cache memory usage in bytes',
      registers: [register]
    });

    this.cacheConnectionsActive = new Gauge({
      name: 'sasgoapp_cache_connections_active',
      help: 'Number of active cache connections',
      registers: [register]
    });
  }

  private initializeBusinessMetrics(): void {
    this.tripsCreated = new Counter({
      name: 'sasgoapp_trips_created_total',
      help: 'Total number of trips created',
      labelNames: ['user_id', 'destination_type'],
      registers: [register]
    });

    this.tripsShared = new Counter({
      name: 'sasgoapp_trips_shared_total',
      help: 'Total number of trips shared',
      labelNames: ['permission_level'],
      registers: [register]
    });

    this.expensesAdded = new Counter({
      name: 'sasgoapp_expenses_added_total',
      help: 'Total number of expenses added',
      labelNames: ['category', 'trip_id'],
      registers: [register]
    });

    this.userRegistrations = new Counter({
      name: 'sasgoapp_user_registrations_total',
      help: 'Total number of user registrations',
      registers: [register]
    });

    this.userLogins = new Counter({
      name: 'sasgoapp_user_logins_total',
      help: 'Total number of user logins',
      labelNames: ['status'],
      registers: [register]
    });
  }

  private initializeSystemMetrics(): void {
    this.memoryUsage = new Gauge({
      name: 'sasgoapp_memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type'],
      registers: [register]
    });

    this.cpuUsage = new Gauge({
      name: 'sasgoapp_cpu_usage_percent',
      help: 'CPU usage percentage',
      registers: [register]
    });

    this.diskUsage = new Gauge({
      name: 'sasgoapp_disk_usage_bytes',
      help: 'Disk usage in bytes',
      labelNames: ['mount'],
      registers: [register]
    });

    this.uptime = new Gauge({
      name: 'sasgoapp_uptime_seconds',
      help: 'Application uptime in seconds',
      registers: [register]
    });
  }

  private initializeErrorMetrics(): void {
    this.errorsTotal = new Counter({
      name: 'sasgoapp_errors_total',
      help: 'Total number of errors',
      labelNames: ['type', 'severity'],
      registers: [register]
    });

    this.errorsByEndpoint = new Counter({
      name: 'sasgoapp_errors_by_endpoint_total',
      help: 'Total number of errors by endpoint',
      labelNames: ['method', 'endpoint', 'error_code'],
      registers: [register]
    });

    this.criticalErrors = new Counter({
      name: 'sasgoapp_critical_errors_total',
      help: 'Total number of critical errors',
      labelNames: ['component'],
      registers: [register]
    });
  }

  private initializeWebSocketMetrics(): void {
    this.websocketConnections = new Gauge({
      name: 'sasgoapp_websocket_connections',
      help: 'Number of active WebSocket connections',
      registers: [register]
    });

    this.websocketMessages = new Counter({
      name: 'sasgoapp_websocket_messages_total',
      help: 'Total number of WebSocket messages',
      labelNames: ['type', 'direction'],
      registers: [register]
    });
  }

  // HTTP metrics methods
  recordHttpRequest(method: string, endpoint: string, statusCode: number, duration: number, userId?: string): void {
    const labels = { method, endpoint, status_code: statusCode.toString() };
    
    this.httpRequestsTotal.inc({
      ...labels,
      user_id: userId || 'anonymous'
    });
    
    this.httpRequestDuration.observe(labels, duration / 1000); // Convert to seconds
  }

  recordHttpRequestSize(method: string, endpoint: string, sizeBytes: number): void {
    this.httpRequestSizeBytes.observe({ method, endpoint }, sizeBytes);
  }

  recordHttpResponseSize(method: string, endpoint: string, statusCode: number, sizeBytes: number): void {
    this.httpResponseSizeBytes.observe({
      method,
      endpoint,
      status_code: statusCode.toString()
    }, sizeBytes);
  }

  // Database metrics methods
  recordDatabaseQuery(operation: string, table: string, duration: number, success: boolean): void {
    const status = success ? 'success' : 'error';
    
    this.dbQueriesTotal.inc({ operation, table, status });
    this.dbQueryDuration.observe({ operation, table }, duration / 1000);
  }

  updateDatabaseConnections(active: number, idle: number): void {
    this.dbConnectionsActive.set(active);
    this.dbConnectionsIdle.set(idle);
  }

  // Cache metrics methods
  recordCacheOperation(operation: 'hit' | 'miss' | 'set' | 'del' | 'evict', success: boolean = true): void {
    const status = success ? 'success' : 'error';
    this.cacheOperationsTotal.inc({ operation, status });
  }

  updateCacheMetrics(hitRate: number, memoryUsage: number, connections: number): void {
    this.cacheHitRate.set(hitRate);
    this.cacheMemoryUsage.set(memoryUsage);
    this.cacheConnectionsActive.set(connections);
  }

  // Business metrics methods
  recordTripCreated(userId: string, destinationType: string = 'unknown'): void {
    this.tripsCreated.inc({ user_id: userId, destination_type: destinationType });
  }

  recordTripShared(permissionLevel: string): void {
    this.tripsShared.inc({ permission_level: permissionLevel });
  }

  recordExpenseAdded(category: string, tripId: string): void {
    this.expensesAdded.inc({ category, trip_id: tripId });
  }

  recordUserRegistration(): void {
    this.userRegistrations.inc();
  }

  recordUserLogin(success: boolean): void {
    const status = success ? 'success' : 'failed';
    this.userLogins.inc({ status });
  }

  // Error metrics methods
  recordError(type: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    this.errorsTotal.inc({ type, severity });
    
    if (severity === 'critical') {
      this.criticalErrors.inc({ component: type });
    }
  }

  recordEndpointError(method: string, endpoint: string, errorCode: string): void {
    this.errorsByEndpoint.inc({ method, endpoint, error_code: errorCode });
  }

  // System metrics methods
  updateSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    
    this.memoryUsage.set({ type: 'rss' }, memUsage.rss);
    this.memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
    this.memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
    this.memoryUsage.set({ type: 'external' }, memUsage.external);
    
    this.uptime.set(process.uptime());
  }

  // WebSocket metrics methods
  updateWebSocketConnections(count: number): void {
    this.websocketConnections.set(count);
  }

  recordWebSocketMessage(type: string, direction: 'inbound' | 'outbound'): void {
    this.websocketMessages.inc({ type, direction });
  }

  // Utility methods
  getMetrics(): Promise<string> {
    return register.metrics();
  }

  getRegister() {
    return register;
  }

  async getHealthMetrics(): Promise<{
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: number;
  }> {
    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage().system / 1000000 // Convert to percentage
    };
  }

  // Convenience methods for backward compatibility
  incrementCounter(name: string, labels?: Record<string, string>): void {
    // Map to existing counter based on name
    switch (name) {
      case 'booking_controller_errors':
        this.recordError('booking_controller', 'medium');
        break;
      default:
        this.recordError('generic', 'low');
    }
  }

  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    // Map to existing histogram based on name
    switch (name) {
      case 'booking_search_duration':
        // Use HTTP request duration as a proxy
        this.httpRequestDuration.observe(
          { method: 'GET', endpoint: '/search', status_code: '200' }, 
          value / 1000 // Convert to seconds
        );
        break;
      default:
        // Generic histogram - could be expanded
        console.warn(`Unknown histogram metric: ${name}`);
    }
  }

  // Start collecting system metrics periodically
  startPeriodicCollection(intervalMs: number = 10000): NodeJS.Timeout {
    return setInterval(() => {
      this.updateSystemMetrics();
    }, intervalMs);
  }
}

// Singleton instance
export const metricsService = new MetricsService();
export default metricsService;