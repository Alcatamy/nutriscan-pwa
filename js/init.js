// Script de inicialización para NutriScan
import authManager from './local-auth.js';
import userPreferences from './user-preferences.js';
import workoutRecommendations from './models/workout-recommendations.js';
import aiWorkoutRecommendations from './models/ai-workout-recommendations.js';
import database from './models/database.js';

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
        
        // Inicializar base de datos local
        updateLoadingStatus('Configurando base de datos local...');
        await database.init();
        
        // Inicializar preferencias de usuario
        updateLoadingStatus('Cargando preferencias...');
        await userPreferences.init();
        
        // Inicializar recomendaciones de entrenamiento
        updateLoadingStatus('Preparando sistema de recomendaciones...');
        await workoutRecommendations.init();
        
        // Inicializar recomendaciones de entrenamiento con IA
        await aiWorkoutRecommendations.init();
        
        console.log('Módulos principales inicializados correctamente');
        
        // Configurar eventos de UI
        setupUIEvents();
        
        // Inicializar autenticación
        await initializeAuth();
        
        // Verificar si hay un usuario autenticado
        // Después de la inicialización, mostrar siempre la pantalla de login primero
        // El observer de autenticación se encargará de manejar el caso donde el usuario ya está autenticado
        showScreen('login-screen');
    } catch (error) {
        console.error('Error en la inicialización:', error);
        showErrorScreen('Error durante la inicialización: ' + error.message);
    }
}

// Inicializar autenticación
async function initializeAuth() {
    try {
        // Inicializar el administrador de autenticación
        await authManager.init();
        console.log('Autenticación inicializada');
        
        // Configurar eventos para la autenticación
        setupAuthEvents();
        
        // Comprobar si hay un usuario ya autenticado
        const isAuthenticated = authManager.isAuthenticated();
        
        if (isAuthenticated) {
            // Si ya hay sesión, mostrar pantalla principal
            showHomeScreen();
            
            // Comprobar si el usuario tiene un objetivo de fitness configurado
            const user = authManager.getCurrentUser();
            const userPrefs = await userPreferences.getUserPreferences(user.uid);
            
            if (!userPrefs || !userPrefs.fitnessGoal) {
                // Si no tiene objetivo configurado, mostrar modal de selección
                showFitnessGoalModal();
            }
            
            // Actualizar el dashboard con los datos del usuario
            updateDashboard();
        }
        
    } catch (error) {
        console.error('Error al inicializar autenticación:', error);
        showErrorScreen('Error de autenticación', error.message);
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
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const passwordConfirm = document.getElementById('register-password-confirm').value;
            const name = document.getElementById('register-name').value;
            
            if (!email || !password || !passwordConfirm || !name) {
                showNotification('Por favor, completa todos los campos');
                return;
            }
            
            if (password !== passwordConfirm) {
                showNotification('Las contraseñas no coinciden');
                return;
            }
            
            try {
                showLoading(true);
                const result = await authManager.registerWithEmail(email, password, name);
                showLoading(false);
                
                if (!result.success) {
                    showNotification(result.error);
                }
            } catch (error) {
                showLoading(false);
                showNotification('Error al registrar usuario');
                console.error(error);
            }
        });
    }
    
    // Cerrar sesión
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                showLoading(true);
                await authManager.logout();
                showLoading(false);
            } catch (error) {
                showLoading(false);
                console.error('Error al cerrar sesión:', error);
            }
        });
    }
    
    // === EVENTOS DE PREFERENCIAS Y OBJETIVOS ===
    // Cambiar objetivo fitness
    if (changeGoalBtn) {
        changeGoalBtn.addEventListener('click', () => {
            // Actualizar el modal con los objetivos actuales
            const fitnessGoals = userPreferences.getFitnessGoals();
            
            // Quitar selección previa
            goalOptions.forEach(option => {
                option.classList.remove('selected');
            });
            
            // Seleccionar el objetivo actual
            if (fitnessGoals.primaryGoal) {
                const currentOption = document.querySelector(`.goal-option[data-goal="${fitnessGoals.primaryGoal}"]`);
                if (currentOption) {
                    currentOption.classList.add('selected');
                }
            }
            
            // Mostrar modal
            toggleModal('fitness-goal-modal', true);
        });
    }
    
    // Selección de objetivo fitness
    goalOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Quitar selección previa
            goalOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Seleccionar el objetivo clicado
            option.classList.add('selected');
        });
    });
    
    // Guardar objetivo fitness
    if (goalSaveBtn) {
        goalSaveBtn.addEventListener('click', async () => {
            await saveSelectedGoal();
        });
    }
    
    // Cancelar selección de objetivo
    if (goalCancelBtn) {
        goalCancelBtn.addEventListener('click', () => {
            toggleModal('fitness-goal-modal', false);
        });
    }
    
    // Botón para cerrar modal
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            const modal = modalCloseBtn.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
                document.getElementById('modal-overlay').classList.remove('active');
            }
        });
    }
    
    // === EVENTOS DEL DASHBOARD ===
    // Botón de escaneo rápido
    if (quickScanBtn) {
        quickScanBtn.addEventListener('click', () => {
            showScreen('camera-screen');
        });
    }
    
    // Botón de registro rápido
    if (quickLogBtn) {
        quickLogBtn.addEventListener('click', () => {
            showScreen('food-log-screen');
        });
    }
    
    // Botón de entrenamiento rápido
    if (quickWorkoutBtn) {
        quickWorkoutBtn.addEventListener('click', () => {
            showScreen('workouts-screen');
        });
    }
    
    // Botón de agua rápido
    if (quickWaterBtn) {
        quickWaterBtn.addEventListener('click', () => {
            // Implementar lógica para añadir agua
            showNotification('Vaso de agua registrado');
        });
    }
}

