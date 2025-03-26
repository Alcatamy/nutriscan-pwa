// Base de datos para NutriScan
// Este módulo maneja todas las operaciones de base de datos para la aplicación

class NutriScanDB {
    constructor() {
        this.dbName = 'nutriscan-db';
        this.dbVersion = 1;
        this.db = null;
    }

    // Inicializar la base de datos
    async init() {
        try {
            this.db = await this.openDatabase();
            console.log('Base de datos inicializada correctamente');
            return this;
        } catch (error) {
            console.error('Error al inicializar la base de datos:', error);
            throw error;
        }
    }

    // Abrir la conexión a la base de datos
    openDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            // Crear o actualizar la estructura de la base de datos
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Crear almacén para alimentos escaneados
                if (!db.objectStoreNames.contains('scanned_foods')) {
                    const scannedFoodsStore = db.createObjectStore('scanned_foods', { keyPath: 'id', autoIncrement: true });
                    scannedFoodsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    scannedFoodsStore.createIndex('date', 'date', { unique: false });
                }
                
                // Crear almacén para registro diario de alimentos
                if (!db.objectStoreNames.contains('daily_logs')) {
                    const dailyLogsStore = db.createObjectStore('daily_logs', { keyPath: 'date' });
                }
                
                // Crear almacén para productos escaneados por código de barras
                if (!db.objectStoreNames.contains('barcode_products')) {
                    const barcodeProductsStore = db.createObjectStore('barcode_products', { keyPath: 'barcode' });
                    barcodeProductsStore.createIndex('name', 'name', { unique: false });
                }
                
                // Crear almacén para preferencias de usuario
                if (!db.objectStoreNames.contains('user_preferences')) {
                    db.createObjectStore('user_preferences', { keyPath: 'id' });
                }
                
                // Crear almacén para información nutricional detallada
                if (!db.objectStoreNames.contains('nutrition_data')) {
                    db.createObjectStore('nutrition_data', { keyPath: 'foodId' });
                }
                
