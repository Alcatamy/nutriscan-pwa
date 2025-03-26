// Módulo para gestionar las preferencias de usuario
import database from './models/database.js';

class UserPreferences {
    constructor() {
        // Preferencias por defecto
        this.defaultPreferences = {
            // Datos de perfil
            profile: {
                name: 'Usuario',
                gender: null, // 'male', 'female', 'other'
                birthdate: null,
                height: null, // cm
                weight: null, // kg
                activityLevel: 'moderate' // 'sedentary', 'light', 'moderate', 'active', 'very_active'
            },
            // Objetivos nutricionales
            nutritionGoals: {
                calorieGoal: 2000, // kcal
                macros: {
                    protein: 25, // %
                    carbs: 55,   // %
                    fat: 20      // %
                }
            },
            // Objetivos de fitness
            fitnessGoal: null, // 'lose-weight', 'gain-muscle', 'maintain', 'improve-health', 'athletic-performance'
            // Nivel de condición física
            fitnessLevel: 'beginner', // 'beginner', 'intermediate', 'advanced'
            // Preferencias dietéticas
            dietPreferences: {
                vegetarian: false,
                vegan: false,
                glutenFree: false,
                lactoseFree: false,
                nutFree: false,
                lowCarb: false,
                lowSodium: false,
                highProtein: false
            },
            // Alérgenos e intolerancias
            allergens: [],
            // Preferencias de la aplicación
            appSettings: {
                darkMode: false,
                notificationsEnabled: true,
                language: 'es',
                units: 'metric' // 'metric', 'imperial'
            }
        };
        
        // Preferencias actuales del usuario
        this.userPreferences = JSON.parse(JSON.stringify(this.defaultPreferences));
    }
    
    // Inicializar las preferencias de usuario
    async init() {
        console.log('Inicializando preferencias de usuario');
        return this;
    }
    
    // Obtener preferencias completas del usuario actual
    async getUserPreferences(userId) {
        try {
            if (!userId) return null;
            
            // Intentar obtener preferencias de la base de datos
            const savedPrefs = await database.getUserPreferences(userId);
            
            if (savedPrefs) {
                // Combinar con preferencias por defecto para garantizar que se tienen todos los campos
                return {...this.defaultPreferences, ...savedPrefs};
            } else {
                // Si no hay preferencias guardadas, usar las por defecto
                return this.defaultPreferences;
            }
        } catch (error) {
            console.error('Error al obtener preferencias de usuario:', error);
            return this.defaultPreferences;
        }
    }
    
    // Guardar preferencias de usuario
    async saveUserPreferences(userId, preferences) {
        try {
            if (!userId) return false;
            
            // Guardar preferencias en la base de datos
            await database.saveUserPreferences(userId, preferences);
            return true;
        } catch (error) {
            console.error('Error al guardar preferencias de usuario:', error);
            return false;
        }
    }
    
    // Actualizar perfil de usuario
    async updateProfile(userId, profileData) {
        try {
            if (!userId) return false;
            
            // Obtener preferencias actuales
            const prefs = await this.getUserPreferences(userId);
            
            // Actualizar perfil
            const updatedPrefs = {
                ...prefs,
                profile: {
                    ...prefs.profile,
                    ...profileData
                }
            };
            
            // Guardar cambios
            return await this.saveUserPreferences(userId, updatedPrefs);
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            return false;
        }
    }
    
    // Establecer objetivo fitness
    async setFitnessGoal(userId, goal) {
        try {
            if (!userId) return false;
            
            // Validar objetivo
            const validGoals = ['lose-weight', 'gain-muscle', 'maintain', 'improve-health', 'athletic-performance'];
            if (!validGoals.includes(goal)) {
                throw new Error('Objetivo fitness no válido');
            }
            
            // Obtener preferencias actuales
            const prefs = await this.getUserPreferences(userId);
            
            // Actualizar objetivo
            const updatedPrefs = {
                ...prefs,
                fitnessGoal: goal
            };
            
            // Guardar cambios
            return await this.saveUserPreferences(userId, updatedPrefs);
        } catch (error) {
            console.error('Error al establecer objetivo fitness:', error);
            return false;
        }
    }
    
    // Actualizar nivel de condición física
    async setFitnessLevel(userId, level) {
        try {
            if (!userId) return false;
            
            // Validar nivel
            const validLevels = ['beginner', 'intermediate', 'advanced'];
            if (!validLevels.includes(level)) {
                throw new Error('Nivel de condición física no válido');
            }
            
            // Obtener preferencias actuales
            const prefs = await this.getUserPreferences(userId);
            
            // Actualizar nivel
            const updatedPrefs = {
                ...prefs,
                fitnessLevel: level
            };
            
            // Guardar cambios
            return await this.saveUserPreferences(userId, updatedPrefs);
        } catch (error) {
            console.error('Error al establecer nivel de condición física:', error);
            return false;
        }
    }
    