// Configurar eventos de autenticación
function setupAuthEvents() {
    // Botón de iniciar sesión
    document.getElementById('login-btn').addEventListener('click', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (!email || !password) {
            showNotification('Por favor, introduce correo y contraseña', 'is-danger');
            return;
        }
        
        try {
            showLoadingScreen(true, 'Iniciando sesión...');
            
            await authManager.loginWithEmailAndPassword(email, password);
            
            showLoadingScreen(false);
            showHomeScreen();
            updateDashboard();
            
        } catch (error) {
            showLoadingScreen(false);
            showNotification('Error al iniciar sesión: ' + error.message, 'is-danger');
        }
    });
    
    // Botón de registro
    document.getElementById('register-btn').addEventListener('click', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        if (!name || !email || !password) {
            showNotification('Por favor, completa todos los campos', 'is-danger');
            return;
        }
        
        try {
            showLoadingScreen(true, 'Creando cuenta...');
            
            const user = await authManager.registerUser(email, password, name);
            
            // Mostrar modal de selección de objetivo fitness para nuevos usuarios
            showFitnessGoalModal();
            
            showLoadingScreen(false);
            
        } catch (error) {
            showLoadingScreen(false);
            showNotification('Error al registrarse: ' + error.message, 'is-danger');
        }
    });
    
    // Botón de acceso como invitado
    document.getElementById('guest-login-btn').addEventListener('click', async () => {
        try {
            showLoadingScreen(true, 'Accediendo como invitado...');
            
            await authManager.loginAsGuest();
            
            // Mostrar modal de selección de objetivo fitness para invitados
            showFitnessGoalModal();
            
            showLoadingScreen(false);
            
        } catch (error) {
            showLoadingScreen(false);
            showNotification('Error al acceder como invitado: ' + error.message, 'is-danger');
        }
    });
    
    // Botón para alternar entre inicio de sesión y registro
    document.getElementById('toggle-register').addEventListener('click', () => {
        document.getElementById('login-form').classList.add('is-hidden');
        document.getElementById('register-form').classList.remove('is-hidden');
    });
    
    document.getElementById('toggle-login').addEventListener('click', () => {
        document.getElementById('register-form').classList.add('is-hidden');
        document.getElementById('login-form').classList.remove('is-hidden');
    });
    
    // Botón de cerrar sesión
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await authManager.logout();
            showLoginScreen();
        } catch (error) {
            showNotification('Error al cerrar sesión: ' + error.message, 'is-danger');
        }
    });
}

