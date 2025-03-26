// Variables globales
let stream = null;
let video = null;
let canvas = null;
let context = null;
let model = null;
let detectionInterval = null;

// Inicializar la cámara
async function initCamera() {
    try {
        // Obtener acceso a la cámara
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
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

            // Iniciar detección en tiempo real una vez que el video esté listo
            startRealTimeDetection();
        });

        // Asegurarse de que el video se esté reproduciendo
        await video.play();
    } catch (error) {
        console.error('Error accediendo a la cámara:', error);
        alert('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
        throw error;
    }
}

// Cargar el modelo COCO-SSD para detección de objetos
async function loadModel() {
    try {
        if (!model) {
            console.log('Cargando modelo de detección...');
            // Mostrar indicador de carga
            document.getElementById('model-loading').style.display = 'flex';
            
            // Cargar el modelo
            model = await cocoSsd.load();
            
            // Ocultar indicador de carga
            document.getElementById('model-loading').style.display = 'none';
            console.log('Modelo cargado correctamente');
        }
        return model;
    } catch (error) {
        console.error('Error cargando modelo:', error);
        alert('No se pudo cargar el modelo de detección. Intenta recargar la página.');
        throw error;
    }
}

// Iniciar detección en tiempo real
async function startRealTimeDetection() {
    try {
        // Cargar el modelo
        const detectionModel = await loadModel();
        
        // Detener cualquier detección previa
        if (detectionInterval) {
            clearInterval(detectionInterval);
        }
        
        // Iniciar detección periódica
        detectionInterval = setInterval(async () => {
            if (video && video.readyState === 4) { // HAVE_ENOUGH_DATA
                // Limpiar el canvas
                context.clearRect(0, 0, canvas.width, canvas.height);
                
                // Detectar objetos
                const predictions = await detectionModel.detect(video);
                
                // Dibujar las detecciones
                drawPredictions(predictions);
            }
        }, 200); // Detectar cada 200ms
    } catch (error) {
        console.error('Error iniciando detección en tiempo real:', error);
    }
}

// Dibujar las predicciones en el canvas
function drawPredictions(predictions) {
    // Filtrar solo categorías relevantes de alimentos
    const foodCategories = [
        'apple', 'orange', 'banana', 'sandwich', 'pizza', 'donut', 'cake', 
        'broccoli', 'carrot', 'hot dog', 'bowl', 'cup', 'dining table', 'food'
    ];
    
    const foodPredictions = predictions.filter(p => 
        foodCategories.includes(p.class.toLowerCase()) || 
        p.class.toLowerCase().includes('food')
    );
    
    // Mostrar texto de ayuda si no hay detecciones
    if (foodPredictions.length === 0) {
        context.fillStyle = 'white';
        context.strokeStyle = 'black';
        context.lineWidth = 3;
        context.font = 'bold 20px Arial';
        
        const text = 'Apunta la cámara hacia un alimento';
        const textWidth = context.measureText(text).width;
        
        // Texto con borde negro para visibilidad
        context.strokeText(text, (canvas.width - textWidth) / 2, 50);
        context.fillText(text, (canvas.width - textWidth) / 2, 50);
        return;
    }
    
    // Diccionario de traducciones
    const translations = {
        'apple': 'Manzana',
        'orange': 'Naranja',
        'banana': 'Plátano',
        'sandwich': 'Sándwich',
        'pizza': 'Pizza',
        'donut': 'Donut',
        'cake': 'Pastel',
        'broccoli': 'Brócoli',
        'carrot': 'Zanahoria',
        'hot dog': 'Perrito caliente',
        'bowl': 'Bol de comida',
        'cup': 'Taza/Bebida',
        'dining table': 'Mesa con comida',
        'food': 'Alimento'
    };
    
    // Dibujar cada predicción
    foodPredictions.forEach(prediction => {
        // Extraer datos
        const [x, y, width, height] = prediction.bbox;
        const text = translations[prediction.class.toLowerCase()] || prediction.class;
        const score = Math.round(prediction.score * 100);
        
        // Dibujar rectángulo
        context.strokeStyle = '#4CAF50';
        context.lineWidth = 4;
        context.strokeRect(x, y, width, height);
        
        // Preparar texto
        context.fillStyle = '#4CAF50';
        context.font = 'bold 18px Arial';
        const textWidth = context.measureText(`${text}: ${score}%`).width;
        
        // Dibujar fondo para el texto
        context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        context.fillRect(x, y - 25, textWidth + 10, 25);
        
        // Dibujar texto
        context.fillStyle = 'white';
        context.fillText(`${text}: ${score}%`, x + 5, y - 7);
    });
}

// Detener la cámara
function stopCamera() {
    // Detener detección en tiempo real
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
    
    // Detener la transmisión de video
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
        
        // Si tenemos detecciones en tiempo real, usarlas
        let recognizedFoods = [];
        
        // Si no hay detecciones, devolver resultado por defecto
        if (recognizedFoods.length === 0) {
            // Simulación de procesamiento con API
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Resultados simulados (en una app real, estos vendrían de un servicio de IA)
            recognizedFoods = [
                {
                    id: 1,
                    name: 'Manzana',
                    calories: 95,
                    portion: '1 unidad (182g)',
                    protein: 0.5,
                    carbs: 25,
                    fat: 0.3,
                    fiber: 4.5,
                    image: imageData,
                    recommendations: 'Las manzanas son ricas en fibra y antioxidantes. Una excelente opción para un snack saludable.'
                }
            ];
        }
        
        return recognizedFoods;
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
window.stopCamera = stopCamera;

// Manejar cambios de orientación
window.addEventListener('orientationchange', () => {
    if (video && canvas) {
        // Ajustar el tamaño del canvas después de un breve retraso para permitir que se actualice la orientación
        setTimeout(() => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }, 300);
    }
});

// Detener la cámara cuando se cambia de pantalla
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopCamera();
    }
});
