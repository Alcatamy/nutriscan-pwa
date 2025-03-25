// Funcionalidad de la cámara
let videoStream = null;
let cameraView = null;
let cameraCanvas = null;
let capturedImage = null;

// Inicializar la cámara
function initCamera() {
  cameraView = document.getElementById('camera-view');
  cameraCanvas = document.getElementById('camera-canvas');
  capturedImage = document.getElementById('captured-image');
  
  // Detener cualquier stream existente
  if (videoStream) {
    videoStream.getTracks().forEach(track => {
      track.stop();
    });
  }
  
  // Configuración de la cámara
  const constraints = {
    video: {
      facingMode: 'environment', // Usar cámara trasera
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    },
    audio: false
  };
  
  // Solicitar acceso a la cámara
  navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      videoStream = stream;
      cameraView.srcObject = stream;
      
      // Esperar a que el video esté listo
      return new Promise(resolve => {
        cameraView.onloadedmetadata = () => {
          resolve();
        };
      });
    })
    .then(() => {
      // Ajustar el tamaño del canvas
      cameraCanvas.width = cameraView.videoWidth;
      cameraCanvas.height = cameraView.videoHeight;
      
      console.log('Camera initialized successfully');
    })
    .catch(error => {
      console.error('Error accessing camera:', error);
      
      // Mostrar mensaje de error
      const cameraContainer = document.querySelector('.camera-container');
      cameraContainer.innerHTML = `
        <div class="camera-error">
          <p>No se pudo acceder a la cámara</p>
          <p class="error-details">${error.message}</p>
          <button id="retry-camera" class="secondary-button">Reintentar</button>
        </div>
      `;
      
      // Agregar evento para reintentar
      document.getElementById('retry-camera').addEventListener('click', () => {
        initCamera();
      });
    });
}

// Capturar imagen de la cámara
function captureImage() {
  if (!cameraView || !cameraCanvas) return;
  
  const context = cameraCanvas.getContext('2d');
  
  // Dibujar el frame actual del video en el canvas
  context.drawImage(cameraView, 0, 0, cameraCanvas.width, cameraCanvas.height);
  
  // Obtener la imagen como URL de datos
  const imageDataUrl = cameraCanvas.toDataURL('image/jpeg');
  
  // Guardar la imagen para mostrarla en la pantalla de resultados
  capturedImage.src = imageDataUrl;
  
  // Detener la cámara para ahorrar batería
  if (videoStream) {
    videoStream.getTracks().forEach(track => {
      track.stop();
    });
    videoStream = null;
  }
  
  // Guardar la imagen en IndexedDB para uso offline
  saveImageToIndexedDB(imageDataUrl);
  
  return imageDataUrl;
}

// Guardar imagen en IndexedDB
async function saveImageToIndexedDB(imageDataUrl) {
  try {
    const db = await initDatabase();
    const tx = db.transaction('scanned-images', 'readwrite');
    const store = tx.objectStore('scanned-images');
    
    const imageData = {
      id: new Date().getTime(),
      dataUrl: imageDataUrl,
      timestamp: new Date().toISOString()
    };
    
    store.put(imageData);
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        console.log('Image saved to IndexedDB');
        resolve();
      };
      
      tx.onerror = event => {
        console.error('Error saving image:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Error accessing database:', error);
  }
}

// Inicializar la base de datos para imágenes
function initDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('nutriscan-db', 1);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // Crear almacén para imágenes escaneadas
      if (!db.objectStoreNames.contains('scanned-images')) {
        db.createObjectStore('scanned-images', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = event => {
      const db = event.target.result;
      resolve(db);
    };
    
    request.onerror = event => {
      console.error('Error initializing database:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Verificar permisos de cámara
async function checkCameraPermission() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === 'videoinput');
    
    if (cameras.length === 0) {
      console.log('No cameras found');
      return false;
    }
    
    // Verificar si ya tenemos permiso
    if (cameras.some(camera => camera.label !== '')) {
      console.log('Camera permission already granted');
      return true;
    }
    
    // Solicitar permiso
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    
    // Detener el stream inmediatamente
    stream.getTracks().forEach(track => track.stop());
    
    console.log('Camera permission granted');
    return true;
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return false;
  }
}

// Función para cambiar entre cámaras (frontal/trasera)
function switchCamera() {
  if (!videoStream) return;
  
  // Obtener la configuración actual
  const currentFacingMode = videoStream.getVideoTracks()[0].getSettings().facingMode;
  
  // Cambiar a la otra cámara
  const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
  
  // Detener el stream actual
  videoStream.getTracks().forEach(track => {
    track.stop();
  });
  
  // Iniciar con la nueva configuración
  const constraints = {
    video: {
      facingMode: newFacingMode,
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    },
    audio: false
  };
  
  navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      videoStream = stream;
      cameraView.srcObject = stream;
    })
    .catch(error => {
      console.error('Error switching camera:', error);
    });
}

// Agregar evento para cambiar de cámara (si está disponible)
document.addEventListener('DOMContentLoaded', () => {
  // Verificar si hay múltiples cámaras
  navigator.mediaDevices.enumerateDevices()
    .then(devices => {
      const cameras = devices.filter(device => device.kind === 'videoinput');
      
      if (cameras.length > 1) {
        // Agregar botón para cambiar de cámara
        const cameraControls = document.querySelector('.camera-controls');
        
        const switchButton = document.createElement('button');
        switchButton.className = 'switch-camera-button';
        switchButton.innerHTML = '🔄';
        switchButton.title = 'Cambiar cámara';
        
        switchButton.addEventListener('click', switchCamera);
        
        cameraControls.appendChild(switchButton);
      }
    })
    .catch(error => {
      console.error('Error enumerating devices:', error);
    });
});
