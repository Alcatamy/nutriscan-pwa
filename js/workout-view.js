// Módulo para visualizar recomendaciones de entrenamiento
import aiWorkoutRecommendations from './models/ai-workout-recommendations.js';
import workoutRecommendations from './models/workout-recommendations.js';
import userPreferences from './models/user-preferences.js';

class WorkoutView {
    constructor() {
        this.aiRecommendations = aiWorkoutRecommendations;
        this.basicRecommendations = workoutRecommendations;
        this.userPrefs = userPreferences;
        this.currentWorkout = null;
        
        // Inicializar
        this.init();
    }
    
    async init() {
        try {
            // Inicializar módulos de recomendaciones
            await this.aiRecommendations.init();
            await this.basicRecommendations.init();
            
            // Configurar listeners
            this.setupEventListeners();
            
            return this;
        } catch (error) {
            console.error('Error al inicializar vista de entrenamientos:', error);
            return this;
        }
    }
    
    setupEventListeners() {
        // Botón para generar recomendación personalizada
        const generateBtn = document.getElementById('generate-workout-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generatePersonalizedWorkout());
        }
        
        // Botón para generar plan semanal
        const generateWeeklyBtn = document.getElementById('generate-weekly-plan-btn');
        if (generateWeeklyBtn) {
            generateWeeklyBtn.addEventListener('click', () => this.generateWeeklyPlan());
        }
        
        // Configurar API Key para la IA
        const configAiBtn = document.getElementById('config-ai-btn');
        if (configAiBtn) {
            configAiBtn.addEventListener('click', () => this.showApiKeyConfig());
        }
        
        // Botón para iniciar entrenamiento
        const startWorkoutBtn = document.getElementById('start-workout-btn');
        if (startWorkoutBtn) {
            startWorkoutBtn.addEventListener('click', () => this.startWorkout());
        }
    }
    
    // Generar una recomendación personalizada usando IA
    async generatePersonalizedWorkout() {
        try {
            // Mostrar pantalla de carga
            this.showLoading('Generando entrenamiento personalizado...');
            
            // Verificar si la IA está configurada
            if (!this.aiRecommendations.isConfigured()) {
                // Mostrar botón para configurar API Key
                this.hideLoading();
                this.showApiKeyConfig();
                return;
            }
            
            // Verificar si el perfil está completo
            const profile = this.userPrefs.getProfile();
            const fitnessGoals = this.userPrefs.getFitnessGoals();
            
            if (!profile.weight || !profile.height || !fitnessGoals.primaryGoal) {
                this.hideLoading();
                this.showError('Perfil incompleto', 'Por favor complete su perfil y objetivos fitness para recibir recomendaciones personalizadas.');
                return;
            }
            
            // Generar recomendación personalizada
            const result = await this.aiRecommendations.generatePersonalizedWorkout();
            
            // Ocultar pantalla de carga
            this.hideLoading();
            
            if (result.error) {
                // Mostrar error
                this.showError('Error al generar entrenamiento', result.message);
                
                // Mostrar recomendación básica como alternativa
                this.showBasicRecommendation();
                return;
            }
            
            // Guardar workout actual
            this.currentWorkout = result;
            
            // Mostrar la recomendación
            this.displayWorkout(result);
            
        } catch (error) {
            console.error('Error al generar entrenamiento personalizado:', error);
            this.hideLoading();
            this.showError('Error inesperado', 'Ocurrió un error al generar el entrenamiento. Intente nuevamente.');
            
            // Mostrar recomendación básica como alternativa
            this.showBasicRecommendation();
        }
    }
    
