// Minimal Service Worker for ForeverPages PWA
// Professional caching with proper versioning and update handling

// ==== CACHE VERSION - INCREMENT ON EACH DEPLOY ====
// This is auto-updated by the build process or manually when deploying
const SW_VERSION = '2.0.0';
const BUILD_TIME = '__BUILD_TIME__'; // Replaced at build time

// Cache names with version for proper cache invalidation
const CACHE_PREFIX = 'foreverpages';
const CACHE_NAME = `${CACHE_PREFIX}-v${SW_VERSION}`;
const STATIC_CACHE = `${CACHE_PREFIX}-static-v${SW_VERSION}`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}-dynamic-v${SW_VERSION}`;
const IMAGE_CACHE = `${CACHE_PREFIX}-images-v${SW_VERSION}`;

// Resources to precache (only truly static assets)
const STATIC_CACHE_URLS = [
  '/favicon.ico',
  '/manifest.json'
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing version ${SW_VERSION}`);

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_CACHE_URLS);
    }).then(() => {
      // Force activation immediately (skip waiting)
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating version ${SW_VERSION}`);

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete caches that start with our prefix but aren't current version
              return name.startsWith(CACHE_PREFIX) &&
                     !name.includes(`v${SW_VERSION}`);
            })
            .map((name) => {
              console.log(`[SW] Deleting old cache: ${name}`);
              return caches.delete(name);
            })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      // Notify all clients about the update
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: SW_VERSION,
            message: 'New version available! Please refresh for the latest updates.'
          });
        });
      });
    })
  );
});

// Fetch handler - smart caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip caching for external domains
  if (url.origin !== self.location.origin) {
    return;
  }

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // ==== NEVER CACHE THESE - Always fetch from network ====
  const neverCachePaths = [
    '/api/auth/',
    '/api/user/',
    '/api/session',
    '/__nextauth',
    '/login',
    '/logout',
    '/signup',
    '/api/notifications',
    '/api/memorials', // Memorial data should be fresh
  ];

  if (neverCachePaths.some(path => url.pathname.includes(path))) {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store',
        credentials: 'same-origin'
      })
    );
    return;
  }

  // ==== NETWORK FIRST for HTML pages (always get fresh content) ====
  if (event.request.destination === 'document' ||
      event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone and cache the response for offline fallback
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Offline fallback - return cached version
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // ==== CACHE FIRST for static assets (JS, CSS) with network fallback ====
  if (url.pathname.startsWith('/_next/static/') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // ==== CACHE FIRST for images with longer TTL ====
  if (event.request.destination === 'image' ||
      url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // ==== STALE-WHILE-REVALIDATE for API data (except auth) ====
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.match(event.request).then((cached) => {
          const fetchPromise = fetch(event.request).then((response) => {
            if (response.ok) {
              cache.put(event.request, response.clone());
            }
            return response;
          });

          // Return cached immediately, update in background
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // ==== DEFAULT: Network first with cache fallback ====
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    data: data.url || '/',
    requireInteraction: true,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'ForeverPages', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existingClient = clients.find(
        (client) => client.url === urlToOpen || client.url.startsWith(urlToOpen)
      );

      if (existingClient) {
        return existingClient.focus();
      } else {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync handling
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  try {
    console.log('Background sync triggered');

    // Notify main thread
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        status: 'starting',
      });
    });

    // Simulate sync work
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Notify completion
    clients.forEach((client) => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        status: 'completed',
      });
    });
  } catch (error) {
    console.error('Background sync failed:', error);
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });
  }
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Force cache clear on demand
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith(CACHE_PREFIX))
            .map((name) => caches.delete(name))
        );
      }).then(() => {
        // Notify client that cache was cleared
        if (event.source) {
          event.source.postMessage({
            type: 'CACHE_CLEARED',
            version: SW_VERSION
          });
        }
      })
    );
  }

  // Get current SW version
  if (event.data && event.data.type === 'GET_VERSION') {
    if (event.source) {
      event.source.postMessage({
        type: 'SW_VERSION',
        version: SW_VERSION,
        buildTime: BUILD_TIME
      });
    }
  }
});
