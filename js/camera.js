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
        console.log('Inicializando cámara...');
        
        // Mostrar el indicador de carga
        const loadingIndicator = document.getElementById('model-loading');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
        }
        
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
        if (!video) {
            throw new Error('Elemento de video no encontrado');
        }
        
        video.srcObject = stream;
        
        // Configurar el canvas
        canvas = document.getElementById('camera-canvas');
        if (!canvas) {
            throw new Error('Elemento de canvas no encontrado');
        }
        
        context = canvas.getContext('2d');
        
        // Ajustar el tamaño del canvas al video
        video.addEventListener('loadedmetadata', () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            console.log(`Video dimensiones: ${video.videoWidth}x${video.videoHeight}`);

            // Iniciar detección en tiempo real una vez que el video esté listo
            startRealTimeDetection();
        });

        // Configurar botones de la cámara
        setupCameraButtons();

        // Asegurarse de que el video se esté reproduciendo
        await video.play();
        
        console.log('Cámara inicializada correctamente');
        
        return true;
    } catch (error) {
        console.error('Error accediendo a la cámara:', error);
        
        // Ocultar indicador de carga y mostrar error
        const loadingIndicator = document.getElementById('model-loading');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        // Mostrar mensaje de error amigable según el tipo de error
        let errorMessage = 'No se pudo acceder a la cámara.';
        
        if (error.name === 'NotAllowedError') {
            errorMessage = 'Acceso a la cámara denegado. Por favor, permite el acceso desde la configuración de tu navegador.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'No se encontró ninguna cámara en tu dispositivo.';
        } else if (error.name === 'NotReadableError') {
            errorMessage = 'La cámara está siendo utilizada por otra aplicación.';
        }
        
        // Usar la función de notificación del módulo principal si está disponible
        if (typeof window.showNotification === 'function') {
            window.showNotification(errorMessage);
        } else {
            alert(errorMessage);
        }
        
        throw error;
    }
}

// Configurar los botones de la interfaz de la cámara
function setupCameraButtons() {
    const captureBtn = document.getElementById('capture-btn');
    const switchCameraBtn = document.getElementById('switch-camera-btn');
    const flashBtn = document.getElementById('flash-btn');
    
    if (captureBtn) {
        captureBtn.addEventListener('click', () => {
            captureFromCamera();
        });
    }
    
    if (switchCameraBtn) {
        switchCameraBtn.addEventListener('click', () => {
            switchCamera();
        });
    }
    
    if (flashBtn) {
        flashBtn.addEventListener('click', () => {
            toggleFlash();
        });
    }
}

// Cambiar entre cámara frontal y trasera
async function switchCamera() {
    if (!stream) return;
    
    // Detener la cámara actual
    stopCamera();
    
    // Invertir el modo de la cámara
    const currentFacingMode = stream.getVideoTracks()[0].getSettings().facingMode;
    const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    
    try {
        // Obtener acceso a la nueva cámara
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: newFacingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        
        // Configurar el elemento de video
        video.srcObject = stream;
        await video.play();
        
        // Mostrar notificación
        if (typeof window.showNotification === 'function') {
            window.showNotification(`Cámara ${newFacingMode === 'user' ? 'frontal' : 'trasera'} activada`);
        }
    } catch (error) {
        console.error('Error al cambiar de cámara:', error);
        
        if (typeof window.showNotification === 'function') {
            window.showNotification('Error al cambiar de cámara');
        }
    }
}

