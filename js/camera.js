// Variables globales
let stream = null;
let video = null;
let canvas = null;
let context = null;
let model = null;
let mobileNetModel = null;
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

// Cargar los modelos para detección de objetos
async function loadModel() {
    try {
        if (!model || !mobileNetModel) {
            console.log('Cargando modelos de detección...');
            // Mostrar indicador de carga
            document.getElementById('model-loading').style.display = 'flex';
            
            // Cargar modelos en paralelo para mayor eficiencia
            const [cocoModel, mobilenet] = await Promise.all([
                cocoSsd.load(),
                mobilenet ? mobilenet : mobilenet.load()
            ]);
            
            model = cocoModel;
            mobileNetModel = mobilenet;
            
            // Ocultar indicador de carga
            document.getElementById('model-loading').style.display = 'none';
            console.log('Modelos cargados correctamente');
        }
        return { cocoModel: model, mobileNetModel: mobileNetModel };
    } catch (error) {
        console.error('Error cargando modelos:', error);
        alert('No se pudo cargar los modelos de detección. Intenta recargar la página.');
        throw error;
    }
}

// Iniciar detección en tiempo real
async function startRealTimeDetection() {
    try {
        // Cargar los modelos
        const models = await loadModel();
        
        // Detener cualquier detección previa
        if (detectionInterval) {
            clearInterval(detectionInterval);
        }
        
        // Iniciar detección periódica
        detectionInterval = setInterval(async () => {
            if (video && video.readyState === 4) { // HAVE_ENOUGH_DATA
                // Limpiar el canvas
                context.clearRect(0, 0, canvas.width, canvas.height);
                
                // Detectar objetos con COCO-SSD para obtener bounding boxes
                const predictions = await model.detect(video);
                
                // Para cada objeto detectado como posible alimento, usar MobileNet para clasificación más precisa
                const enhancedPredictions = await enhancePredictionsWithMobileNet(predictions);
                
                // Dibujar las detecciones
                drawPredictions(enhancedPredictions);
            }
        }, 200); // Detectar cada 200ms
    } catch (error) {
        console.error('Error iniciando detección en tiempo real:', error);
    }
}

// Usar MobileNet para clasificar con más precisión
async function enhancePredictionsWithMobileNet(predictions) {
    // Lista ampliada de categorías de alimentos de COCO-SSD
    const foodCategories = [
        'apple', 'orange', 'banana', 'sandwich', 'pizza', 'donut', 'cake', 
        'broccoli', 'carrot', 'hot dog', 'bowl', 'cup', 'dining table', 'food'
    ];
    
    // Filtrar solo predicciones que podrían ser alimentos
    const foodPredictions = predictions.filter(p => 
        foodCategories.includes(p.class.toLowerCase()) || 
        p.class.toLowerCase().includes('food')
    );
    
    // Si no hay predicciones de alimentos, devolver el array vacío
    if (foodPredictions.length === 0) return [];
    
    // Para cada predicción, recortar el área de la imagen y clasificar con MobileNet
    const enhancedResults = [];
    
    for (const prediction of foodPredictions) {
        try {
            // Extraer coordenadas del área detectada
            const [x, y, width, height] = prediction.bbox;
            
            // Crear un canvas temporal para recortar la imagen
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempContext = tempCanvas.getContext('2d');
            
            // Dibujar solo el área detectada en el canvas temporal
            tempContext.drawImage(
                video, 
                x, y, width, height, // Fuente (área del video)
                0, 0, width, height  // Destino (canvas completo)
            );
            
            // Clasificar con MobileNet
            const imageData = tempCanvas.toDataURL('image/jpeg');
            const classifications = await mobileNetModel.classify(tempCanvas);
            
            // Filtrar clasificaciones de alimentos y ordenar por probabilidad
            const foodClassifications = classifications.filter(c => 
                // Lista de prefijos o términos comunes en nombres de alimentos
                c.className.toLowerCase().includes('food') ||
                c.className.toLowerCase().includes('fruit') ||
                c.className.toLowerCase().includes('vegetable') ||
                c.className.toLowerCase().includes('dish') ||
                c.className.toLowerCase().includes('meal') ||
                c.className.toLowerCase().includes('bread') ||
                c.className.toLowerCase().includes('cake') ||
                c.className.toLowerCase().includes('meat') ||
                c.className.toLowerCase().includes('salad')
            ).sort((a, b) => b.probability - a.probability);
            
            // Si hay clasificaciones relevantes, usar la mejor
            if (foodClassifications.length > 0) {
                const bestMatch = foodClassifications[0];
                enhancedResults.push({
                    ...prediction,
                    class: bestMatch.className,
                    score: bestMatch.probability
                });
            } else {
                // Mantener la predicción original si MobileNet no encuentra alimentos
                enhancedResults.push(prediction);
            }
        } catch (err) {
            console.error('Error al mejorar predicción con MobileNet:', err);
            // Mantener la predicción original en caso de error
            enhancedResults.push(prediction);
        }
    }
    
    return enhancedResults;
}

