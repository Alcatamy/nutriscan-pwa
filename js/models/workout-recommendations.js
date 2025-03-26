// Módulo para generar recomendaciones de entrenamiento basadas en alimentos y objetivos
import userPreferences from './user-preferences.js';
import nutriScanDB from './database.js';

class WorkoutRecommendations {
    constructor() {
        this.workoutTypes = {
            cardio: {
                name: 'Cardio',
                description: 'Ejercicios para mejorar la resistencia cardiovascular y quemar calorías',
                icon: 'fa-running'
            },
            strength: {
                name: 'Fuerza',
                description: 'Ejercicios para aumentar fuerza y masa muscular',
                icon: 'fa-dumbbell'
            },
            hiit: {
                name: 'HIIT',
                description: 'Entrenamiento de intervalos de alta intensidad para máxima quema calórica',
                icon: 'fa-fire-alt'
            },
            flexibility: {
                name: 'Flexibilidad',
                description: 'Ejercicios para mejorar movilidad y prevenir lesiones',
                icon: 'fa-child'
            },
            recovery: {
                name: 'Recuperación',
                description: 'Actividades de baja intensidad para recuperación muscular',
                icon: 'fa-heart'
            }
        };
        
        this.workouts = {
            // Entrenamientos de cardio
            cardio_beginner: {
                type: 'cardio',
                level: 'beginner',
                name: 'Cardio para principiantes',
                duration: 20,
                calories: 150,
                description: 'Sesión de cardio ligero ideal para principiantes',
                exercises: [
                    { name: 'Caminata rápida', duration: 5, instructions: 'Camina a paso ligero' },
                    { name: 'Marcha en el sitio', duration: 3, instructions: 'Levanta las rodillas alternadamente' },
                    { name: 'Jumping jacks suaves', duration: 2, instructions: 'Salta abriendo y cerrando piernas y brazos' },
                    { name: 'Caminata rápida', duration: 5, instructions: 'Aumenta ligeramente el ritmo' },
                    { name: 'Estiramiento', duration: 5, instructions: 'Estiramientos suaves para todo el cuerpo' }
                ]
            },
            cardio_intermediate: {
                type: 'cardio',
                level: 'intermediate',
                name: 'Cardio moderado',
                duration: 30,
                calories: 250,
                description: 'Entrenamiento cardiovascular de intensidad media',
                exercises: [
                    { name: 'Trote suave', duration: 5, instructions: 'Trota a ritmo cómodo' },
                    { name: 'Jumping jacks', duration: 3, instructions: 'Realiza 3 series de 20 repeticiones' },
                    { name: 'Escalador', duration: 3, instructions: '3 series de 30 segundos' },
                    { name: 'Step ups', duration: 3, instructions: 'Usa un escalón o banco estable' },
                    { name: 'Trote', duration: 5, instructions: 'Aumenta el ritmo' },
                    { name: 'Saltos de cuerda', duration: 3, instructions: 'Ritmo moderado' },
                    { name: 'Trote suave', duration: 5, instructions: 'Disminuye gradualmente el ritmo' },
                    { name: 'Enfriamiento', duration: 3, instructions: 'Marcha suave y estiramientos' }
                ]
            },
            
            // Entrenamientos de fuerza
            strength_beginner: {
                type: 'strength',
                level: 'beginner',
                name: 'Fuerza para principiantes',
                duration: 25,
                calories: 180,
                description: 'Entrenamiento básico de fuerza con peso corporal',
                exercises: [
                    { name: 'Sentadillas', reps: '3x10', instructions: 'Pies al ancho de hombros, baja como si te sentaras' },
                    { name: 'Flexiones modificadas', reps: '3x8', instructions: 'Apóyate en las rodillas si es necesario' },
                    { name: 'Puente de glúteos', reps: '3x12', instructions: 'Acostado, eleva la cadera' },
                    { name: 'Plancha', reps: '3x20s', instructions: 'Mantén la posición con el cuerpo alineado' },
                    { name: 'Superman', reps: '3x10', instructions: 'Acostado boca abajo, eleva brazos y piernas' }
                ]
            },
            
            // Más entrenamientos según niveles...
        };
    }

