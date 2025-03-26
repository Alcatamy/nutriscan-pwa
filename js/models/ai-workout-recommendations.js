// Módulo para generar recomendaciones de entrenamiento personalizadas usando IA
import userPreferences from './user-preferences.js';
import calorieTracker from './calorie-tracker.js';
import nutriScanDB from './database.js';

class AIWorkoutRecommendations {
    constructor() {
        this.userPrefs = userPreferences;
        this.calorieTracker = calorieTracker;
        this.db = nutriScanDB;
        
        // OpenAI API key (debe configurarse de forma segura)
        this.apiKey = null;
        
        // Endpoint de OpenAI
        this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
        
        // Template para la solicitud a la IA
        this.promptTemplate = `
        Actúa como un entrenador personal y nutricionista experto. 
        Genera una rutina de entrenamiento personalizada basada en los siguientes datos del usuario:
        
        PERFIL:
        - Edad: {age} años
        - Sexo: {gender}
        - Peso: {weight} kg
        - Altura: {height} cm
        - Nivel de actividad: {activityLevel}
        - Nivel de fitness: {fitnessLevel}
        
        OBJETIVOS:
        - Objetivo principal: {primaryGoal}
        - Peso objetivo: {targetWeight} kg
        - Frecuencia de entrenamiento: {workoutFrequency} días/semana
        
        NUTRICIÓN:
        - Calorías consumidas hoy: {caloriesConsumed} kcal
        - Objetivo calórico diario: {calorieGoal} kcal
        - Proteínas consumidas: {proteinConsumed} g
        - Carbohidratos consumidos: {carbsConsumed} g
        - Grasas consumidas: {fatConsumed} g
        
        ÚLTIMOS ALIMENTOS CONSUMIDOS:
        {recentFoods}
        
        PREFERENCIAS:
        - Ejercicios preferidos: {preferredWorkouts}
        - Limitaciones físicas: {limitations}
        
        Genera una rutina de entrenamiento específica para hoy que considere:
        1. El objetivo principal del usuario
        2. Su nivel de fitness actual
        3. Los alimentos consumidos recientemente y su balance nutricional
        4. Las calorías disponibles para el día (si están en déficit o superávit)
        
        La rutina debe incluir:
        - Nombre de la rutina
        - Duración aproximada
        - Calorías a quemar
        - Calentamiento específico
        - 4-6 ejercicios principales con series, repeticiones y descanso
        - Enfriamiento y estiramientos
        - Justificación de por qué esta rutina es adecuada para este perfil en particular
        - Consejos adicionales considerando la nutrición del día
        
        Formato de respuesta en JSON: 
        {
          "workoutName": "Nombre de la rutina",
          "duration": minutos,
          "caloriesBurned": número estimado,
          "type": "cardio/strength/hiit/flexibility/híbrido",
          "warmup": [
            {"name": "Ejercicio", "duration": "tiempo", "instructions": "instrucciones"}
          ],
          "mainExercises": [
            {"name": "Ejercicio", "sets": número, "reps": "cantidad o tiempo", "rest": "tiempo", "instructions": "instrucciones"}
          ],
          "cooldown": [
            {"name": "Ejercicio", "duration": "tiempo", "instructions": "instrucciones"}
          ],
          "justification": "Explicación personalizada",
          "nutritionTips": "Consejos relacionados con la nutrición del día"
        }
        `;
    }
    
    // Inicializar el módulo y cargar configuraciones
    async init() {
        try {
            // Intentar cargar la API key de la configuración
            const config = await this.db.getConfiguration('aiConfig');
            if (config && config.apiKey) {
                this.apiKey = config.apiKey;
            }
            
            return this;
        } catch (error) {
            console.error('Error al inicializar el módulo de recomendaciones IA:', error);
            return this;
        }
    }
    
    // Verificar si la IA está configurada
    isConfigured() {
        return !!this.apiKey;
    }
    
    // Configurar la API key
    async setApiKey(apiKey) {
        try {
            this.apiKey = apiKey;
            // Guardar en la base de datos local
            await this.db.saveConfiguration('aiConfig', { apiKey });
            return true;
        } catch (error) {
            console.error('Error al guardar configuración de IA:', error);
            return false;
        }
    }
    
