// Archivo principal de la aplicación
document.addEventListener('DOMContentLoaded', () => {
  // Referencias a elementos DOM
  const homeScreen = document.getElementById('home-screen');
  const cameraScreen = document.getElementById('camera-screen');
  const loadingScreen = document.getElementById('loading-screen');
  const resultsScreen = document.getElementById('results-screen');
  const detailsScreen = document.getElementById('details-screen');
  
  const scanButton = document.getElementById('scan-button');
  const captureButton = document.getElementById('capture-button');
  const scanAgainButton = document.getElementById('scan-again-button');
  const backToResultsButton = document.getElementById('back-to-results-button');
  const installPrompt = document.getElementById('install-prompt');
  const installButton = document.getElementById('install-button');
  
  // Variables para la instalación de la PWA
  let deferredPrompt;
  
  // Navegación entre pantallas
  function showScreen(screen) {
    // Ocultar todas las pantallas
    [homeScreen, cameraScreen, loadingScreen, resultsScreen, detailsScreen].forEach(s => {
      s.classList.remove('active');
    });
    
    // Mostrar la pantalla solicitada
    screen.classList.add('active');
  }
  
  // Eventos de navegación
  scanButton.addEventListener('click', () => {
    showScreen(cameraScreen);
    // Iniciar la cámara
    initCamera();
  });
  
  captureButton.addEventListener('click', () => {
    // Capturar imagen
    captureImage();
    // Mostrar pantalla de carga
    showScreen(loadingScreen);
    
    // Simular procesamiento de reconocimiento (en una app real, esto llamaría a la API)
    setTimeout(() => {
      // Procesar resultados
      processResults();
      // Mostrar pantalla de resultados
      showScreen(resultsScreen);
    }, 2000);
  });
  
  scanAgainButton.addEventListener('click', () => {
    showScreen(cameraScreen);
    // Reiniciar la cámara
    initCamera();
  });
  
  backToResultsButton.addEventListener('click', () => {
    showScreen(resultsScreen);
  });
  
  // Manejo de la instalación de la PWA
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir que Chrome muestre la instalación automáticamente
    e.preventDefault();
    // Guardar el evento para usarlo después
    deferredPrompt = e;
    // Mostrar el botón de instalación
    installPrompt.style.display = 'block';
  });
  
  installButton.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    // Mostrar el prompt de instalación
    deferredPrompt.prompt();
    
    // Esperar a que el usuario responda
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // Ya no necesitamos el prompt
    deferredPrompt = null;
    
    // Ocultar el botón de instalación
    installPrompt.style.display = 'none';
  });
  
  // Verificar si la app ya está instalada
  window.addEventListener('appinstalled', () => {
    // Ocultar el botón de instalación
    installPrompt.style.display = 'none';
    console.log('PWA was installed');
  });
  
  // Inicializar la base de datos IndexedDB para almacenamiento offline
  function initDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('nutriscan-db', 1);
      
      request.onupgradeneeded = event => {
        const db = event.target.result;
        
        // Crear almacén para alimentos escaneados
        if (!db.objectStoreNames.contains('scanned-foods')) {
          db.createObjectStore('scanned-foods', { keyPath: 'id' });
        }
        
        // Crear almacén para alimentos pendientes de sincronización
        if (!db.objectStoreNames.contains('pending-foods')) {
          db.createObjectStore('pending-foods', { keyPath: 'id', autoIncrement: true });
        }
      };
      
      request.onsuccess = event => {
        const db = event.target.result;
        console.log('Database initialized successfully');
        resolve(db);
      };
      
      request.onerror = event => {
        console.error('Error initializing database:', event.target.error);
        reject(event.target.error);
      };
    });
  }
  
  // Guardar alimento en IndexedDB
  async function saveFood(food) {
    try {
      const db = await initDatabase();
      const tx = db.transaction('scanned-foods', 'readwrite');
      const store = tx.objectStore('scanned-foods');
      
      store.put(food);
      
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => {
          console.log('Food saved successfully');
          resolve();
        };
        
        tx.onerror = event => {
          console.error('Error saving food:', event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Error accessing database:', error);
      
      // Si hay un error, guardar en pending-foods para sincronizar después
      try {
        const db = await initDatabase();
        const tx = db.transaction('pending-foods', 'readwrite');
        const store = tx.objectStore('pending-foods');
        
        store.add({
          food,
          timestamp: new Date().getTime()
        });
        
        return new Promise((resolve, reject) => {
          tx.oncomplete = () => {
            console.log('Food saved to pending store');
            
            // Registrar para sincronización cuando haya conexión
            if ('serviceWorker' in navigator && 'SyncManager' in window) {
              navigator.serviceWorker.ready.then(registration => {
                registration.sync.register('sync-food-data');
              });
            }
            
            resolve();
          };
          
          tx.onerror = event => {
            console.error('Error saving to pending store:', event.target.error);
            reject(event.target.error);
          };
        });
      } catch (pendingError) {
        console.error('Error saving to pending store:', pendingError);
      }
    }
  }
  
  // Obtener alimentos guardados
  async function getSavedFoods() {
    try {
      const db = await initDatabase();
      const tx = db.transaction('scanned-foods', 'readonly');
      const store = tx.objectStore('scanned-foods');
      
      const request = store.getAll();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = event => {
          console.error('Error getting saved foods:', event.target.error);
          reject(event.target.error);
        };
      });
    } catch (error) {
      console.error('Error accessing database:', error);
      return [];
    }
  }
  
  // Verificar estado de conexión
  function isOnline() {
    return navigator.onLine;
  }
  
  // Mostrar mensaje cuando no hay conexión
  window.addEventListener('offline', () => {
    console.log('App is offline');
    // Mostrar indicador de modo offline
    document.body.classList.add('offline-mode');
  });
  
  window.addEventListener('online', () => {
    console.log('App is online');
    // Ocultar indicador de modo offline
    document.body.classList.remove('offline-mode');
    
    // Intentar sincronizar datos pendientes
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        registration.sync.register('sync-food-data');
      });
    }
  });
  
  // Inicializar la aplicación
  async function init() {
    // Inicializar la base de datos
    await initDatabase();
    
    // Verificar si hay parámetros en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const screenParam = urlParams.get('screen');
    
    // Si hay un parámetro de pantalla, mostrar esa pantalla
    if (screenParam === 'camera') {
      showScreen(cameraScreen);
      initCamera();
    } else {
      // Por defecto, mostrar la pantalla de inicio
      showScreen(homeScreen);
    }
    
    // Verificar estado de conexión
    if (!isOnline()) {
      document.body.classList.add('offline-mode');
    }
  }
  
  // Iniciar la aplicación
  init();
});

