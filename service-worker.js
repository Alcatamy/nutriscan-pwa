const CACHE_NAME = 'nutriscan-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/camera.js',
  '/js/food-recognition.js',
  '/img/logo.png',
  '/img/icons/icon-192x192.png',
  '/img/icons/icon-512x512.png'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retornar respuesta del cache si existe
        if (response) {
          return response;
        }

        // Clonar la petición
        const fetchRequest = event.request.clone();

        // Hacer la petición a la red
        return fetch(fetchRequest).then((response) => {
          // Verificar si la respuesta es válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clonar la respuesta
          const responseToCache = response.clone();

          // Guardar en cache
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/img/icons/icon-192x192.png',
    badge: '/img/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver más'
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
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Manejar sincronización en segundo plano
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-records') {
    event.waitUntil(syncRecords());
  }
});

// Función para sincronizar registros
async function syncRecords() {
  try {
    const db = await openDatabase();
    const records = await db.getAll('pendingRecords');
    
    for (const record of records) {
      await fetch('/api/sync', {
        method: 'POST',
        body: JSON.stringify(record)
      });
      await db.delete('pendingRecords', record.id);
    }
  } catch (error) {
    console.error('Error sincronizando registros:', error);
  }
}

// Función para abrir la base de datos IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NutriScanDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingRecords')) {
        db.createObjectStore('pendingRecords', { keyPath: 'id' });
      }
    };
  });
}
