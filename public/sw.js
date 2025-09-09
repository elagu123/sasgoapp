// SAS Go Service Worker
const CACHE_NAME = 'sasgo-v1.0.0';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  // Add more static assets as needed
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Opened cache');
        return cache.addAll(urlsToCache.filter(url => url)); // Filter out empty URLs
      })
      .catch((error) => {
        console.error('[SW] Cache addAll failed:', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
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

// Fetch event - serve from cache when offline, network-first for API calls
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone();
          
          // Only cache successful responses
          if (response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If no cached response, return a custom offline response for API calls
            if (request.method === 'GET') {
              return new Response(
                JSON.stringify({ 
                  error: 'Offline', 
                  message: 'Esta función requiere conexión a internet' 
                }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            }
            
            return new Response('Offline', { status: 503 });
          });
        })
    );
    return;
  }

  // Handle static resources with cache-first strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response before caching
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch(() => {
        // If it's a navigation request and we're offline, serve the index.html from cache
        if (request.mode === 'navigate') {
          return caches.match('/');
        }
        
        // For other failed requests, return a basic offline response
        return new Response('Offline', { 
          status: 503, 
          statusText: 'Service Unavailable' 
        });
      });
    })
  );
});

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background Sync:', event.tag);
  
  if (event.tag === 'background-sync-trips') {
    event.waitUntil(syncOfflineData());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de SAS Go',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver detalles',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('SAS Go', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app or focus existing window
    event.waitUntil(
      clients.matchAll().then((clients) => {
        if (clients.length > 0) {
          clients[0].focus();
        } else {
          self.clients.openWindow('/app/dashboard');
        }
      })
    );
  }
});

// Sync offline data (placeholder for actual implementation)
async function syncOfflineData() {
  try {
    console.log('[SW] Syncing offline data...');
    
    // Get offline data from IndexedDB or localStorage
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await syncAction(action);
        await removeOfflineAction(action.id);
      } catch (error) {
        console.error('[SW] Failed to sync action:', action, error);
      }
    }
    
    console.log('[SW] Offline data sync completed');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Placeholder functions for offline data management
async function getOfflineActions() {
  // This would typically read from IndexedDB
  return [];
}

async function syncAction(action) {
  // This would make the actual API call to sync the action
  console.log('[SW] Syncing action:', action);
}

async function removeOfflineAction(actionId) {
  // This would remove the synced action from local storage
  console.log('[SW] Removing synced action:', actionId);
}