const CACHE_NAME = 'nutriscan-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/camera.js',
  '/js/food-recognition.js',
  '/img/logo.png',
  '/img/icons/icon-72x72.png',
  '/img/icons/icon-96x96.png',
  '/img/icons/icon-128x128.png',
  '/img/icons/icon-144x144.png',
  '/img/icons/icon-152x152.png',
  '/img/icons/icon-192x192.png',
  '/img/icons/icon-384x384.png',
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
  // Manejar protocol handler
  if (event.request.url.startsWith('web+nutriscan://')) {
    event.respondWith(
      caches.match('/index.html').then(response => {
        return response;
      })
    );
    return;
  }

  // Manejar share target
  if (event.request.method === 'POST' && event.request.url.includes('?action=share')) {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const image = formData.get('image');
        
        // Guardar la imagen en IndexedDB
        const db = await openDatabase();
        await db.add('pendingShares', {
          id: Date.now(),
          image: URL.createObjectURL(image),
          timestamp: new Date()
        });

        // Redirigir a la página principal
        return Response.redirect('/index.html');
      })()
    );
    return;
  }

  // Estrategia de caché para otros recursos
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        const fetchRequest = event.request.clone();
        return fetch(fetchRequest).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
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
  if (event.tag === 'sync-scans') {
    event.waitUntil(syncScans());
  }
});

// Función para sincronizar escaneos
async function syncScans() {
  try {
    const db = await openDatabase();
    const scans = await getPendingScans(db);
    
    for (const scan of scans) {
      try {
        const response = await fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(scan)
        });

        if (response.ok) {
          await markScanAsSynced(db, scan.id);
        }
      } catch (error) {
        console.error('Error syncing scan:', error);
      }
    }
  } catch (error) {
    console.error('Error in sync process:', error);
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
      
      // Crear almacén para escaneos
      if (!db.objectStoreNames.contains('scans')) {
        const scanStore = db.createObjectStore('scans', { keyPath: 'id' });
        scanStore.createIndex('timestamp', 'timestamp');
        scanStore.createIndex('synced', 'synced');
      }

      // Crear almacén para alimentos
      if (!db.objectStoreNames.contains('foods')) {
        const foodStore = db.createObjectStore('foods', { keyPath: 'id' });
        foodStore.createIndex('name', 'name');
      }

      // Crear almacén para shares pendientes
      if (!db.objectStoreNames.contains('pendingShares')) {
        db.createObjectStore('pendingShares', { keyPath: 'id' });
      }
    };
  });
}
