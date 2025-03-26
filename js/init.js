// Script de inicialización para NutriScan
import authManager from './auth.js';
import userPreferences from './models/user-preferences.js';
import workoutRecommendations from './models/workout-recommendations.js';
import nutriScanDB from './models/database.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Iniciando aplicación NutriScan...');
    // Establecer pantalla de carga inicial
    showScreen('loading-screen');
    
    // Mostrar notificación de inicio en la pantalla de carga
    updateLoadingStatus('Inicializando componentes...');
    
    // Inicializar módulos
    try {
        await initializeApp();
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        showErrorScreen('No se pudo inicializar la aplicación: ' + error.message);
    }
});

// Actualizar el estado de carga con mensaje informativo
function updateLoadingStatus(message) {
    const loadingMessage = document.querySelector('#loading-screen p');
    if (loadingMessage) {
        loadingMessage.textContent = message;
    }
}

// Función principal de inicialización
async function initializeApp() {
    try {
        console.log('Inicializando módulos...');
        
        // Verificar Firebase primero
        if (!firebase.apps.length) {
            console.error('Firebase no está inicializado correctamente');
            showErrorScreen('Error al inicializar Firebase');
            return;
        }
        
        // Inicializar base de datos
        updateLoadingStatus('Configurando base de datos local...');
        await nutriScanDB.init();
        
        // Inicializar preferencias de usuario
        updateLoadingStatus('Cargando preferencias...');
        await userPreferences.init();
        
        // Inicializar recomendaciones de entrenamiento
        updateLoadingStatus('Preparando sistema de recomendaciones...');
        await workoutRecommendations.init();
        
        console.log('Módulos principales inicializados correctamente');
        
        // Iniciar AuthManager después que las preferencias estén listas
        updateLoadingStatus('Verificando autenticación...');
        await authManager.init();
        
        // Configurar eventos de UI
        setupUIEvents();
        
        // Configurar observer para cambios de autenticación
        setupAuthStateObserver();
        
        // Verificar si hay un usuario autenticado
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
            console.log('Usuario ya autenticado:', currentUser.displayName || currentUser.email);
            updateLoadingStatus('Cargando tu perfil...');
            await handleUserSignIn(currentUser);
        } else {
            console.log('No hay usuario autenticado, mostrando pantalla de login');
            // Mostrar pantalla de login
            showScreen('login-screen');
        }
    } catch (error) {
        console.error('Error en la inicialización:', error);
        showErrorScreen('Error durante la inicialización: ' + error.message);
    }
}

