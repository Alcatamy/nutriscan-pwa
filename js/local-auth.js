// Módulo para gestionar la autenticación local utilizando localStorage

class LocalAuthManager {
    constructor() {
        this.currentUser = null;
        this.authStateObservers = [];
        this.usersStorageKey = 'nutriScan_users';
        this.currentUserKey = 'nutriScan_currentUser';
    }
    
    // Inicializar el administrador de autenticación
    async init() {
        try {
            console.log('Inicializando administrador de autenticación local');
            
            // Cargar usuario actual desde localStorage si existe
            await this.loadCurrentUser();
            
            return this;
        } catch (error) {
            console.error('Error al inicializar autenticación local:', error);
            return this;
        }
    }
    
    // Cargar usuario actual desde localStorage
    async loadCurrentUser() {
        const currentUserJson = localStorage.getItem(this.currentUserKey);
        
        if (currentUserJson) {
            try {
                this.currentUser = JSON.parse(currentUserJson);
                // Notificar a los observadores sobre el cambio de estado
                this.notifyAuthStateChanged(this.currentUser);
            } catch (e) {
                console.error('Error al parsear usuario actual:', e);
                this.currentUser = null;
            }
        }
    }
    
    // Guardar usuarios en localStorage
    saveUsers(users) {
        localStorage.setItem(this.usersStorageKey, JSON.stringify(users));
    }
    
    // Obtener usuarios de localStorage
    getUsers() {
        const usersJson = localStorage.getItem(this.usersStorageKey);
        return usersJson ? JSON.parse(usersJson) : {};
    }
    
    // Guardar usuario actual en localStorage
    saveCurrentUser(user) {
        if (user) {
            localStorage.setItem(this.currentUserKey, JSON.stringify(user));
        } else {
            localStorage.removeItem(this.currentUserKey);
        }
        
        // Actualizar el usuario actual y notificar cambios
        this.currentUser = user;
        this.notifyAuthStateChanged(user);
    }
    
    // Notificar a los observadores sobre cambios en el estado de autenticación
    notifyAuthStateChanged(user) {
        // Llamar a cada observador registrado con el usuario actual
        this.authStateObservers.forEach(observer => {
            try {
                observer(user);
            } catch (error) {
                console.error('Error en observador de autenticación:', error);
            }
        });
    }
    
    // Registrar un observador para cambios en el estado de autenticación
    onAuthStateChanged(observer) {
        if (typeof observer === 'function') {
            this.authStateObservers.push(observer);
            
            // Llamar inmediatamente al observador con el estado actual
            observer(this.currentUser);
        }
        
        // Devolver función para quitar el observador
        return () => {
            const index = this.authStateObservers.indexOf(observer);
            if (index !== -1) {
                this.authStateObservers.splice(index, 1);
            }
        };
    }
    
    // Iniciar sesión con correo y contraseña
    async loginWithEmailAndPassword(email, password) {
        try {
            email = email.toLowerCase().trim();
            
            // Validar entradas
            if (!email || !password) {
                throw new Error('Correo y contraseña son obligatorios');
            }
            
            // Obtener usuarios registrados
            const users = this.getUsers();
            
            // Verificar si existe el usuario con ese correo
            const user = Object.values(users).find(u => u.email.toLowerCase() === email);
            
            if (!user) {
                throw new Error('Usuario no encontrado');
            }
            
            // Verificar contraseña (en una implementación real debería usar hash)
            if (user.password !== password) {
                throw new Error('Contraseña incorrecta');
            }
            
            // Eliminar la contraseña antes de almacenar el usuario actual
            const { password: _, ...userWithoutPassword } = user;
            
            // Guardar usuario actual
            this.saveCurrentUser(userWithoutPassword);
            
            return userWithoutPassword;
            
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            throw error;
        }
    }
    
    // Registrar un nuevo usuario
    async registerUser(email, password, displayName) {
        try {
            email = email.toLowerCase().trim();
            
            // Validar entradas
            if (!email || !password) {
                throw new Error('Correo y contraseña son obligatorios');
            }
            
            // Obtener usuarios registrados
            const users = this.getUsers();
            
            // Verificar si ya existe un usuario con ese correo
            const existingUser = Object.values(users).find(u => u.email.toLowerCase() === email);
            
            if (existingUser) {
                throw new Error('Ya existe un usuario con ese correo');
            }
            
            // Crear nuevo usuario
            const userId = 'user_' + Date.now();
            const newUser = {
                uid: userId,
                email,
                displayName: displayName || email.split('@')[0],
                password, // En una implementación real debería usar hash
                createdAt: new Date().toISOString()
            };
            
            // Guardar el nuevo usuario
            users[userId] = newUser;
            this.saveUsers(users);
            
            // Eliminar la contraseña antes de almacenar el usuario actual
            const { password: _, ...userWithoutPassword } = newUser;
            
            // Guardar usuario actual
            this.saveCurrentUser(userWithoutPassword);
            
            // Inicializar preferencias de usuario
            await this.initUserPreferences(userId);
            
            return userWithoutPassword;
            
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            throw error;
        }
    }
    
    // Iniciar sesión como invitado
    async loginAsGuest() {
        try {
            // Crear un ID único para el invitado
            const guestId = 'guest_' + Date.now();
            
            // Crear usuario invitado
            const guestUser = {
                uid: guestId,
                email: `guest_${Date.now()}@nutriscan.local`,
                displayName: 'Invitado',
                isGuest: true
            };
            
            // Guardar usuario actual
            this.saveCurrentUser(guestUser);
            
            // Inicializar preferencias de usuario invitado
            await this.initUserPreferences(guestId);
            
            return guestUser;
            
        } catch (error) {
            console.error('Error al iniciar sesión como invitado:', error);
            throw error;
        }
    }
    
    // Cerrar sesión
    async logout() {
        // Eliminar usuario actual
        this.saveCurrentUser(null);
        return true;
    }
    
    // Verificar si hay un usuario autenticado
    isAuthenticated() {
        return !!this.currentUser;
    }
    
    // Obtener usuario actual
    getCurrentUser() {
        return this.currentUser;
    }
    
    // Inicializar preferencias de usuario
    async initUserPreferences(userId) {
        try {
            // Aquí se podrían inicializar las preferencias por defecto del usuario
            // en un módulo de preferencias de usuario
            console.log(`Inicializando preferencias para usuario ${userId}`);
            
            // En una implementación real, aquí se llamaría al módulo de preferencias
            // Para guardar preferencias iniciales para el nuevo usuario
            
            return true;
        } catch (error) {
            console.error('Error al inicializar preferencias de usuario:', error);
            return false;
        }
    }
    
    // Actualizar perfil de usuario
    async updateUserProfile(userProfile) {
        try {
            if (!this.currentUser) {
                throw new Error('No hay un usuario autenticado');
            }
            
            // Actualizar el usuario actual con los nuevos datos
            const updatedUser = {
                ...this.currentUser,
                ...userProfile,
                updatedAt: new Date().toISOString()
            };
            
            // Si el usuario no es invitado, actualizar en la lista de usuarios
            if (!this.currentUser.isGuest) {
                const users = this.getUsers();
                users[this.currentUser.uid] = updatedUser;
                this.saveUsers(users);
            }
            
            // Actualizar usuario actual
            this.saveCurrentUser(updatedUser);
            
            return updatedUser;
            
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            throw error;
        }
    }
}

// Exportar como singleton
export default new LocalAuthManager(); 