                // Crear almacén para información de alérgenos
                if (!db.objectStoreNames.contains('allergens')) {
                    db.createObjectStore('allergens', { keyPath: 'foodId' });
                }
            };

            request.onsuccess = (event) => {
                const db = event.target.result;
                resolve(db);
            };

            request.onerror = (event) => {
                console.error('Error al abrir la base de datos:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Guardar un alimento escaneado en el historial
    async saveScannedFood(foodData) {
        try {
            const today = new Date();
            const timestamp = today.getTime();
            const date = today.toISOString().split('T')[0]; // Formato YYYY-MM-DD
            
            const transaction = this.db.transaction(['scanned_foods'], 'readwrite');
            const store = transaction.objectStore('scanned_foods');
            
            const entry = {
                foodData,
                timestamp,
                date
            };
            
            await this.performTransaction(store, 'add', entry);
            console.log('Alimento guardado en el historial');
            return true;
        } catch (error) {
            console.error('Error al guardar alimento escaneado:', error);
            return false;
        }
    }

    // Añadir un alimento al registro diario de calorías
    async addToDailyLog(food, meal, date = null) {
        try {
            // Si no se proporciona fecha, usar la fecha actual
            const logDate = date || new Date().toISOString().split('T')[0];
            
            const transaction = this.db.transaction(['daily_logs'], 'readwrite');
            const store = transaction.objectStore('daily_logs');
            
            // Intentar obtener el registro existente para la fecha dada
            let dailyLog = await this.performTransaction(store, 'get', logDate);
            
            if (!dailyLog) {
                // Si no existe registro para esta fecha, crear uno nuevo
                dailyLog = {
                    date: logDate,
                    meals: {},
                    totalCalories: 0,
                    macros: {
                        protein: 0,
                        carbs: 0,
                        fat: 0,
                        fiber: 0
                    }
                };
            }
            
            // Asegurarse de que la estructura de comidas existe
            if (!dailyLog.meals[meal]) {
                dailyLog.meals[meal] = [];
            }
            
            // Generar ID único para la entrada
            const entryId = `${logDate}-${meal}-${Date.now()}`;
            
            // Añadir alimento a la comida correspondiente
            dailyLog.meals[meal].push({
                id: entryId,
                food,
                timestamp: Date.now()
            });
            
            // Actualizar calorías totales y macronutrientes
            dailyLog.totalCalories += food.nutrients?.energy || 0;
            
            dailyLog.macros.protein += food.nutrients?.protein || 0;
            dailyLog.macros.carbs += food.nutrients?.carbohydrates || 0;
            dailyLog.macros.fat += food.nutrients?.fat || 0;
            dailyLog.macros.fiber += food.nutrients?.fiber || 0;
            
            // Guardar el registro actualizado
            await this.performTransaction(store, 'put', dailyLog);
            
            console.log(`Alimento añadido a ${meal} para ${logDate}`);
            return entryId;
        } catch (error) {
            console.error('Error al añadir alimento al registro diario:', error);
            return null;
        }
    }

    // Obtener el registro diario para una fecha específica
    async getDailyLog(date) {
        try {
            const transaction = this.db.transaction(['daily_logs'], 'readonly');
            const store = transaction.objectStore('daily_logs');
            
            return await this.performTransaction(store, 'get', date);
        } catch (error) {
            console.error(`Error al obtener registro diario para ${date}:`, error);
            return null;
        }
    }

    // Guardar un producto escaneado por código de barras
    async saveBarcodeProduct(product) {
        try {
            if (!product.barcode) {
                throw new Error('El producto debe tener un código de barras');
            }
            
            const transaction = this.db.transaction(['barcode_products'], 'readwrite');
            const store = transaction.objectStore('barcode_products');
            
            await this.performTransaction(store, 'put', product);
            console.log(`Producto guardado: ${product.name} (${product.barcode})`);
            return true;
        } catch (error) {
            console.error('Error al guardar producto por código de barras:', error);
            return false;
        }
    }

    // Obtener un producto por su código de barras
    async getProductByBarcode(barcode) {
        try {
            const transaction = this.db.transaction(['barcode_products'], 'readonly');
            const store = transaction.objectStore('barcode_products');
            
            return await this.performTransaction(store, 'get', barcode);
        } catch (error) {
            console.error(`Error al obtener producto con código ${barcode}:`, error);
            return null;
        }
    }

    // Guardar preferencias de usuario
    async saveUserPreferences(preferences) {
        try {
            const transaction = this.db.transaction(['user_preferences'], 'readwrite');
            const store = transaction.objectStore('user_preferences');
            
            // Usar un ID fijo para las preferencias (solo un registro)
            const preferencesEntry = {
                id: 'user_preferences',
                ...preferences
            };
            
            await this.performTransaction(store, 'put', preferencesEntry);
            console.log('Preferencias de usuario guardadas');
            return true;
        } catch (error) {
            console.error('Error al guardar preferencias de usuario:', error);
            return false;
        }
    }

    // Obtener preferencias de usuario
    async getUserPreferences() {
        try {
            const transaction = this.db.transaction(['user_preferences'], 'readonly');
            const store = transaction.objectStore('user_preferences');
            
            const preferences = await this.performTransaction(store, 'get', 'user_preferences');
            
            if (preferences) {
                // Eliminar el ID interno antes de devolver las preferencias
                const { id, ...prefsData } = preferences;
                return prefsData;
            }
            
            return null;
        } catch (error) {
            console.error('Error al obtener preferencias de usuario:', error);
            return null;
        }
    }

    // Guardar información nutricional detallada de un alimento
    async saveNutritionData(foodId, nutritionData) {
        try {
            const transaction = this.db.transaction(['nutrition_data'], 'readwrite');
            const store = transaction.objectStore('nutrition_data');
            
            const entry = {
                foodId,
                ...nutritionData,
                lastUpdated: Date.now()
            };
            
            await this.performTransaction(store, 'put', entry);
            console.log(`Información nutricional guardada para ${foodId}`);
            return true;
        } catch (error) {
            console.error(`Error al guardar información nutricional para ${foodId}:`, error);
            return false;
        }
    }

    // Obtener información nutricional detallada de un alimento
    async getNutritionData(foodId) {
        try {
            const transaction = this.db.transaction(['nutrition_data'], 'readonly');
            const store = transaction.objectStore('nutrition_data');
            
            return await this.performTransaction(store, 'get', foodId);
        } catch (error) {
            console.error(`Error al obtener información nutricional para ${foodId}:`, error);
            return null;
        }
    }

    // Guardar información de alérgenos para un alimento
    async saveAllergenInfo(foodId, allergens) {
        try {
            const transaction = this.db.transaction(['allergens'], 'readwrite');
            const store = transaction.objectStore('allergens');
            
            // Primero eliminar cualquier entrada existente
            try {
                await this.performTransaction(store, 'delete', foodId);
            } catch (e) {
                // Ignorar error si no existe
            }
            
            const entry = {
                foodId,
                allergens,
                lastUpdated: Date.now()
            };
            
            await this.performTransaction(store, 'put', entry);
            console.log(`Información de alérgenos guardada para ${foodId}`);
            return true;
        } catch (error) {
            console.error(`Error al guardar información de alérgenos para ${foodId}:`, error);
            return false;
        }
    }

    // Obtener información de alérgenos para un alimento
    async getAllergenInfo(foodId) {
        try {
            const transaction = this.db.transaction(['allergens'], 'readonly');
            const store = transaction.objectStore('allergens');
            
            return await this.performTransaction(store, 'get', foodId);
        } catch (error) {
            console.error(`Error al obtener información de alérgenos para ${foodId}:`, error);
            return null;
        }
    }

    // Obtener historial de alimentos escaneados
    async getScannedFoodHistory(limit = 50) {
        try {
            const transaction = this.db.transaction(['scanned_foods'], 'readonly');
            const store = transaction.objectStore('scanned_foods');
            const index = store.index('timestamp');
            
            const history = [];
            let cursor = await this.performCursorRequest(index.openCursor(null, 'prev'));
            
            while (cursor && history.length < limit) {
                history.push(cursor.value);
                cursor = await this.performCursorRequest(cursor.continue());
            }
            
            return history;
        } catch (error) {
            console.error('Error al obtener historial de alimentos:', error);
            return [];
        }
    }

    // Eliminar entrada del registro diario
    async removeLogEntry(entryId) {
        try {
            if (!entryId) throw new Error('ID de entrada no válido');
            
            // Extraer fecha y tipo de comida del ID
            const [date, meal] = entryId.split('-');
            
            if (!date || !meal) throw new Error('ID de entrada no válido');
            
            const transaction = this.db.transaction(['daily_logs'], 'readwrite');
            const store = transaction.objectStore('daily_logs');
            
            // Obtener el registro diario
            const dailyLog = await this.performTransaction(store, 'get', date);
            
            if (!dailyLog || !dailyLog.meals || !dailyLog.meals[meal]) {
                throw new Error('Registro diario no encontrado');
            }
            
            // Encontrar la entrada por ID
            const entryIndex = dailyLog.meals[meal].findIndex(entry => entry.id === entryId);
            
            if (entryIndex === -1) {
                throw new Error('Entrada no encontrada');
            }
            
            // Restar calorías y macros
            const entry = dailyLog.meals[meal][entryIndex];
            dailyLog.totalCalories -= entry.food.nutrients?.energy || 0;
            dailyLog.macros.protein -= entry.food.nutrients?.protein || 0;
            dailyLog.macros.carbs -= entry.food.nutrients?.carbohydrates || 0;
            dailyLog.macros.fat -= entry.food.nutrients?.fat || 0;
            dailyLog.macros.fiber -= entry.food.nutrients?.fiber || 0;
            
            // Eliminar la entrada
            dailyLog.meals[meal].splice(entryIndex, 1);
            
            // Guardar el registro actualizado
            await this.performTransaction(store, 'put', dailyLog);
            
            console.log(`Entrada ${entryId} eliminada del registro diario`);
            return true;
        } catch (error) {
            console.error('Error al eliminar entrada del registro diario:', error);
            return false;
        }
    }

    // Limpiar todos los datos (para depuración)
    async clearAllData() {
        try {
            const storeNames = this.db.objectStoreNames;
            const promises = [];
            
            for (const storeName of storeNames) {
                const transaction = this.db.transaction([storeName], 'readwrite');
                const store = transaction.objectStore(storeName);
                promises.push(this.performTransaction(store, 'clear'));
            }
            
            await Promise.all(promises);
            console.log('Todos los datos han sido borrados');
            return true;
        } catch (error) {
            console.error('Error al limpiar datos:', error);
            return false;
        }
    }

    // Realizar una transacción genérica
    performTransaction(store, method, value = null) {
        return new Promise((resolve, reject) => {
            let request;
            
            if (method === 'add' || method === 'put') {
                request = store[method](value);
            } else if (method === 'delete' || method === 'get') {
                request = store[method](value);
            } else if (method === 'clear') {
                request = store.clear();
            } else if (method === 'getAll') {
                request = store.getAll();
            } else {
                reject(new Error(`Método desconocido: ${method}`));
                return;
            }
            
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            
            request.onerror = (event) => {
                console.error(`Error en transacción ${method}:`, event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Realizar una petición de cursor
    performCursorRequest(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            
            request.onerror = (event) => {
                console.error('Error en petición de cursor:', event.target.error);
                reject(event.target.error);
            };
        });
    }
}

// Exportar una instancia única para uso en toda la aplicación
const nutriScanDB = new NutriScanDB();
export default nutriScanDB;

// Hacer accesible desde la consola para depuración
window.nutriScanDB = nutriScanDB; 