// Configurar eventos de UI
function setupUIEvents() {
    // === ELEMENTOS DOM ===
    // Navegación
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const menuCloseBtn = document.getElementById('menu-close-btn');
    const menuButtons = document.querySelectorAll('.menu-btn');
    const navButtons = document.querySelectorAll('.nav-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    
    // Autenticación
    const googleLoginBtn = document.getElementById('google-login-btn');
    const emailLoginToggle = document.getElementById('email-login-toggle');
    const guestLoginBtn = document.getElementById('guest-login-btn');
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const registerSubmitBtn = document.getElementById('register-submit-btn');
    const emailLoginForm = document.getElementById('email-login-form');
    const registerForm = document.getElementById('register-form');
    const registerToggle = document.getElementById('register-toggle');
    const loginToggle = document.getElementById('login-toggle');
    const logoutBtn = document.getElementById('logout-btn');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    
    // Fitness
    const changeGoalBtn = document.getElementById('change-goal-btn');
    const goalOptions = document.querySelectorAll('.goal-option');
    const goalSaveBtn = document.getElementById('goal-save-btn');
    const goalCancelBtn = document.getElementById('goal-cancel-btn');
    const modalCloseBtn = document.querySelector('.modal-close-btn');
    
    // Dashboard
    const quickScanBtn = document.getElementById('quick-scan-btn');
    const quickLogBtn = document.getElementById('quick-log-btn');
    const quickWorkoutBtn = document.getElementById('quick-workout-btn');
    const quickWaterBtn = document.getElementById('quick-water-btn');
    const startWorkoutBtn = document.getElementById('start-workout-btn');
    const retryBtn = document.getElementById('retry-btn');
    
    // === EVENTOS DE NAVEGACIÓN ===
    // Botón para reintentar en pantalla de error
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            location.reload();
        });
    }
    
    // Menú lateral
    if (menuToggleBtn) {
        menuToggleBtn.addEventListener('click', toggleSideMenu);
    }
    
    if (menuCloseBtn) {
        menuCloseBtn.addEventListener('click', toggleSideMenu);
    }
    
    // Botones de navegación del menú
    menuButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const screenId = btn.getAttribute('data-screen');
            if (screenId === 'logout-btn' || btn.id === 'logout-btn') {
                authManager.logout();
            } else if (screenId) {
                showScreen(screenId);
                toggleSideMenu();
            }
        });
    });
    
    // Navegación principal (móvil)
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const screenId = btn.getAttribute('data-screen');
            if (screenId) {
                showScreen(screenId);
            }
        });
    });
    
    // Overlay para cerrar modales
    if (modalOverlay) {
        modalOverlay.addEventListener('click', () => {
            document.getElementById('side-menu').classList.remove('open');
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
            modalOverlay.classList.remove('active');
        });
    }
    
    // === EVENTOS DE AUTENTICACIÓN ===
    // Login con Google
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', async () => {
            try {
                showLoading(true);
                const result = await authManager.loginWithGoogle();
                showLoading(false);
                
                if (!result.success) {
                    showNotification(result.error);
                }
            } catch (error) {
                showLoading(false);
                showNotification('Error al iniciar sesión con Google');
                console.error(error);
            }
        });
    }
    
    // Mostrar formulario de login con email
    if (emailLoginToggle) {
        emailLoginToggle.addEventListener('click', () => {
            if (emailLoginForm) {
                emailLoginForm.classList.toggle('hidden');
                if (registerForm) registerForm.classList.add('hidden');
            }
        });
    }
    
    // Login como invitado
    if (guestLoginBtn) {
        guestLoginBtn.addEventListener('click', async () => {
            try {
                showLoading(true);
                const result = await authManager.loginAsGuest();
                showLoading(false);
                
                if (!result.success) {
                    showNotification(result.error);
                }
            } catch (error) {
                showLoading(false);
                showNotification('Error al iniciar sesión como invitado');
                console.error(error);
            }
        });
    }
    
    // Alternar entre login y registro
    if (registerToggle) {
        registerToggle.addEventListener('click', () => {
            if (emailLoginForm) emailLoginForm.classList.add('hidden');
            if (registerForm) registerForm.classList.remove('hidden');
        });
    }
    
    if (loginToggle) {
        loginToggle.addEventListener('click', () => {
            if (registerForm) registerForm.classList.add('hidden');
            if (emailLoginForm) emailLoginForm.classList.remove('hidden');
        });
    }
    
    // Submit login con email
    if (loginSubmitBtn) {
        loginSubmitBtn.addEventListener('click', async () => {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if (!email || !password) {
                showNotification('Por favor, completa todos los campos');
                return;
            }
            
            try {
                showLoading(true);
                const result = await authManager.loginWithEmail(email, password);
                showLoading(false);
                
                if (!result.success) {
                    showNotification(result.error);
                }
            } catch (error) {
                showLoading(false);
                showNotification('Error al iniciar sesión');
                console.error(error);
            }
        });
    }
    
    // Submit registro
    if (registerSubmitBtn) {
        registerSubmitBtn.addEventListener('click', async () => {
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            
            if (!name || !email || !password || !confirmPassword) {
                showNotification('Por favor, completa todos los campos');
                return;
            }
            
            if (password !== confirmPassword) {
                showNotification('Las contraseñas no coinciden');
                return;
            }
            
            try {
                showLoading(true);
                const result = await authManager.registerWithEmail(email, password, name);
                showLoading(false);
                
                if (!result.success) {
                    showNotification(result.error);
                } else {
                    showNotification('¡Registro exitoso! Iniciando sesión...');
                }
            } catch (error) {
                showLoading(false);
                showNotification('Error al registrar usuario');
                console.error(error);
            }
        });
    }
    
    // Olvidé mi contraseña
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async () => {
            const email = document.getElementById('login-email').value;
            
            if (!email) {
                showNotification('Por favor, introduce tu email para restablecer contraseña');
                return;
            }
            
            try {
                showLoading(true);
                const result = await authManager.resetPassword(email);
                showLoading(false);
                
                if (result.success) {
                    showNotification('Se ha enviado un email para restablecer tu contraseña');
                } else {
                    showNotification(result.error);
                }
            } catch (error) {
                showLoading(false);
                showNotification('Error al enviar email de restablecimiento');
                console.error(error);
            }
        });
    }
    
    // Cerrar sesión
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const result = await authManager.logout();
                
                if (!result.success) {
                    showNotification(result.error);
                }
            } catch (error) {
                showNotification('Error al cerrar sesión');
                console.error(error);
            }
        });
    }
    
    // === EVENTOS DE FITNESS ===
    // Cambiar objetivo fitness
    if (changeGoalBtn) {
        changeGoalBtn.addEventListener('click', () => {
            toggleModal('fitness-goal-modal', true);
        });
    }
    
    // Seleccionar objetivo fitness
    goalOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Deseleccionar todas las opciones
            goalOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Seleccionar la opción actual
            option.classList.add('selected');
            
            // Guardar la selección
            window.selectedGoal = option.getAttribute('data-goal');
        });
    });
    
    // Guardar objetivo fitness
    if (goalSaveBtn) {
        goalSaveBtn.addEventListener('click', saveSelectedGoal);
    }
    
    // Cancelar selección de objetivo
    if (goalCancelBtn) {
        goalCancelBtn.addEventListener('click', () => {
            toggleModal('fitness-goal-modal', false);
        });
    }
    
    // Cerrar modales
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            // Cerrar todos los modales
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
            modalOverlay.classList.remove('active');
        });
    }
    
    // === EVENTOS DE DASHBOARD ===
    // Acciones rápidas
    if (quickScanBtn) {
        quickScanBtn.addEventListener('click', () => {
            showScreen('scanner-screen');
        });
    }
    
    if (quickLogBtn) {
        quickLogBtn.addEventListener('click', () => {
            showScreen('food-log-screen');
        });
    }
    
    if (quickWorkoutBtn) {
        quickWorkoutBtn.addEventListener('click', () => {
            showScreen('workout-screen');
        });
    }
    
    if (quickWaterBtn) {
        quickWaterBtn.addEventListener('click', async () => {
            try {
                // Incremento de agua en ml (por defecto 250ml)
                const waterIncrement = 250;
                
                // Obtener preferencias para límite diario
                const nutritionGoals = userPreferences.getNutritionGoals();
                const waterGoal = nutritionGoals?.waterIntake || 2000; // ml por defecto
                
                // Actualizar en preferencias (simular por ahora)
                // TODO: Implementar registro real de agua
                
                // Actualizar UI (usando datos ficticios por ahora)
                const currentWater = parseInt(document.getElementById('today-water').textContent.split('/')[0]) || 0;
                const newWater = Math.min(currentWater + waterIncrement, waterGoal);
                
                // Actualizar barra de progreso
                updateWaterProgress(newWater, waterGoal);
                
                showNotification(`¡Añadidos ${waterIncrement}ml de agua!`);
            } catch (error) {
                console.error('Error al registrar agua:', error);
                showNotification('Error al registrar agua');
            }
        });
    }
    
    if (startWorkoutBtn) {
        startWorkoutBtn.addEventListener('click', () => {
            showScreen('workout-screen');
        });
    }
}