    // Inicializar
    async init() {
        try {
            // Cargar entrenamientos personalizados de la base de datos si existen
            const customWorkouts = await nutriScanDB.getCustomWorkouts();
            if (customWorkouts && customWorkouts.length > 0) {
                for (const workout of customWorkouts) {
                    this.workouts[workout.id] = workout;
                }
            }
            return this;
        } catch (error) {
            console.error('Error al inicializar recomendaciones de entrenamiento:', error);
            return this;
        }
    }

    // Generar recomendaciones de entrenamiento basadas en alimentos consumidos
    async getWorkoutRecommendationsForFood(foodInfo) {
        try {
            // Obtener preferencias y objetivos del usuario
            const fitnessGoals = userPreferences.getFitnessGoals();
            const primaryGoal = fitnessGoals.primaryGoal;
            const fitnessLevel = fitnessGoals.fitnessLevel || 'beginner';
            
            // Si no hay objetivos definidos, retornar recomendaciones generales
            if (!primaryGoal) {
                return this.getGeneralWorkoutRecommendations();
            }
            
            const recommendations = [];
            
            // Analizar el alimento y generar recomendaciones específicas
            switch (primaryGoal) {
                case 'weightLoss':
                    // Para pérdida de peso, entrenamientos que maximicen quema calórica
                    if (foodInfo.calories > 500) {
                        // Comida alta en calorías → cardio o HIIT
                        recommendations.push({
                            title: 'Compensa este alimento con cardio',
                            description: `Este alimento tiene ${foodInfo.calories} calorías. Un entrenamiento cardiovascular te ayudará a mantener tu déficit calórico.`,
                            workoutType: foodInfo.calories > 800 ? 'hiit' : 'cardio',
                            duration: Math.min(45, Math.max(20, Math.round(foodInfo.calories / 15))), // Entre 20-45 min según calorías
                            icon: 'fa-running'
                        });
                    } 
                    
                    if (foodInfo.carbs && foodInfo.carbs > 50) {
                        // Alimento alto en carbohidratos → HIIT para aprovechar la energía
                        recommendations.push({
                            title: 'Aprovecha la energía de los carbohidratos',
                            description: 'Este alimento te proporciona energía rápida. Aprovéchala con un entrenamiento de alta intensidad.',
                            workoutType: 'hiit',
                            duration: 25,
                            icon: 'fa-fire-alt'
                        });
                    }
                    
                    if (foodInfo.protein && foodInfo.protein > 20) {
                        // Alimento alto en proteínas → entrenamiento de fuerza para preservar músculo
                        recommendations.push({
                            title: 'Entrenamiento de fuerza recomendado',
                            description: 'Aprovecha la proteína de este alimento para mantener tu masa muscular con un entrenamiento de fuerza.',
                            workoutType: 'strength',
                            duration: 30,
                            icon: 'fa-dumbbell'
                        });
                    }
                    break;
                    
                case 'muscleGain':
                    if (foodInfo.protein && foodInfo.protein > 15) {
                        // Alimento con proteína → entrenamiento de fuerza
                        recommendations.push({
                            title: 'Momento ideal para entrenamiento de fuerza',
                            description: 'Este alimento rico en proteínas es ideal para complementar con un entrenamiento de fuerza para maximizar la ganancia muscular.',
                            workoutType: 'strength',
                            duration: 40,
                            icon: 'fa-dumbbell'
                        });
                    }
                    
                    if (foodInfo.carbs && foodInfo.carbs > 40) {
                        // Alimento alto en carbohidratos → energía para entrenamiento intenso
                        recommendations.push({
                            title: 'Energía para un entrenamiento intenso',
                            description: 'Aprovecha los carbohidratos consumidos para un entrenamiento de alta intensidad.',
                            workoutType: 'strength',
                            duration: 45,
                            icon: 'fa-dumbbell'
                        });
                    }
                    
                    if (foodInfo.calories < 300 && foodInfo.protein < 15) {
                        // Comida ligera y baja en proteínas → recuperación
                        recommendations.push({
                            title: 'Sesión de recuperación activa',
                            description: 'Este alimento ligero es ideal para acompañar con una sesión de recuperación o movilidad.',
                            workoutType: 'recovery',
                            duration: 25,
                            icon: 'fa-heart'
                        });
                    }
                    break;
                    
                case 'athleticPerformance':
                    if (foodInfo.carbs && foodInfo.carbs > 40 && foodInfo.protein && foodInfo.protein > 15) {
                        // Equilibrio de carbos y proteínas → entrenamiento completo
                        recommendations.push({
                            title: 'Entrenamiento de rendimiento completo',
                            description: 'Este alimento ofrece un buen equilibrio de nutrientes para un entrenamiento de alto rendimiento.',
                            workoutType: foodInfo.carbs > foodInfo.protein * 2 ? 'cardio' : 'strength',
                            duration: 50,
                            icon: foodInfo.carbs > foodInfo.protein * 2 ? 'fa-running' : 'fa-dumbbell'
                        });
                    }
                    
                    if (foodInfo.mealTime === 'pre-workout') {
                        recommendations.push({
                            title: 'Maximiza tu rendimiento',
                            description: 'Perfecto como comida pre-entrenamiento. Realiza un entrenamiento específico para tu deporte.',
                            workoutType: 'cardio',
                            duration: 45,
                            icon: 'fa-medal'
                        });
                    }
                    break;
                    
                case 'maintenance':
                case 'healthImprovement':
                    // Recomendaciones más equilibradas y variadas
                    const randomIndex = Math.floor(Math.random() * 3);
                    const workoutTypes = ['cardio', 'strength', 'flexibility'];
                    const selectedType = workoutTypes[randomIndex];
                    
                    recommendations.push({
                        title: 'Entrenamiento balanceado',
                        description: 'Mantén tu rutina con un entrenamiento equilibrado para una salud óptima.',
                        workoutType: selectedType,
                        duration: 30,
                        icon: selectedType === 'cardio' ? 'fa-running' : 
                               selectedType === 'strength' ? 'fa-dumbbell' : 'fa-child'
                    });
                    break;
            }
            
            // Si no hay recomendaciones específicas, añadir una general
            if (recommendations.length === 0) {
                return this.getGeneralWorkoutRecommendations();
            }
            
            // Añadir entrenamientos concretos a cada recomendación
            for (const rec of recommendations) {
                // Buscar entrenamientos del tipo y nivel adecuados
                const matchingWorkouts = Object.values(this.workouts).filter(workout => 
                    workout.type === rec.workoutType && workout.level === fitnessLevel
                );
                
                if (matchingWorkouts.length > 0) {
                    // Seleccionar uno aleatorio entre los que coinciden
                    const selectedWorkout = matchingWorkouts[Math.floor(Math.random() * matchingWorkouts.length)];
                    rec.workout = selectedWorkout;
                } else {
                    // Si no hay del nivel exacto, buscar alguno del tipo correcto
                    const anyLevelWorkouts = Object.values(this.workouts).filter(workout => 
                        workout.type === rec.workoutType
                    );
                    
                    if (anyLevelWorkouts.length > 0) {
                        rec.workout = anyLevelWorkouts[Math.floor(Math.random() * anyLevelWorkouts.length)];
                    }
                }
            }
            
            return recommendations;
            
        } catch (error) {
            console.error('Error al generar recomendaciones de entrenamiento:', error);
            return this.getGeneralWorkoutRecommendations();
        }
    }

