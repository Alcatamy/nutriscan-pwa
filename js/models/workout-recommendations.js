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

    // Generar recomendaciones generales de entrenamiento
    getGeneralWorkoutRecommendations() {
        try {
            const fitnessGoals = userPreferences.getFitnessGoals();
            const primaryGoal = fitnessGoals.primaryGoal;
            const fitnessLevel = fitnessGoals.fitnessLevel || 'beginner';
            
            // Si no hay objetivo definido, dar recomendaciones básicas
            if (!primaryGoal) {
                return [
                    {
                        title: 'Entrenamiento básico para principiantes',
                        description: 'Una sesión suave de cardio combinado con ejercicios de fuerza.',
                        workoutType: 'mixed',
                        duration: 30,
                        icon: 'fas fa-heartbeat',
                        workout: this.workouts.cardio_beginner
                    },
                    {
                        title: 'Ejercicios de movilidad',
                        description: 'Mejora tu flexibilidad y rango de movimiento.',
                        workoutType: 'flexibility',
                        duration: 20,
                        icon: 'fas fa-child'
                    }
                ];
            }
            
            // Recomendaciones basadas en el objetivo primario
            const recommendations = [];
            
            switch (primaryGoal) {
                case 'weightLoss':
                    recommendations.push({
                        title: 'Quema de calorías',
                        description: 'Entrenamiento cardiovascular para maximizar la quema de calorías.',
                        workoutType: 'cardio',
                        duration: 30,
                        icon: 'fas fa-fire-alt',
                        workout: fitnessLevel === 'beginner' ? this.workouts.cardio_beginner : this.workouts.cardio_intermediate
                    });
                    recommendations.push({
                        title: 'HIIT para pérdida de peso',
                        description: 'Entrenamiento de intervalos de alta intensidad para continuar quemando calorías durante horas.',
                        workoutType: 'hiit',
                        duration: 25,
                        icon: 'fas fa-bolt'
                    });
                    recommendations.push({
                        title: 'Entrenamiento de fuerza',
                        description: 'Mantén tu masa muscular mientras pierdes grasa.',
                        workoutType: 'strength',
                        duration: 35,
                        icon: 'fas fa-dumbbell',
                        workout: this.workouts.strength_beginner
                    });
                    break;
                    
                case 'muscleGain':
                    recommendations.push({
                        title: 'Entrenamiento de hipertrofia',
                        description: 'Enfocado en el crecimiento muscular con series de 8-12 repeticiones.',
                        workoutType: 'strength',
                        duration: 45,
                        icon: 'fas fa-dumbbell'
                    });
                    recommendations.push({
                        title: 'Entrenamiento de fuerza compuesto',
                        description: 'Ejercicios que trabajan múltiples grupos musculares para máximo crecimiento.',
                        workoutType: 'strength',
                        duration: 40,
                        icon: 'fas fa-dumbbell'
                    });
                    recommendations.push({
                        title: 'Recuperación activa',
                        description: 'Sesión suave para mejorar la recuperación entre entrenamientos intensos.',
                        workoutType: 'recovery',
                        duration: 30,
                        icon: 'fas fa-heart'
                    });
                    break;
                    
                case 'maintenance':
                    recommendations.push({
                        title: 'Entrenamiento mixto',
                        description: 'Combinación de cardio y fuerza para mantener tu condición física actual.',
                        workoutType: 'mixed',
                        duration: 40,
                        icon: 'fas fa-balance-scale-right'
                    });
                    recommendations.push({
                        title: 'Cardio moderado',
                        description: 'Mantén tu salud cardiovascular con esta sesión de intensidad media.',
                        workoutType: 'cardio',
                        duration: 30,
                        icon: 'fas fa-running'
                    });
                    recommendations.push({
                        title: 'Yoga para flexibilidad',
                        description: 'Mejora tu flexibilidad y reduce el estrés.',
                        workoutType: 'flexibility',
                        duration: 35,
                        icon: 'fas fa-child'
                    });
                    break;
                    
                case 'athleticPerformance':
                    recommendations.push({
                        title: 'Entrenamiento de velocidad',
                        description: 'Mejora tu velocidad y agilidad con estos ejercicios.',
                        workoutType: 'cardio',
                        duration: 35,
                        icon: 'fas fa-tachometer-alt'
                    });
                    recommendations.push({
                        title: 'Fuerza explosiva',
                        description: 'Desarrolla potencia y explosividad para mejorar tu rendimiento atlético.',
                        workoutType: 'strength',
                        duration: 45,
                        icon: 'fas fa-bolt'
                    });
                    recommendations.push({
                        title: 'Entrenamiento de agilidad',
                        description: 'Mejora tus reflejos y coordinación con estos ejercicios.',
                        workoutType: 'agility',
                        duration: 30,
                        icon: 'fas fa-running'
                    });
                    break;
                    
                case 'healthImprovement':
                    recommendations.push({
                        title: 'Caminata activa',
                        description: 'Mejora tu salud cardiovascular con esta caminata de ritmo moderado.',
                        workoutType: 'cardio',
                        duration: 30,
                        icon: 'fas fa-walking'
                    });
                    recommendations.push({
                        title: 'Entrenamiento de fuerza suave',
                        description: 'Fortalece tus músculos con ejercicios de baja intensidad.',
                        workoutType: 'strength',
                        duration: 25,
                        icon: 'fas fa-dumbbell'
                    });
                    recommendations.push({
                        title: 'Yoga para principiantes',
                        description: 'Mejora tu flexibilidad y equilibrio con esta sesión de yoga suave.',
                        workoutType: 'flexibility',
                        duration: 30,
                        icon: 'fas fa-child'
                    });
                    break;
            }
            
            return recommendations;
        } catch (error) {
            console.error('Error al generar recomendaciones generales:', error);
            return [
                {
                    title: 'Entrenamiento general',
                    description: 'Una sesión mixta de cardio y fuerza.',
                    workoutType: 'mixed',
                    duration: 30,
                    icon: 'fas fa-dumbbell'
                }
            ];
        }
    }
    
    // Generar plan semanal de entrenamientos
    generateWeeklyPlan() {
        try {
            const fitnessGoals = userPreferences.getFitnessGoals();
            const workoutFrequency = fitnessGoals.workoutFrequency || 3;
            const primaryGoal = fitnessGoals.primaryGoal || 'maintenance';
            
            // Configurar los días de la semana
            const days = [
                { day: 'Lunes', hasWorkout: false },
                { day: 'Martes', hasWorkout: false },
                { day: 'Miércoles', hasWorkout: false },
                { day: 'Jueves', hasWorkout: false },
                { day: 'Viernes', hasWorkout: false },
                { day: 'Sábado', hasWorkout: false },
                { day: 'Domingo', hasWorkout: false }
            ];
            
            // Función para mezclar array aleatoriamente
            const shuffleArray = arr => arr.sort(() => Math.random() - 0.5);
            
            // Distribución de entrenamientos según el objetivo
            let workoutTypes = [];
            
            switch (primaryGoal) {
                case 'weightLoss':
                    workoutTypes = [
                        { type: 'cardio', name: 'Cardio' },
                        { type: 'hiit', name: 'HIIT' },
                        { type: 'strength', name: 'Fuerza' },
                        { type: 'cardio', name: 'Cardio' },
                        { type: 'hiit', name: 'HIIT' },
                        { type: 'flexibility', name: 'Recuperación' },
                        { type: 'active_rest', name: 'Descanso activo' }
                    ];
                    break;
                    
                case 'muscleGain':
                    workoutTypes = [
                        { type: 'strength', name: 'Fuerza - Tren superior' },
                        { type: 'strength', name: 'Fuerza - Tren inferior' },
                        { type: 'strength', name: 'Fuerza - Empuje' },
                        { type: 'strength', name: 'Fuerza - Tirón' },
                        { type: 'cardio', name: 'Cardio moderado' },
                        { type: 'flexibility', name: 'Recuperación' },
                        { type: 'active_rest', name: 'Descanso activo' }
                    ];
                    break;
                    
                case 'maintenance':
                    workoutTypes = [
                        { type: 'cardio', name: 'Cardio' },
                        { type: 'strength', name: 'Fuerza' },
                        { type: 'mixed', name: 'Mixto' },
                        { type: 'hiit', name: 'HIIT' },
                        { type: 'flexibility', name: 'Flexibilidad' },
                        { type: 'active_rest', name: 'Actividad ligera' },
                        { type: 'active_rest', name: 'Descanso activo' }
                    ];
                    break;
                    
                case 'athleticPerformance':
                    workoutTypes = [
                        { type: 'cardio', name: 'Velocidad' },
                        { type: 'strength', name: 'Fuerza explosiva' },
                        { type: 'agility', name: 'Agilidad' },
                        { type: 'cardio', name: 'Resistencia' },
                        { type: 'strength', name: 'Fuerza' },
                        { type: 'flexibility', name: 'Movilidad' },
                        { type: 'active_rest', name: 'Recuperación' }
                    ];
                    break;
                    
                case 'healthImprovement':
                    workoutTypes = [
                        { type: 'cardio', name: 'Caminata' },
                        { type: 'strength', name: 'Fuerza suave' },
                        { type: 'flexibility', name: 'Yoga' },
                        { type: 'cardio', name: 'Cardio ligero' },
                        { type: 'flexibility', name: 'Estiramientos' },
                        { type: 'active_rest', name: 'Actividad ligera' },
                        { type: 'active_rest', name: 'Descanso' }
                    ];
                    break;
                    
                default:
                    workoutTypes = [
                        { type: 'cardio', name: 'Cardio' },
                        { type: 'strength', name: 'Fuerza' },
                        { type: 'flexibility', name: 'Flexibilidad' },
                        { type: 'mixed', name: 'Mixto' },
                        { type: 'active_rest', name: 'Actividad ligera' },
                        { type: 'active_rest', name: 'Descanso' },
                        { type: 'active_rest', name: 'Descanso' }
                    ];
            }
            
            // Mezclar los tipos de entrenamiento
            const shuffledWorkouts = shuffleArray([...workoutTypes]);
            
            // Distribuir entrenamientos según frecuencia deseada
            // Primero ordenamos por prioridad para cada objetivo
            const workoutDayIndices = [];
            
            // Para entrenamientos con frecuencia de 3-4, incluir lunes, miércoles, viernes
            if (workoutFrequency <= 4) {
                workoutDayIndices.push(0, 2, 4); // Lunes, Miércoles, Viernes
                if (workoutFrequency === 4) {
                    workoutDayIndices.push(6); // Domingo si son 4 días
                }
            } else {
                // Para 5+ días, descansar al menos un día en fin de semana
                workoutDayIndices.push(0, 1, 2, 3, 4); // Lunes a Viernes
                if (workoutFrequency === 6) {
                    workoutDayIndices.push(5); // Sábado si son 6 días
                }
            }
            
            // Asignar entrenamientos a los días
            workoutDayIndices.slice(0, workoutFrequency).forEach((dayIndex, i) => {
                days[dayIndex].hasWorkout = true;
                days[dayIndex].workoutName = shuffledWorkouts[i % shuffledWorkouts.length].name;
                days[dayIndex].workoutType = shuffledWorkouts[i % shuffledWorkouts.length].type;
            });
            
            return days;
        } catch (error) {
            console.error('Error al generar plan semanal:', error);
            // Plan por defecto en caso de error
            return [
                { day: 'Lunes', hasWorkout: true, workoutName: 'Cardio' },
                { day: 'Martes', hasWorkout: false },
                { day: 'Miércoles', hasWorkout: true, workoutName: 'Fuerza' },
                { day: 'Jueves', hasWorkout: false },
                { day: 'Viernes', hasWorkout: true, workoutName: 'Mixto' },
                { day: 'Sábado', hasWorkout: false },
                { day: 'Domingo', hasWorkout: false }
            ];
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