// Observer para cambios de estado de autenticación
function setupAuthStateObserver() {
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            console.log('Auth state changed: Usuario autenticado', user.displayName || user.email);
            await handleUserSignIn(user);
        } else {
            console.log('Auth state changed: No hay usuario autenticado');
            // Mostrar pantalla de login
            showScreen('login-screen');
        }
    });
}

// Manejar inicio de sesión
async function handleUserSignIn(user) {
    console.log('Manejando inicio de sesión para:', user.displayName || user.email);
    
    try {
        // Asegurar que las preferencias están inicializadas
        if (!userPreferences.preferences) {
            await userPreferences.init();
        }
        
        // Actualizar UI con datos del usuario
        const userNameDisplay = document.getElementById('user-name-display');
        const userAvatar = document.getElementById('user-avatar');
        const menuUserAvatar = document.getElementById('menu-user-avatar');
        const menuUserName = document.getElementById('menu-user-name');
        const menuUserEmail = document.getElementById('menu-user-email');
        
        if (userNameDisplay) {
            userNameDisplay.textContent = user.displayName || 'Usuario';
        }
        
        if (userAvatar && user.photoURL) {
            userAvatar.src = user.photoURL;
        }
        
        if (menuUserAvatar && user.photoURL) {
            menuUserAvatar.src = user.photoURL;
        }
        
        if (menuUserName) {
            menuUserName.textContent = user.displayName || 'Usuario';
        }
        
        if (menuUserEmail) {
            menuUserEmail.textContent = user.email || '';
        }
        
        // Verificar si el usuario tiene objetivos fitness configurados
        const fitnessGoals = userPreferences.getFitnessGoals();
        console.log('Objetivos fitness actuales:', fitnessGoals);
        
        if (!fitnessGoals.primaryGoal) {
            console.log('El usuario no tiene objetivo fitness, mostrando modal de selección');
            // Primero ir a la pantalla home para que se vea el fondo
            showScreen('home-screen');
            
            // Luego mostrar el modal de selección de objetivo
            setTimeout(() => {
                toggleModal('fitness-goal-modal', true);
            }, 300);
        } else {
            console.log('Usuario con objetivo fitness configurado, mostrando dashboard');
            // Si ya tiene objetivos, ir directamente al home y actualizar
            showScreen('home-screen');
            await updateDashboard();
        }
    } catch (error) {
        console.error('Error al manejar inicio de sesión:', error);
        showNotification('Error al cargar los datos de usuario');
    }
}