    // Generar recomendación personalizada usando IA
    async generatePersonalizedWorkout(options = {}) {
        try {
            // Verificar si la IA está configurada
            if (!this.isConfigured()) {
                return {
                    error: true,
                    message: 'La IA no está configurada. Por favor configure una API key válida.'
                };
            }
            
            // Recopilar datos del perfil
            const profile = this.userPrefs.getProfile();
            const fitnessGoals = this.userPrefs.getFitnessGoals();
            const nutritionGoals = this.userPrefs.getNutritionGoals();
            
            // Verificar si hay datos suficientes
            if (!profile.weight || !profile.height || !fitnessGoals.primaryGoal) {
                return {
                    error: true,
                    message: 'Datos de perfil insuficientes. Por favor complete su perfil y objetivos fitness.'
                };
            }
            
            // Obtener datos de consumo de alimentos del día
            const today = new Date().toISOString().split('T')[0];
            const dailyLog = await this.calorieTracker.getDailyLog(today);
            
            // Calcular totales de macronutrientes
            let caloriesConsumed = 0;
            let proteinConsumed = 0;
            let carbsConsumed = 0;
            let fatConsumed = 0;
            let recentFoodsText = '';
            
            if (dailyLog && dailyLog.meals) {
                for (const meal of Object.values(dailyLog.meals)) {
                    if (meal.foods) {
                        for (const food of meal.foods) {
                            caloriesConsumed += food.calories || 0;
                            proteinConsumed += food.protein || 0;
                            carbsConsumed += food.carbs || 0;
                            fatConsumed += food.fat || 0;
                        }
                    }
                }
                
                // Generar texto de alimentos recientes
                // Tomar los últimos 3 alimentos consumidos
                const allFoods = [];
                for (const meal of Object.values(dailyLog.meals)) {
                    if (meal.foods) {
                        allFoods.push(...meal.foods.map(food => ({
                            ...food,
                            mealType: meal.type
                        })));
                    }
                }
                
                // Ordenar por hora de consumo (más recientes primero)
                allFoods.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
                
                // Tomar los 3 más recientes
                const recentFoods = allFoods.slice(0, 3);
                if (recentFoods.length > 0) {
                    recentFoodsText = recentFoods.map(food => 
                        `- ${food.name} (${food.mealType}): ${food.calories || 0} kcal, Proteínas: ${food.protein || 0}g, Carbohidratos: ${food.carbs || 0}g, Grasas: ${food.fat || 0}g`
                    ).join('\n');
                } else {
                    recentFoodsText = '- No hay alimentos registrados recientemente';
                }
            } else {
                recentFoodsText = '- No hay alimentos registrados hoy';
            }
            
            // Obtener limitaciones físicas y preferencias (si existen)
            const userLimitations = options.limitations || this.userPrefs.preferences?.limitations || 'Ninguna limitación conocida';
            
            // Preparar datos para el prompt
            const promptData = {
                age: profile.age || 30,
                gender: profile.gender || 'no especificado',
                weight: profile.weight || 70,
                height: profile.height || 170,
                activityLevel: profile.activityLevel || 'moderate',
                fitnessLevel: fitnessGoals.fitnessLevel || 'beginner',
                primaryGoal: fitnessGoals.primaryGoal || 'maintenance',
                targetWeight: fitnessGoals.targetWeight || profile.weight || 70,
                workoutFrequency: fitnessGoals.workoutFrequency || 3,
                caloriesConsumed,
                calorieGoal: nutritionGoals.calorieGoal || 2000,
                proteinConsumed,
                carbsConsumed,
                fatConsumed,
                recentFoods: recentFoodsText,
                preferredWorkouts: fitnessGoals.preferredWorkouts?.join(', ') || 'No especificado',
                limitations: userLimitations
            };
            
            // Generar el prompt final reemplazando las variables
            let finalPrompt = this.promptTemplate;
            for (const [key, value] of Object.entries(promptData)) {
                finalPrompt = finalPrompt.replace(new RegExp(`{${key}}`, 'g'), value);
            }
            
            // Realizar la solicitud a la API de OpenAI
            const response = await this.callOpenAI(finalPrompt);
            
            // Procesar la respuesta
            if (!response || response.error) {
                return {
                    error: true,
                    message: response?.message || 'Error al generar recomendación de entrenamiento'
                };
            }
            
            return {
                ...response,
                error: false
            };
            
        } catch (error) {
            console.error('Error al generar entrenamiento personalizado:', error);
            return {
                error: true,
                message: 'Error al generar entrenamiento personalizado: ' + error.message
            };
        }
    }
    