// Gestión de estados y navegación
class App {
    constructor() {
        this.currentScreen = 'home';
        this.deferredPrompt = null;
        this.foodRecognition = new FoodRecognition();
        
        this.initializeEventListeners();
        this.checkInstallPrompt();
        this.handleShareTarget();
    }

    initializeEventListeners() {
        // Botones de navegación
        document.getElementById('scan-button').addEventListener('click', () => this.showScreen('camera'));
        document.getElementById('scan-again-button').addEventListener('click', () => this.showScreen('camera'));
        document.getElementById('back-to-results-button').addEventListener('click', () => this.showScreen('results'));
        
        // Botón de instalación
        document.getElementById('install-button').addEventListener('click', () => this.installPWA());
        
        // Botón de captura
        document.getElementById('capture-button').addEventListener('click', () => this.captureImage());
    }

    showScreen(screenId) {
        // Ocultar todas las pantallas
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Mostrar la pantalla solicitada
        document.getElementById(`${screenId}-screen`).classList.add('active');
        
        // Inicializar la cámara si es necesario
        if (screenId === 'camera') {
            initCamera();
        }
        
        this.currentScreen = screenId;
    }

    async captureImage() {
        try {
            // Mostrar pantalla de carga
            this.showScreen('loading');
            
            // Capturar imagen
            const imageData = await captureFromCamera();
            document.getElementById('captured-image').src = imageData;
            
            // Procesar imagen
            const results = await this.foodRecognition.recognizeFood(imageData);
            
            // Mostrar resultados
            this.showScreen('results');
            this.displayResults(results);
            
            // Guardar en historial
            await this.foodRecognition.saveScan({
                image: imageData,
                results: results,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Error capturando imagen:', error);
            alert('Error al procesar la imagen. Por favor, inténtalo de nuevo.');
            this.showScreen('camera');
        }
    }

    displayResults(results) {
        const foodList = document.getElementById('food-list');
        foodList.innerHTML = '';
        
        results.forEach(food => {
            const foodElement = this.createFoodElement(food);
            foodList.appendChild(foodElement);
        });
    }

    createFoodElement(food) {
        const element = document.createElement('div');
        element.className = 'food-item';
        element.innerHTML = `
            <img src="${food.image}" alt="${food.name}">
            <div class="food-info">
                <h3>${food.name}</h3>
                <p>${food.calories} kcal</p>
                <p>${food.portion}</p>
            </div>
        `;
        
        element.addEventListener('click', () => this.showFoodDetails(food));
        return element;
    }

    async showFoodDetails(food) {
        try {
            const details = await this.foodRecognition.getNutritionalInfo(food.id);
            
            document.getElementById('food-name').textContent = details.name;
            document.getElementById('food-calories').textContent = `${details.calories} kcal`;
            document.getElementById('food-portion').textContent = details.portion;
            document.getElementById('protein-value').textContent = `${details.protein}g`;
            document.getElementById('carbs-value').textContent = `${details.carbs}g`;
            document.getElementById('fat-value').textContent = `${details.fat}g`;
            document.getElementById('fiber-value').textContent = `${details.fiber}g`;
            document.getElementById('recommendations').textContent = details.recommendations;
            
            this.showScreen('details');
        } catch (error) {
            console.error('Error obteniendo detalles:', error);
            alert('Error al cargar los detalles. Por favor, inténtalo de nuevo.');
        }
    }

    checkInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            document.getElementById('install-prompt').style.display = 'flex';
        });
    }

    async installPWA() {
        if (!this.deferredPrompt) return;
        
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            document.getElementById('install-prompt').style.display = 'none';
        }
    }

    async handleShareTarget() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        
        if (action === 'share') {
            const db = await this.foodRecognition.openDatabase();
            const shares = await db.getAll('pendingShares');
            
            if (shares.length > 0) {
                const share = shares[0];
                document.getElementById('captured-image').src = share.image;
                await this.captureImage();
                await db.delete('pendingShares', share.id);
            }
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