// Guardar objetivo fitness seleccionado
async function saveSelectedGoal() {
    if (!window.selectedGoal) {
        showNotification('Por favor, selecciona un objetivo de fitness');
        return;
    }
    
    console.log('Guardando objetivo fitness:', window.selectedGoal);
    showLoading(true);
    
    try {
        // Guardar el objetivo en preferencias
        await userPreferences.updateFitnessGoals({
            primaryGoal: window.selectedGoal,
            // Valores por defecto para otros parámetros
            fitnessLevel: 'beginner',
            workoutFrequency: 3,
            targetWeight: null,
            weeklyWeightChange: 0.5,
            activityCalories: 300,
            preferredWorkouts: ['cardio', 'strength']
        });
        
        // Mostrar el objetivo seleccionado en la pantalla de fitness
        const currentFitnessGoal = document.getElementById('current-fitness-goal');
        if (currentFitnessGoal) {
            currentFitnessGoal.textContent = getGoalDisplayName(window.selectedGoal);
        }
        
        // Actualizar dashboard con las recomendaciones
        await updateDashboard();
        
        // Cerrar modal
        toggleModal('fitness-goal-modal', false);
        
        // Mostrar notificación de éxito
        showNotification('¡Objetivo de fitness guardado con éxito!');
    } catch (error) {
        console.error('Error al guardar objetivo fitness:', error);
        showNotification('Error al guardar objetivo fitness');
    } finally {
        showLoading(false);
    }
}

// Obtener nombre mostrable del objetivo
function getGoalDisplayName(goalId) {
    const goalMap = {
        'weightLoss': 'Pérdida de peso',
        'muscleGain': 'Ganancia muscular',
        'maintenance': 'Mantenimiento',
        'athleticPerformance': 'Rendimiento atlético',
        'healthImprovement': 'Mejora de salud'
    };
    
    return goalMap[goalId] || 'No definido';
}

// Actualizar dashboard con datos del usuario
async function updateDashboard() {
    try {
        console.log('Actualizando dashboard');
        // Obtener objetivos y preferencias
        const fitnessGoals = userPreferences.getFitnessGoals();
        const nutritionGoals = userPreferences.getNutritionGoals();
        
        // Actualizar objetivo actual
        const currentFitnessGoal = document.getElementById('current-fitness-goal');
        if (currentFitnessGoal && fitnessGoals.primaryGoal) {
            currentFitnessGoal.textContent = getGoalDisplayName(fitnessGoals.primaryGoal);
        }
        
        // Obtener y mostrar recomendaciones generales
        const recommendations = workoutRecommendations.getGeneralWorkoutRecommendations();
        displayWorkoutRecommendations(recommendations);
        
        // Actualizar plan semanal
        const weeklyPlan = workoutRecommendations.generateWeeklyPlan();
        displayWeeklyPlan(weeklyPlan);
        
        // Aquí se actualizarían otros datos del dashboard como calorías, actividad, etc.
        // Usando datos ficticios por ahora
        updateCaloriesProgress(1450, 2000);
        updateActivityProgress(150, 300);
        updateWaterProgress(1200, 2000);
        
        const workoutsCompleted = document.getElementById('workouts-completed');
        if (workoutsCompleted) {
            workoutsCompleted.textContent = '2/4';
        }
        
        const weeklyActivityCalories = document.getElementById('weekly-activity-calories');
        if (weeklyActivityCalories) {
            weeklyActivityCalories.textContent = '750/2100';
        }
        
        console.log('Dashboard actualizado correctamente');
    } catch (error) {
        console.error('Error al actualizar dashboard:', error);
    }
}

