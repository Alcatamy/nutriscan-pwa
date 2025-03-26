// Script de inicialización para NutriScan
import authManager from './auth.js';
import userPreferences from './models/user-preferences.js';
import workoutRecommendations from './models/workout-recommendations.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Establecer pantalla de carga inicial
    showScreen('loading-screen');
    
    // Inicializar módulos
    try {
        await initializeApp();
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        showErrorScreen('No se pudo inicializar la aplicación');
    }
});

// Función principal de inicialización
async function initializeApp() {
    // Inicializar módulos
    await Promise.all([
        authManager.init(),
        userPreferences.init(),
        workoutRecommendations.init()
    ]);
    
    // Configurar eventos de UI
    setupUIEvents();
    
    // Manejar estado de autenticación
    setupAuthStateObserver();
    
    // Verificar si hay un usuario autenticado
    const currentUser = authManager.getCurrentUser();
    if (currentUser) {
        handleUserSignIn(currentUser);
    } else {
        // Mostrar pantalla de login
        showScreen('login-screen');
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
    
    // === EVENTOS DE NAVEGACIÓN ===
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
            showScreen(screenId);
            toggleSideMenu();
        });
    });
    
    // Navegación principal (móvil)
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const screenId = btn.getAttribute('data-screen');
            showScreen(screenId);
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
                    showNotification('Registro exitoso');
                }
            } catch (error) {
                showLoading(false);
                showNotification('Error al registrar usuario');
                console.error(error);
            }
        });
    }
    
    // Alternar entre login y registro
    if (registerToggle) {
        registerToggle.addEventListener('click', (e) => {
            e.preventDefault();
            if (emailLoginForm) emailLoginForm.classList.add('hidden');
            if (registerForm) registerForm.classList.remove('hidden');
        });
    }
    
    if (loginToggle) {
        loginToggle.addEventListener('click', (e) => {
            e.preventDefault();
            if (emailLoginForm) emailLoginForm.classList.remove('hidden');
            if (registerForm) registerForm.classList.add('hidden');
        });
    }
    
    // Olvidé mi contraseña
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            
            if (!email) {
                showNotification('Por favor, ingresa tu email para restablecer la contraseña');
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
                await authManager.logout();
            } catch (error) {
                showNotification('Error al cerrar sesión');
                console.error(error);
            }
        });
    }
    
    // === EVENTOS FITNESS ===
    // Selección de objetivo fitness
    if (goalOptions) {
        goalOptions.forEach(option => {
            option.addEventListener('click', () => {
                goalOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                window.selectedGoal = option.getAttribute('data-goal');
            });
        });
    }
    
    // Cambiar objetivo fitness
    if (changeGoalBtn) {
        changeGoalBtn.addEventListener('click', () => {
            toggleModal('fitness-goal-modal', true);
        });
    }
    
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
    
    // Cerrar modal con botón X
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            toggleModal('fitness-goal-modal', false);
        });
    }
    
    // === EVENTOS DEL DASHBOARD ===
    // Botones de acción rápida
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
        quickWaterBtn.addEventListener('click', () => {
            showNotification('Agua registrada');
            updateWaterProgress();
        });
    }
    
    if (startWorkoutBtn) {
        startWorkoutBtn.addEventListener('click', () => {
            showScreen('workout-screen');
        });
    }
}

// Configurar el observador de estado de autenticación
function setupAuthStateObserver() {
    authManager.onAuthStateChanged(user => {
        if (user) {
            handleUserSignIn(user);
        } else {
            // Mostrar pantalla de login
            showScreen('login-screen');
        }
    });
}

// Manejar inicio de sesión
function handleUserSignIn(user) {
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
    
    if (!fitnessGoals.primaryGoal) {
        // Si no tiene objetivos, mostrar modal de selección
        showScreen('home-screen');
        setTimeout(() => {
            toggleModal('fitness-goal-modal', true);
        }, 500);
    } else {
        // Si ya tiene objetivos, ir directamente al home
        showScreen('home-screen');
        updateDashboard();
    }
}