    // Actualizar objetivos nutricionales
    async updateNutritionGoals(userId, nutritionGoals) {
        try {
            if (!userId) return false;
            
            // Obtener preferencias actuales
            const prefs = await this.getUserPreferences(userId);
            
            // Actualizar objetivos nutricionales
            const updatedPrefs = {
                ...prefs,
                nutritionGoals: {
                    ...prefs.nutritionGoals,
                    ...nutritionGoals
                }
            };
            
            // Guardar cambios
            return await this.saveUserPreferences(userId, updatedPrefs);
        } catch (error) {
            console.error('Error al actualizar objetivos nutricionales:', error);
            return false;
        }
    }
    
    // Actualizar preferencias dietéticas
    async updateDietPreferences(userId, dietPreferences) {
        try {
            if (!userId) return false;
            
            // Obtener preferencias actuales
            const prefs = await this.getUserPreferences(userId);
            
            // Actualizar preferencias dietéticas
            const updatedPrefs = {
                ...prefs,
                dietPreferences: {
                    ...prefs.dietPreferences,
                    ...dietPreferences
                }
            };
            
            // Guardar cambios
            return await this.saveUserPreferences(userId, updatedPrefs);
        } catch (error) {
            console.error('Error al actualizar preferencias dietéticas:', error);
            return false;
        }
    }
    
    // Actualizar alérgenos
    async updateAllergens(userId, allergens) {
        try {
            if (!userId) return false;
            
            // Obtener preferencias actuales
            const prefs = await this.getUserPreferences(userId);
            
            // Actualizar alérgenos
            const updatedPrefs = {
                ...prefs,
                allergens: allergens
            };
            
            // Guardar cambios
            return await this.saveUserPreferences(userId, updatedPrefs);
        } catch (error) {
            console.error('Error al actualizar alérgenos:', error);
            return false;
        }
    }
    
    // Actualizar configuración de la aplicación
    async updateAppSettings(userId, settings) {
        try {
            if (!userId) return false;
            
            // Obtener preferencias actuales
            const prefs = await this.getUserPreferences(userId);
            
            // Actualizar configuración
            const updatedPrefs = {
                ...prefs,
                appSettings: {
                    ...prefs.appSettings,
                    ...settings
                }
            };
            
            // Guardar cambios
            return await this.saveUserPreferences(userId, updatedPrefs);
        } catch (error) {
            console.error('Error al actualizar configuración de la aplicación:', error);
            return false;
        }
    }
    
    // Reiniciar preferencias a valores por defecto
    async resetToDefaults(userId) {
        try {
            if (!userId) return false;
            
            // Guardar preferencias por defecto
            return await this.saveUserPreferences(userId, this.defaultPreferences);
        } catch (error) {
            console.error('Error al restablecer preferencias:', error);
            return false;
        }
    }
    
    // Calcular calorías diarias recomendadas en base al perfil y objetivo
    calculateRecommendedCalories(profile, fitnessGoal) {
        try {
            if (!profile.gender || !profile.weight || !profile.height || !profile.birthdate) {
                return null;
            }
            
            // Calcular edad
            const birthDate = new Date(profile.birthdate);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            // Factores de actividad
            const activityFactors = {
                sedentary: 1.2,
                light: 1.375,
                moderate: 1.55,
                active: 1.725,
                very_active: 1.9
            };
            
            // Calcular TMB (Tasa Metabólica Basal) usando la ecuación de Mifflin-St Jeor
            let bmr = 0;
            if (profile.gender === 'male') {
                bmr = 10 * profile.weight + 6.25 * profile.height - 5 * age + 5;
            } else {
                bmr = 10 * profile.weight + 6.25 * profile.height - 5 * age - 161;
            }
            
            // Aplicar factor de actividad
            const maintenanceCalories = bmr * activityFactors[profile.activityLevel || 'moderate'];
            
            // Ajustar según objetivo
            let recommendedCalories = maintenanceCalories;
            
            switch (fitnessGoal) {
                case 'lose-weight':
                    recommendedCalories = maintenanceCalories * 0.8; // Déficit del 20%
                    break;
                case 'gain-muscle':
                    recommendedCalories = maintenanceCalories * 1.1; // Superávit del 10%
                    break;
                case 'athletic-performance':
                    recommendedCalories = maintenanceCalories * 1.15; // Superávit del 15%
                    break;
                // Para 'maintain' e 'improve-health', usar las calorías de mantenimiento
            }
            
            return Math.round(recommendedCalories);
        } catch (error) {
            console.error('Error al calcular calorías recomendadas:', error);
            return null;
        }
    }
}

// Exportar como singleton
export default new UserPreferences(); 