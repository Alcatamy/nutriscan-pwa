const CACHE_NAME = 'nutriscan-v1';
const ASSETS_TO_CACHE = [
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
  '/img/icons/icon-512x512.png',
  '/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  
  // Esperar hasta que el caché esté listo
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cacheando archivos');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activación del Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Activado');
  
  // Eliminar cachés antiguos
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Limpiando caché antiguo');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  
  // Asegurar que el service worker tome el control inmediatamente
  return self.clients.claim();
});

// Estrategia de caché: Cache First, luego Network
self.addEventListener('fetch', event => {
  console.log('Service Worker: Interceptando fetch', event.request.url);
  
  // Ignorar solicitudes a APIs externas
  if (event.request.url.includes('api.')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Si el recurso está en caché, devolverlo
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Si no está en caché, buscarlo en la red
        return fetch(event.request)
          .then(response => {
            // Verificar si la respuesta es válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clonar la respuesta para poder almacenarla en caché
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Si falla la red y es una solicitud de página, mostrar página offline
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html');
            }
          });
      })
  );
});

// Sincronización en segundo plano
self.addEventListener('sync', event => {
  if (event.tag === 'sync-food-data') {
    event.waitUntil(syncFoodData());
  }
});

// Función para sincronizar datos de alimentos cuando hay conexión
function syncFoodData() {
  return new Promise((resolve, reject) => {
    // Obtener datos pendientes del IndexedDB
    const dbPromise = indexedDB.open('nutriscan-db', 1);
    
    dbPromise.onsuccess = event => {
      const db = event.target.result;
      const tx = db.transaction('pending-foods', 'readwrite');
      const store = tx.objectStore('pending-foods');
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        const pendingFoods = request.result;
        
        if (pendingFoods.length > 0) {
          // Aquí iría el código para enviar los datos al servidor
          console.log('Sincronizando datos pendientes:', pendingFoods);
          
          // Después de sincronizar, limpiar los datos pendientes
          const clearRequest = store.clear();
          clearRequest.onsuccess = () => {
            console.log('Datos pendientes sincronizados y eliminados');
            resolve();
          };
        } else {
          resolve();
        }
      };
      
      request.onerror = error => {
        console.error('Error al obtener datos pendientes:', error);
        reject(error);
      };
    };
    
    dbPromise.onerror = error => {
      console.error('Error al abrir la base de datos:', error);
      reject(error);
    };
  });
}

// Notificaciones push
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/img/icons/icon-192x192.png',
    badge: '/img/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Acción al hacer clic en una notificación
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        // Si ya hay una ventana abierta, enfocarla
        for (const client of clientList) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
  );
});