// Actualizar progreso de calorías
function updateCaloriesProgress(current, goal) {
    const todayCalories = document.getElementById('today-calories');
    const caloriesProgress = document.getElementById('calories-progress');
    
    if (todayCalories) {
        todayCalories.textContent = `${current}/${goal}`;
    }
    
    if (caloriesProgress) {
        const percentage = Math.min(100, Math.round((current / goal) * 100));
        caloriesProgress.querySelector('.progress').style.width = `${percentage}%`;
    }
}

// Actualizar progreso de actividad
function updateActivityProgress(current, goal) {
    const todayActivity = document.getElementById('today-activity');
    const activityProgress = document.getElementById('activity-progress');
    
    if (todayActivity) {
        todayActivity.textContent = `${current}/${goal}`;
    }
    
    if (activityProgress) {
        const percentage = Math.min(100, Math.round((current / goal) * 100));
        activityProgress.querySelector('.progress').style.width = `${percentage}%`;
    }
}

// Actualizar progreso de agua
function updateWaterProgress(current, goal) {
    const todayWater = document.getElementById('today-water');
    const waterProgress = document.getElementById('water-progress');
    
    if (todayWater) {
        todayWater.textContent = `${current}/${goal}`;
    }
    
    if (waterProgress) {
        const percentage = Math.min(100, Math.round((current / goal) * 100));
        waterProgress.querySelector('.progress').style.width = `${percentage}%`;
    }
}

// Mostrar recomendaciones de entrenamiento
function displayWorkoutRecommendations(recommendations) {
    const container = document.getElementById('recommendations-container');
    if (!container) return;
    
    container.innerHTML = ''; // Limpiar contenedor
    
    if (!recommendations || recommendations.length === 0) {
        container.innerHTML = `
            <div class="no-recommendations">
                <p>No hay recomendaciones disponibles en este momento.</p>
                <p>Establece tu objetivo de fitness para obtener recomendaciones personalizadas.</p>
            </div>
        `;
        return;
    }
    
    // Crear tarjetas para cada recomendación
    recommendations.forEach(rec => {
        const card = document.createElement('div');
        card.className = 'recommendation-card';
        
        card.innerHTML = `
            <div class="recommendation-icon">
                <i class="${rec.icon || 'fas fa-dumbbell'}"></i>
            </div>
            <div class="recommendation-info">
                <h4>${rec.title}</h4>
                <p>${rec.description}</p>
                <span class="duration"><i class="far fa-clock"></i> ${rec.duration} min</span>
            </div>
        `;
        
        // Hacer la tarjeta clickeable para comenzar entrenamiento
        card.addEventListener('click', () => {
            // Guardar recomendación seleccionada para usar en pantalla de entrenamiento
            window.selectedWorkout = rec;
            
            // Ir a pantalla de entrenamiento
            showScreen('workout-screen');
        });
        
        container.appendChild(card);
    });
}

// Mostrar plan semanal
function displayWeeklyPlan(weeklyPlan) {
    const container = document.getElementById('weekly-plan-container');
    if (!container) return;
    
    container.innerHTML = ''; // Limpiar contenedor
    
    if (!weeklyPlan || weeklyPlan.length === 0) {
        container.innerHTML = `
            <div class="no-plan">
                <p>No hay plan de entrenamiento disponible.</p>
                <p>Establece tu objetivo de fitness para generar un plan personalizado.</p>
            </div>
        `;
        return;
    }
    
    // Crear tabla para el plan semanal
    const table = document.createElement('table');
    table.className = 'weekly-plan-table';
    
    // Crear fila para cada día
    weeklyPlan.forEach(day => {
        const row = document.createElement('tr');
        
        // Columna del día
        const dayCell = document.createElement('td');
        dayCell.className = 'day-cell';
        dayCell.textContent = day.day;
        row.appendChild(dayCell);
        
        // Columna del entrenamiento
        const workoutCell = document.createElement('td');
        workoutCell.className = 'workout-cell';
        
        if (day.hasWorkout) {
            workoutCell.innerHTML = `
                <div class="workout-info">
                    <i class="${getWorkoutIcon(day.workoutType || 'mixed')}"></i>
                    <span>${day.workoutName || 'Entrenamiento'}</span>
                </div>
            `;
            workoutCell.classList.add('has-workout');
        } else {
            workoutCell.innerHTML = `
                <div class="rest-day">
                    <i class="fas fa-couch"></i>
                    <span>Descanso</span>
                </div>
            `;
        }
        
        row.appendChild(workoutCell);
        table.appendChild(row);
    });
    
    container.appendChild(table);
}

