// Variables globales
let stream = null;
let video = null;
let canvas = null;
let context = null;

// Inicializar la cámara
async function initCamera() {
    try {
        // Obtener acceso a la cámara
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        });
        
        // Configurar el elemento de video
        video = document.getElementById('camera-view');
        video.srcObject = stream;
        
        // Configurar el canvas
        canvas = document.getElementById('camera-canvas');
        context = canvas.getContext('2d');
        
        // Ajustar el tamaño del canvas al video
        video.addEventListener('loadedmetadata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        });
    } catch (error) {
        console.error('Error accediendo a la cámara:', error);
        alert('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
        throw error;
    }
}

// Detener la cámara
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

// Capturar imagen de la cámara
async function captureFromCamera() {
    if (!video || !canvas || !context) {
        throw new Error('La cámara no está inicializada');
    }
    
    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convertir el canvas a una imagen JPEG
    return canvas.toDataURL('image/jpeg', 0.8);
}

// Procesar la imagen
async function processImage(imageData) {
    try {
        // Verificar que imageData exista y sea una cadena válida
        if (!imageData || typeof imageData !== 'string') {
            throw new Error('Datos de imagen no válidos');
        }

        console.log('Procesando imagen...');
        
        // Simulación de procesamiento con API
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Resultados simulados (en una app real, estos vendrían de un servicio de IA)
        return [
            {
                id: 1,
                name: 'Manzana',
                calories: 95,
                portion: '1 unidad (182g)',
                protein: 0.5,
                carbs: 25,
                fat: 0.3,
                fiber: 4.5,
                image: imageData
            }
        ];
    } catch (error) {
        console.error('Error al procesar la imagen:', error);
        // Re-lanzar el error para que pueda ser manejado por el llamador
        throw new Error('No se pudo procesar la imagen: ' + error.message);
    }
}

// Exportar funciones
window.initCamera = initCamera;
window.captureFromCamera = captureFromCamera;
window.processImage = processImage;

// Manejar cambios de orientación
window.addEventListener('orientationchange', () => {
    if (video && canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }
});

// Detener la cámara cuando se cambia de pantalla
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopCamera();
    }
});