// Activar/desactivar flash (si está disponible)
async function toggleFlash() {
    if (!stream) return;
    
    try {
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        
        // Verificar si el flash está disponible
        if (!capabilities.torch) {
            if (typeof window.showNotification === 'function') {
                window.showNotification('Flash no disponible en este dispositivo');
            }
            return;
        }
        
        // Obtener el estado actual del flash
        const settings = track.getSettings();
        const currentTorch = settings.torch || false;
        
        // Cambiar el estado del flash
        await track.applyConstraints({
            advanced: [{ torch: !currentTorch }]
        });
        
        // Actualizar UI del botón
        const flashBtn = document.getElementById('flash-btn');
        if (flashBtn) {
            if (!currentTorch) {
                flashBtn.innerHTML = '<i class="fas fa-bolt"></i>';
                flashBtn.classList.add('active');
            } else {
                flashBtn.innerHTML = '<i class="far fa-bolt"></i>';
                flashBtn.classList.remove('active');
            }
        }
        
        if (typeof window.showNotification === 'function') {
            window.showNotification(`Flash ${!currentTorch ? 'activado' : 'desactivado'}`);
        }
    } catch (error) {
        console.error('Error al cambiar el flash:', error);
        
        if (typeof window.showNotification === 'function') {
            window.showNotification('Error al cambiar el flash');
        }
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
        // Ocultar indicador de carga
        document.getElementById('model-loading').style.display = 'none';
        
        // Mostrar error amigable
        if (typeof window.showNotification === 'function') {
            window.showNotification('Error al cargar los modelos de detección. Por favor, intenta recargar la página.');
        } else {
            alert('Error al cargar los modelos de detección. Por favor, intenta recargar la página.');
        }
        
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
                
                // Filtrar y mejorar predicciones con MobileNet
                const enhancedPredictions = await enhancePredictionsWithMobileNet(predictions);
                
                // Dibujar las detecciones
                drawPredictions(enhancedPredictions);
            }
        }, 200); // Detectar cada 200ms
    } catch (error) {
        console.error('Error iniciando detección en tiempo real:', error);
        
        // Mostrar error amigable
        if (typeof window.showNotification === 'function') {
            window.showNotification('Error al iniciar la detección en tiempo real');
        }
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
                    score: bestMatch.probability,
                    imageData: imageData // Guardar la imagen recortada para mostrarla
                });
            } else {
                // Mantener la predicción original si MobileNet no encuentra alimentos
                enhancedResults.push({
                    ...prediction,
                    imageData: imageData // Guardar la imagen recortada para mostrarla
                });
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
    
    // Para cada predicción, dibujar un rectángulo y etiqueta
    predictions.forEach(prediction => {
        // Obtener coordenadas del bounding box
        const [x, y, width, height] = prediction.bbox;
        
        // Dibujar rectángulo
        context.strokeStyle = '#4CAF50';
        context.lineWidth = 4;
        context.strokeRect(x, y, width, height);
        
        // Preparar texto con clase y probabilidad
        const className = prediction.class.split(',')[0]; // Tomar solo la primera parte si es complejo
        const score = Math.round(prediction.score * 100);
        const text = `${className} (${score}%)`;
        
        // Configurar estilo para etiqueta
        context.fillStyle = '#4CAF50';
        context.fillRect(x, y - 30, context.measureText(text).width + 10, 30);
        
        // Dibujar texto
        context.fillStyle = 'white';
        context.font = 'bold 16px Arial';
        context.fillText(text, x + 5, y - 10);
        
        // Mostrar una pequeña área de interacción para capturar
        context.fillStyle = 'rgba(76, 175, 80, 0.7)';
        context.fillRect(x + width - 40, y + height - 40, 40, 40);
        
        // Icono de captura
        context.fillStyle = 'white';
        context.beginPath();
        context.arc(x + width - 20, y + height - 20, 12, 0, 2 * Math.PI);
        context.fill();
    });
}