// Obtener icono para tipo de entrenamiento
function getWorkoutIcon(workoutType) {
    const icons = {
        'cardio': 'fas fa-running',
        'strength': 'fas fa-dumbbell',
        'hiit': 'fas fa-bolt',
        'flexibility': 'fas fa-child',
        'mixed': 'fas fa-th-list',
        'recovery': 'fas fa-heart',
        'active_rest': 'fas fa-walking',
        'agility': 'fas fa-fist-raised'
    };
    
    return icons[workoutType] || 'fas fa-dumbbell';
}

// Mostrar notificación
function showNotification(message, duration = 3000) {
    // Usar notificación existente o crear una nueva
    let notification = document.getElementById('notification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.classList.add('active');
    
    // Ocultar después de duración
    setTimeout(() => {
        notification.classList.remove('active');
    }, duration);
}

// Mostrar/ocultar indicador de carga
function showLoading(show = true) {
    const loadingIndicator = document.getElementById('loading-indicator');
    
    if (!loadingIndicator) return;
    
    if (show) {
        loadingIndicator.classList.add('active');
    } else {
        loadingIndicator.classList.remove('active');
    }
}

// Mostrar pantalla de error
function showErrorScreen(message) {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    
    showScreen('error-screen');
}

// Mostrar pantalla específica
function showScreen(screenId) {
    // Ocultar todas las pantallas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Mostrar la pantalla solicitada
    const screenToShow = document.getElementById(screenId);
    if (screenToShow) {
        screenToShow.classList.add('active');
        
        // Actualizar navegación
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-screen') === screenId);
        });
        
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-screen') === screenId);
        });
        
        // Si es la pantalla de scanner, inicializar cámara
        if (screenId === 'scanner-screen') {
            // Importar dinámicamente el módulo camera.js
            import('./camera.js')
                .then(cameraModule => {
                    // Inicializar la cámara
                    cameraModule.initCamera()
                        .catch(error => {
                            console.error('Error al inicializar la cámara:', error);
                            showNotification('Error al inicializar la cámara. Verifica los permisos.');
                        });
                })
                .catch(error => {
                    console.error('Error al cargar el módulo de cámara:', error);
                });
        }
        
        // Si es cualquier otra pantalla y la cámara está activa, detenerla
        else if (screenId !== 'scanner-screen') {
            import('./camera.js')
                .then(cameraModule => {
                    if (typeof cameraModule.stopCamera === 'function') {
                        cameraModule.stopCamera();
                    }
                })
                .catch(() => {
                    // Ignorar errores si el módulo no está cargado
                });
        }
    }
}

// Mostrar/ocultar menú lateral
function toggleSideMenu() {
    const sideMenu = document.getElementById('side-menu');
    const modalOverlay = document.getElementById('modal-overlay');
    
    if (sideMenu) {
        sideMenu.classList.toggle('open');
        
        if (sideMenu.classList.contains('open')) {
            modalOverlay.classList.add('active');
        } else {
            modalOverlay.classList.remove('active');
        }
    }
}

// Mostrar/ocultar modal
function toggleModal(modalId, show = true) {
    const modal = document.getElementById(modalId);
    const modalOverlay = document.getElementById('modal-overlay');
    
    if (modal) {
        if (show) {
            modal.classList.add('active');
            modalOverlay.classList.add('active');
        } else {
            modal.classList.remove('active');
            modalOverlay.classList.remove('active');
        }
    }
}

// Exportar funciones útiles
window.showScreen = showScreen;
window.toggleModal = toggleModal;
window.showNotification = showNotification;
window.showLoading = showLoading; 