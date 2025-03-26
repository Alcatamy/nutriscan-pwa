// Módulo para gestionar la base de datos local utilizando localStorage
class LocalDatabase {
    constructor() {
        this.storagePrefix = 'nutriScan_';
        this.collections = {
            preferences: 'preferences',
            foodLog: 'foodLog',
            scannedFoods: 'scannedFoods',
            configurations: 'configurations',
            workouts: 'customWorkouts'
        };
    }
    
    // Inicializar la base de datos
    async init() {
        try {
            console.log('Inicializando base de datos local');
            
            // Verificar si localStorage está disponible
            if (!this.isLocalStorageAvailable()) {
                throw new Error('localStorage no está disponible');
            }
            
            return this;
        } catch (error) {
            console.error('Error al inicializar base de datos local:', error);
            return this;
        }
    }
    
    // Verificar si localStorage está disponible
    isLocalStorageAvailable() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    // Guardar datos en una colección
    async saveToCollection(collection, id, data) {
        try {
            if (!this.collections[collection]) {
                throw new Error(`Colección no válida: ${collection}`);
            }
            
            // Obtener los datos actuales de la colección
            const collectionData = this.getCollectionData(collection);
            
            // Actualizar o añadir el documento
            collectionData[id] = {
                ...data,
                updatedAt: new Date().toISOString()
            };
            
            // Guardar en localStorage
            this.saveCollectionData(collection, collectionData);
            
            return true;
        } catch (error) {
            console.error(`Error al guardar en ${collection}:`, error);
            return false;
        }
    }
    
    // Obtener datos de una colección
    async getFromCollection(collection, id) {
        try {
            if (!this.collections[collection]) {
                throw new Error(`Colección no válida: ${collection}`);
            }
            
            // Obtener los datos de la colección
            const collectionData = this.getCollectionData(collection);
            
            // Devolver el documento específico si existe
            return collectionData[id] || null;
        } catch (error) {
            console.error(`Error al obtener de ${collection}:`, error);
            return null;
        }
    }
    
    // Eliminar datos de una colección
    async deleteFromCollection(collection, id) {
        try {
            if (!this.collections[collection]) {
                throw new Error(`Colección no válida: ${collection}`);
            }
            
            // Obtener los datos actuales de la colección
            const collectionData = this.getCollectionData(collection);
            
            // Eliminar el documento si existe
            if (collectionData[id]) {
                delete collectionData[id];
                
                // Guardar en localStorage
                this.saveCollectionData(collection, collectionData);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error(`Error al eliminar de ${collection}:`, error);
            return false;
        }
    }
    
    // Guardar preferencias de usuario
    async saveUserPreferences(userId, preferences) {
        return this.saveToCollection(this.collections.preferences, userId, preferences);
    }
    
    // Obtener preferencias de usuario
    async getUserPreferences(userId) {
        return this.getFromCollection(this.collections.preferences, userId);
    }
    
    // Guardar registro de alimentos
    async saveFoodLog(userId, date, log) {
        const logId = `${userId}_${date}`;
        return this.saveToCollection(this.collections.foodLog, logId, log);
    }
    
    // Obtener registro de alimentos
    async getFoodLog(userId, date) {
        const logId = `${userId}_${date}`;
        return this.getFromCollection(this.collections.foodLog, logId);
    }
    
    // Guardar alimento escaneado
    async saveScannedFood(userId, foodId, foodData) {
        const userFoodsId = `${userId}_foods`;
        
        // Obtener alimentos escaneados actuales
        const scannedFoods = await this.getFromCollection(this.collections.scannedFoods, userFoodsId) || { foods: {} };
        
        // Añadir o actualizar el alimento
        scannedFoods.foods[foodId] = {
            ...foodData,
            updatedAt: new Date().toISOString()
        };
        
        return this.saveToCollection(this.collections.scannedFoods, userFoodsId, scannedFoods);
    }
    
    // Obtener todos los alimentos escaneados de un usuario
    async getAllScannedFoods(userId) {
        const userFoodsId = `${userId}_foods`;
        const scannedFoods = await this.getFromCollection(this.collections.scannedFoods, userFoodsId);
        return scannedFoods ? scannedFoods.foods || {} : {};
    }
    
    // Guardar rutina de entrenamiento personalizada
    async saveCustomWorkout(userId, workoutId, workoutData) {
        const userWorkoutsId = `${userId}_workouts`;
        
        // Obtener rutinas actuales
        const customWorkouts = await this.getFromCollection(this.collections.workouts, userWorkoutsId) || { workouts: {} };
        
        // Añadir o actualizar la rutina
        customWorkouts.workouts[workoutId] = {
            ...workoutData,
            updatedAt: new Date().toISOString()
        };
        
        return this.saveToCollection(this.collections.workouts, userWorkoutsId, customWorkouts);
    }
    
    // Obtener todas las rutinas personalizadas de un usuario
    async getCustomWorkouts(userId) {
        const userWorkoutsId = `${userId}_workouts`;
        const customWorkouts = await this.getFromCollection(this.collections.workouts, userWorkoutsId);
        
        if (customWorkouts && customWorkouts.workouts) {
            return Object.values(customWorkouts.workouts);
        }
        
        return [];
    }
    
    // Guardar configuración
    async saveConfiguration(configId, configData) {
        return this.saveToCollection(this.collections.configurations, configId, configData);
    }
    
    // Obtener configuración
    async getConfiguration(configId) {
        return this.getFromCollection(this.collections.configurations, configId);
    }
    
    // Métodos auxiliares para manipular datos en localStorage
    getCollectionData(collection) {
        const storageKey = this.storagePrefix + collection;
        const data = localStorage.getItem(storageKey);
        return data ? JSON.parse(data) : {};
    }
    
    saveCollectionData(collection, data) {
        const storageKey = this.storagePrefix + collection;
        localStorage.setItem(storageKey, JSON.stringify(data));
    }
}

// Exportar como singleton
export default new LocalDatabase(); 