// Guardar objetivo fitness seleccionado
function saveSelectedGoal() {
    if (!window.selectedGoal) {
        showNotification('Por favor, selecciona un objetivo de fitness');
        return;
    }
    
    // Guardar el objetivo en preferencias
    userPreferences.updateFitnessGoals({
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
    updateDashboard();
    
    // Cerrar modal
    toggleModal('fitness-goal-modal', false);
    
    // Mostrar notificación de éxito
    showNotification('¡Objetivo de fitness guardado con éxito!');
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
    
    // Si no se proporcionan valores, incrementar en 250ml
    if (current === undefined || goal === undefined) {
        const waterText = todayWater ? todayWater.textContent : '0/2000';
        const parts = waterText.split('/');
        current = parseInt(parts[0]) + 250;
        goal = parseInt(parts[1]);
    }
    
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
    const container = document.getElementById('workout-recommendations');
    if (!container) return;
    
    container.innerHTML = '';
    
    recommendations.forEach(rec => {
        const workoutEl = document.createElement('div');
        workoutEl.className = 'workout-recommendation';
        
        workoutEl.innerHTML = `
            <div class="workout-icon">
                <i class="${rec.icon}"></i>
            </div>
            <div class="workout-info">
                <div class="workout-title">${rec.title}</div>
                <div class="workout-description">${rec.description}</div>
                ${rec.workout ? `<div class="workout-time">${rec.workout.duration} minutos • ${rec.workout.calories} kcal</div>` : ''}
            </div>
            <button class="start-workout-btn" data-workout="${rec.workoutType}">
                <i class="fas fa-play"></i>
            </button>
        `;
        
        container.appendChild(workoutEl);
    });
    
    // Añadir eventos a los botones
    container.querySelectorAll('.start-workout-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const workoutType = this.getAttribute('data-workout');
            startWorkout(workoutType);
        });
    });
}

// Mostrar plan semanal
function displayWeeklyPlan(weekPlan) {
    const container = document.getElementById('weekly-plan');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Obtener día actual para destacarlo
    const today = new Date().getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const adjustedToday = today === 0 ? 6 : today - 1; // Ajustar para que 0 = Lunes, 6 = Domingo
    
    weekPlan.forEach((dayInfo, index) => {
        const dayEl = document.createElement('div');
        dayEl.className = 'day-plan';
        if (index === adjustedToday) {
            dayEl.classList.add('active');
        }
        
        let workoutInfo = 'Descanso';
        if (dayInfo.hasWorkout) {
            if (dayInfo.workout) {
                workoutInfo = `${dayInfo.workout.name} (${dayInfo.workout.duration} min)`;
            } else if (dayInfo.workoutName) {
                workoutInfo = dayInfo.workoutName;
            }
        }
        
        dayEl.innerHTML = `
            <div class="day-name">${dayInfo.day}</div>
            <div class="day-workout">${workoutInfo}</div>
            ${dayInfo.hasWorkout ? '<button class="view-workout-btn"><i class="fas fa-eye"></i></button>' : ''}
        `;
        
        container.appendChild(dayEl);
    });
}

// Iniciar un entrenamiento específico
function startWorkout(workoutType) {
    // Aquí se implementaría la lógica para iniciar un entrenamiento
    // Por ahora solo mostraremos una notificación
    showNotification(`Iniciando entrenamiento de ${workoutType}`);
    showScreen('workout-screen');
}

// Mostrar pantalla
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
        document.querySelectorAll('[data-screen]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-screen') === screenId);
        });
    }
}

// Mostrar/ocultar menú lateral
function toggleSideMenu() {
    const sideMenu = document.getElementById('side-menu');
    const modalOverlay = document.getElementById('modal-overlay');
    
    if (sideMenu) {
        sideMenu.classList.toggle('open');
        if (modalOverlay) {
            if (sideMenu.classList.contains('open')) {
                modalOverlay.classList.add('active');
            } else {
                modalOverlay.classList.remove('active');
            }
        }
    }
}

// Mostrar/ocultar modal
function toggleModal(modalId, show = true) {
    const modal = document.getElementById(modalId);
    const modalOverlay = document.getElementById('modal-overlay');
    
    if (modal && modalOverlay) {
        if (show) {
            modal.classList.add('active');
            modalOverlay.classList.add('active');
        } else {
            modal.classList.remove('active');
            modalOverlay.classList.remove('active');
        }
    }
}

// Mostrar notificación
function showNotification(message, duration = 3000) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notification-text');
    
    if (notification && notificationText) {
        notificationText.textContent = message;
        notification.classList.add('visible');
        
        setTimeout(() => {
            notification.classList.remove('visible');
        }, duration);
    } else {
        alert(message);
    }
}

// Mostrar/ocultar indicador de carga
function showLoading(show = true) {
    const loadingScreen = document.getElementById('loading-screen');
    
    if (loadingScreen) {
        if (show) {
            loadingScreen.classList.add('active');
        } else {
            loadingScreen.classList.remove('active');
        }
    }
}

// Mostrar pantalla de error
function showErrorScreen(message) {
    const errorScreen = document.getElementById('error-screen');
    const errorMessage = document.getElementById('error-message');
    
    if (errorScreen && errorMessage) {
        errorMessage.textContent = message;
        showScreen('error-screen');
    } else {
        alert(`Error: ${message}`);
    }
}

// Exportar funciones útiles
window.showScreen = showScreen;
window.toggleModal = toggleModal;
window.showNotification = showNotification;
window.showLoading = showLoading; 