    // Mostrar recomendación básica (sin IA) como alternativa
    async showBasicRecommendation() {
        try {
            // Generar recomendación básica
            const basicRecs = this.basicRecommendations.getGeneralWorkoutRecommendations();
            if (basicRecs && basicRecs.length > 0) {
                // Tomar la primera recomendación
                const recommendation = basicRecs[0];
                const workout = recommendation.workout;
                
                if (workout) {
                    // Convertir al formato esperado por displayWorkout
                    const formattedWorkout = {
                        workoutName: workout.name,
                        duration: workout.duration,
                        caloriesBurned: workout.calories,
                        type: workout.type,
                        warmup: workout.exercises.filter(ex => ex.type === 'warmup').map(ex => ({
                            name: ex.name,
                            duration: typeof ex.duration === 'number' ? `${ex.duration} minutos` : ex.duration,
                            instructions: ex.instructions
                        })),
                        mainExercises: workout.exercises.filter(ex => !ex.type || ex.type === 'main').map(ex => ({
                            name: ex.name,
                            sets: ex.sets || 1,
                            reps: ex.reps || `${ex.duration} segundos`,
                            rest: ex.rest || '30 segundos',
                            instructions: ex.instructions
                        })),
                        cooldown: workout.exercises.filter(ex => ex.type === 'cooldown').map(ex => ({
                            name: ex.name,
                            duration: typeof ex.duration === 'number' ? `${ex.duration} minutos` : ex.duration,
                            instructions: ex.instructions
                        })),
                        justification: 'Recomendación general basada en su objetivo de fitness.',
                        nutritionTips: 'Asegúrate de mantenerte hidratado durante el entrenamiento.'
                    };
                    
                    this.currentWorkout = formattedWorkout;
                    this.displayWorkout(formattedWorkout);
                }
            }
        } catch (error) {
            console.error('Error al mostrar recomendación básica:', error);
        }
    }
    
    // Mostrar la recomendación de entrenamiento en la UI
    displayWorkout(workout) {
        const workoutContainer = document.getElementById('workout-details');
        if (!workoutContainer) return;
        
        // Limpiar contenedor
        workoutContainer.innerHTML = '';
        
        // Crear header del workout
        const header = document.createElement('div');
        header.className = 'workout-header';
        header.innerHTML = `
            <h2>${workout.workoutName}</h2>
            <div class="workout-meta">
                <span><i class="fas fa-clock"></i> ${workout.duration} minutos</span>
                <span><i class="fas fa-fire"></i> ${workout.caloriesBurned} kcal</span>
                <span><i class="fas ${this.getWorkoutIcon(workout.type)}"></i> ${this.getWorkoutTypeName(workout.type)}</span>
            </div>
        `;
        workoutContainer.appendChild(header);
        
        // Crear sección de justificación
        if (workout.justification) {
            const justification = document.createElement('div');
            justification.className = 'workout-justification';
            justification.innerHTML = `
                <h3>Por qué este entrenamiento es para ti</h3>
                <p>${workout.justification}</p>
            `;
            workoutContainer.appendChild(justification);
        }
        
        // Crear sección de calentamiento
        if (workout.warmup && workout.warmup.length > 0) {
            const warmupSection = document.createElement('div');
            warmupSection.className = 'workout-section';
            warmupSection.innerHTML = `
                <h3><i class="fas fa-fire-alt"></i> Calentamiento</h3>
                <div class="exercise-list warmup-list">
                    ${workout.warmup.map(ex => `
                        <div class="exercise-item">
                            <div class="exercise-header">
                                <span class="exercise-name">${ex.name}</span>
                                <span class="exercise-duration">${ex.duration}</span>
                            </div>
                            <p class="exercise-instructions">${ex.instructions}</p>
                        </div>
                    `).join('')}
                </div>
            `;
            workoutContainer.appendChild(warmupSection);
        }
        
        // Crear sección de ejercicios principales
        if (workout.mainExercises && workout.mainExercises.length > 0) {
            const mainSection = document.createElement('div');
            mainSection.className = 'workout-section';
            mainSection.innerHTML = `
                <h3><i class="fas fa-dumbbell"></i> Ejercicios principales</h3>
                <div class="exercise-list main-exercises-list">
                    ${workout.mainExercises.map(ex => `
                        <div class="exercise-item">
                            <div class="exercise-header">
                                <span class="exercise-name">${ex.name}</span>
                                <span class="exercise-sets">${ex.sets} series × ${ex.reps}</span>
                            </div>
                            <div class="exercise-details">
                                <span class="exercise-rest">Descanso: ${ex.rest}</span>
                                <p class="exercise-instructions">${ex.instructions}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            workoutContainer.appendChild(mainSection);
        }
        
        // Crear sección de enfriamiento
        if (workout.cooldown && workout.cooldown.length > 0) {
            const cooldownSection = document.createElement('div');
            cooldownSection.className = 'workout-section';
            cooldownSection.innerHTML = `
                <h3><i class="fas fa-wind"></i> Enfriamiento</h3>
                <div class="exercise-list cooldown-list">
                    ${workout.cooldown.map(ex => `
                        <div class="exercise-item">
                            <div class="exercise-header">
                                <span class="exercise-name">${ex.name}</span>
                                <span class="exercise-duration">${ex.duration}</span>
                            </div>
                            <p class="exercise-instructions">${ex.instructions}</p>
                        </div>
                    `).join('')}
                </div>
            `;
            workoutContainer.appendChild(cooldownSection);
        }
        
        // Consejos nutricionales
        if (workout.nutritionTips) {
            const tipsSection = document.createElement('div');
            tipsSection.className = 'workout-section nutrition-tips';
            tipsSection.innerHTML = `
                <h3><i class="fas fa-apple-alt"></i> Consejos nutricionales</h3>
                <p>${workout.nutritionTips}</p>
            `;
            workoutContainer.appendChild(tipsSection);
        }
        
        // Botones de acción
        const actionsSection = document.createElement('div');
        actionsSection.className = 'workout-actions';
        actionsSection.innerHTML = `
            <button id="start-workout-btn" class="primary-btn">
                <i class="fas fa-play"></i> Empezar entrenamiento
            </button>
            <button id="save-workout-btn" class="secondary-btn">
                <i class="fas fa-save"></i> Guardar entrenamiento
            </button>
        `;
        workoutContainer.appendChild(actionsSection);
        
        // Actualizar listeners
        this.setupWorkoutActionListeners();
        
        // Mostrar el contenedor de entrenamiento
        document.getElementById('workout-container').classList.add('active');
    }
    
