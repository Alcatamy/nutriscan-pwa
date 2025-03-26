// Módulo para gestionar preferencias de usuario y configuraciones dietéticas
import nutriScanDB from './database.js';

class UserPreferences {
    constructor() {
        // Preferencias por defecto
        this.defaultPreferences = {
            // Información de perfil
            profile: {
                name: '',
                weight: null, // kg
                height: null, // cm
                age: null,
                gender: '', // 'male', 'female', 'other'
                activityLevel: 'moderate' // 'sedentary', 'light', 'moderate', 'active', 'very_active'
            },
            
            // Objetivos nutricionales
            nutritionGoals: {
                calorieGoal: 2000,
                proteinGoal: 100, // gramos
                carbsGoal: 250, // gramos
                fatGoal: 65, // gramos
                fiberGoal: 25, // gramos
                waterGoal: 2000 // ml
            },
            
            // Objetivos de fitness y entrenamiento
            fitnessGoals: {
                primaryGoal: null, // 'weightLoss', 'muscleGain', 'maintenance', 'athleticPerformance', 'healthImprovement'
                targetWeight: null, // kg (objetivo de peso)
                weeklyWeightChange: 0.5, // kg por semana (para pérdida o ganancia)
                activityCalories: 300, // calorías diarias objetivo para actividad física
                workoutFrequency: 3, // entrenamientos por semana
                preferredWorkouts: [], // tipos de entrenamientos preferidos: 'cardio', 'strength', 'flexibility', 'hiit', etc.
                fitnessLevel: 'beginner', // 'beginner', 'intermediate', 'advanced'
            },
            
            // Preferencias dietéticas
            dietaryPreferences: {
                vegetarian: false,
                vegan: false,
                glutenFree: false,
                lactoseFree: false,
                nutFree: false,
                lowSodium: false,
                lowSugar: false,
                keto: false,
                paleo: false
            },
            
            // Alergias
            allergens: [],
            
            // Configuración de la aplicación
            appSettings: {
                theme: 'light', // 'light', 'dark', 'system'
                language: 'es',
                notifications: true,
                mealReminderTimes: {
                    breakfast: '08:00',
                    lunch: '13:00',
                    dinner: '20:00'
                },
                scanPreferences: {
                    automaticDetection: true,
                    showCaloriesOnScan: true,
                    showNutrientsOnScan: true,
                    enableSoundFeedback: true
                },
                isGuestAccount: false
            },
            
            // Última actualización
            lastUpdated: Date.now()
        };
        
        // Preferencias actuales
        this.preferences = { ...this.defaultPreferences };
    }

    // Inicializar y cargar preferencias
    async init() {
        try {
            const storedPreferences = await nutriScanDB.getUserPreferences();
            
            if (storedPreferences && Object.keys(storedPreferences).length > 0) {
                // Combinar preferencias almacenadas con las predeterminadas
                this.preferences = this.mergePreferences(this.defaultPreferences, storedPreferences);
                console.log('Preferencias cargadas desde la base de datos');
            } else {
                // Usar preferencias por defecto
                this.preferences = { ...this.defaultPreferences };
                console.log('Usando preferencias por defecto');
            }
            
            return this;
        } catch (error) {
            console.error('Error al inicializar preferencias:', error);
            this.preferences = { ...this.defaultPreferences };
            return this;
        }
    }

    // Combinar preferencias manteniendo la estructura
    mergePreferences(defaults, stored) {
        const result = { ...defaults };
        
        for (const key in stored) {
            if (key in defaults) {
                if (typeof stored[key] === 'object' && stored[key] !== null && !Array.isArray(stored[key]) &&
                    typeof defaults[key] === 'object' && defaults[key] !== null && !Array.isArray(defaults[key])) {
                    // Si ambos son objetos, combinar recursivamente
                    result[key] = this.mergePreferences(defaults[key], stored[key]);
                } else {
                    // Si no son objetos o uno no es objeto, usar el valor almacenado
                    result[key] = stored[key];
                }
            } else {
                // Si la clave no existe en los valores predeterminados, añadirla
                result[key] = stored[key];
            }
        }
        
        return result;
    }

