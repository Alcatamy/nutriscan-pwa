// Simulación de reconocimiento de alimentos
// En una aplicación real, esto se conectaría a un servicio de IA o API

// Base de datos de alimentos simulada
const foodDatabase = [
  {
    id: 1,
    name: "Manzana",
    calories: 52,
    portion: "1 manzana mediana (100g)",
    nutrients: {
      protein: "0.3g",
      carbs: "14g",
      fat: "0.2g",
      fiber: "2.4g"
    },
    recommendations: "Las manzanas son ricas en fibra y antioxidantes. Son una excelente opción para un snack saludable y pueden ayudar a mantener la sensación de saciedad."
  },
  {
    id: 2,
    name: "Plátano",
    calories: 89,
    portion: "1 plátano mediano (100g)",
    nutrients: {
      protein: "1.1g",
      carbs: "22.8g",
      fat: "0.3g",
      fiber: "2.6g"
    },
    recommendations: "Los plátanos son una excelente fuente de potasio y carbohidratos de rápida absorción, ideales antes o después del ejercicio."
  },
  {
    id: 3,
    name: "Ensalada César",
    calories: 230,
    portion: "1 plato (150g)",
    nutrients: {
      protein: "8.1g",
      carbs: "10.2g",
      fat: "18.3g",
      fiber: "2.9g"
    },
    recommendations: "Esta ensalada tiene un alto contenido de grasas debido al aderezo. Considera pedir el aderezo aparte para controlar la cantidad."
  },
  {
    id: 4,
    name: "Hamburguesa con queso",
    calories: 520,
    portion: "1 hamburguesa (180g)",
    nutrients: {
      protein: "31g",
      carbs: "40g",
      fat: "26g",
      fiber: "3g"
    },
    recommendations: "Alto contenido calórico y graso. Considera opciones más ligeras como hamburguesas vegetales o de pollo si estás controlando calorías."
  },
  {
    id: 5,
    name: "Salmón a la parrilla",
    calories: 280,
    portion: "1 filete (150g)",
    nutrients: {
      protein: "39g",
      carbs: "0g",
      fat: "13g",
      fiber: "0g"
    },
    recommendations: "Excelente fuente de proteínas y ácidos grasos omega-3, beneficiosos para la salud cardiovascular y cerebral."
  },
  {
    id: 6,
    name: "Pizza Margarita",
    calories: 285,
    portion: "1 porción (100g)",
    nutrients: {
      protein: "11g",
      carbs: "39g",
      fat: "10g",
      fiber: "2.5g"
    },
    recommendations: "Opción moderada en calorías para una pizza. Puedes mejorar su perfil nutricional añadiendo vegetales como topping."
  },
  {
    id: 7,
    name: "Yogur natural",
    calories: 59,
    portion: "100g",
    nutrients: {
      protein: "3.5g",
      carbs: "4.7g",
      fat: "3.3g",
      fiber: "0g"
    },
    recommendations: "Buena fuente de proteínas y calcio. Añade frutas frescas para aumentar su valor nutricional sin muchas calorías adicionales."
  },
  {
    id: 8,
    name: "Arroz blanco",
    calories: 130,
    portion: "100g cocido",
    nutrients: {
      protein: "2.7g",
      carbs: "28g",
      fat: "0.3g",
      fiber: "0.4g"
    },
    recommendations: "Fuente de carbohidratos de absorción rápida. Considera mezclarlo con arroz integral para aumentar el contenido de fibra."
  }
];

// Función para simular el reconocimiento de alimentos
function recognizeFood(imageDataUrl) {
  return new Promise((resolve) => {
    // Simulamos un tiempo de procesamiento
    setTimeout(() => {
      // En una aplicación real, aquí se enviaría la imagen a un servicio de IA
      // Para la simulación, seleccionamos alimentos aleatorios de nuestra base de datos
      
      // Determinar cuántos alimentos "detectar" (entre 1 y 3)
      const foodCount = Math.floor(Math.random() * 3) + 1;
      
      // Seleccionar alimentos aleatorios sin repetir
      const detectedFoods = [];
      const usedIndices = new Set();
      
      for (let i = 0; i < foodCount; i++) {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * foodDatabase.length);
        } while (usedIndices.has(randomIndex));
        
        usedIndices.add(randomIndex);
        detectedFoods.push(foodDatabase[randomIndex]);
      }
      
      // Simular confianza de detección
      const results = detectedFoods.map(food => ({
        ...food,
        confidence: (Math.random() * 30 + 70).toFixed(1) // Entre 70% y 100%
      }));
      
      resolve(results);
    }, 1500); // Simular 1.5 segundos de procesamiento
  });
}