// Mostrar pantalla de inicio de sesión
function showLoginScreen() {
    // Ocultar todas las secciones
    document.querySelectorAll('section.section').forEach(section => {
        section.classList.add('is-hidden');
    });
    
    // Mostrar sección de login
    document.getElementById('login-section').classList.remove('is-hidden');
    
    // Restablecer campos de formulario
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('register-name').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-password').value = '';
    
    // Asegurarse de que el formulario de login es visible (no el de registro)
    document.getElementById('login-form').classList.remove('is-hidden');
    document.getElementById('register-form').classList.add('is-hidden');
}

// Mostrar pantalla principal
function showHomeScreen() {
    // Ocultar todas las secciones
    document.querySelectorAll('section.section').forEach(section => {
        section.classList.add('is-hidden');
    });
    
    // Mostrar sección principal
    document.getElementById('main-section').classList.remove('is-hidden');
    
    // Actualizar información del usuario
    updateUserInfo();
}

// Mostrar modal de selección de objetivo fitness
function showFitnessGoalModal() {
    document.getElementById('fitness-goal-modal').classList.add('is-active');
}

// Actualizar dashboard con datos del usuario
async function updateDashboard() {
    try {
        const user = authManager.getCurrentUser();
        if (!user) return;
        
        // Obtener preferencias del usuario
        const userPrefs = await userPreferences.getUserPreferences(user.uid);
        
        if (userPrefs) {
            // Actualizar indicador de objetivo fitness en el dashboard
            const fitnessGoalElement = document.getElementById('current-fitness-goal');
            if (fitnessGoalElement) {
                let goalText = 'No establecido';
                
                switch (userPrefs.fitnessGoal) {
                    case 'lose-weight':
                        goalText = 'Perder peso';
                        break;
                    case 'gain-muscle':
                        goalText = 'Ganar músculo';
                        break;
                    case 'maintain':
                        goalText = 'Mantener peso';
                        break;
                    case 'improve-health':
                        goalText = 'Mejorar salud';
                        break;
                    case 'athletic-performance':
                        goalText = 'Rendimiento deportivo';
                        break;
                }
                
                fitnessGoalElement.textContent = goalText;
            }
            
            // Actualizar más elementos del dashboard según sea necesario...
        }
        
    } catch (error) {
        console.error('Error al actualizar dashboard:', error);
    }
}

// Actualizar información del usuario en la UI
function updateUserInfo() {
    const user = authManager.getCurrentUser();
    if (!user) return;
    
    // Actualizar nombre de usuario en la navegación
    const userNameElement = document.getElementById('current-user-name');
    if (userNameElement) {
        userNameElement.textContent = user.displayName || 'Usuario';
    }
    
    // Más actualizaciones de la UI basadas en el usuario...
}

// Mostrar pantalla de carga
function showLoadingScreen(show, message = 'Cargando...') {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingMessage = document.getElementById('loading-message');
    
    if (loadingMessage) {
        loadingMessage.textContent = message;
    }
    
    if (show) {
        loadingScreen.classList.remove('is-hidden');
    } else {
        loadingScreen.classList.add('is-hidden');
    }
}

// Mostrar pantalla de error
function showErrorScreen(title, message) {
    const errorScreen = document.getElementById('error-screen');
    const errorTitle = document.getElementById('error-title');
    const errorMessage = document.getElementById('error-message');
    
    if (errorTitle) errorTitle.textContent = title;
    if (errorMessage) errorMessage.textContent = message;
    
    // Ocultar carga y mostrar error
    showLoadingScreen(false);
    errorScreen.classList.remove('is-hidden');
}