    // Guardar todas las preferencias
    async saveAllPreferences() {
        try {
            this.preferences.lastUpdated = Date.now();
            await nutriScanDB.saveUserPreferences(this.preferences);
            return true;
        } catch (error) {
            console.error('Error al guardar preferencias:', error);
            return false;
        }
    }

    // Obtener todas las preferencias
    getAllPreferences() {
        return { ...this.preferences };
    }

    // Actualizar información de perfil
    async updateProfile(profileData) {
        try {
            // Validar datos
            if (profileData.weight && (isNaN(profileData.weight) || profileData.weight <= 0)) {
                throw new Error('Peso inválido');
            }
            
            if (profileData.height && (isNaN(profileData.height) || profileData.height <= 0)) {
                throw new Error('Altura inválida');
            }
            
            if (profileData.age && (isNaN(profileData.age) || profileData.age <= 0)) {
                throw new Error('Edad inválida');
            }
            
            // Actualizar perfil
            this.preferences.profile = {
                ...this.preferences.profile,
                ...profileData
            };
            
            // Recalcular objetivos nutricionales basados en el nuevo perfil
            this.recalculateNutritionGoals();
            
            // Guardar cambios
            await this.saveAllPreferences();
            
            return true;
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            return false;
        }
    }

    // Recalcular objetivos nutricionales basados en el perfil
    recalculateNutritionGoals() {
        const profile = this.preferences.profile;
        
        // Si no hay suficientes datos, no recalcular
        if (!profile.weight || !profile.height || !profile.age || !profile.gender) {
            return;
        }
        
        // Calcular TMB (Tasa Metabólica Basal) usando la ecuación de Harris-Benedict
        let bmr = 0;
        
        if (profile.gender === 'male') {
            bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
        } else if (profile.gender === 'female') {
            bmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
        } else {
            // Para género 'otro', usar un promedio
            const maleBmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age);
            const femaleBmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
            bmr = (maleBmr + femaleBmr) / 2;
        }
        
        // Ajustar por nivel de actividad
        const activityMultipliers = {
            'sedentary': 1.2, // Poco o ningún ejercicio
            'light': 1.375, // Ejercicio ligero 1-3 días/semana
            'moderate': 1.55, // Ejercicio moderado 3-5 días/semana
            'active': 1.725, // Ejercicio intenso 6-7 días/semana
            'very_active': 1.9 // Ejercicio muy intenso o trabajo físico
        };
        
        const multiplier = activityMultipliers[profile.activityLevel] || activityMultipliers.moderate;
        const calorieGoal = Math.round(bmr * multiplier);
        
        // Actualizar objetivos nutricionales
        this.preferences.nutritionGoals.calorieGoal = calorieGoal;
        
        // Calcular macronutrientes (usando proporciones estándar)
        // Proteínas: 20% de calorías (4 calorías por gramo)
        this.preferences.nutritionGoals.proteinGoal = Math.round((calorieGoal * 0.2) / 4);
        
        // Carbohidratos: 50% de calorías (4 calorías por gramo)
        this.preferences.nutritionGoals.carbsGoal = Math.round((calorieGoal * 0.5) / 4);
        
        // Grasas: 30% de calorías (9 calorías por gramo)
        this.preferences.nutritionGoals.fatGoal = Math.round((calorieGoal * 0.3) / 9);
        
