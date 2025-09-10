// SAS Go Service Worker
const CACHE_NAME = 'sasgo-v1.1.0';
const OFFLINE_URL = '/offline.html';

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Resources to cache immediately
const PRECACHE_RESOURCES = [
  '/',
  '/offline.html',
  '/manifest.json'
  // Icons will be cached when needed if they exist
];

// Resources that should be cached with different strategies
const CACHE_RULES = [
  {
    pattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: 'google-fonts'
  },
  {
    pattern: /^https:\/\/images\.unsplash\.com\//,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: 'images-unsplash',
    expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 } // 30 days
  },
  {
    pattern: /^https:\/\/i\.pravatar\.cc\//,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: 'avatar-images',
    expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 } // 7 days
  },
  {
    pattern: /\/api\//,
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    cacheName: 'api-cache',
    expiration: { maxEntries: 100, maxAgeSeconds: 5 * 60 } // 5 minutes
  },
  {
    pattern: /\.(?:js|css|html)$/,
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    cacheName: 'static-resources'
  },
  {
    pattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    cacheName: 'images',
    expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 } // 30 days
  }
];

// Background sync tasks
const SYNC_TASKS = {
  TRIP_SYNC: 'trip-sync',
  BOOKING_SYNC: 'booking-sync',
  ANALYTICS_SYNC: 'analytics-sync',
  POST_SYNC: 'post-sync',
  OFFLINE_DATA: 'background-sync-trips'
};

// IndexedDB setup for offline storage
const DB_NAME = 'SasGoOfflineDB';
const DB_VERSION = 2;
const STORES = {
  TRIPS: 'trips',
  BOOKINGS: 'bookings',
  POSTS: 'posts',
  SYNC_QUEUE: 'syncQueue',
  USER_DATA: 'userData',
  CACHED_RESPONSES: 'cachedResponses'
};

// Install event - cache essential resources
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Precaching resources');
        return cache.addAll(PRECACHE_RESOURCES);
      }),
      initializeOfflineDatabase()
    ]).then(() => {
      console.log('[SW] Service worker installed successfully');
      return self.skipWaiting();
    }).catch(error => {
      console.error('[SW] Installation failed:', error);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the new service worker takes control immediately
  self.clients.claim();
});

// Fetch event - handle network requests with intelligent caching
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip unsupported URL schemes
  if (!url.protocol.startsWith('http') && !url.protocol.startsWith('https')) {
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Apply cache strategies based on rules
  const rule = CACHE_RULES.find(rule => rule.pattern.test(request.url));
  
  if (rule) {
    event.respondWith(applyCacheStrategy(request, rule));
  } else {
    // Default strategy for unmatched requests
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).catch(() => {
          return new Response('Offline', { 
            status: 503, 
            statusText: 'Service Unavailable' 
          });
        });
      })
    );
  }
});

// Background sync for offline operations
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case SYNC_TASKS.TRIP_SYNC:
      event.waitUntil(syncTrips());
      break;
    case SYNC_TASKS.BOOKING_SYNC:
      event.waitUntil(syncBookings());
      break;
    case SYNC_TASKS.ANALYTICS_SYNC:
      event.waitUntil(syncAnalytics());
      break;
    case SYNC_TASKS.POST_SYNC:
      event.waitUntil(syncPosts());
      break;
    case SYNC_TASKS.OFFLINE_DATA:
      event.waitUntil(syncOfflineData());
      break;
    default:
      console.log('[SW] Unknown sync task:', event.tag);
  }
});

// Handle push notifications
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'You have new travel updates!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ]
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      options.body = payload.body || options.body;
      options.data = payload.data || options.data;
    } catch (error) {
      console.error('[SW] Error parsing push payload:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification('SAS Go', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      // Check if there's already a window open
      for (const client of clients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message handler for communication with main app
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  const { type, payload } = event.data;
  
  switch (type) {
    case 'CACHE_UPDATE':
      event.waitUntil(updateCache(payload));
      break;
    case 'OFFLINE_STORE':
      event.waitUntil(storeOfflineData(payload));
      break;
    case 'GET_CACHE_STATUS':
      event.waitUntil(getCacheStatus().then(status => {
        event.ports[0].postMessage({ type: 'CACHE_STATUS', payload: status });
      }));
      break;
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Cache strategy implementations
async function applyCacheStrategy(request, rule) {
  const { strategy, cacheName, expiration } = rule;
  const cache = await caches.open(cacheName || CACHE_NAME);
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cache);
    
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cache);
    
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cache);
    
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);
    
    case CACHE_STRATEGIES.CACHE_ONLY:
      return cache.match(request);
    
    default:
      return cacheFirst(request, cache);
  }
}