// Dibujar las predicciones en el canvas
function drawPredictions(predictions) {
    // Si no hay predicciones, mostrar mensaje de ayuda
    if (predictions.length === 0) {
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
    
    // Diccionario de traducciones ampliado
    const translations = {
        // Frutas
        'apple': 'Manzana',
        'orange': 'Naranja',
        'banana': 'Plátano',
        'strawberry': 'Fresa',
        'pear': 'Pera',
        'grape': 'Uva',
        'grapefruit': 'Pomelo',
        'kiwi': 'Kiwi',
        'lemon': 'Limón',
        'lime': 'Lima',
        'mango': 'Mango',
        'melon': 'Melón',
        'nectarine': 'Nectarina',
        'peach': 'Melocotón',
        'pineapple': 'Piña',
        'plum': 'Ciruela',
        'raspberry': 'Frambuesa',
        'watermelon': 'Sandía',
        
        // Vegetales
        'broccoli': 'Brócoli',
        'carrot': 'Zanahoria',
        'cucumber': 'Pepino',
        'lettuce': 'Lechuga',
        'tomato': 'Tomate',
        'potato': 'Patata',
        'bell pepper': 'Pimiento',
        'onion': 'Cebolla',
        'garlic': 'Ajo',
        'cabbage': 'Repollo',
        'eggplant': 'Berenjena',
        
        // Comidas preparadas
        'sandwich': 'Sándwich',
        'pizza': 'Pizza',
        'donut': 'Donut',
        'cake': 'Pastel',
        'hot dog': 'Perrito caliente',
        'hamburger': 'Hamburguesa',
        'french fries': 'Patatas fritas',
        'salad': 'Ensalada',
        'burrito': 'Burrito',
        'taco': 'Taco',
        'pasta': 'Pasta',
        'rice dish': 'Plato de arroz',
        'soup': 'Sopa',
        'ice cream': 'Helado',
        'cookie': 'Galleta',
        'chocolate': 'Chocolate',
        'sushi': 'Sushi',
        'steak': 'Filete',
        'fish': 'Pescado',
        'chicken': 'Pollo',
        
        // Misceláneos
        'bowl': 'Bol de comida',
        'cup': 'Taza/Bebida',
        'dining table': 'Mesa con comida',
        'food': 'Alimento'
    };
    
    // Dibujar cada predicción
    predictions.forEach(prediction => {
        // Extraer datos
        const [x, y, width, height] = prediction.bbox;
        
        // Obtener nombre en español o usar el original
        let className = prediction.class.toLowerCase();
        // Extraer nombre principal (remover texto después de coma si existe)
        if (className.includes(',')) {
            className = className.split(',')[0].trim();
        }
        const text = translations[className] || className;
        
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

// Capturar imagen desde la cámara
function captureFromCamera() {
    return new Promise((resolve, reject) => {
        if (!video || !canvas || !context) {
            reject(new Error('La cámara no está inicializada'));
            return;
        }
        
        try {
            // Dibujar el frame actual del video en el canvas
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Obtener la imagen como una URL de datos
            const imageData = canvas.toDataURL('image/jpeg');
            resolve(imageData);
        } catch (error) {
            console.error('Error capturando imagen:', error);
            reject(error);
        }
    });
}

// Procesar la imagen
async function processImage(imageData) {
    try {
        // Verificar que imageData exista y sea una cadena válida
        if (!imageData || typeof imageData !== 'string') {
            throw new Error('Datos de imagen no válidos');
        }

        console.log('Procesando imagen...');
        
        // Crear una imagen para pasarla a los modelos
        const img = new Image();
        img.src = imageData;
        
        // Esperar a que la imagen se cargue
        await new Promise(resolve => {
            img.onload = resolve;
        });
        
        // Asegurarnos de que los modelos estén cargados
        await loadModel();
        
        // Usar ambos modelos para obtener resultados más precisos
        const cocoResults = await model.detect(img);
        
        // Para cada detección, usar MobileNet para clasificación más precisa
        const enhancedResults = await enhancePredictionsWithMobileNet(cocoResults);
        
        // Si no tenemos resultados de los modelos, usar datos simulados
        if (enhancedResults.length === 0) {
            // Clasificar toda la imagen con MobileNet
            const classifications = await mobileNetModel.classify(img);
            
            // Filtrar solo clasificaciones de alimentos con alta probabilidad
            const foodClassifications = classifications
                .filter(c => c.probability > 0.5)
                .filter(c => 
                    c.className.toLowerCase().includes('food') ||
                    c.className.toLowerCase().includes('fruit') ||
                    c.className.toLowerCase().includes('vegetable') ||
                    c.className.toLowerCase().includes('dish') ||
                    c.className.toLowerCase().includes('meal')
                );
            
            if (foodClassifications.length > 0) {
                // Convertir clasificaciones a formato de respuesta
                return foodClassifications.map(item => {
                    // Extraer nombre principal (antes de la coma)
                    let name = item.className;
                    if (name.includes(',')) {
                        name = name.split(',')[0].trim();
                    }
                    
                    // Buscar traducción
                    const translations = {
                        'apple': 'Manzana',
                        'banana': 'Plátano',
                        'orange': 'Naranja',
                        'strawberry': 'Fresa',
                        // (más traducciones del objeto translations anterior...)
                    };
                    
                    return {
                        id: Math.floor(Math.random() * 1000) + 1,
                        name: translations[name.toLowerCase()] || name,
                        calories: Math.floor(Math.random() * 300) + 50,
                        portion: '1 porción (100g)',
                        protein: (Math.random() * 20).toFixed(1),
                        carbs: (Math.random() * 30).toFixed(1),
                        fat: (Math.random() * 15).toFixed(1),
                        fiber: (Math.random() * 5).toFixed(1),
                        image: imageData,
                        confidence: Math.round(item.probability * 100),
                        recommendations: 'Recomendación nutricional para este alimento.'
                    };
                });
            }
            
            // Si no podemos clasificar, devolver un resultado simulado
            return [{
                id: 1,
                name: 'Alimento no identificado',
                calories: 100,
                portion: '1 porción (100g)',
                protein: 5,
                carbs: 15,
                fat: 2,
                fiber: 3,
                image: imageData,
                recommendations: 'No se pudo identificar con precisión. Intente con otra foto o mejor iluminación.'
            }];
        }
        
        // Convertir resultados a formato de respuesta
        return enhancedResults.map(item => {
            // Extraer nombre principal (antes de la coma)
            let name = item.class;
            if (name.includes(',')) {
                name = name.split(',')[0].trim();
            }
            
            return {
                id: Math.floor(Math.random() * 1000) + 1,
                name: name,
                calories: Math.floor(Math.random() * 300) + 50,
                portion: '1 porción (100g)',
                protein: (Math.random() * 20).toFixed(1),
                carbs: (Math.random() * 30).toFixed(1),
                fat: (Math.random() * 15).toFixed(1),
                fiber: (Math.random() * 5).toFixed(1),
                image: imageData,
                confidence: Math.round(item.score * 100),
                recommendations: 'Recomendación nutricional para este alimento.'
            };
        });
    } catch (error) {
        console.error('Error al procesar la imagen:', error);
        // Re-lanzar el error para que pueda ser manejado por el llamador
        throw new Error('No se pudo procesar la imagen: ' + error.message);
    }
}

// Manejar cambios de orientación del dispositivo
window.addEventListener('orientationchange', () => {
    // Ajustar el tamaño del canvas cuando cambia la orientación
    if (video && canvas) {
        setTimeout(() => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }, 300); // Pequeño retraso para que el cambio de orientación se complete
    }
});

// Manejar cambios de visibilidad de la página
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        // Pausar detección cuando la página no es visible para ahorrar recursos
        if (detectionInterval) {
            clearInterval(detectionInterval);
            detectionInterval = null;
        }
    } else if (document.visibilityState === 'visible' && video && !detectionInterval) {
        // Reiniciar detección cuando la página vuelve a ser visible
        startRealTimeDetection();
    }
});

// Exportar funciones para uso externo
window.initCamera = initCamera;
window.stopCamera = stopCamera;
window.captureFromCamera = captureFromCamera;
window.processImage = processImage;
