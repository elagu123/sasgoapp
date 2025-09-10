import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { pwaManager } from '../utils/pwaUtils';

// Database schema
interface OfflineDB extends DBSchema {
  trips: {
    key: string;
    value: {
      id: string;
      userId: string;
      title: string;
      destination: string;
      startDate: string;
      endDate: string;
      data: any;
      lastModified: string;
      syncStatus: 'synced' | 'pending' | 'failed';
    };
    indexes: { 'by-user': string; 'by-sync-status': string };
  };
  bookings: {
    key: string;
    value: {
      id: string;
      userId: string;
      tripId: string;
      type: 'hotel' | 'flight' | 'activity';
      data: any;
      lastModified: string;
      syncStatus: 'synced' | 'pending' | 'failed';
    };
    indexes: { 'by-user': string; 'by-trip': string };
  };
  posts: {
    key: string;
    value: {
      id: string;
      userId: string;
      tripId: string;
      title: string;
      data: any;
      lastModified: string;
      syncStatus: 'synced' | 'pending' | 'failed';
    };
    indexes: { 'by-user': string; 'by-trip': string };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      type: 'trip' | 'booking' | 'post' | 'analytics';
      method: 'POST' | 'PUT' | 'DELETE';
      endpoint: string;
      data: any;
      token?: string;
      timestamp: number;
      retryCount: number;
      maxRetries: number;
    };
    indexes: { 'by-type': string; 'by-timestamp': number };
  };
  userData: {
    key: string;
    value: {
      id: string;
      userId: string;
      type: 'profile' | 'preferences' | 'analytics';
      data: any;
      lastModified: string;
      expiresAt?: string;
    };
    indexes: { 'by-user': string; 'by-type': string };
  };
  cachedResponses: {
    key: string;
    value: {
      id: string;
      url: string;
      method: string;
      headers: any;
      data: any;
      timestamp: number;
      expiresAt: number;
    };
    indexes: { 'by-url': string; 'by-expires': number };
  };
}

export interface OfflineAction {
  id: string;
  type: 'trip' | 'booking' | 'post' | 'analytics';
  method: 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data: any;
  token?: string;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingActions: number;
  lastSyncTime?: Date;
  syncErrors: string[];
}