// Mostrar notificación
function showNotification(message, type = 'is-info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <button class="delete"></button>
        ${message}
    `;
    
    // Añadir al contenedor de notificaciones
    const container = document.getElementById('notification-container');
    if (container) {
        container.appendChild(notification);
        
        // Configurar botón para cerrar notificación
        const closeBtn = notification.querySelector('.delete');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.remove();
            });
        }
        
        // Auto eliminar después de 5 segundos
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }
}

// Mostrar/ocultar pantalla de carga
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

// Cambiar de pantalla
function showScreen(screenId) {
    // Ocultar todas las pantallas
    const screens = document.querySelectorAll('.app-screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Mostrar la pantalla solicitada
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        
        // Acciones específicas según la pantalla
        if (screenId === 'camera-screen') {
            // Iniciar la cámara cuando se muestra la pantalla
            if (window.initCamera) {
                window.initCamera();
            }
        } else if (screenId === 'food-log-screen') {
            // Actualizar el registro de alimentos cuando se muestra la pantalla
            if (window.updateFoodLog) {
                window.updateFoodLog();
            }
        }
    } else {
        console.error(`Pantalla no encontrada: ${screenId}`);
    }
    
    // Actualizar botones de navegación móvil
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        const targetScreenId = btn.getAttribute('data-screen');
        if (targetScreenId === screenId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Si se está mostrando una pantalla principal, cerrar el menú lateral
    if (['home-screen', 'food-log-screen', 'camera-screen', 'stats-screen', 'profile-screen'].includes(screenId)) {
        document.getElementById('side-menu').classList.remove('open');
        
        // Actualizar contenido según la pantalla
        if (screenId === 'home-screen' && authManager.isAuthenticated()) {
            updateDashboard();
        }
    }
}

// Abrir/cerrar menú lateral
function toggleSideMenu() {
    const sideMenu = document.getElementById('side-menu');
    const overlay = document.getElementById('modal-overlay');
    
    if (sideMenu.classList.contains('open')) {
        sideMenu.classList.remove('open');
        overlay.classList.remove('active');
    } else {
        sideMenu.classList.add('open');
        overlay.classList.add('active');
    }
}

// Mostrar/ocultar modal
function toggleModal(modalId, show = true) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    
    if (!modal || !overlay) return;
    
    if (show) {
        modal.classList.add('active');
        overlay.classList.add('active');
    } else {
        modal.classList.remove('active');
        overlay.classList.remove('active');
    }
}

// Guardar el objetivo fitness seleccionado
async function saveSelectedGoal() {
    try {
        const selectedGoal = document.querySelector('.goal-option.selected');
        
        if (!selectedGoal) {
            showNotification('Por favor, selecciona un objetivo');
            return;
        }
        
        const goalId = selectedGoal.getAttribute('data-goal');
        
        // Actualizar preferencias de usuario
        await userPreferences.updateFitnessGoals({
            primaryGoal: goalId,
            // Valores predeterminados según el objetivo
            fitnessLevel: 'beginner',
            workoutFrequency: 3,
            preferredWorkouts: []
        });
        
        // Cerrar modal
        toggleModal('fitness-goal-modal', false);
        
        // Mostrar confirmación
        showNotification(`Objetivo establecido: ${getGoalDisplayName(goalId)}`);
        
        // Redirigir al home y actualizar dashboard
        showScreen('home-screen');
        updateDashboard();
    } catch (error) {
        console.error('Error al guardar objetivo:', error);
        showNotification('Error al guardar objetivo');
    }
}

// Obtener nombre amigable del objetivo
function getGoalDisplayName(goalId) {
    const goalNames = {
        'weightLoss': 'Pérdida de peso',
        'muscleGain': 'Ganancia muscular',
        'maintenance': 'Mantenimiento',
        'athleticPerformance': 'Rendimiento atlético',
        'healthImprovement': 'Mejora de salud'
    };
    
    return goalNames[goalId] || 'Objetivo personalizado';
} 