const CACHE_NAME = 'nutriscan-v1';
const OFFLINE_URL = 'offline.html';

// Archivos a cachear inicialmente
const INITIAL_CACHED_RESOURCES = [
  '/nutriscan-pwa/',
  '/nutriscan-pwa/index.html',
  '/nutriscan-pwa/offline.html',
  '/nutriscan-pwa/css/styles.css',
  '/nutriscan-pwa/js/app.js',
  '/nutriscan-pwa/js/camera.js',
  '/nutriscan-pwa/js/food-recognition.js',
  '/nutriscan-pwa/manifest.json',
  '/nutriscan-pwa/img/icons/icon-72x72.png',
  '/nutriscan-pwa/img/icons/icon-96x96.png',
  '/nutriscan-pwa/img/icons/icon-128x128.png',
  '/nutriscan-pwa/img/icons/icon-144x144.png',
  '/nutriscan-pwa/img/icons/icon-152x152.png',
  '/nutriscan-pwa/img/icons/icon-192x192.png',
  '/nutriscan-pwa/img/icons/icon-384x384.png',
  '/nutriscan-pwa/img/icons/icon-512x512.png'
];

// Instalar el service worker y cachear archivos iniciales
self.addEventListener('install', event => {
  console.log('[Service Worker] Installation');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching initial resources');
        return cache.addAll(INITIAL_CACHED_RESOURCES);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
  );
});

// Activar el service worker y limpiar caches antiguos
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activation');
  
  event.waitUntil(
    caches.keys()
      .then(keyList => {
        return Promise.all(keyList.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        }));
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        return self.clients.claim();
      })
  );
});

// Interceptar solicitudes de red
self.addEventListener('fetch', event => {
  console.log('[Service Worker] Fetch', event.request.url);
  
  // Estrategia: Cache first, falling back to network, then offline page
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache', event.request.url);
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            // No cachear respuestas fallidas
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Cachear la nueva respuesta
            let responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                console.log('[Service Worker] Caching new resource', event.request.url);
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.log('[Service Worker] Fetch failed; returning offline page instead.', error);
            
            // Si es una solicitud de página, mostrar la página offline
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // Para otros recursos, devolver un error
            return new Response('Network error', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Manejar mensajes del cliente
self.addEventListener('message', event => {
  console.log('[Service Worker] Message received', event.data);
  
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Sincronización en segundo plano
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background Sync', event.tag);
  
  if (event.tag === 'sync-food-data') {
    event.waitUntil(syncFoodData());
  }
});

// Función para sincronizar datos de alimentos
async function syncFoodData() {
  console.log('[Service Worker] Syncing food data');
  // Aquí iría la lógica para sincronizar datos pendientes
  // cuando se recupera la conexión
}

// Notificaciones push
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/nutriscan-pwa/img/icons/icon-192x192.png',
      badge: '/nutriscan-pwa/img/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Ver detalles'
        },
        {
          action: 'close',
          title: 'Cerrar'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification('NutriScan', options)
    );
  }
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/nutriscan-pwa/index.html')
    );
  }
});