class OfflineService {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private syncCallbacks: ((status: SyncStatus) => void)[] = [];
  private syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingActions: 0,
    syncErrors: []
  };

  constructor() {
    this.init();
    this.setupEventListeners();
  }

  private async init() {
    try {
      this.db = await openDB<OfflineDB>('SasGoOfflineDB', 2, {
        upgrade(db, oldVersion, newVersion, transaction) {
          console.log('[OfflineService] Upgrading database from', oldVersion, 'to', newVersion);

          // Create trips store
          if (!db.objectStoreNames.contains('trips')) {
            const tripsStore = db.createObjectStore('trips', { keyPath: 'id' });
            tripsStore.createIndex('by-user', 'userId');
            tripsStore.createIndex('by-sync-status', 'syncStatus');
          }

          // Create bookings store
          if (!db.objectStoreNames.contains('bookings')) {
            const bookingsStore = db.createObjectStore('bookings', { keyPath: 'id' });
            bookingsStore.createIndex('by-user', 'userId');
            bookingsStore.createIndex('by-trip', 'tripId');
          }

          // Create posts store
          if (!db.objectStoreNames.contains('posts')) {
            const postsStore = db.createObjectStore('posts', { keyPath: 'id' });
            postsStore.createIndex('by-user', 'userId');
            postsStore.createIndex('by-trip', 'tripId');
          }

          // Create sync queue store
          if (!db.objectStoreNames.contains('syncQueue')) {
            const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
            syncStore.createIndex('by-type', 'type');
            syncStore.createIndex('by-timestamp', 'timestamp');
          }

          // Create user data store
          if (!db.objectStoreNames.contains('userData')) {
            const userStore = db.createObjectStore('userData', { keyPath: 'id' });
            userStore.createIndex('by-user', 'userId');
            userStore.createIndex('by-type', 'type');
          }

          // Create cached responses store
          if (!db.objectStoreNames.contains('cachedResponses')) {
            const cacheStore = db.createObjectStore('cachedResponses', { keyPath: 'id' });
            cacheStore.createIndex('by-url', 'url');
            cacheStore.createIndex('by-expires', 'expiresAt');
          }
        }
      });

      await this.updatePendingActionsCount();
      console.log('[OfflineService] Database initialized successfully');
    } catch (error) {
      console.error('[OfflineService] Failed to initialize database:', error);
    }
  }

  private setupEventListeners() {
    // Network status change listeners
    window.addEventListener('online', () => {
      console.log('[OfflineService] Network connection restored');
      this.syncStatus.isOnline = true;
      this.notifyStatusChange();
      this.syncPendingActions();
    });

    window.addEventListener('offline', () => {
      console.log('[OfflineService] Network connection lost');
      this.syncStatus.isOnline = false;
      this.syncStatus.isSyncing = false;
      this.notifyStatusChange();
    });

    // Service Worker message listener
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        const { type, payload } = event.data;
        if (type === 'SYNC_COMPLETED') {
          this.handleSyncCompleted(payload);
        }
      });
    }
  }

  // Public API methods
  public onSyncStatusChange(callback: (status: SyncStatus) => void) {
    this.syncCallbacks.push(callback);
    // Immediately call with current status
    callback(this.syncStatus);
  }

  public getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  // Store data for offline use
  public async storeTrip(trip: any): Promise<void> {
    if (!this.db) return;

    try {
      const tripData = {
        id: trip.id,
        userId: trip.userId,
        title: trip.title,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        data: trip,
        lastModified: new Date().toISOString(),
        syncStatus: 'synced' as const
      };

      await this.db.put('trips', tripData);
      console.log('[OfflineService] Trip stored for offline use:', trip.id);
    } catch (error) {
      console.error('[OfflineService] Failed to store trip:', error);
    }
  }

  public async storeBooking(booking: any): Promise<void> {
    if (!this.db) return;

    try {
      const bookingData = {
        id: booking.id,
        userId: booking.userId,
        tripId: booking.tripId,
        type: booking.type,
        data: booking,
        lastModified: new Date().toISOString(),
        syncStatus: 'synced' as const
      };

      await this.db.put('bookings', bookingData);
      console.log('[OfflineService] Booking stored for offline use:', booking.id);
    } catch (error) {
      console.error('[OfflineService] Failed to store booking:', error);
    }
  }

  public async storePost(post: any): Promise<void> {
    if (!this.db) return;

    try {
      const postData = {
        id: post.id,
        userId: post.userId,
        tripId: post.tripId,
        title: post.title,
        data: post,
        lastModified: new Date().toISOString(),
        syncStatus: 'synced' as const
      };

      await this.db.put('posts', postData);
      console.log('[OfflineService] Post stored for offline use:', post.id);
    } catch (error) {
      console.error('[OfflineService] Failed to store post:', error);
    }
  }

  // Queue actions for sync when online
  public async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const actionId = `${action.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queueItem: OfflineAction = {
      id: actionId,
      ...action,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: action.maxRetries || 3
    };

    try {
      await this.db.put('syncQueue', queueItem);
      await this.updatePendingActionsCount();
      
      console.log('[OfflineService] Action queued for sync:', actionId);
      
      // Try to sync immediately if online
      if (this.syncStatus.isOnline) {
        this.syncPendingActions();
      }
      
      return actionId;
    } catch (error) {
      console.error('[OfflineService] Failed to queue action:', error);
      throw error;
    }
  }

  // Retrieve cached data
  public async getCachedTrips(userId: string): Promise<any[]> {
    if (!this.db) return [];

    try {
      const trips = await this.db.getAllFromIndex('trips', 'by-user', userId);
      return trips.map(trip => trip.data);
    } catch (error) {
      console.error('[OfflineService] Failed to get cached trips:', error);
      return [];
    }
  }

  public async getCachedBookings(userId: string, tripId?: string): Promise<any[]> {
    if (!this.db) return [];

    try {
      let bookings;
      if (tripId) {
        bookings = await this.db.getAllFromIndex('bookings', 'by-trip', tripId);
      } else {
        bookings = await this.db.getAllFromIndex('bookings', 'by-user', userId);
      }
      return bookings.map(booking => booking.data);
    } catch (error) {
      console.error('[OfflineService] Failed to get cached bookings:', error);
      return [];
    }
  }

  public async getCachedPosts(userId: string, tripId?: string): Promise<any[]> {
    if (!this.db) return [];

    try {
      let posts;
      if (tripId) {
        posts = await this.db.getAllFromIndex('posts', 'by-trip', tripId);
      } else {
        posts = await this.db.getAllFromIndex('posts', 'by-user', userId);
      }
      return posts.map(post => post.data);
    } catch (error) {
      console.error('[OfflineService] Failed to get cached posts:', error);
      return [];
    }
  }

  // Cache API responses
  public async cacheResponse(url: string, method: string, response: any, ttl: number = 300000): Promise<void> {
    if (!this.db) return;

    try {
      const cacheId = `${method}_${url}`;
      const cacheData = {
        id: cacheId,
        url,
        method,
        headers: {},
        data: response,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl
      };

      await this.db.put('cachedResponses', cacheData);
      console.log('[OfflineService] Response cached:', url);
    } catch (error) {
      console.error('[OfflineService] Failed to cache response:', error);
    }
  }

  public async getCachedResponse(url: string, method: string = 'GET'): Promise<any | null> {
    if (!this.db) return null;

    try {
      const cacheId = `${method}_${url}`;
      const cached = await this.db.get('cachedResponses', cacheId);
      
      if (!cached) return null;
      
      // Check if cache is expired
      if (Date.now() > cached.expiresAt) {
        await this.db.delete('cachedResponses', cacheId);
        return null;
      }
      
      return cached.data;
    } catch (error) {
      console.error('[OfflineService] Failed to get cached response:', error);
      return null;
    }
  }

  // Sync operations
  public async syncPendingActions(): Promise<void> {
    if (!this.db || !this.syncStatus.isOnline || this.syncStatus.isSyncing) {
      return;
    }

    this.syncStatus.isSyncing = true;
    this.syncStatus.syncErrors = [];
    this.notifyStatusChange();

    try {
      const pendingActions = await this.db.getAllFromIndex('syncQueue', 'by-timestamp');
      
      console.log(`[OfflineService] Syncing ${pendingActions.length} pending actions`);

      for (const action of pendingActions) {
        try {
          await this.syncSingleAction(action);
          await this.db.delete('syncQueue', action.id);
          console.log('[OfflineService] Action synced successfully:', action.id);
        } catch (error) {
          console.error('[OfflineService] Failed to sync action:', action.id, error);
          
          // Increment retry count
          action.retryCount++;
          
          if (action.retryCount >= action.maxRetries) {
            // Max retries reached, remove from queue and log error
            await this.db.delete('syncQueue', action.id);
            this.syncStatus.syncErrors.push(`Failed to sync ${action.type} after ${action.maxRetries} attempts`);
          } else {
            // Update retry count in database
            await this.db.put('syncQueue', action);
          }
        }
      }

      this.syncStatus.lastSyncTime = new Date();
      console.log('[OfflineService] Sync completed');

      // Register background sync if service worker is available
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration) {
          await registration.sync.register('background-sync-trips');
        }
      }

    } catch (error) {
      console.error('[OfflineService] Sync process failed:', error);
      this.syncStatus.syncErrors.push('Sync process failed');
    } finally {
      this.syncStatus.isSyncing = false;
      await this.updatePendingActionsCount();
      this.notifyStatusChange();
    }
  }

  private async syncSingleAction(action: OfflineAction): Promise<void> {
    const response = await fetch(`/api/${action.endpoint}`, {
      method: action.method,
      headers: {
        'Content-Type': 'application/json',
        ...(action.token && { 'Authorization': `Bearer ${action.token}` })
      },
      body: JSON.stringify(action.data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  private async handleSyncCompleted(payload: any): Promise<void> {
    console.log('[OfflineService] Background sync completed:', payload);
    await this.updatePendingActionsCount();
    this.notifyStatusChange();
  }

  private async updatePendingActionsCount(): Promise<void> {
    if (!this.db) return;

    try {
      const pendingActions = await this.db.getAll('syncQueue');
      this.syncStatus.pendingActions = pendingActions.length;
    } catch (error) {
      console.error('[OfflineService] Failed to update pending actions count:', error);
    }
  }

  private notifyStatusChange(): void {
    this.syncCallbacks.forEach(callback => {
      try {
        callback({ ...this.syncStatus });
      } catch (error) {
        console.error('[OfflineService] Error in sync status callback:', error);
      }
    });
  }

  // Cleanup operations
  public async clearExpiredCache(): Promise<void> {
    if (!this.db) return;

    try {
      const expired = await this.db.getAllFromIndex('cachedResponses', 'by-expires', IDBKeyRange.upperBound(Date.now()));
      
      for (const item of expired) {
        await this.db.delete('cachedResponses', item.id);
      }
      
      console.log(`[OfflineService] Cleared ${expired.length} expired cache entries`);
    } catch (error) {
      console.error('[OfflineService] Failed to clear expired cache:', error);
    }
  }

  public async getCacheSize(): Promise<{ entries: number; estimatedSize: string }> {
    if (!this.db) return { entries: 0, estimatedSize: '0 KB' };

    try {
      const stores = ['trips', 'bookings', 'posts', 'cachedResponses', 'userData'];
      let totalEntries = 0;

      for (const store of stores) {
        const count = await this.db.count(store as any);
        totalEntries += count;
      }

      // Estimate size (rough calculation)
      const estimatedBytes = totalEntries * 1024; // Assume 1KB per entry on average
      const estimatedSize = this.formatBytes(estimatedBytes);

      return { entries: totalEntries, estimatedSize };
    } catch (error) {
      console.error('[OfflineService] Failed to calculate cache size:', error);
      return { entries: 0, estimatedSize: '0 KB' };
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Utility methods
  public isOnline(): boolean {
    return this.syncStatus.isOnline;
  }

  public hasPendingActions(): boolean {
    return this.syncStatus.pendingActions > 0;
  }
}

export const offlineService = new OfflineService();