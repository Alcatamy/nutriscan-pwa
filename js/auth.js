// Módulo para gestionar la autenticación y usuarios
import userPreferences from './models/user-preferences.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authStateChangedCallbacks = [];
    }

    // Inicializar el gestor de autenticación
    async init() {
        try {
            // Verificar si Firebase está inicializado
            if (!firebase.apps.length) {
                throw new Error('Firebase no está inicializado');
            }
            
            // Configurar el observador de estado de autenticación
            firebase.auth().onAuthStateChanged(user => {
                this.handleAuthStateChanged(user);
            });
            
            return this;
        } catch (error) {
            console.error('Error al inicializar AuthManager:', error);
            return this;
        }
    }

    // Manejar cambios en el estado de autenticación
    handleAuthStateChanged(user) {
        this.currentUser = user;
        
        // Ejecutar callbacks registrados
        this.authStateChangedCallbacks.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Error en callback de authStateChanged:', error);
            }
        });
    }

    // Registrar callback para cambios de estado de autenticación
    onAuthStateChanged(callback) {
        if (typeof callback === 'function') {
            this.authStateChangedCallbacks.push(callback);
            
            // Si ya hay un usuario, llamar inmediatamente al callback
            if (this.currentUser !== null) {
                callback(this.currentUser);
            }
        }
    }

    // Iniciar sesión con email y contraseña
    async loginWithEmail(email, password) {
        try {
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Error al iniciar sesión con email:', error);
            let errorMessage = 'Error al iniciar sesión';
            
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = 'No existe ninguna cuenta con este email';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Contraseña incorrecta';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Email no válido';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'Esta cuenta ha sido deshabilitada';
                    break;
            }
            
            return { success: false, error: errorMessage };
        }
    }

    // Iniciar sesión con Google
    async loginWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await firebase.auth().signInWithPopup(provider);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Error al iniciar sesión con Google:', error);
            return { success: false, error: 'Error al iniciar sesión con Google: ' + error.message };
        }
    }

    // Registrar usuario nuevo con email y contraseña
    async registerWithEmail(email, password, displayName) {
        try {
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Actualizar nombre de usuario
            await user.updateProfile({ displayName });
            
            // Inicializar preferencias para el nuevo usuario
            await this.initUserPreferences(user);
            
            return { success: true, user };
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            let errorMessage = 'Error al registrar usuario';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'El email ya está en uso por otra cuenta';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Email no válido';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'La contraseña es demasiado débil';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'Operación no permitida';
                    break;
            }
            
            return { success: false, error: errorMessage };
        }
    }

    // Iniciar sesión como invitado (anónimo)
    async loginAsGuest() {
        try {
            const userCredential = await firebase.auth().signInAnonymously();
            const user = userCredential.user;
            
            // Actualizar usuario anónimo con datos de invitado
            await user.updateProfile({
                displayName: 'Invitado'
            });
            
            // Inicializar preferencias para el usuario invitado
            await this.initUserPreferences(user, true);
            
            return { success: true, user };
        } catch (error) {
            console.error('Error al iniciar sesión como invitado:', error);
            return { success: false, error: 'Error al iniciar sesión como invitado: ' + error.message };
        }
    }

    // Inicializar preferencias para un nuevo usuario
    async initUserPreferences(user, isGuest = false) {
        try {
            // Reiniciar preferencias a valores por defecto
            await userPreferences.resetToDefaults();
            
            // Actualizar perfil con información disponible del usuario
            const profileUpdate = {
                name: user.displayName || 'Usuario'
            };
            
            await userPreferences.updateProfile(profileUpdate);
            
            // Si es invitado, marcar como tal en las preferencias
            if (isGuest) {
                await userPreferences.updateAppSettings({
                    isGuestAccount: true
                });
            }
            
            return true;
        } catch (error) {
            console.error('Error al inicializar preferencias de usuario:', error);
            return false;
        }
    }

    // Cerrar sesión
    async logout() {
        try {
            await firebase.auth().signOut();
            return { success: true };
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            return { success: false, error: 'Error al cerrar sesión: ' + error.message };
        }
    }

    // Restablecer contraseña
    async resetPassword(email) {
        try {
            await firebase.auth().sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            console.error('Error al restablecer contraseña:', error);
            let errorMessage = 'Error al enviar email de restablecimiento';
            
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Email no válido';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No existe ninguna cuenta con este email';
                    break;
            }
            
            return { success: false, error: errorMessage };
        }
    }

    // Actualizar perfil del usuario actual
    async updateUserProfile(profileData) {
        try {
            const user = firebase.auth().currentUser;
            
            if (!user) {
                throw new Error('No hay usuario autenticado');
            }
            
            await user.updateProfile({
                displayName: profileData.displayName || user.displayName,
                photoURL: profileData.photoURL || user.photoURL
            });
            
            // También actualizar en las preferencias
            await userPreferences.updateProfile({
                name: profileData.displayName || user.displayName
            });
            
            return { success: true };
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            return { success: false, error: 'Error al actualizar perfil: ' + error.message };
        }
    }

    // Actualizar email del usuario actual
    async updateEmail(newEmail, password) {
        try {
            const user = firebase.auth().currentUser;
            
            if (!user) {
                throw new Error('No hay usuario autenticado');
            }
            
            // Reautenticar usuario antes de cambiar email
            const credential = firebase.auth.EmailAuthProvider.credential(
                user.email,
                password
            );
            
            await user.reauthenticateWithCredential(credential);
            await user.updateEmail(newEmail);
            
            return { success: true };
        } catch (error) {
            console.error('Error al actualizar email:', error);
            let errorMessage = 'Error al actualizar email';
            
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Email no válido';
                    break;
                case 'auth/email-already-in-use':
                    errorMessage = 'El email ya está en uso por otra cuenta';
                    break;
                case 'auth/requires-recent-login':
                    errorMessage = 'Por seguridad, debes volver a iniciar sesión antes de actualizar tu email';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Contraseña incorrecta';
                    break;
            }
            
            return { success: false, error: errorMessage };
        }
    }

    // Actualizar contraseña del usuario actual
    async updatePassword(currentPassword, newPassword) {
        try {
            const user = firebase.auth().currentUser;
            
            if (!user) {
                throw new Error('No hay usuario autenticado');
            }
            
            // Reautenticar usuario antes de cambiar contraseña
            const credential = firebase.auth.EmailAuthProvider.credential(
                user.email,
                currentPassword
            );
            
            await user.reauthenticateWithCredential(credential);
            await user.updatePassword(newPassword);
            
            return { success: true };
        } catch (error) {
            console.error('Error al actualizar contraseña:', error);
            let errorMessage = 'Error al actualizar contraseña';
            
            switch (error.code) {
                case 'auth/weak-password':
                    errorMessage = 'La nueva contraseña es demasiado débil';
                    break;
                case 'auth/requires-recent-login':
                    errorMessage = 'Por seguridad, debes volver a iniciar sesión antes de actualizar tu contraseña';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Contraseña actual incorrecta';
                    break;
            }
            
            return { success: false, error: errorMessage };
        }
    }

    // Comprobar si hay un usuario autenticado
    isAuthenticated() {
        return !!this.currentUser;
    }

    // Obtener usuario actual
    getCurrentUser() {
        return this.currentUser;
    }

    // Comprobar si el usuario actual es anónimo
    isAnonymous() {
        return this.currentUser ? this.currentUser.isAnonymous : false;
    }
}

// Exportar una instancia única para toda la aplicación
const authManager = new AuthManager();
export default authManager; 