    // Recomendaciones generales no basadas en alimentos específicos
    getGeneralWorkoutRecommendations() {
        try {
            const fitnessGoals = userPreferences.getFitnessGoals();
            const primaryGoal = fitnessGoals.primaryGoal || 'maintenance';
            const fitnessLevel = fitnessGoals.fitnessLevel || 'beginner';
            
            // Recomendaciones según el objetivo
            const goalRecommendations = {
                weightLoss: [
                    { type: 'cardio', probability: 0.4 },
                    { type: 'hiit', probability: 0.4 },
                    { type: 'strength', probability: 0.2 }
                ],
                muscleGain: [
                    { type: 'strength', probability: 0.7 },
                    { type: 'recovery', probability: 0.2 },
                    { type: 'cardio', probability: 0.1 }
                ],
                maintenance: [
                    { type: 'cardio', probability: 0.3 },
                    { type: 'strength', probability: 0.3 },
                    { type: 'flexibility', probability: 0.2 },
                    { type: 'hiit', probability: 0.2 }
                ],
                athleticPerformance: [
                    { type: 'cardio', probability: 0.3 },
                    { type: 'strength', probability: 0.3 },
                    { type: 'hiit', probability: 0.3 },
                    { type: 'recovery', probability: 0.1 }
                ],
                healthImprovement: [
                    { type: 'cardio', probability: 0.4 },
                    { type: 'strength', probability: 0.3 },
                    { type: 'flexibility', probability: 0.3 }
                ]
            };
            
            // Seleccionar tipo de entrenamiento según probabilidades
            const typeOptions = goalRecommendations[primaryGoal] || goalRecommendations.maintenance;
            const random = Math.random();
            let cumulativeProbability = 0;
            let selectedType = typeOptions[0].type;
            
            for (const option of typeOptions) {
                cumulativeProbability += option.probability;
                if (random <= cumulativeProbability) {
                    selectedType = option.type;
                    break;
                }
            }
            
            // Títulos y descripciones según el tipo
            const recommendations = [{
                title: `Entrenamiento de ${this.workoutTypes[selectedType].name} recomendado`,
                description: this.workoutTypes[selectedType].description,
                workoutType: selectedType,
                duration: selectedType === 'hiit' ? 25 : selectedType === 'recovery' ? 20 : 30,
                icon: `fas ${this.workoutTypes[selectedType].icon}`
            }];
            
            // Añadir entrenamientos concretos
            for (const rec of recommendations) {
                // Buscar entrenamientos del tipo y nivel adecuados
                const matchingWorkouts = Object.values(this.workouts).filter(workout => 
                    workout.type === rec.workoutType && workout.level === fitnessLevel
                );
                
                if (matchingWorkouts.length > 0) {
                    // Seleccionar uno aleatorio
                    const selectedWorkout = matchingWorkouts[Math.floor(Math.random() * matchingWorkouts.length)];
                    rec.workout = selectedWorkout;
                } else {
                    // Si no hay del nivel exacto, buscar alguno del tipo correcto
                    const anyLevelWorkouts = Object.values(this.workouts).filter(workout => 
                        workout.type === rec.workoutType
                    );
                    
                    if (anyLevelWorkouts.length > 0) {
                        rec.workout = anyLevelWorkouts[Math.floor(Math.random() * anyLevelWorkouts.length)];
                    }
                }
            }
            
            return recommendations;
            
        } catch (error) {
            console.error('Error al generar recomendaciones generales:', error);
            return [{
                title: 'Entrenamiento recomendado',
                description: 'Actividad física regular para mantener tu salud',
                workoutType: 'cardio',
                duration: 30,
                icon: 'fa-running'
            }];
        }
    }