// Detener la cámara
function stopCamera() {
    // Detener el loop de detección
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
    
    // Detener las pistas de video
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    // Limpiar el video y canvas
    if (video) {
        video.srcObject = null;
    }
    
    if (context && canvas) {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    console.log('Cámara detenida');
}

// Capturar imagen desde la cámara
function captureFromCamera() {
    if (!video || !canvas || !context) {
        console.error('No se puede capturar: video o canvas no inicializados');
        return null;
    }
    
    try {
        // Dibujar el frame actual en el canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Obtener datos de la imagen
        const imageData = canvas.toDataURL('image/jpeg');
        
        console.log('Imagen capturada correctamente');
        
        // Procesar la imagen capturada
        processImage(imageData).then(results => {
            if (results && results.length > 0) {
                console.log('Alimentos reconocidos:', results);
                displayResults(results, imageData);
            } else {
                console.log('No se detectaron alimentos');
                if (typeof window.showNotification === 'function') {
                    window.showNotification('No se detectaron alimentos en la imagen');
                } else {
                    alert('No se detectaron alimentos en la imagen');
                }
            }
        }).catch(error => {
            console.error('Error procesando imagen:', error);
            if (typeof window.showNotification === 'function') {
                window.showNotification('Error al procesar la imagen');
            } else {
                alert('Error al procesar la imagen');
            }
        });
        
        return imageData;
    } catch (error) {
        console.error('Error al capturar imagen:', error);
        return null;
    }
}

// Procesar la imagen para identificar alimentos
async function processImage(imageData) {
    try {
        console.log('Procesando imagen...');
        
        // Para desarrollo, simular la detección con datos de ejemplo
        // TODO: Implementar la integración real con la API de reconocimiento
        
        // Crear una imagen para analizar con los modelos
        const img = new Image();
        img.src = imageData;
        
        // Esperar a que la imagen se cargue
        await new Promise(resolve => {
            img.onload = resolve;
        });
        
        // Detectar objetos con COCO-SSD
        const predictions = await model.detect(img);
        console.log('Predicciones COCO-SSD:', predictions);
        
        // Filtrar y mejorar predicciones usando MobileNet
        const enhancedPredictions = await enhancePredictionsWithMobileNet(predictions);
        console.log('Predicciones mejoradas:', enhancedPredictions);
        
        // Si hay predicciones, convertirlas al formato esperado por la aplicación
        if (enhancedPredictions && enhancedPredictions.length > 0) {
            return enhancedPredictions.map(prediction => {
                // Crear información nutricional simulada basada en el tipo de alimento
                let nutrients = simulateNutrients(prediction.class);
                
                return {
                    name: prediction.class,
                    probability: prediction.score,
                    image: prediction.imageData || imageData,
                    nutrients: nutrients
                };
            });
        }
        
        // Si no hay predicciones, devolver datos simulados para pruebas
        // En producción, aquí se devolvería un array vacío
        return [{
            name: 'Alimento no identificado',
            probability: 0.6,
            image: imageData,
            nutrients: {
                energy: 250,
                protein: 10,
                carbohydrates: 30,
                fat: 8,
                fiber: 5
            }
        }];
    } catch (error) {
        console.error('Error en el procesamiento de imagen:', error);
        throw error;
    }
}

// Simular información nutricional para diferentes tipos de alimentos
function simulateNutrients(foodClass) {
    // Categorías generales de alimentos
    const foodCategories = {
        // Frutas
        'fruit': { energy: 60, protein: 1, carbohydrates: 15, fat: 0, fiber: 3 },
        'apple': { energy: 52, protein: 0.3, carbohydrates: 14, fat: 0.2, fiber: 2.4 },
        'banana': { energy: 96, protein: 1.1, carbohydrates: 22, fat: 0.2, fiber: 2.6 },
        'orange': { energy: 47, protein: 0.9, carbohydrates: 12, fat: 0.1, fiber: 2.4 },
        
        // Verduras
        'vegetable': { energy: 30, protein: 2, carbohydrates: 5, fat: 0, fiber: 3 },
        'carrot': { energy: 41, protein: 0.9, carbohydrates: 10, fat: 0.2, fiber: 2.8 },
        'broccoli': { energy: 34, protein: 2.8, carbohydrates: 7, fat: 0.4, fiber: 2.6 },
        
        // Comida rápida
        'pizza': { energy: 285, protein: 12, carbohydrates: 36, fat: 10, fiber: 2.5 },
        'hamburger': { energy: 295, protein: 15, carbohydrates: 30, fat: 14, fiber: 1.4 },
        'hot dog': { energy: 290, protein: 10, carbohydrates: 18, fat: 16, fiber: 0 },
        
        // Postres
        'cake': { energy: 340, protein: 5, carbohydrates: 55, fat: 15, fiber: 0.8 },
        'donut': { energy: 280, protein: 3, carbohydrates: 34, fat: 15, fiber: 1 },
        
        // Por defecto
        'default': { energy: 150, protein: 5, carbohydrates: 20, fat: 7, fiber: 2 }
    };
    
    // Normalizar el nombre de clase para buscar en nuestras categorías
    const normalizedClass = foodClass.toLowerCase();
    
    // Buscar la categoría que mejor coincida
    for (const category in foodCategories) {
        if (normalizedClass.includes(category)) {
            return foodCategories[category];
        }
    }
    
    // Si no coincide con ninguna categoría, devolver valores por defecto
    return foodCategories.default;
}

// Mostrar resultados de la detección
function displayResults(results, originalImage) {
    console.log('Mostrando resultados:', results);
    
    // Cambiar a la pantalla de resultados
    const resultScreen = document.getElementById('result-screen');
    if (resultScreen) {
        // Mostrar la pantalla
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        resultScreen.classList.add('active');
        
        // Mostrar la imagen capturada
        const capturedImage = document.getElementById('captured-image');
        if (capturedImage && originalImage) {
            capturedImage.src = originalImage;
        }
        
        // Mostrar información del primer alimento detectado (el más probable)
        const food = results[0];
        
        // Nombre del alimento
        const foodNameElement = document.getElementById('food-name');
        if (foodNameElement) {
            foodNameElement.textContent = food.name;
        }
        
        // Información nutricional
        const nutrients = food.nutrients || {};
        
        const caloriesElement = document.getElementById('calories-value');
        if (caloriesElement) {
            caloriesElement.textContent = nutrients.energy ? `${nutrients.energy} kcal` : '--';
        }
        
        const proteinElement = document.getElementById('protein-value');
        if (proteinElement) {
            proteinElement.textContent = nutrients.protein ? `${nutrients.protein}g` : '--';
        }
        
        const carbsElement = document.getElementById('carbs-value');
        if (carbsElement) {
            carbsElement.textContent = nutrients.carbohydrates ? `${nutrients.carbohydrates}g` : '--';
        }
        
        const fatElement = document.getElementById('fat-value');
        if (fatElement) {
            fatElement.textContent = nutrients.fat ? `${nutrients.fat}g` : '--';
        }
        
        // Detalles adicionales
        const detailsContainer = document.getElementById('food-details');
        if (detailsContainer) {
            // Información nutricional detallada
            let detailsHTML = `
                <h3>Información Nutricional Detallada</h3>
                <div class="nutrition-table">
                    <div class="nutrition-row">
                        <span class="nutrition-name">Calorías</span>
                        <span class="nutrition-value">${nutrients.energy || 0} kcal</span>
                    </div>
                    <div class="nutrition-row">
                        <span class="nutrition-name">Proteínas</span>
                        <span class="nutrition-value">${nutrients.protein || 0}g</span>
                    </div>
                    <div class="nutrition-row">
                        <span class="nutrition-name">Carbohidratos</span>
                        <span class="nutrition-value">${nutrients.carbohydrates || 0}g</span>
                    </div>
                    <div class="nutrition-row">
                        <span class="nutrition-name">Grasas</span>
                        <span class="nutrition-value">${nutrients.fat || 0}g</span>
                    </div>
                    <div class="nutrition-row">
                        <span class="nutrition-name">Fibra</span>
                        <span class="nutrition-value">${nutrients.fiber || 0}g</span>
                    </div>
                </div>
                
                <h3>Compatibilidad con tu objetivo</h3>
                <div class="compatibility-info">
                    <div class="compatibility-indicator ${getCompatibilityClass(food, nutrients)}">
                        ${getCompatibilityMessage(food, nutrients)}
                    </div>
                </div>
            `;
            
            detailsContainer.innerHTML = detailsHTML;
        }
        
        // Configurar botones
        const addToDiaryBtn = document.getElementById('add-to-diary-btn');
        if (addToDiaryBtn) {
            addToDiaryBtn.onclick = () => addFoodToDiary(food);
        }
        
        const scanAgainBtn = document.getElementById('scan-again-btn');
        if (scanAgainBtn) {
            scanAgainBtn.onclick = () => {
                document.querySelectorAll('.screen').forEach(screen => {
                    screen.classList.remove('active');
                });
                document.getElementById('scanner-screen').classList.add('active');
            };
        }
    } else {
        console.error('Pantalla de resultados no encontrada');
    }
}

// Determinar la clase CSS para el indicador de compatibilidad
function getCompatibilityClass(food, nutrients) {
    // Esta función se podría mejorar con lógica real basada en los objetivos del usuario
    if (nutrients.energy > 300) {
        return 'compatibility-warning';
    } else if (nutrients.protein > 15) {
        return 'compatibility-good';
    } else {
        return 'compatibility-neutral';
    }
}

// Generar mensaje de compatibilidad
function getCompatibilityMessage(food, nutrients) {
    // Esta función se podría mejorar con lógica real basada en los objetivos del usuario
    if (nutrients.energy > 300) {
        return 'Alto en calorías. Considerar porciones más pequeñas.';
    } else if (nutrients.protein > 15) {
        return 'Buena fuente de proteínas. Ideal para tu objetivo.';
    } else {
        return 'Neutral para tu objetivo actual.';
    }
}

// Añadir alimento al diario
function addFoodToDiary(food) {
    // Aquí se mostraría la pantalla para seleccionar el tipo de comida
    // (desayuno, almuerzo, cena, etc.)
    console.log('Añadiendo alimento al diario:', food);
    
    // Mostrar la pantalla de añadir al diario
    const addToLogScreen = document.getElementById('add-to-log-screen');
    if (addToLogScreen) {
        // Mostrar la pantalla
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        addToLogScreen.classList.add('active');
        
        // Actualizar el nombre del alimento
        const logFoodName = document.getElementById('log-food-name');
        if (logFoodName) {
            logFoodName.textContent = food.name;
        }
        
        // Configurar los botones de tipo de comida
        const mealTypeButtons = document.querySelectorAll('.meal-type-btn');
        mealTypeButtons.forEach(btn => {
            btn.onclick = () => {
                const mealType = btn.getAttribute('data-meal-type');
                
                // Aquí se guardaría el alimento en la base de datos
                // Simulamos la operación por ahora
                setTimeout(() => {
                    if (typeof window.showNotification === 'function') {
                        window.showNotification(`${food.name} añadido a ${mealType}`);
                    } else {
                        alert(`${food.name} añadido a ${mealType}`);
                    }
                    
                    // Volver a la pantalla de inicio
                    document.querySelectorAll('.screen').forEach(screen => {
                        screen.classList.remove('active');
                    });
                    document.getElementById('home-screen').classList.add('active');
                }, 500);
            };
        });
    } else {
        // Si no existe la pantalla, mostrar una notificación simple
        if (typeof window.showNotification === 'function') {
            window.showNotification(`${food.name} añadido al diario`);
        } else {
            alert(`${food.name} añadido al diario`);
        }
    }
}

// Eventos para manejar orientación y visibilidad
window.addEventListener('orientationchange', () => {
    // Ajustar dimensiones del canvas cuando cambia la orientación
    if (video && canvas) {
        setTimeout(() => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }, 300);
    }
});

document.addEventListener('visibilitychange', () => {
    // Detener la cámara cuando la página no está visible
    if (document.hidden) {
        if (detectionInterval) {
            clearInterval(detectionInterval);
        }
    } else {
        // Reiniciar la detección cuando la página vuelve a ser visible
        if (video && video.srcObject) {
            startRealTimeDetection();
        }
    }
});

// Exportar funciones para uso externo
export {
    initCamera,
    stopCamera,
    captureFromCamera,
    processImage,
    displayResults
};
