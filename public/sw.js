// Minimal Service Worker for ForeverPages PWA
// Basic implementation without external dependencies

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

// Basic caching for static assets
const CACHE_NAME = 'foreverpages-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/favicon.ico',
  '/manifest.json'
];

// Install handler - cache basic resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE_URLS);
    })
  );
});

// Fetch handler - serve from cache when possible, but don't interfere with external scripts
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip caching/intercepting external domains (like Google APIs, reCAPTCHA, etc.)
  if (url.origin !== self.location.origin) {
    return; // Let the browser handle external requests normally
  }

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // CRITICAL: Never cache authentication or session-related endpoints
  const noCachePaths = [
    '/api/auth/',
    '/api/user/profile',
    '/api/session',
    '/__nextauth',
    '/login',
    '/logout',
    '/signup'
  ];

  if (noCachePaths.some(path => url.pathname.includes(path))) {
    // Fetch from network only, no caching
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store',
        credentials: 'same-origin'
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached version if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cache successful responses
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Return offline fallback if available
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      });
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
});