    // Método para llamar a la API de OpenAI
    async callOpenAI(prompt) {
        try {
            // Simular respuesta mientras no se utilice la API real
            if (!this.simulateResponse) {
                // Configuración para la solicitud a la API
                const requestBody = {
                    model: "gpt-3.5-turbo",
                    messages: [
                        {
                            role: "system",
                            content: "Eres un entrenador personal y nutricionista experto que genera recomendaciones de ejercicio personalizadas."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 1500
                };
                
                // Realizar la solicitud
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify(requestBody)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`Error de API: ${errorData.error?.message || response.statusText}`);
                }
                
                const data = await response.json();
                
                // Extraer y parsear la respuesta
                const content = data.choices[0]?.message?.content;
                if (!content) {
                    throw new Error('Respuesta de API no válida');
                }
                
                // Intentar extraer el JSON de la respuesta
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('No se pudo extraer JSON de la respuesta');
                }
            }
            
            // Simular respuesta para pruebas (modo de desarrollo)
            return this.simulateResponse(prompt);
        } catch (error) {
            console.error('Error al llamar a OpenAI:', error);
            return {
                error: true,
                message: error.message
            };
        }
    }
    
    // Método para simular respuesta de OpenAI (para desarrollo/pruebas)
    simulateResponse(prompt) {
        // Extraer objetivo principal y nivel de fitness del prompt
        const primaryGoalMatch = prompt.match(/Objetivo principal: ([\w]+)/);
        const fitnessLevelMatch = prompt.match(/Nivel de fitness: ([\w]+)/);
        
        const primaryGoal = primaryGoalMatch ? primaryGoalMatch[1] : 'maintenance';
        const fitnessLevel = fitnessLevelMatch ? fitnessLevelMatch[1] : 'beginner';
        
        // Generar respuesta simulada basada en el objetivo y nivel
        let workoutType, workoutName, caloriesBurned;
        
        switch (primaryGoal) {
            case 'weightLoss':
                workoutType = 'cardio';
                workoutName = fitnessLevel === 'beginner' ? 
                    'Quema calórica para principiantes' : 
                    'Rutina intensiva de pérdida de peso';
                caloriesBurned = fitnessLevel === 'beginner' ? 250 : 400;
                break;
            case 'muscleGain':
                workoutType = 'strength';
                workoutName = fitnessLevel === 'beginner' ? 
                    'Iniciación a la fuerza muscular' : 
                    'Hipertrofia optimizada';
                caloriesBurned = fitnessLevel === 'beginner' ? 200 : 350;
                break;
            case 'athleticPerformance':
                workoutType = 'hiit';
                workoutName = 'Entrenamiento de rendimiento atlético';
                caloriesBurned = 450;
                break;
            default:
                workoutType = 'flexibility';
                workoutName = 'Rutina de bienestar general';
                caloriesBurned = 200;
        }
        
        // Generar contenido simulado según el tipo de entrenamiento
        const exercises = this.getExercisesByType(workoutType, fitnessLevel);
        
        return {
            workoutName,
            duration: fitnessLevel === 'beginner' ? 30 : 45,
            caloriesBurned,
            type: workoutType,
            warmup: [
                {name: "Movilidad articular", duration: "3 minutos", instructions: "Movimientos circulares de todas las articulaciones"},
                {name: "Activación cardiovascular", duration: "3 minutos", instructions: "Marcha suave aumentando gradualmente la intensidad"}
            ],
            mainExercises: exercises,
            cooldown: [
                {name: "Estiramiento general", duration: "5 minutos", instructions: "Estiramientos suaves manteniendo 20 segundos cada posición"}
            ],
            justification: `Esta rutina está diseñada específicamente para tu objetivo de ${primaryGoal} y nivel ${fitnessLevel}, considerando tu perfil físico y nutricional actual.`,
            nutritionTips: "Asegúrate de mantenerte hidratado y considera consumir una pequeña cantidad de proteína después del entrenamiento para ayudar en la recuperación muscular."
        };
    }
    
    // Método auxiliar para obtener ejercicios según tipo y nivel
    getExercisesByType(type, level) {
        const exercises = {
            cardio: {
                beginner: [
                    {name: "Caminata rápida", sets: 1, reps: "10 minutos", rest: "1 minuto", instructions: "Camina a paso ligero manteniendo buena postura"},
                    {name: "Marcha elevando rodillas", sets: 3, reps: "30 segundos", rest: "30 segundos", instructions: "Eleva las rodillas alternadamente a la altura de la cadera"},
                    {name: "Jumping jacks modificados", sets: 3, reps: "15 repeticiones", rest: "30 segundos", instructions: "Realiza el movimiento sin saltar si es necesario"},
                    {name: "Step-ups básicos", sets: 3, reps: "12 por pierna", rest: "1 minuto", instructions: "Usa un escalón bajo o banco estable"}
                ],
                intermediate: [
                    {name: "Carrera interválica", sets: 5, reps: "1 minuto rápido + 1 minuto lento", rest: "30 segundos", instructions: "Alterna entre carrera rápida y trote suave"},
                    {name: "Burpees modificados", sets: 3, reps: "10 repeticiones", rest: "45 segundos", instructions: "Sin salto si es demasiado intenso"},
                    {name: "Mountain climbers", sets: 3, reps: "45 segundos", rest: "30 segundos", instructions: "Mantén la cadera estable y alterna las rodillas hacia el pecho"},
                    {name: "Saltos de cuerda", sets: 3, reps: "1 minuto", rest: "45 segundos", instructions: "Salta a un ritmo constante"}
                ]
            },
            strength: {
                beginner: [
                    {name: "Sentadillas con peso corporal", sets: 3, reps: "12 repeticiones", rest: "45 segundos", instructions: "Mantén el peso en los talones y la espalda recta"},
                    {name: "Flexiones modificadas", sets: 3, reps: "8 repeticiones", rest: "45 segundos", instructions: "Puedes apoyar las rodillas si es necesario"},
                    {name: "Plancha", sets: 3, reps: "20 segundos", rest: "40 segundos", instructions: "Mantén el cuerpo alineado sin hundir la cadera"},
                    {name: "Bird dog", sets: 3, reps: "8 por lado", rest: "30 segundos", instructions: "Extiende simultáneamente brazo y pierna opuestos"}
                ],
                intermediate: [
                    {name: "Sentadillas goblet", sets: 4, reps: "12 repeticiones", rest: "60 segundos", instructions: "Usa una mancuerna o peso sostenido frente al pecho"},
                    {name: "Flexiones completas", sets: 3, reps: "12 repeticiones", rest: "60 segundos", instructions: "Mantén el cuerpo en línea recta durante todo el movimiento"},
                    {name: "Peso muerto rumano", sets: 3, reps: "10 repeticiones", rest: "60 segundos", instructions: "Mantén la espalda recta y desciende la cadera hacia atrás"},
                    {name: "Remo con mancuerna", sets: 3, reps: "12 por brazo", rest: "45 segundos", instructions: "Apoya una rodilla y mano en banco, mantén espalda paralela al suelo"}
                ]
            },
            hiit: {
                beginner: [
                    {name: "Jumping jacks", sets: 1, reps: "30 segundos trabajo + 30 segundos descanso", rest: "Incluido", instructions: "Haz el movimiento a tu ritmo"},
                    {name: "Sentadillas", sets: 1, reps: "30 segundos trabajo + 30 segundos descanso", rest: "Incluido", instructions: "Mantén buena forma durante todo el ejercicio"},
                    {name: "Marcha elevando rodillas", sets: 1, reps: "30 segundos trabajo + 30 segundos descanso", rest: "Incluido", instructions: "Mantén ritmo constante"},
                    {name: "Plancha", sets: 1, reps: "20 segundos trabajo + 40 segundos descanso", rest: "Incluido", instructions: "Mantén la posición correcta todo el tiempo"}
                ],
                intermediate: [
                    {name: "Burpees", sets: 1, reps: "40 segundos trabajo + 20 segundos descanso", rest: "Incluido", instructions: "Realiza el movimiento completo a buen ritmo"},
                    {name: "Mountain climbers", sets: 1, reps: "40 segundos trabajo + 20 segundos descanso", rest: "Incluido", instructions: "Mantén ritmo alto y constante"},
                    {name: "Sentadillas con salto", sets: 1, reps: "30 segundos trabajo + 30 segundos descanso", rest: "Incluido", instructions: "Aterriza suavemente flexionando rodillas"},
                    {name: "Plancha lateral con rotación", sets: 1, reps: "40 segundos trabajo + 20 segundos descanso", rest: "Incluido", instructions: "Alterna ambos lados"}
                ]
            },
            flexibility: {
                beginner: [
                    {name: "Estiramiento de isquiotibiales", sets: 2, reps: "30 segundos por pierna", rest: "15 segundos", instructions: "Estira sin rebotes, mantén la posición"},
                    {name: "Estiramiento de cuádriceps", sets: 2, reps: "30 segundos por pierna", rest: "15 segundos", instructions: "Mantén el equilibrio apoyándote si es necesario"},
                    {name: "Rotación de tronco", sets: 2, reps: "8 por lado", rest: "15 segundos", instructions: "Gira suavemente sin forzar el movimiento"},
                    {name: "Child's pose (postura del niño)", sets: 2, reps: "45 segundos", rest: "15 segundos", instructions: "Relaja completamente la espalda y hombros"}
                ],
                intermediate: [
                    {name: "Estiramiento de cadena posterior", sets: 2, reps: "45 segundos", rest: "15 segundos", instructions: "Flexión hacia adelante con piernas ligeramente flexionadas"},
                    {name: "World's greatest stretch", sets: 2, reps: "30 segundos por lado", rest: "15 segundos", instructions: "Secuencia completa de estiramiento dinámico"},
                    {name: "Yoga flow básico", sets: 1, reps: "3 minutos", rest: "30 segundos", instructions: "Secuencia de posturas conectadas con la respiración"},
                    {name: "Estiramiento de pectoral", sets: 2, reps: "30 segundos por lado", rest: "15 segundos", instructions: "Abre el brazo a 90 grados contra una pared"}
                ]
            }
        };
        
        return exercises[type][level] || exercises.cardio.beginner;
    }
}

// Exportar como singleton
export default new AIWorkoutRecommendations(); 