        // Agua: aproximadamente 30-35 ml por kg de peso
        this.preferences.nutritionGoals.waterGoal = Math.round(profile.weight * 33);
    }

    // Obtener perfil de usuario
    getProfile() {
        return { ...this.preferences.profile };
    }

    // Actualizar objetivos nutricionales
    async updateNutritionGoals(goals) {
        try {
            this.preferences.nutritionGoals = {
                ...this.preferences.nutritionGoals,
                ...goals
            };
            
            await this.saveAllPreferences();
            return true;
        } catch (error) {
            console.error('Error al actualizar objetivos nutricionales:', error);
            return false;
        }
    }

    // Obtener objetivos nutricionales
    getNutritionGoals() {
        return { ...this.preferences.nutritionGoals };
    }

    // Actualizar objetivos de fitness
    async updateFitnessGoals(goals) {
        try {
            this.preferences.fitnessGoals = {
                ...this.preferences.fitnessGoals,
                ...goals
            };
            
            // Si cambia el objetivo primario, ajustar otros valores automáticamente
            if (goals.primaryGoal) {
                this.adjustGoalsByFitnessPriority(goals.primaryGoal);
            }
            
            await this.saveAllPreferences();
            return true;
        } catch (error) {
            console.error('Error al actualizar objetivos de fitness:', error);
            return false;
        }
    }

    // Ajustar objetivos basados en la prioridad de fitness
    adjustGoalsByFitnessPriority(primaryGoal) {
        const profile = this.preferences.profile;
        // Si no hay datos suficientes de perfil, no ajustar
        if (!profile.weight || !profile.height || !profile.age) return;
        
        // Ajustar objetivos de calorías según el objetivo primario
        switch (primaryGoal) {
            case 'weightLoss':
                // Déficit calórico para pérdida de peso (15-20% menos)
                const deficitPercentage = 0.2; // 20% de déficit
                this.preferences.nutritionGoals.calorieGoal = Math.round(
                    this.preferences.nutritionGoals.calorieGoal * (1 - deficitPercentage)
                );
                // Ajustar macronutrientes: más proteína, menos carbos
                this.preferences.nutritionGoals.proteinGoal = Math.round((this.preferences.nutritionGoals.calorieGoal * 0.3) / 4);
                this.preferences.nutritionGoals.carbsGoal = Math.round((this.preferences.nutritionGoals.calorieGoal * 0.4) / 4);
                this.preferences.nutritionGoals.fatGoal = Math.round((this.preferences.nutritionGoals.calorieGoal * 0.3) / 9);
                // Ajustar metas de actividad
                this.preferences.fitnessGoals.activityCalories = 400;
                this.preferences.fitnessGoals.workoutFrequency = 4;
                // Entrenamientos recomendados
                this.preferences.fitnessGoals.preferredWorkouts = ['cardio', 'hiit', 'strength'];
                break;
                
            case 'muscleGain':
                // Superávit calórico para ganancia muscular (10-15% más)
                const surplusPercentage = 0.15; // 15% de superávit
                this.preferences.nutritionGoals.calorieGoal = Math.round(
                    this.preferences.nutritionGoals.calorieGoal * (1 + surplusPercentage)
                );
                // Más proteína y carbohidratos para construcción muscular
                this.preferences.nutritionGoals.proteinGoal = Math.round((this.preferences.nutritionGoals.calorieGoal * 0.25) / 4);
                this.preferences.nutritionGoals.carbsGoal = Math.round((this.preferences.nutritionGoals.calorieGoal * 0.55) / 4);
                this.preferences.nutritionGoals.fatGoal = Math.round((this.preferences.nutritionGoals.calorieGoal * 0.2) / 9);
                // Ajustar metas de actividad
                this.preferences.fitnessGoals.activityCalories = 300;
                this.preferences.fitnessGoals.workoutFrequency = 4;
                // Entrenamientos recomendados
                this.preferences.fitnessGoals.preferredWorkouts = ['strength', 'hypertrophy', 'recovery'];
                break;
                
            case 'maintenance':
                // Mantener calorías actuales según calculado por TMB y nivel de actividad
                // Sin ajustes a las calorías calculadas por TMB
                // Distribución equilibrada de macronutrientes
                this.preferences.nutritionGoals.proteinGoal = Math.round((this.preferences.nutritionGoals.calorieGoal * 0.2) / 4);
                this.preferences.nutritionGoals.carbsGoal = Math.round((this.preferences.nutritionGoals.calorieGoal * 0.5) / 4);
                this.preferences.nutritionGoals.fatGoal = Math.round((this.preferences.nutritionGoals.calorieGoal * 0.3) / 9);
                // Actividad moderada
                this.preferences.fitnessGoals.activityCalories = 300;
                this.preferences.fitnessGoals.workoutFrequency = 3;
                // Entrenamientos variados
                this.preferences.fitnessGoals.preferredWorkouts = ['cardio', 'strength', 'flexibility'];
                break;
                
            case 'athleticPerformance':
                // Enfoque en rendimiento - calorías suficientes para entrenamientos intensos
                // Ligero superávit calórico
                this.preferences.nutritionGoals.calorieGoal = Math.round(
                    this.preferences.nutritionGoals.calorieGoal * 1.1
                );
                // Mayor proporción de carbohidratos para energía
                this.preferences.nutritionGoals.proteinGoal = Math.round((this.preferences.nutritionGoals.calorieGoal * 0.2) / 4);
                this.preferences.nutritionGoals.carbsGoal = Math.round((this.preferences.nutritionGoals.calorieGoal * 0.6) / 4);
                this.preferences.nutritionGoals.fatGoal = Math.round((this.preferences.nutritionGoals.calorieGoal * 0.2) / 9);
                // Alta actividad
                this.preferences.fitnessGoals.activityCalories = 600;
                this.preferences.fitnessGoals.workoutFrequency = 5;
                // Entrenamientos específicos
                this.preferences.fitnessGoals.preferredWorkouts = ['sport-specific', 'hiit', 'strength', 'cardio'];
                break;
                
            case 'healthImprovement':
                // Enfoque en salud general - calorías moderadas
                // Slight deficit if overweight, otherwise maintenance
                if (profile.weight && profile.height) {
                    const bmi = profile.weight / Math.pow(profile.height/100, 2);
                    if (bmi > 25) {
                        this.preferences.nutritionGoals.calorieGoal = Math.round(
                            this.preferences.nutritionGoals.calorieGoal * 0.9
                        );
                    }
                }
                // Distribución saludable de macronutrientes
                this.preferences.nutritionGoals.proteinGoal = Math.round((this.preferences.nutritionGoals.calorieGoal * 0.2) / 4);
                this.preferences.nutritionGoals.carbsGoal = Math.round((this.preferences.nutritionGoals.calorieGoal * 0.5) / 4);
                this.preferences.nutritionGoals.fatGoal = Math.round((this.preferences.nutritionGoals.calorieGoal * 0.3) / 9);
                // Actividad moderada
                this.preferences.fitnessGoals.activityCalories = 250;
                this.preferences.fitnessGoals.workoutFrequency = 3;
                // Ejercicios variados y de bajo impacto
                this.preferences.fitnessGoals.preferredWorkouts = ['walking', 'flexibility', 'strength-light', 'swimming'];
                break;
        }
    }

    // Obtener objetivos de fitness
    getFitnessGoals() {
        return { ...this.preferences.fitnessGoals };
    }

    // Evaluar compatibilidad del alimento con objetivos de fitness
    isFoodCompatibleWithFitnessGoals(foodInfo) {
        const fitnessGoals = this.preferences.fitnessGoals;
        const currentGoal = fitnessGoals.primaryGoal;
        
        // Si no hay objetivo establecido, cualquier alimento es compatible
        if (!currentGoal) {
            return { compatible: true };
        }
        
        const issues = [];
        const recommendations = [];
        
        // Evaluar basado en el objetivo primario
        switch (currentGoal) {
            case 'weightLoss':
                // Alta densidad calórica (calorías por gramo)
                if (foodInfo.calories > 300 && foodInfo.weight && (foodInfo.calories / foodInfo.weight) > 3) {
                    issues.push({
                        severity: 'warning',
                        message: 'Este alimento tiene alta densidad calórica, lo que podría dificultar tu objetivo de pérdida de peso'
                    });
                    recommendations.push('Considera opciones con menos calorías por porción');
                }
                
                // Alto en grasas saturadas
                if (foodInfo.saturatedFat && foodInfo.saturatedFat > 5) {
                    issues.push({
                        severity: 'warning',
                        message: 'Alto contenido de grasas saturadas'
                    });
                    recommendations.push('Busca alternativas con menos grasas saturadas');
                }
                
                // Alto en azúcares añadidos
                if (foodInfo.sugar && foodInfo.sugar > 15) {
                    issues.push({
                        severity: 'warning',
                        message: 'Alto contenido de azúcares'
                    });
                    recommendations.push('Para pérdida de peso, limita los alimentos con alto contenido de azúcares');
                }
                
                // Bajo en proteínas (para alimentos principales)
                if (foodInfo.category === 'meal' && foodInfo.protein && foodInfo.protein < 15) {
                    recommendations.push('Para pérdida de peso, prioriza alimentos ricos en proteínas que te ayudarán a mantener la masa muscular');
                }
                break;
                
            case 'muscleGain':
                // Bajo en proteínas (para alimentos principales)
                if (foodInfo.category === 'meal' && foodInfo.protein && foodInfo.protein < 20) {
                    issues.push({
                        severity: 'info',
                        message: 'Este alimento es relativamente bajo en proteínas para tu objetivo de ganancia muscular'
                    });
                    recommendations.push('Para ganar músculo, prioriza alimentos con mayor contenido proteico');
                }
                
                // Bajo en calorías totales
                if (foodInfo.calories < 200 && foodInfo.category === 'meal') {
                    recommendations.push('Considera acompañar este alimento con otras fuentes de calorías para alcanzar tu superávit calórico');
                }
                
                // Bajo en carbohidratos (para antes/después del ejercicio)
                if (foodInfo.carbs && foodInfo.carbs < 30 && foodInfo.mealTime === 'pre-workout') {
                    recommendations.push('Para mejor rendimiento en el entrenamiento, busca alimentos más ricos en carbohidratos antes de ejercitarse');
                }
                break;
                
            case 'maintenance':
                // Recomendaciones generales para mantenimiento
                if (foodInfo.sugar && foodInfo.sugar > 25) {
                    issues.push({
                        severity: 'info',
                        message: 'Alto contenido de azúcares'
                    });
                    recommendations.push('Incluso en mantenimiento, es recomendable limitar el consumo excesivo de azúcares');
                }
                break;
                
            case 'athleticPerformance':
                // Bajo en carbohidratos (para alimentos pre-entrenamiento)
                if (foodInfo.category === 'pre-workout' && foodInfo.carbs && foodInfo.carbs < 40) {
                    issues.push({
                        severity: 'info',
                        message: 'Este alimento podría no proporcionar suficientes carbohidratos para un rendimiento óptimo'
                    });
                    recommendations.push('Para mejorar el rendimiento, consume alimentos más ricos en carbohidratos antes del entrenamiento');
                }
                
                // Bajo en proteínas (post-entrenamiento)
                if (foodInfo.category === 'post-workout' && foodInfo.protein && foodInfo.protein < 20) {
                    issues.push({
                        severity: 'info',
                        message: 'Este alimento contiene menos proteínas de las recomendadas para recuperación muscular'
                    });
                    recommendations.push('Después del entrenamiento, prioriza alimentos ricos en proteínas para optimizar la recuperación');
                }
                break;
                
            case 'healthImprovement':
                // Alto en grasas saturadas
                if (foodInfo.saturatedFat && foodInfo.saturatedFat > 5) {
                    issues.push({
                        severity: 'warning',
                        message: 'Alto contenido de grasas saturadas'
                    });
                    recommendations.push('Para mejorar la salud cardiovascular, limita el consumo de grasas saturadas');
                }
                
                // Alto en sodio
                if (foodInfo.sodium && foodInfo.sodium > 600) {
                    issues.push({
                        severity: 'warning',
                        message: 'Alto contenido de sodio'
                    });
                    recommendations.push('Un alto consumo de sodio puede afectar la presión arterial. Busca alternativas con menos sal');
                }
                
                // Bajo en fibra
                if (foodInfo.fiber && foodInfo.fiber < 2 && foodInfo.category === 'meal') {
                    recommendations.push('Procura incluir más alimentos ricos en fibra para una mejor salud digestiva');
                }
                break;
        }
        
        return {
            compatible: issues.length === 0 || issues.every(issue => issue.severity === 'info'),
            issues: issues,
            recommendations: recommendations
        };
    }

    // Actualizar preferencias dietéticas
    async updateDietaryPreferences(dietPrefs) {
        try {
            this.preferences.dietaryPreferences = {
                ...this.preferences.dietaryPreferences,
                ...dietPrefs
            };
            
            await this.saveAllPreferences();
            return true;
        } catch (error) {
            console.error('Error al actualizar preferencias dietéticas:', error);
            return false;
        }
    }

    // Obtener preferencias dietéticas
    getDietaryPreferences() {
        return { ...this.preferences.dietaryPreferences };
    }

    // Añadir un alérgeno
    async addAllergen(allergenId) {
        try {
            if (!this.preferences.allergens.includes(allergenId)) {
                this.preferences.allergens.push(allergenId);
                await this.saveAllPreferences();
            }
            return true;
        } catch (error) {
            console.error('Error al añadir alérgeno:', error);
            return false;
        }
    }

    // Eliminar un alérgeno
    async removeAllergen(allergenId) {
        try {
            this.preferences.allergens = this.preferences.allergens.filter(id => id !== allergenId);
            await this.saveAllPreferences();
            return true;
        } catch (error) {
            console.error('Error al eliminar alérgeno:', error);
            return false;
        }
    }

    // Obtener lista de alérgenos
    getAllergens() {
        return [...this.preferences.allergens];
    }

    // Actualizar configuración de la aplicación
    async updateAppSettings(settings) {
        try {
            this.preferences.appSettings = {
                ...this.preferences.appSettings,
                ...settings
            };
            
            await this.saveAllPreferences();
            
            // Notificar cambio de configuración
            this.notifySettingsChange();
            
            return true;
        } catch (error) {
            console.error('Error al actualizar configuración de aplicación:', error);
            return false;
        }
    }

    // Obtener configuración de la aplicación
    getAppSettings() {
        return { ...this.preferences.appSettings };
    }

    // Verificar si un alimento cumple con las preferencias dietéticas
    isCompatibleWithDiet(foodInfo) {
        const dietPrefs = this.preferences.dietaryPreferences;
        
        // Si no hay restricciones dietéticas activas, es compatible
        if (!Object.values(dietPrefs).some(val => val === true)) {
            return { compatible: true };
        }
        
        const issues = [];
        
        // Verificar vegetariano
        if (dietPrefs.vegetarian && foodInfo.category === 'meat') {
            issues.push({
                type: 'diet',
                restriction: 'vegetarian',
                message: 'Este alimento no es compatible con una dieta vegetariana'
            });
        }
        
        // Verificar vegano
        if (dietPrefs.vegan && (foodInfo.category === 'meat' || foodInfo.category === 'dairy')) {
            issues.push({
                type: 'diet',
                restriction: 'vegan',
                message: 'Este alimento no es compatible con una dieta vegana'
            });
        }
        
        // Verificar sin gluten
        if (dietPrefs.glutenFree && foodInfo.allergens && 
            foodInfo.allergens.some(a => a.id === 'gluten')) {
            issues.push({
                type: 'diet',
                restriction: 'glutenFree',
                message: 'Este alimento contiene gluten'
            });
        }
        
        // Verificar sin lactosa
        if (dietPrefs.lactoseFree && foodInfo.allergens && 
            foodInfo.allergens.some(a => a.id === 'milk')) {
            issues.push({
                type: 'diet',
                restriction: 'lactoseFree',
                message: 'Este alimento contiene lactosa'
            });
        }
        
        // Verificar sin frutos secos
        if (dietPrefs.nutFree && foodInfo.allergens && 
            foodInfo.allergens.some(a => a.id === 'nuts' || a.id === 'peanuts')) {
            issues.push({
                type: 'diet',
                restriction: 'nutFree',
                message: 'Este alimento contiene frutos secos'
            });
        }
        
        // Verificar si contiene alérgenos del usuario
        if (this.preferences.allergens.length > 0 && foodInfo.allergens) {
            for (const userAllergen of this.preferences.allergens) {
                if (foodInfo.allergens.some(a => a.id === userAllergen)) {
                    issues.push({
                        type: 'allergen',
                        allergen: userAllergen,
                        message: `Este alimento contiene ${userAllergen}, al que eres alérgico/a`
                    });
                }
            }
        }
        
        return {
            compatible: issues.length === 0,
            issues: issues
        };
    }

    // Notificar cambio de configuración
    notifySettingsChange() {
        const event = new CustomEvent('app-settings-changed', {
            detail: {
                settings: this.preferences.appSettings
            }
        });
        document.dispatchEvent(event);
    }

    // Reiniciar a valores por defecto
    async resetToDefaults() {
        try {
            // Copiar las preferencias por defecto
            this.preferences = JSON.parse(JSON.stringify(this.defaultPreferences));
            
            // Actualizar la fecha de última actualización
            this.preferences.lastUpdated = Date.now();
            
            // Guardar en la base de datos
            await nutriScanDB.saveUserPreferences(this.preferences);
            
            return true;
        } catch (error) {
            console.error('Error al reiniciar preferencias:', error);
            return false;
        }
    }
}

// Exportar una instancia única para uso en toda la aplicación
const userPreferences = new UserPreferences();
export default userPreferences; 