    // Obtener un plan semanal basado en los objetivos del usuario
    generateWeeklyPlan() {
        try {
            const fitnessGoals = userPreferences.getFitnessGoals();
            const primaryGoal = fitnessGoals.primaryGoal || 'maintenance';
            const fitnessLevel = fitnessGoals.fitnessLevel || 'beginner';
            const frequency = fitnessGoals.workoutFrequency || 3;
            
            // Estructura de la semana para diferentes objetivos y frecuencias
            const weeklyTemplates = {
                weightLoss: {
                    3: ['cardio', 'hiit', 'strength'],
                    4: ['cardio', 'hiit', 'strength', 'cardio'],
                    5: ['cardio', 'hiit', 'strength', 'cardio', 'flexibility'],
                    6: ['cardio', 'hiit', 'strength', 'cardio', 'hiit', 'flexibility']
                },
                muscleGain: {
                    3: ['strength', 'strength', 'recovery'],
                    4: ['strength', 'strength', 'cardio', 'recovery'],
                    5: ['strength', 'strength', 'cardio', 'strength', 'recovery'],
                    6: ['strength', 'strength', 'cardio', 'strength', 'strength', 'recovery']
                },
                maintenance: {
                    3: ['cardio', 'strength', 'flexibility'],
                    4: ['cardio', 'strength', 'hiit', 'flexibility'],
                    5: ['cardio', 'strength', 'hiit', 'strength', 'flexibility'],
                    6: ['cardio', 'strength', 'hiit', 'cardio', 'strength', 'flexibility']
                },
                athleticPerformance: {
                    3: ['cardio', 'strength', 'sport-specific'],
                    4: ['cardio', 'strength', 'hiit', 'sport-specific'],
                    5: ['cardio', 'strength', 'hiit', 'sport-specific', 'recovery'],
                    6: ['cardio', 'strength', 'hiit', 'sport-specific', 'strength', 'recovery']
                },
                healthImprovement: {
                    3: ['cardio', 'strength-light', 'flexibility'],
                    4: ['walking', 'strength-light', 'cardio', 'flexibility'],
                    5: ['walking', 'strength-light', 'cardio', 'swimming', 'flexibility'],
                    6: ['walking', 'strength-light', 'cardio', 'walking', 'swimming', 'flexibility']
                }
            };
            
            // Obtener el template adecuado o usar uno por defecto
            const goalTemplates = weeklyTemplates[primaryGoal] || weeklyTemplates.maintenance;
            const frequencyKey = Math.min(6, Math.max(3, frequency)); // Asegurar que la frecuencia esté entre 3-6
            const weekTemplate = goalTemplates[frequencyKey] || goalTemplates[3];
            
            // Generar el plan semanal
            const weekPlan = [];
            const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
            
            // Decidir qué días incluir según frecuencia (distribuidos en la semana)
            const selectedDays = [];
            const step = Math.floor(7 / frequencyKey);
            let currentDay = 0;
            
            for (let i = 0; i < frequencyKey; i++) {
                selectedDays.push(currentDay);
                currentDay = (currentDay + step) % 7;
            }
            
            // Para cada día de la semana
            for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
                const dayInfo = {
                    day: daysOfWeek[dayIndex],
                    dayOfWeek: dayIndex,
                    hasWorkout: false,
                    workout: null
                };
                
                // Si este día debe incluir entrenamiento
                if (selectedDays.includes(dayIndex)) {
                    const workoutTypeIndex = selectedDays.indexOf(dayIndex);
                    const workoutType = weekTemplate[workoutTypeIndex];
                    
                    // Buscar entrenamientos del tipo y nivel adecuados
                    const matchingWorkouts = Object.values(this.workouts).filter(workout => 
                        workout.type === workoutType && workout.level === fitnessLevel
                    );
                    
                    if (matchingWorkouts.length > 0) {
                        dayInfo.hasWorkout = true;
                        // Seleccionar uno aleatorio
                        dayInfo.workout = matchingWorkouts[Math.floor(Math.random() * matchingWorkouts.length)];
                    } else {
                        // Si no hay del tipo específico, incluir indicación del tipo
                        dayInfo.hasWorkout = true;
                        dayInfo.workoutType = workoutType;
                        dayInfo.workoutName = this.workoutTypes[workoutType]?.name || 'Entrenamiento';
                    }
                }
                
                weekPlan.push(dayInfo);
            }
            
            return weekPlan;
            
        } catch (error) {
            console.error('Error al generar plan semanal:', error);
            return [];
        }
    }

    // Analizar compatibilidad de entrenamiento con alimentación reciente
    async analyzeWorkoutCompatibility(workoutType) {
        try {
            // Obtener registro de alimentos del día
            const today = new Date().toISOString().split('T')[0];
            const dailyLog = await nutriScanDB.getDailyLogForDate(today);
            
            if (!dailyLog || !dailyLog.meals || Object.keys(dailyLog.meals).length === 0) {
                return {
                    compatible: true,
                    message: 'No hay datos de alimentación registrados hoy.'
                };
            }
            
            // Analizar macronutrientes totales del día
            const totalNutrients = {
                calories: dailyLog.totalCalories || 0,
                protein: 0,
                carbs: 0,
                fat: 0
            };
            
            // Sumar nutrientes de todas las comidas
            for (const mealType in dailyLog.meals) {
                for (const food of dailyLog.meals[mealType]) {
                    totalNutrients.protein += food.protein || 0;
                    totalNutrients.carbs += food.carbs || 0;
                    totalNutrients.fat += food.fat || 0;
                }
            }
            
            // Última comida (ordenar por hora)
            let lastMeal = null;
            let lastMealTime = 0;
            
            for (const mealType in dailyLog.meals) {
                for (const food of dailyLog.meals[mealType]) {
                    if (food.timestamp && food.timestamp > lastMealTime) {
                        lastMealTime = food.timestamp;
                        lastMeal = food;
                    }
                }
            }
            
            // Tiempo desde la última comida en horas
            const hoursSinceLastMeal = lastMeal ? 
                (Date.now() - lastMealTime) / (1000 * 60 * 60) : 24;
            
            // Análisis según tipo de entrenamiento
            switch (workoutType) {
                case 'cardio':
                    if (hoursSinceLastMeal < 1) {
                        return {
                            compatible: false,
                            message: 'Es recomendable esperar al menos 1 hora después de comer para hacer cardio.'
                        };
                    }
                    if (totalNutrients.carbs < 50) {
                        return {
                            compatible: true,
                            message: 'Tus niveles de carbohidratos son bajos. El cardio podría sentirse más intenso. Considera una pequeña porción de carbos si el entrenamiento será largo.',
                            tips: ['Hidrátate bien antes, durante y después', 'Mantén la intensidad moderada']
                        };
                    }
                    return {
                        compatible: true,
                        message: 'Tus niveles de nutrición son adecuados para cardio.',
                        tips: ['Hidrátate bien', 'Ajusta la intensidad según te sientas']
                    };
                    
                case 'hiit':
                    if (hoursSinceLastMeal < 1.5) {
                        return {
                            compatible: false,
                            message: 'HIIT con el estómago lleno puede causar molestias. Espera al menos 1.5-2 horas después de comer.'
                        };
                    }
                    if (totalNutrients.carbs < 60) {
                        return {
                            compatible: true,
                            message: 'Niveles de carbohidratos algo bajos para HIIT de alta intensidad.',
                            tips: ['Considera un pequeño snack con carbos rápidos', 'Ajusta la intensidad si sientes fatiga']
                        };
                    }
                    return {
                        compatible: true,
                        message: 'Tu alimentación es compatible con un entrenamiento HIIT.',
                        tips: ['Hidrátate bien', 'No te exijas demasiado si te sientes fatigado']
                    };
                    
                case 'strength':
                    if (hoursSinceLastMeal < 1) {
                        return {
                            compatible: true,
                            message: 'Entrenar con el estómago lleno puede ser incómodo. Considera un entrenamiento menos intenso.',
                            tips: ['Evita ejercicios que compriman el abdomen', 'Reduce la intensidad']
                        };
                    }
                    if (totalNutrients.protein < 60) {
                        return {
                            compatible: true,
                            message: 'Nivel de proteínas algo bajo para entrenamiento de fuerza óptimo.',
                            tips: ['Considera tomar proteínas después del entrenamiento', 'Enfócate en técnica más que en peso']
                        };
                    }
                    return {
                        compatible: true,
                        message: 'Tu alimentación es adecuada para entrenamiento de fuerza.',
                        tips: ['Hidrátate bien', 'Asegúrate de consumir proteínas después del entrenamiento']
                    };
                    
                default:
                    return {
                        compatible: true,
                        message: 'No hay recomendaciones específicas para este tipo de entrenamiento.',
                        tips: ['Mantente hidratado', 'Escucha a tu cuerpo y ajusta la intensidad']
                    };
            }
            
        } catch (error) {
            console.error('Error al analizar compatibilidad de entrenamiento:', error);
            return {
                compatible: true,
                message: 'No se pudo analizar la compatibilidad. Procede con precaución.'
            };
        }
    }
}

// Exportar una instancia única para toda la aplicación
const workoutRecommendations = new WorkoutRecommendations();
export default workoutRecommendations; 