    // Configurar listeners para acciones del entrenamiento
    setupWorkoutActionListeners() {
        const startBtn = document.getElementById('start-workout-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startWorkout());
        }
        
        const saveBtn = document.getElementById('save-workout-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveWorkout());
        }
    }
    
    // Iniciar el entrenamiento actual
    startWorkout() {
        if (!this.currentWorkout) {
            this.showError('No hay entrenamiento', 'Genera un entrenamiento personalizado primero.');
            return;
        }
        
        // Mostrar la pantalla de entrenamiento activo
        this.showActiveWorkout(this.currentWorkout);
    }
    
    // Mostrar pantalla de entrenamiento activo
    showActiveWorkout(workout) {
        // Cambiar a la pantalla de entrenamiento activo
        const screens = document.querySelectorAll('.app-screen');
        screens.forEach(screen => screen.classList.remove('active'));
        
        const activeWorkoutScreen = document.getElementById('active-workout-screen');
        if (activeWorkoutScreen) {
            activeWorkoutScreen.classList.add('active');
            
            // Configurar la pantalla con el entrenamiento actual
            this.setupActiveWorkoutScreen(workout);
        }
    }
    
    // Configurar la pantalla de entrenamiento activo
    setupActiveWorkoutScreen(workout) {
        const container = document.getElementById('active-workout-container');
        if (!container) return;
        
        // Limpiar contenedor
        container.innerHTML = '';
        
        // Header
        const header = document.createElement('div');
        header.className = 'active-workout-header';
        header.innerHTML = `
            <h2>${workout.workoutName}</h2>
            <div class="workout-timer">
                <span id="workout-timer-display">00:00</span>
                <button id="timer-toggle-btn" class="icon-btn">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        `;
        container.appendChild(header);
        
        // Progreso
        const progress = document.createElement('div');
        progress.className = 'workout-progress';
        progress.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
            <div class="progress-stats">
                <span><i class="fas fa-fire"></i> <span id="calories-burned">0</span>/${workout.caloriesBurned} kcal</span>
                <span><i class="fas fa-clock"></i> <span id="time-elapsed">0</span>/${workout.duration} min</span>
            </div>
        `;
        container.appendChild(progress);
        
        // Lista de ejercicios
        const exerciseListContainer = document.createElement('div');
        exerciseListContainer.className = 'active-exercise-list';
        
        // Combinar todos los ejercicios en una sola lista
        const allExercises = [
            ...workout.warmup.map(ex => ({...ex, type: 'warmup'})),
            ...workout.mainExercises.map(ex => ({...ex, type: 'main'})),
            ...workout.cooldown.map(ex => ({...ex, type: 'cooldown'}))
        ];
        
        // Mapear ejercicios a elementos HTML
        exerciseListContainer.innerHTML = `
            <div class="exercises-container">
                ${allExercises.map((ex, index) => `
                    <div class="active-exercise-item ${index === 0 ? 'current' : ''}" data-index="${index}">
                        <div class="exercise-indicator">
                            <div class="indicator-dot"></div>
                            <div class="indicator-line ${index === allExercises.length - 1 ? 'hidden' : ''}"></div>
                        </div>
                        <div class="exercise-content">
                            <h4>${ex.name}</h4>
                            <p class="exercise-detail">
                                ${ex.type === 'main' 
                                    ? `${ex.sets} series × ${ex.reps} · Descanso: ${ex.rest}`
                                    : `Duración: ${ex.duration}`
                                }
                            </p>
                            <p class="exercise-instructions">${ex.instructions}</p>
                            ${index === 0 ? `
                                <div class="exercise-controls">
                                    <button class="exercise-complete-btn primary-btn">Completado</button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(exerciseListContainer);
        
        // Botones de control
        const controls = document.createElement('div');
        controls.className = 'workout-controls';
        controls.innerHTML = `
            <button id="end-workout-btn" class="danger-btn">
                <i class="fas fa-stop"></i> Finalizar entrenamiento
            </button>
        `;
        container.appendChild(controls);
        
        // Configurar listeners para el entrenamiento activo
        this.setupActiveWorkoutListeners(allExercises);
    }
    
    // Configurar listeners para el entrenamiento activo
    setupActiveWorkoutListeners(exercises) {
        // Timer toggle
        const timerToggleBtn = document.getElementById('timer-toggle-btn');
        if (timerToggleBtn) {
            timerToggleBtn.addEventListener('click', () => this.toggleWorkoutTimer());
        }
        
        // Botón para finalizar entrenamiento
        const endWorkoutBtn = document.getElementById('end-workout-btn');
        if (endWorkoutBtn) {
            endWorkoutBtn.addEventListener('click', () => this.endWorkout());
        }
        
        // Botón para marcar ejercicio como completado
        const completeExerciseBtn = document.querySelector('.exercise-complete-btn');
        if (completeExerciseBtn) {
            completeExerciseBtn.addEventListener('click', () => this.completeCurrentExercise(exercises));
        }
    }
    
    // Timer para el entrenamiento
    toggleWorkoutTimer() {
        if (!this.timerInterval) {
            // Iniciar timer
            let seconds = 0;
            const timerDisplay = document.getElementById('workout-timer-display');
            const caloriesBurnedDisplay = document.getElementById('calories-burned');
            const timeElapsedDisplay = document.getElementById('time-elapsed');
            const progressFill = document.querySelector('.progress-fill');
            const timerToggleBtn = document.getElementById('timer-toggle-btn');
            
            if (timerToggleBtn) {
                timerToggleBtn.innerHTML = '<i class="fas fa-pause"></i>';
            }
            
            this.timerInterval = setInterval(() => {
                seconds++;
                
                // Actualizar display del timer
                if (timerDisplay) {
                    const minutes = Math.floor(seconds / 60);
                    const secs = seconds % 60;
                    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
                }
                
                // Calcular calorías quemadas (estimación lineal basada en duración)
                if (caloriesBurnedDisplay && this.currentWorkout) {
                    const totalCalories = this.currentWorkout.caloriesBurned;
                    const totalDuration = this.currentWorkout.duration * 60; // en segundos
                    const caloriesBurned = Math.round((seconds / totalDuration) * totalCalories);
                    caloriesBurnedDisplay.textContent = caloriesBurned;
                }
                
                // Actualizar tiempo transcurrido
                if (timeElapsedDisplay) {
                    timeElapsedDisplay.textContent = Math.floor(seconds / 60);
                }
                
                // Actualizar barra de progreso
                if (progressFill && this.currentWorkout) {
                    const totalDuration = this.currentWorkout.duration * 60; // en segundos
                    const progress = Math.min(100, (seconds / totalDuration) * 100);
                    progressFill.style.width = `${progress}%`;
                }
                
            }, 1000);
        } else {
            // Pausar timer
            clearInterval(this.timerInterval);
            this.timerInterval = null;
            
            const timerToggleBtn = document.getElementById('timer-toggle-btn');
            if (timerToggleBtn) {
                timerToggleBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        }
    }
    
    // Marcar ejercicio actual como completado y pasar al siguiente
    completeCurrentExercise(exercises) {
        const currentExercise = document.querySelector('.active-exercise-item.current');
        if (!currentExercise) return;
        
        const index = parseInt(currentExercise.dataset.index);
        currentExercise.classList.remove('current');
        currentExercise.classList.add('completed');
        
        // Remover controles del ejercicio actual
        const controls = currentExercise.querySelector('.exercise-controls');
        if (controls) {
            controls.remove();
        }
        
        // Pasar al siguiente ejercicio si existe
        if (index < exercises.length - 1) {
            const nextExercise = document.querySelector(`.active-exercise-item[data-index="${index + 1}"]`);
            if (nextExercise) {
                nextExercise.classList.add('current');
                
                // Añadir controles al siguiente ejercicio
                const exerciseContent = nextExercise.querySelector('.exercise-content');
                if (exerciseContent) {
                    const newControls = document.createElement('div');
                    newControls.className = 'exercise-controls';
                    newControls.innerHTML = `
                        <button class="exercise-complete-btn primary-btn">Completado</button>
                    `;
                    exerciseContent.appendChild(newControls);
                    
                    // Añadir listener al nuevo botón
                    const newCompleteBtn = newControls.querySelector('.exercise-complete-btn');
                    if (newCompleteBtn) {
                        newCompleteBtn.addEventListener('click', () => this.completeCurrentExercise(exercises));
                    }
                }
            }
        } else {
            // Era el último ejercicio, mostrar botón de finalizar entrenamiento
            this.showWorkoutCompletionMessage();
        }
    }
    
    // Mostrar mensaje de entrenamiento completado
    showWorkoutCompletionMessage() {
        const container = document.getElementById('active-workout-container');
        if (!container) return;
        
        const completionMessage = document.createElement('div');
        completionMessage.className = 'workout-completion-message';
        completionMessage.innerHTML = `
            <div class="completion-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h3>¡Entrenamiento completado!</h3>
            <p>¡Excelente trabajo! Has completado tu entrenamiento de hoy.</p>
            <button id="finish-workout-btn" class="primary-btn">
                Finalizar
            </button>
        `;
        
        container.appendChild(completionMessage);
        
        // Detener el timer si está activo
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Añadir listener al botón de finalizar
        const finishBtn = document.getElementById('finish-workout-btn');
        if (finishBtn) {
            finishBtn.addEventListener('click', () => this.endWorkout(true));
        }
    }
    
    // Finalizar el entrenamiento
    endWorkout(completed = false) {
        // Detener el timer si está activo
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Mostrar pantalla de resumen si el entrenamiento se completó
        if (completed) {
            this.showWorkoutSummary();
        } else {
            // Confirmar si realmente quiere finalizar el entrenamiento
            const confirmed = confirm('¿Seguro que deseas finalizar el entrenamiento?');
            if (confirmed) {
                // Volver a la pantalla de entrenamientos
                const screens = document.querySelectorAll('.app-screen');
                screens.forEach(screen => screen.classList.remove('active'));
                
                const workoutsScreen = document.getElementById('workouts-screen');
                if (workoutsScreen) {
                    workoutsScreen.classList.add('active');
                }
            }
        }
    }
    
    // Mostrar resumen del entrenamiento
    showWorkoutSummary() {
        // Cambiar a la pantalla de resumen
        const screens = document.querySelectorAll('.app-screen');
        screens.forEach(screen => screen.classList.remove('active'));
        
        const summaryScreen = document.getElementById('workout-summary-screen');
        if (summaryScreen) {
            summaryScreen.classList.add('active');
            
            // Obtener datos del entrenamiento
            const timerDisplay = document.getElementById('workout-timer-display');
            const caloriesBurnedDisplay = document.getElementById('calories-burned');
            
            const timeElapsed = timerDisplay ? timerDisplay.textContent : '00:00';
            const caloriesBurned = caloriesBurnedDisplay ? caloriesBurnedDisplay.textContent : '0';
            
            // Configurar pantalla de resumen
            const summaryContainer = document.getElementById('workout-summary-container');
            if (summaryContainer) {
                summaryContainer.innerHTML = `
                    <div class="summary-header">
                        <i class="fas fa-medal"></i>
                        <h2>¡Entrenamiento completado!</h2>
                        <p>Has completado el entrenamiento "${this.currentWorkout.workoutName}"</p>
                    </div>
                    <div class="summary-stats">
                        <div class="stat-item">
                            <div class="stat-value">${timeElapsed}</div>
                            <div class="stat-label">Tiempo total</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${caloriesBurned}</div>
                            <div class="stat-label">Calorías quemadas</div>
                        </div>
                    </div>
                    <div class="summary-actions">
                        <button id="return-dashboard-btn" class="primary-btn">
                            Volver al inicio
                        </button>
                        <button id="share-workout-btn" class="secondary-btn">
                            <i class="fas fa-share-alt"></i> Compartir
                        </button>
                    </div>
                `;
                
                // Configurar listeners
                const returnBtn = document.getElementById('return-dashboard-btn');
                if (returnBtn) {
                    returnBtn.addEventListener('click', () => {
                        // Volver a la pantalla de inicio
                        const screens = document.querySelectorAll('.app-screen');
                        screens.forEach(screen => screen.classList.remove('active'));
                        
                        const homeScreen = document.getElementById('home-screen');
                        if (homeScreen) {
                            homeScreen.classList.add('active');
                        }
                    });
                }
            }
        }
    }
    
    // Guardar el entrenamiento actual
    saveWorkout() {
        if (!this.currentWorkout) {
            this.showError('No hay entrenamiento', 'Genera un entrenamiento personalizado primero.');
            return;
        }
        
        // Implementar lógica para guardar el entrenamiento
        // TODO: Guardar en la base de datos
        alert('Entrenamiento guardado');
    }
    
    // Generar plan semanal de entrenamiento
    async generateWeeklyPlan() {
        // TODO: Implementar generación de plan semanal
        alert('Funcionalidad en desarrollo');
    }
    
    // Mostrar modal para configurar API Key
    showApiKeyConfig() {
        // Crear modal si no existe
        let modal = document.getElementById('ai-config-modal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ai-config-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-header">
                    <h3>Configurar API de IA</h3>
                    <button class="modal-close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-content">
                    <p>Para utilizar las recomendaciones de entrenamiento con IA, necesitas proporcionar una clave API de OpenAI.</p>
                    <div class="form-group">
                        <label for="api-key-input">API Key de OpenAI:</label>
                        <input type="password" id="api-key-input" placeholder="sk-...">
                    </div>
                    <p class="info-text">
                        <i class="fas fa-info-circle"></i> Puedes obtener una API Key en 
                        <a href="https://platform.openai.com/account/api-keys" target="_blank">platform.openai.com</a>
                    </p>
                </div>
                <div class="modal-footer">
                    <button id="cancel-api-config-btn" class="secondary-btn">Cancelar</button>
                    <button id="save-api-config-btn" class="primary-btn">Guardar</button>
                </div>
            `;
            
            // Añadir modal al DOM
            document.body.appendChild(modal);
            
            // Añadir overlay si no existe
            let overlay = document.getElementById('modal-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'modal-overlay';
                overlay.className = 'modal-overlay';
                document.body.appendChild(overlay);
            }
            
            // Configurar listeners
            const closeBtn = modal.querySelector('.modal-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hideApiKeyConfig());
            }
            
            const cancelBtn = document.getElementById('cancel-api-config-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.hideApiKeyConfig());
            }
            
            const saveBtn = document.getElementById('save-api-config-btn');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => this.saveApiKey());
            }
        }
        
        // Mostrar modal
        modal.classList.add('active');
        document.getElementById('modal-overlay').classList.add('active');
    }
    
    // Ocultar modal de configuración de API Key
    hideApiKeyConfig() {
        const modal = document.getElementById('ai-config-modal');
        const overlay = document.getElementById('modal-overlay');
        
        if (modal) modal.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    }
    
    // Guardar API Key
    async saveApiKey() {
        const apiKeyInput = document.getElementById('api-key-input');
        if (!apiKeyInput) return;
        
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            alert('Por favor ingresa una API Key válida');
            return;
        }
        
        try {
            // Guardar API Key
            const success = await this.aiRecommendations.setApiKey(apiKey);
            
            if (success) {
                this.hideApiKeyConfig();
                alert('API Key guardada correctamente');
                
                // Generar recomendación personalizada
                this.generatePersonalizedWorkout();
            } else {
                alert('Error al guardar la API Key');
            }
        } catch (error) {
            console.error('Error al guardar API Key:', error);
            alert('Error al guardar la API Key');
        }
    }
    
    // Mostrar pantalla de carga
    showLoading(message = 'Cargando...') {
        let loading = document.getElementById('loading-screen');
        
        if (!loading) {
            loading = document.createElement('div');
            loading.id = 'loading-screen';
            loading.className = 'loading-screen';
            loading.innerHTML = `
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p id="loading-message">${message}</p>
                </div>
            `;
            document.body.appendChild(loading);
        } else {
            document.getElementById('loading-message').textContent = message;
        }
        
        loading.classList.add('active');
    }
    
    // Ocultar pantalla de carga
    hideLoading() {
        const loading = document.getElementById('loading-screen');
        if (loading) {
            loading.classList.remove('active');
        }
    }
    
    // Mostrar mensaje de error
    showError(title, message) {
        let errorModal = document.getElementById('error-modal');
        
        if (!errorModal) {
            errorModal = document.createElement('div');
            errorModal.id = 'error-modal';
            errorModal.className = 'modal error-modal';
            errorModal.innerHTML = `
                <div class="modal-header">
                    <h3 id="error-title">${title}</h3>
                    <button class="modal-close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-content">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-circle"></i>
                    </div>
                    <p id="error-message">${message}</p>
                </div>
                <div class="modal-footer">
                    <button id="error-ok-btn" class="primary-btn">Entendido</button>
                </div>
            `;
            
            document.body.appendChild(errorModal);
            
            // Añadir overlay si no existe
            let overlay = document.getElementById('modal-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'modal-overlay';
                overlay.className = 'modal-overlay';
                document.body.appendChild(overlay);
            }
            
            // Configurar listeners
            const closeBtn = errorModal.querySelector('.modal-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hideError());
            }
            
            const okBtn = document.getElementById('error-ok-btn');
            if (okBtn) {
                okBtn.addEventListener('click', () => this.hideError());
            }
        } else {
            document.getElementById('error-title').textContent = title;
            document.getElementById('error-message').textContent = message;
        }
        
        // Mostrar modal
        errorModal.classList.add('active');
        document.getElementById('modal-overlay').classList.add('active');
    }
    
    // Ocultar mensaje de error
    hideError() {
        const errorModal = document.getElementById('error-modal');
        const overlay = document.getElementById('modal-overlay');
        
        if (errorModal) errorModal.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    }
    
    // Obtener icono según tipo de entrenamiento
    getWorkoutIcon(type) {
        switch (type) {
            case 'cardio': return 'fa-running';
            case 'strength': return 'fa-dumbbell';
            case 'hiit': return 'fa-fire-alt';
            case 'flexibility': return 'fa-child';
            case 'hybrid': return 'fa-sync';
            default: return 'fa-dumbbell';
        }
    }
    
    // Obtener nombre según tipo de entrenamiento
    getWorkoutTypeName(type) {
        switch (type) {
            case 'cardio': return 'Cardio';
            case 'strength': return 'Fuerza';
            case 'hiit': return 'HIIT';
            case 'flexibility': return 'Flexibilidad';
            case 'hybrid': return 'Híbrido';
            default: return 'General';
        }
    }
}

// Exportar como singleton
export default new WorkoutView(); 