// Función para procesar los resultados y mostrarlos en la interfaz
function processResults() {
  // Obtener la imagen capturada
  const capturedImage = document.getElementById('captured-image');
  const imageDataUrl = capturedImage.src;
  
  // Contenedor de la lista de alimentos
  const foodList = document.getElementById('food-list');
  foodList.innerHTML = '';
  
  // Mostrar indicador de carga
  foodList.innerHTML = '<div class="loading-indicator"><div class="spinner"></div><p>Analizando alimentos...</p></div>';
  
  // Reconocer alimentos (simulado)
  recognizeFood(imageDataUrl)
    .then(results => {
      // Limpiar el contenedor
      foodList.innerHTML = '';
      
      // Mostrar cada alimento detectado
      results.forEach(food => {
        const foodItem = document.createElement('div');
        foodItem.className = 'food-item';
        foodItem.dataset.foodId = food.id;
        
        foodItem.innerHTML = `
          <div class="food-info">
            <div class="food-name">${food.name}</div>
            <div class="food-calories">${food.calories} kcal</div>
            <div class="food-portion">${food.portion}</div>
          </div>
          <div class="food-confidence">${food.confidence}%</div>
          <div class="food-arrow">›</div>
        `;
        
        // Agregar evento para mostrar detalles
        foodItem.addEventListener('click', () => {
          showFoodDetails(food);
        });
        
        foodList.appendChild(foodItem);
      });
      
      // Guardar resultados en IndexedDB para acceso offline
      saveResultsToIndexedDB(results);
    })
    .catch(error => {
      console.error('Error processing results:', error);
      foodList.innerHTML = '<div class="error-message">Error al procesar la imagen. Intenta de nuevo.</div>';
    });
}

// Mostrar detalles de un alimento
function showFoodDetails(food) {
  // Actualizar la información en la pantalla de detalles
  document.getElementById('food-name').textContent = food.name;
  document.getElementById('food-calories').textContent = `${food.calories} kcal`;
  document.getElementById('food-portion').textContent = food.portion;
  
  document.getElementById('protein-value').textContent = food.nutrients.protein;
  document.getElementById('carbs-value').textContent = food.nutrients.carbs;
  document.getElementById('fat-value').textContent = food.nutrients.fat;
  document.getElementById('fiber-value').textContent = food.nutrients.fiber;
  
  document.getElementById('recommendations').textContent = food.recommendations;
  
  // Mostrar la pantalla de detalles
  const detailsScreen = document.getElementById('details-screen');
  const resultsScreen = document.getElementById('results-screen');
  
  resultsScreen.classList.remove('active');
  detailsScreen.classList.add('active');
}

// Guardar resultados en IndexedDB
async function saveResultsToIndexedDB(results) {
  try {
    const db = await initDatabase();
    const tx = db.transaction('scanned-foods', 'readwrite');
    const store = tx.objectStore('scanned-foods');
    
    const resultData = {
      id: new Date().getTime(),
      foods: results,
      timestamp: new Date().toISOString()
    };
    
    store.put(resultData);
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        console.log('Results saved to IndexedDB');
        resolve();
      };
      
      tx.onerror = event => {
        console.error('Error saving results:', event.target.error);
        reject(event.target.error);
      };
    });
  } catch (error) {
    console.error('Error accessing database:', error);
  }
}

// Inicializar la base de datos
function initDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('nutriscan-db', 1);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // Crear almacén para alimentos escaneados si no existe
      if (!db.objectStoreNames.contains('scanned-foods')) {
        db.createObjectStore('scanned-foods', { keyPath: 'id' });
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

// Calcular calorías totales de múltiples alimentos
function calculateTotalCalories(foods) {
  return foods.reduce((total, food) => total + food.calories, 0);
}

// Calcular macronutrientes totales
function calculateTotalMacros(foods) {
  const totals = {
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0
  };
  
  foods.forEach(food => {
    // Convertir de string a número (eliminar la 'g' y convertir)
    totals.protein += parseFloat(food.nutrients.protein);
    totals.carbs += parseFloat(food.nutrients.carbs);
    totals.fat += parseFloat(food.nutrients.fat);
    totals.fiber += parseFloat(food.nutrients.fiber);
  });
  
  // Formatear los resultados
  return {
    protein: totals.protein.toFixed(1) + 'g',
    carbs: totals.carbs.toFixed(1) + 'g',
    fat: totals.fat.toFixed(1) + 'g',
    fiber: totals.fiber.toFixed(1) + 'g'
  };
}