async function cacheFirst(request, cache) {
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] Network error in cache-first:', error);
    throw error;
  }
}

async function networkFirst(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache');
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    // For API requests, return structured offline response
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'This feature requires internet connection',
          offline: true
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    throw error;
  }
}

async function staleWhileRevalidate(request, cache) {
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
    console.error('[SW] Revalidation failed:', error);
  });
  
  return cached || fetchPromise;
}

async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('[SW] Navigation failed, serving offline page');
    const cache = await caches.open(CACHE_NAME);
    const offlinePage = await cache.match(OFFLINE_URL);
    return offlinePage || cache.match('/');
  }
}

// IndexedDB operations
async function initializeOfflineDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // Create object stores
      Object.values(STORES).forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          
          // Add indexes based on store type
          if (storeName === STORES.TRIPS) {
            store.createIndex('userId', 'userId', { unique: false });
            store.createIndex('startDate', 'startDate', { unique: false });
          } else if (storeName === STORES.SYNC_QUEUE) {
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('type', 'type', { unique: false });
          }
        }
      });
    };
  });
}

async function storeOfflineData(data) {
  const db = await initializeOfflineDatabase();
  const { store, records } = data;
  
  const transaction = db.transaction([store], 'readwrite');
  const objectStore = transaction.objectStore(store);
  
  for (const record of records) {
    await objectStore.put(record);
  }
  
  return transaction.complete;
}

// Sync operations
async function syncTrips() {
  console.log('[SW] Syncing trips');
  
  try {
    const db = await initializeOfflineDatabase();
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readonly');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    const index = store.index('type');
    
    const tripSyncTasks = await index.getAll('trip');
    
    for (const task of tripSyncTasks) {
      try {
        await syncSingleItem(task);
        await deleteSyncTask(task.id);
      } catch (error) {
        console.error('[SW] Failed to sync trip:', task.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Trip sync failed:', error);
  }
}

async function syncBookings() {
  console.log('[SW] Syncing bookings');
  // Similar implementation to syncTrips
}

async function syncAnalytics() {
  console.log('[SW] Syncing analytics');
  // Similar implementation to syncTrips
}

async function syncPosts() {
  console.log('[SW] Syncing posts');
  // Similar implementation to syncTrips
}

// Sync offline data (enhanced version)
async function syncOfflineData() {
  try {
    console.log('[SW] Syncing offline data...');
    
    const db = await initializeOfflineDatabase();
    const transaction = db.transaction([STORES.SYNC_QUEUE], 'readonly');
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    
    const allTasks = await store.getAll();
    
    for (const task of allTasks) {
      try {
        await syncSingleItem(task);
        await deleteSyncTask(task.id);
      } catch (error) {
        console.error('[SW] Failed to sync task:', task.id, error);
      }
    }
    
    console.log('[SW] Offline data sync completed');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

async function syncSingleItem(task) {
  const response = await fetch(`/api/${task.endpoint}`, {
    method: task.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${task.token}`
    },
    body: JSON.stringify(task.data)
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }
  
  return response.json();
}

async function deleteSyncTask(taskId) {
  const db = await initializeOfflineDatabase();
  const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
  const store = transaction.objectStore(STORES.SYNC_QUEUE);
  
  await store.delete(taskId);
  return transaction.complete;
}

// Cache management
async function updateCache(payload) {
  const { resources, cacheName = CACHE_NAME } = payload;
  const cache = await caches.open(cacheName);
  
  for (const resource of resources) {
    try {
      const response = await fetch(resource);
      if (response.ok) {
        await cache.put(resource, response);
      }
    } catch (error) {
      console.error('[SW] Failed to cache resource:', resource, error);
    }
  }
}

async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = {
      count: keys.length,
      size: await calculateCacheSize(cache)
    };
  }
  
  return status;
}

async function calculateCacheSize(cache) {
  const keys = await cache.keys();
  let totalSize = 0;
  
  for (const key of keys) {
    const response = await cache.match(key);
    if (response) {
      const blob = await response.blob();
      totalSize += blob.size;
    }
  }
  
  return totalSize;
}

// Utility functions
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Log service worker status
console.log('[SW] Service worker script loaded');

// Handle errors
self.addEventListener('error', event => {
  console.error('[SW] Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
  event.preventDefault();
});