// Módulo para generar estadísticas y gráficos nutricionales
import nutriScanDB from './database.js';

class NutritionStatistics {
    constructor() {
        // Colores para los gráficos
        this.chartColors = {
            calories: '#FF6384',
            protein: '#4BC0C0',
            carbs: '#FFCD56',
            fat: '#36A2EB',
            fiber: '#9966FF',
            foodCategories: [
                '#FF6384', '#36A2EB', '#FFCD56', '#4BC0C0', 
                '#9966FF', '#FF9F40', '#2E7D32', '#C2185B',
                '#7B1FA2', '#1976D2', '#0097A7', '#388E3C'
            ]
        };
    }

    // Obtener estadísticas generales del consumo calórico
    async getCalorieStatistics(days = 7) {
        try {
            const today = new Date();
            const endDate = today.toISOString().split('T')[0];
            
            // Obtener datos para los últimos 'days' días
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - days + 1); // +1 para incluir hoy
            const formattedStartDate = startDate.toISOString().split('T')[0];
            
            // Datos de la base de datos
            const dailyLogs = await this.getDailyLogsForDateRange(formattedStartDate, endDate);
            
            // Si no hay datos, retornar un conjunto vacío
            if (dailyLogs.length === 0) {
                return {
                    labels: this.generateDateLabels(formattedStartDate, endDate),
                    datasets: [{
                        data: Array(days).fill(0),
                        average: 0,
                        goal: 2000 // Objetivo por defecto
                    }]
                };
            }
            
            // Obtener objetivo de calorías
            const userPrefs = await this.getUserPreferences();
            const calorieGoal = userPrefs?.nutritionGoals?.calorieGoal || 2000;
            
            // Generar dataset
            const dateLabels = this.generateDateLabels(formattedStartDate, endDate);
            const calorieData = Array(dateLabels.length).fill(0);
            
            // Rellenar datos existentes
            dailyLogs.forEach(log => {
                const logDate = log.date;
                const index = dateLabels.findIndex(d => d === logDate);
                
                if (index !== -1) {
                    calorieData[index] = log.totalCalories;
                }
            });
            
            // Calcular promedio (excluyendo días sin datos)
            const nonZeroEntries = calorieData.filter(val => val > 0);
            const average = nonZeroEntries.length > 0 
                ? Math.round(nonZeroEntries.reduce((a, b) => a + b, 0) / nonZeroEntries.length) 
                : 0;
            
            return {
                labels: dateLabels,
                datasets: [{
                    data: calorieData,
                    average: average,
                    goal: calorieGoal
                }]
            };
        } catch (error) {
            console.error('Error al obtener estadísticas de calorías:', error);
            return null;
        }
    }

    // Obtener estadísticas detalladas de los macronutrientes
    async getMacroStatistics(days = 7) {
        try {
            const today = new Date();
            const endDate = today.toISOString().split('T')[0];
            
            // Obtener datos para los últimos 'days' días
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - days + 1);
            const formattedStartDate = startDate.toISOString().split('T')[0];
            
            // Datos de la base de datos
            const dailyLogs = await this.getDailyLogsForDateRange(formattedStartDate, endDate);
            
            // Si no hay datos, retornar conjuntos vacíos
            if (dailyLogs.length === 0) {
                const emptyLabels = this.generateDateLabels(formattedStartDate, endDate);
                const emptyData = Array(days).fill(0);
                
                return {
                    labels: emptyLabels,
                    datasets: [
                        { label: 'Proteínas (g)', data: [...emptyData], color: this.chartColors.protein },
                        { label: 'Carbohidratos (g)', data: [...emptyData], color: this.chartColors.carbs },
                        { label: 'Grasas (g)', data: [...emptyData], color: this.chartColors.fat },
                        { label: 'Fibra (g)', data: [...emptyData], color: this.chartColors.fiber }
                    ]
                };
            }
            
            // Generar datasets
            const dateLabels = this.generateDateLabels(formattedStartDate, endDate);
            const proteinData = Array(dateLabels.length).fill(0);
            const carbsData = Array(dateLabels.length).fill(0);
            const fatData = Array(dateLabels.length).fill(0);
            const fiberData = Array(dateLabels.length).fill(0);
            
            // Rellenar datos existentes
            dailyLogs.forEach(log => {
                const logDate = log.date;
                const index = dateLabels.findIndex(d => d === logDate);
                
                if (index !== -1) {
                    proteinData[index] = log.macros?.protein || 0;
                    carbsData[index] = log.macros?.carbs || 0;
                    fatData[index] = log.macros?.fat || 0;
                    fiberData[index] = log.macros?.fiber || 0;
                }
            });
            
            return {
                labels: dateLabels,
                datasets: [
                    { label: 'Proteínas (g)', data: proteinData, color: this.chartColors.protein },
                    { label: 'Carbohidratos (g)', data: carbsData, color: this.chartColors.carbs },
                    { label: 'Grasas (g)', data: fatData, color: this.chartColors.fat },
                    { label: 'Fibra (g)', data: fiberData, color: this.chartColors.fiber }
                ]
            };
        } catch (error) {
            console.error('Error al obtener estadísticas de macronutrientes:', error);
            return null;
        }
    }

    // Obtener distribución de macronutrientes para un día específico
    async getMacroDistribution(date = null) {
        try {
            // Si no se proporciona fecha, usar hoy
            const targetDate = date || new Date().toISOString().split('T')[0];
            
            // Obtener registro del día
            const dailyLog = await this.getDailyLogForDate(targetDate);
            
            // Si no hay datos, retornar distribución predeterminada
            if (!dailyLog || !dailyLog.macros) {
                return {
                    labels: ['Proteínas', 'Carbohidratos', 'Grasas'],
                    datasets: [{
                        data: [0, 0, 0],
                        backgroundColor: [
                            this.chartColors.protein, 
                            this.chartColors.carbs, 
                            this.chartColors.fat
                        ]
                    }]
                };
            }
            
            // Calcular macros en gramos
            const protein = dailyLog.macros.protein || 0;
            const carbs = dailyLog.macros.carbs || 0;
            const fat = dailyLog.macros.fat || 0;
            
            // Calcular calorías por macronutriente
            const proteinCalories = protein * 4; // 4 calorías por gramo
            const carbsCalories = carbs * 4;     // 4 calorías por gramo
            const fatCalories = fat * 9;         // 9 calorías por gramo
            
            // Total de calorías de macronutrientes
            const totalMacroCalories = proteinCalories + carbsCalories + fatCalories;
            
            // Calcular porcentajes
            const proteinPercentage = totalMacroCalories > 0 ? Math.round((proteinCalories / totalMacroCalories) * 100) : 0;
            const carbsPercentage = totalMacroCalories > 0 ? Math.round((carbsCalories / totalMacroCalories) * 100) : 0;
            const fatPercentage = totalMacroCalories > 0 ? Math.round((fatCalories / totalMacroCalories) * 100) : 0;
            
            return {
                labels: ['Proteínas', 'Carbohidratos', 'Grasas'],
                datasets: [{
                    data: [proteinPercentage, carbsPercentage, fatPercentage],
                    backgroundColor: [
                        this.chartColors.protein, 
                        this.chartColors.carbs, 
                        this.chartColors.fat
                    ]
                }],
                rawValues: {
                    protein: protein,
                    carbs: carbs,
                    fat: fat,
                    proteinCalories: proteinCalories,
                    carbsCalories: carbsCalories,
                    fatCalories: fatCalories,
                    totalCalories: totalMacroCalories
                }
            };
        } catch (error) {
            console.error('Error al obtener distribución de macronutrientes:', error);
            return null;
        }
    }

    // Obtener estadísticas por categorías de alimentos
    async getFoodCategoryStatistics(days = 30) {
        try {
            const today = new Date();
            
            // Obtener datos para los últimos 'days' días
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - days);
            
            // Obtener historial de alimentos escaneados
            const foodHistory = await this.getScannedFoodHistory(100); // Obtener un máximo de 100 registros
            
            // Filtrar solo los registros dentro del rango de fechas
            const filteredHistory = foodHistory.filter(item => {
                const itemDate = new Date(item.timestamp);
                return itemDate >= startDate && itemDate <= today;
            });
            
            // Si no hay datos, retornar conjunto vacío
            if (filteredHistory.length === 0) {
                return {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: []
                    }]
                };
            }
            
            // Contar por categoría
            const categoryCount = {};
            
            filteredHistory.forEach(item => {
                const category = item.foodData.category || 'Sin categoría';
                categoryCount[category] = (categoryCount[category] || 0) + 1;
            });
            
            // Convertir a arrays para el gráfico
            const labels = Object.keys(categoryCount);
            const data = Object.values(categoryCount);
            
            // Generar colores
            const backgroundColor = labels.map((_, index) => 
                this.chartColors.foodCategories[index % this.chartColors.foodCategories.length]
            );
            
            return {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColor
                }]
            };
        } catch (error) {
            console.error('Error al obtener estadísticas por categoría de alimentos:', error);
            return null;
        }
    }

    // Obtener comparación con objetivos nutricionales
    async getNutritionGoalsComparison(date = null) {
        try {
            // Si no se proporciona fecha, usar hoy
            const targetDate = date || new Date().toISOString().split('T')[0];
            
            // Obtener objetivos nutricionales
            const userPrefs = await this.getUserPreferences();
            const goals = userPrefs?.nutritionGoals || {
                calorieGoal: 2000,
                proteinGoal: 100,
                carbsGoal: 250,
                fatGoal: 65,
                fiberGoal: 25
            };
            
            // Obtener registro del día
            const dailyLog = await this.getDailyLogForDate(targetDate);
            
            // Si no hay datos, retornar comparación con valores en cero
            if (!dailyLog) {
                return {
                    calories: { consumed: 0, goal: goals.calorieGoal, percentage: 0 },
                    protein: { consumed: 0, goal: goals.proteinGoal, percentage: 0 },
                    carbs: { consumed: 0, goal: goals.carbsGoal, percentage: 0 },
                    fat: { consumed: 0, goal: goals.fatGoal, percentage: 0 },
                    fiber: { consumed: 0, goal: goals.fiberGoal, percentage: 0 }
                };
            }
            
            // Calcular porcentajes
            const caloriesPercentage = Math.round((dailyLog.totalCalories / goals.calorieGoal) * 100);
            const proteinPercentage = Math.round(((dailyLog.macros?.protein || 0) / goals.proteinGoal) * 100);
            const carbsPercentage = Math.round(((dailyLog.macros?.carbs || 0) / goals.carbsGoal) * 100);
            const fatPercentage = Math.round(((dailyLog.macros?.fat || 0) / goals.fatGoal) * 100);
            const fiberPercentage = Math.round(((dailyLog.macros?.fiber || 0) / goals.fiberGoal) * 100);
            
            return {
                calories: { 
                    consumed: dailyLog.totalCalories, 
                    goal: goals.calorieGoal, 
                    percentage: caloriesPercentage 
                },
                protein: { 
                    consumed: dailyLog.macros?.protein || 0, 
                    goal: goals.proteinGoal, 
                    percentage: proteinPercentage 
                },
                carbs: { 
                    consumed: dailyLog.macros?.carbs || 0, 
                    goal: goals.carbsGoal, 
                    percentage: carbsPercentage 
                },
                fat: { 
                    consumed: dailyLog.macros?.fat || 0, 
                    goal: goals.fatGoal, 
                    percentage: fatPercentage 
                },
                fiber: { 
                    consumed: dailyLog.macros?.fiber || 0, 
                    goal: goals.fiberGoal, 
                    percentage: fiberPercentage 
                }
            };
        } catch (error) {
            console.error('Error al comparar con objetivos nutricionales:', error);
            return null;
        }
    }

    // Obtener análisis de tendencias en el tiempo
    async getTrendsAnalysis(days = 30) {
        try {
            const today = new Date();
            const endDate = today.toISOString().split('T')[0];
            
            // Obtener datos para los últimos 'days' días
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - days + 1);
            const formattedStartDate = startDate.toISOString().split('T')[0];
            
            // Datos de la base de datos
            const dailyLogs = await this.getDailyLogsForDateRange(formattedStartDate, endDate);
            
            // Si no hay suficientes datos para analizar tendencias
            if (dailyLogs.length < 3) {
                return {
                    hasSufficientData: false,
                    message: 'Se necesitan al menos 3 días de datos para analizar tendencias.'
                };
            }
            
            // Ordenar por fecha
            dailyLogs.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            // Calcular tendencias de calorías y macronutrientes
            const calorieValues = dailyLogs.map(log => log.totalCalories);
            const proteinValues = dailyLogs.map(log => log.macros?.protein || 0);
            const carbsValues = dailyLogs.map(log => log.macros?.carbs || 0);
            const fatValues = dailyLogs.map(log => log.macros?.fat || 0);
            
            // Calcular tendencias usando regresión lineal simple
            const calorieTrend = this.calculateLinearRegression(calorieValues);
            const proteinTrend = this.calculateLinearRegression(proteinValues);
            const carbsTrend = this.calculateLinearRegression(carbsValues);
            const fatTrend = this.calculateLinearRegression(fatValues);
            
            // Obtener objetivos nutricionales para contexto
            const userPrefs = await this.getUserPreferences();
            const goals = userPrefs?.nutritionGoals || {
                calorieGoal: 2000,
                proteinGoal: 100,
                carbsGoal: 250,
                fatGoal: 65
            };
            
            // Análisis cualitativo de tendencias
            return {
                hasSufficientData: true,
                calories: {
                    trend: calorieTrend,
                    direction: this.interpretTrendDirection(calorieTrend),
                    analysis: this.analyzeTrend(calorieTrend, calorieValues, goals.calorieGoal, 'Calorías')
                },
                protein: {
                    trend: proteinTrend,
                    direction: this.interpretTrendDirection(proteinTrend),
                    analysis: this.analyzeTrend(proteinTrend, proteinValues, goals.proteinGoal, 'Proteínas')
                },
                carbs: {
                    trend: carbsTrend,
                    direction: this.interpretTrendDirection(carbsTrend),
                    analysis: this.analyzeTrend(carbsTrend, carbsValues, goals.carbsGoal, 'Carbohidratos')
                },
                fat: {
                    trend: fatTrend,
                    direction: this.interpretTrendDirection(fatTrend),
                    analysis: this.analyzeTrend(fatTrend, fatValues, goals.fatGoal, 'Grasas')
                },
                averages: {
                    calories: this.calculateAverage(calorieValues),
                    protein: this.calculateAverage(proteinValues),
                    carbs: this.calculateAverage(carbsValues),
                    fat: this.calculateAverage(fatValues)
                }
            };
        } catch (error) {
            console.error('Error al analizar tendencias:', error);
            return null;
        }
    }

    // Generar etiquetas de fechas para un rango dado
    generateDateLabels(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dateLabels = [];
        
        const currentDate = new Date(start);
        while (currentDate <= end) {
            dateLabels.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return dateLabels;
    }

    // Calcular regresión lineal para detectar tendencias
    calculateLinearRegression(values) {
        if (values.length < 2) return 0;
        
        const n = values.length;
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumXX = 0;
        
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += values[i];
            sumXY += i * values[i];
            sumXX += i * i;
        }
        
        // Pendiente (m) de la línea de tendencia
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        
        return slope;
    }

    // Interpretar dirección de tendencia
    interpretTrendDirection(slope) {
        if (slope > 0.5) return 'aumento-significativo';
        if (slope > 0) return 'aumento-ligero';
        if (slope < -0.5) return 'disminucion-significativa';
        if (slope < 0) return 'disminucion-ligera';
        return 'estable';
    }

    // Analizar tendencia con respecto a objetivos
    analyzeTrend(slope, values, goal, nutrientName) {
        const average = this.calculateAverage(values);
        const lastValue = values[values.length - 1];
        const percentOfGoal = Math.round((average / goal) * 100);
        
        let analysis = '';
        
        if (slope > 0.5) {
            if (average < goal) {
                analysis = `Tu consumo de ${nutrientName.toLowerCase()} está aumentando. Si continúa esta tendencia, podrías alcanzar tu objetivo pronto.`;
            } else {
                analysis = `Tu consumo de ${nutrientName.toLowerCase()} está aumentando y ya supera tu objetivo. Considera moderar tu ingesta.`;
            }
        } else if (slope > 0) {
            if (average < goal) {
                analysis = `Tu consumo de ${nutrientName.toLowerCase()} está aumentando ligeramente, actualmente en el ${percentOfGoal}% de tu objetivo.`;
            } else {
                analysis = `Tu consumo de ${nutrientName.toLowerCase()} está aumentando ligeramente y ya alcanza el ${percentOfGoal}% de tu objetivo.`;
            }
        } else if (slope < -0.5) {
            if (average > goal) {
                analysis = `Tu consumo de ${nutrientName.toLowerCase()} está disminuyendo significativamente, lo que te ayudará a acercarte a tu objetivo.`;
            } else {
                analysis = `Tu consumo de ${nutrientName.toLowerCase()} está disminuyendo significativamente y está por debajo de tu objetivo. Considera aumentar la ingesta.`;
            }
        } else if (slope < 0) {
            if (average > goal) {
                analysis = `Tu consumo de ${nutrientName.toLowerCase()} está disminuyendo ligeramente, actualmente en el ${percentOfGoal}% de tu objetivo.`;
            } else {
                analysis = `Tu consumo de ${nutrientName.toLowerCase()} está disminuyendo ligeramente y está por debajo de tu objetivo (${percentOfGoal}%).`;
            }
        } else {
            if (Math.abs(average - goal) < goal * 0.1) {
                analysis = `Tu consumo de ${nutrientName.toLowerCase()} se mantiene estable y cerca de tu objetivo.`;
            } else if (average < goal) {
                analysis = `Tu consumo de ${nutrientName.toLowerCase()} se mantiene estable pero por debajo de tu objetivo (${percentOfGoal}%).`;
            } else {
                analysis = `Tu consumo de ${nutrientName.toLowerCase()} se mantiene estable pero por encima de tu objetivo (${percentOfGoal}%).`;
            }
        }
        
        return analysis;
    }

    // Calcular promedio de un array de valores
    calculateAverage(values) {
        if (values.length === 0) return 0;
        const sum = values.reduce((a, b) => a + b, 0);
        return Math.round(sum / values.length);
    }

    // Funciones auxiliares para obtener datos de la base de datos
    async getDailyLogsForDateRange(startDate, endDate) {
        try {
            // Implementar función para obtener logs diarios desde la BD
            // Placeholder - reemplazar con implementación real
            const dailyLogs = [];
            
            // Obtener todos los logs del rango de fechas
            const currentDate = new Date(startDate);
            const end = new Date(endDate);
            
            while (currentDate <= end) {
                const dateStr = currentDate.toISOString().split('T')[0];
                const log = await this.getDailyLogForDate(dateStr);
                
                if (log) {
                    dailyLogs.push(log);
                }
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            return dailyLogs;
        } catch (error) {
            console.error('Error al obtener registros diarios:', error);
            return [];
        }
    }

    async getDailyLogForDate(date) {
        try {
            return await nutriScanDB.getDailyLog(date);
        } catch (error) {
            console.error(`Error al obtener registro para ${date}:`, error);
            return null;
        }
    }

    async getScannedFoodHistory(limit) {
        try {
            return await nutriScanDB.getScannedFoodHistory(limit);
        } catch (error) {
            console.error('Error al obtener historial de alimentos:', error);
            return [];
        }
    }

    async getUserPreferences() {
        try {
            return await nutriScanDB.getUserPreferences();
        } catch (error) {
            console.error('Error al obtener preferencias de usuario:', error);
            return null;
        }
    }
}

// Exportar instancia única para uso en toda la aplicación
const nutritionStatistics = new NutritionStatistics();
export default nutritionStatistics; 