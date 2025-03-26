// Módulo para gestionar la sección de perfil
import userPrefs from './models/user-preferences.js';

class Profile {
    constructor() {
        this.userPrefs = userPrefs;
        this.init();
    }
    
    async init() {
        // Inicializar listeners
        this.initProfileListeners();
        this.initGoalListeners();
        this.initProfileForm();
        this.initGoalsForm();
        
        // Cargar datos actuales
        await this.loadProfileData();
    }
    
    initProfileListeners() {
        // Abrir modal de edición de perfil
        document.getElementById('edit-profile-btn').addEventListener('click', () => {
            this.openProfileModal();
        });
        
        // Cerrar modal de perfil con botón X o Cancelar
        document.querySelectorAll('#edit-profile-modal .modal-close-btn, #profile-cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeProfileModal();
            });
        });
        
        // Guardar cambios del perfil
        document.getElementById('profile-save-btn').addEventListener('click', () => {
            this.saveProfileChanges();
        });
    }
    
    initGoalListeners() {
        // Abrir modal de edición de objetivos
        document.getElementById('edit-goals-btn').addEventListener('click', () => {
            this.openGoalsModal();
        });
        
        // Cerrar modal de objetivos con botón X o Cancelar
        document.querySelectorAll('#edit-goals-modal .modal-close-btn, #goals-cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeGoalsModal();
            });
        });
        
        // Guardar cambios de objetivos
        document.getElementById('goals-save-btn').addEventListener('click', () => {
            this.saveGoalsChanges();
        });
        
        // Listeners para sliders de macronutrientes
        this.initMacroSliderListeners();
    }
    
    initMacroSliderListeners() {
        const proteinSlider = document.getElementById('protein-percent');
        const carbsSlider = document.getElementById('carbs-percent');
        const fatSlider = document.getElementById('fat-percent');
        
        const proteinValue = document.getElementById('protein-value');
        const carbsValue = document.getElementById('carbs-value');
        const fatValue = document.getElementById('fat-value');
        const macroTotal = document.getElementById('macro-total');
        
        // Función para actualizar todos los valores
        const updateMacroValues = () => {
            const protein = parseInt(proteinSlider.value);
            const carbs = parseInt(carbsSlider.value);
            const fat = parseInt(fatSlider.value);
            const total = protein + carbs + fat;
            
            proteinValue.textContent = protein;
            carbsValue.textContent = carbs;
            fatValue.textContent = fat;
            macroTotal.textContent = total;
            
            // Aplicar clase de alerta si no suma 100%
            macroTotal.parentElement.classList.toggle('warning', total !== 100);
        };
        
        // Añadir listeners a cada slider
        [proteinSlider, carbsSlider, fatSlider].forEach(slider => {
            slider.addEventListener('input', updateMacroValues);
        });
    }
    
    initProfileForm() {
        // Configuración adicional del formulario de perfil
        // Por ejemplo, validación de campos numéricos
        const numberInputs = document.querySelectorAll('#edit-profile-modal input[type="number"]');
        numberInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                const min = parseFloat(e.target.min);
                const max = parseFloat(e.target.max);
                
                if (value < min) e.target.value = min;
                if (value > max) e.target.value = max;
            });
        });
    }
    
    initGoalsForm() {
        // Configuración adicional del formulario de objetivos
        // Por ejemplo, mostrar/ocultar campos según el objetivo seleccionado
        const goalSelect = document.getElementById('fitness-goal-select');
        goalSelect.addEventListener('change', () => {
            this.updateGoalFormFields(goalSelect.value);
        });
    }
    
    updateGoalFormFields(goal) {
        // Mostrar/ocultar campos según el objetivo seleccionado
        const weightTargetSection = document.querySelector('.goal-section:nth-child(2)');
        
        if (goal === 'maintenance' || goal === 'athleticPerformance') {
            weightTargetSection.style.opacity = '0.6';
        } else {
            weightTargetSection.style.opacity = '1';
        }
    }
    
    async loadProfileData() {
        try {
            // Cargar datos del perfil en la página
            const profile = await this.userPrefs.getProfile();
            const fitnessGoals = await this.userPrefs.getFitnessGoals();
            const nutritionGoals = await this.userPrefs.getNutritionGoals();
            
            // Actualizar sección de perfil
            this.updateProfileSection(profile);
            
            // Actualizar sección de objetivos
            this.updateGoalsSection(fitnessGoals, nutritionGoals);
            
            console.log('Datos de perfil cargados correctamente');
        } catch (error) {
            console.error('Error al cargar datos de perfil:', error);
        }
    }
    
    updateProfileSection(profile) {
        // Actualizar nombre de usuario
        const profileNameEl = document.getElementById('profile-name');
        if (profileNameEl && profile.name) {
            profileNameEl.textContent = profile.name;
        }
        
        // Actualizar datos físicos
        const profileDetailsEl = document.getElementById('profile-physical-details');
        if (profileDetailsEl) {
            let detailsText = '';
            
            if (profile.age) detailsText += `${profile.age} años`;
            if (profile.height) detailsText += (detailsText ? ', ' : '') + `${profile.height}cm`;
            if (profile.weight) detailsText += (detailsText ? ', ' : '') + `${profile.weight}kg`;
            
            // Si no hay datos, mostrar mensaje para animar a completar perfil
            profileDetailsEl.textContent = detailsText || 'Completa tu perfil para recibir recomendaciones personalizadas';
        }
        
        // Actualizar nivel de actividad
        const activityLevelEl = document.getElementById('profile-activity-level-display');
        if (activityLevelEl && profile.activityLevel) {
            const activityLabels = {
                'sedentary': 'Sedentario',
                'light': 'Levemente activo',
                'moderate': 'Moderadamente activo',
                'active': 'Muy activo',
                'extremely': 'Extremadamente activo'
            };
            activityLevelEl.textContent = activityLabels[profile.activityLevel] || 'No especificado';
        }
    }
    
    updateGoalsSection(fitnessGoals, nutritionGoals) {
        // Actualizar objetivo fitness
        const fitnessGoalEl = document.getElementById('fitness-goal-display');
        if (fitnessGoalEl && fitnessGoals.primaryGoal) {
            const goalLabels = {
                'weightLoss': 'Pérdida de peso',
                'muscleGain': 'Ganancia muscular',
                'maintenance': 'Mantenimiento',
                'athleticPerformance': 'Rendimiento atlético',
                'healthImprovement': 'Mejora de salud'
            };
            fitnessGoalEl.textContent = goalLabels[fitnessGoals.primaryGoal] || 'No especificado';
        }
        
        // Actualizar objetivo de peso
        const weightGoalEl = document.getElementById('weight-goal-display');
        if (weightGoalEl && fitnessGoals.targetWeight) {
            weightGoalEl.textContent = `${fitnessGoals.targetWeight}kg`;
        }
        
        // Actualizar objetivos de calorías
        const calorieGoalEl = document.getElementById('calorie-goal-display');
        if (calorieGoalEl && nutritionGoals.calorieGoal) {
            calorieGoalEl.textContent = `${nutritionGoals.calorieGoal} kcal/día`;
        }
        
        // Actualizar frecuencia de entrenamiento
        const workoutFreqEl = document.getElementById('workout-frequency-display');
        if (workoutFreqEl && fitnessGoals.workoutFrequency) {
            workoutFreqEl.textContent = `${fitnessGoals.workoutFrequency} días/semana`;
        }
    }
    
    openProfileModal() {
        const modal = document.getElementById('edit-profile-modal');
        const overlay = document.getElementById('modal-overlay');
        
        // Llenar formulario con datos actuales
        this.fillProfileForm();
        
        // Mostrar modal
        modal.classList.add('active');
        overlay.classList.add('active');
    }
    
    closeProfileModal() {
        const modal = document.getElementById('edit-profile-modal');
        const overlay = document.getElementById('modal-overlay');
        
        modal.classList.remove('active');
        overlay.classList.remove('active');
    }
    
    fillProfileForm() {
        const profile = this.userPrefs.getProfile();
        
        // Llenar inputs con datos actuales
        document.getElementById('profile-name-input').value = profile.name || '';
        
        if (profile.gender) {
            document.getElementById('profile-gender').value = profile.gender;
        }
        
        if (profile.birthdate) {
            document.getElementById('profile-birthdate').value = profile.birthdate;
        }
        
        if (profile.height) {
            document.getElementById('profile-height').value = profile.height;
        }
        
        if (profile.weight) {
            document.getElementById('profile-weight').value = profile.weight;
        }
        
        if (profile.activityLevel) {
            document.getElementById('profile-activity-level').value = profile.activityLevel;
        }
    }
    
    async saveProfileChanges() {
        try {
            // Recoger datos del formulario
            const name = document.getElementById('profile-name-input').value.trim();
            const gender = document.getElementById('profile-gender').value;
            const birthdate = document.getElementById('profile-birthdate').value;
            const height = parseFloat(document.getElementById('profile-height').value);
            const weight = parseFloat(document.getElementById('profile-weight').value);
            const activityLevel = document.getElementById('profile-activity-level').value;
            
            // Calcular edad a partir de la fecha de nacimiento
            let age = null;
            if (birthdate) {
                const birthDate = new Date(birthdate);
                const today = new Date();
                age = today.getFullYear() - birthDate.getFullYear();
                const m = today.getMonth() - birthDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
            }
            
            // Actualizar perfil
            const profileData = {
                name,
                gender,
                birthdate,
                height: isNaN(height) ? null : height,
                weight: isNaN(weight) ? null : weight,
                age,
                activityLevel
            };
            
            const success = await this.userPrefs.updateProfile(profileData);
            
            if (success) {
                // Actualizar UI con nuevos datos
                this.updateProfileSection(profileData);
                this.closeProfileModal();
                
                // Mostrar notificación de éxito
                showToast('Perfil actualizado correctamente');
            } else {
                showToast('Error al actualizar perfil', 'error');
            }
        } catch (error) {
            console.error('Error al guardar cambios del perfil:', error);
            showToast('Error al guardar perfil', 'error');
        }
    }
    
    openGoalsModal() {
        const modal = document.getElementById('edit-goals-modal');
        const overlay = document.getElementById('modal-overlay');
        
        // Llenar formulario con datos actuales
        this.fillGoalsForm();
        
        // Mostrar modal
        modal.classList.add('active');
        overlay.classList.add('active');
    }
    
    closeGoalsModal() {
        const modal = document.getElementById('edit-goals-modal');
        const overlay = document.getElementById('modal-overlay');
        
        modal.classList.remove('active');
        overlay.classList.remove('active');
    }
    
    fillGoalsForm() {
        const fitnessGoals = this.userPrefs.getFitnessGoals();
        const nutritionGoals = this.userPrefs.getNutritionGoals();
        
        // Llenar inputs con datos actuales
        if (fitnessGoals.primaryGoal) {
            const goalSelect = document.getElementById('fitness-goal-select');
            goalSelect.value = fitnessGoals.primaryGoal;
            this.updateGoalFormFields(fitnessGoals.primaryGoal);
        }
        
        if (fitnessGoals.fitnessLevel) {
            document.getElementById('fitness-level').value = fitnessGoals.fitnessLevel;
        }
        
        if (fitnessGoals.workoutFrequency) {
            document.getElementById('workout-frequency').value = fitnessGoals.workoutFrequency;
        }
        
        if (fitnessGoals.targetWeight) {
            document.getElementById('target-weight').value = fitnessGoals.targetWeight;
        }
        
        if (fitnessGoals.weeklyWeightChange) {
            document.getElementById('weekly-change').value = fitnessGoals.weeklyWeightChange;
        }
        
        // Configurar sliders de macronutrientes
        if (nutritionGoals) {
            const totalCals = nutritionGoals.calorieGoal;
            
            if (totalCals && nutritionGoals.proteinGoal && nutritionGoals.carbsGoal && nutritionGoals.fatGoal) {
                const proteinPerc = Math.round((nutritionGoals.proteinGoal * 4 / totalCals) * 100);
                const carbsPerc = Math.round((nutritionGoals.carbsGoal * 4 / totalCals) * 100);
                const fatPerc = Math.round((nutritionGoals.fatGoal * 9 / totalCals) * 100);
                
                document.getElementById('protein-percent').value = proteinPerc;
                document.getElementById('protein-value').textContent = proteinPerc;
                
                document.getElementById('carbs-percent').value = carbsPerc;
                document.getElementById('carbs-value').textContent = carbsPerc;
                
                document.getElementById('fat-percent').value = fatPerc;
                document.getElementById('fat-value').textContent = fatPerc;
                
                document.getElementById('macro-total').textContent = proteinPerc + carbsPerc + fatPerc;
            }
        }
    }
    
    async saveGoalsChanges() {
        try {
            // Recoger datos del formulario
            const primaryGoal = document.getElementById('fitness-goal-select').value;
            const fitnessLevel = document.getElementById('fitness-level').value;
            const workoutFrequency = parseInt(document.getElementById('workout-frequency').value);
            const targetWeight = parseFloat(document.getElementById('target-weight').value);
            const weeklyWeightChange = parseFloat(document.getElementById('weekly-change').value);
            
            // Obtener valores de macronutrientes
            const proteinPerc = parseInt(document.getElementById('protein-percent').value);
            const carbsPerc = parseInt(document.getElementById('carbs-percent').value);
            const fatPerc = parseInt(document.getElementById('fat-percent').value);
            
            // Validar que los macros suman 100%
            if (proteinPerc + carbsPerc + fatPerc !== 100) {
                showToast('La distribución de macronutrientes debe sumar 100%', 'error');
                return;
            }
            
            // Actualizar objetivos de fitness
            const fitnessGoals = {
                primaryGoal,
                fitnessLevel,
                workoutFrequency,
                targetWeight: isNaN(targetWeight) ? null : targetWeight,
                weeklyWeightChange: isNaN(weeklyWeightChange) ? 0.5 : weeklyWeightChange
            };
            
            // Obtener calorías actuales para calcular macros en gramos
            const nutritionGoals = this.userPrefs.getNutritionGoals();
            const calorieGoal = nutritionGoals.calorieGoal;
            
            // Calcular macros en gramos
            const updatedNutritionGoals = {
                proteinGoal: Math.round((calorieGoal * (proteinPerc / 100)) / 4),
                carbsGoal: Math.round((calorieGoal * (carbsPerc / 100)) / 4),
                fatGoal: Math.round((calorieGoal * (fatPerc / 100)) / 9)
            };
            
            // Guardar cambios
            const successFitness = await this.userPrefs.updateFitnessGoals(fitnessGoals);
            const successNutrition = await this.userPrefs.updateNutritionGoals(updatedNutritionGoals);
            
            if (successFitness && successNutrition) {
                // Actualizar UI con nuevos datos
                this.updateGoalsSection(fitnessGoals, {...nutritionGoals, ...updatedNutritionGoals});
                this.closeGoalsModal();
                
                // Mostrar notificación de éxito
                showToast('Objetivos actualizados correctamente');
            } else {
                showToast('Error al actualizar objetivos', 'error');
            }
        } catch (error) {
            console.error('Error al guardar cambios de objetivos:', error);
            showToast('Error al guardar objetivos', 'error');
        }
    }
}

// Función auxiliar para mostrar notificaciones toast
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.classList.add('toast', type);
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Mostrar toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Ocultar toast después de 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

export default new Profile(); 