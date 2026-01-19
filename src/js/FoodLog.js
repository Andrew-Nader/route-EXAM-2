/**
 * FoodLog - LocalStorage management for food tracking
 * Handles all food log operations with date-based storage
 */
export class FoodLog {
    constructor() {
        this.storageKey = 'nutriplan_foodlog';
        this.dailyTargets = {
            calories: 2000,
            protein: 50,
            carbs: 250,
            fat: 65
        };
    }

    /**
     * Get the storage key for a specific date
     * @param {Date} date - The date
     */
    getDateKey(date = new Date()) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Get all log data from LocalStorage
     */
    getAllData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error reading food log:', error);
            return {};
        }
    }

    /**
     * Save all log data to LocalStorage
     * @param {object} data - The data to save
     */
    saveAllData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving food log:', error);
        }
    }

    /**
     * Add an item to the food log
     * @param {object} item - The food item to add
     */
    addItem(item) {
        const data = this.getAllData();
        const dateKey = this.getDateKey();

        if (!data[dateKey]) {
            data[dateKey] = [];
        }

        const logEntry = {
            id: Date.now().toString(),
            name: item.name,
            type: item.type || 'meal', // 'meal' or 'product'
            image: item.image || null,
            calories: item.calories || 0,
            protein: item.protein || 0,
            carbs: item.carbs || 0,
            fat: item.fat || 0,
            quantity: item.quantity || 1,
            timestamp: new Date().toISOString()
        };

        data[dateKey].push(logEntry);
        this.saveAllData(data);
        return logEntry;
    }

    /**
     * Remove an item from the food log
     * @param {string} itemId - The item ID to remove
     * @param {string} dateKey - Optional date key
     */
    removeItem(itemId, dateKey = null) {
        const data = this.getAllData();
        const key = dateKey || this.getDateKey();

        if (data[key]) {
            data[key] = data[key].filter(item => item.id !== itemId);
            this.saveAllData(data);
        }
    }

    /**
     * Get items for today
     */
    getTodayItems() {
        const data = this.getAllData();
        const dateKey = this.getDateKey();
        return data[dateKey] || [];
    }

    /**
     * Get items for a specific date
     * @param {Date} date - The date
     */
    getItemsByDate(date) {
        const data = this.getAllData();
        const dateKey = this.getDateKey(date);
        return data[dateKey] || [];
    }

    /**
     * Clear all items for today
     */
    clearToday() {
        const data = this.getAllData();
        const dateKey = this.getDateKey();
        delete data[dateKey];
        this.saveAllData(data);
    }

    /**
     * Get totals for today
     */
    getTodayTotals() {
        const items = this.getTodayItems();
        return this.calculateTotals(items);
    }

    /**
     * Calculate totals from items array
     * @param {array} items - Array of food items
     */
    calculateTotals(items) {
        return items.reduce((totals, item) => {
            const qty = item.quantity || 1;
            return {
                calories: totals.calories + (item.calories * qty),
                protein: totals.protein + (item.protein * qty),
                carbs: totals.carbs + (item.carbs * qty),
                fat: totals.fat + (item.fat * qty)
            };
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    }

    /**
     * Get weekly data for chart
     */
    getWeeklyData() {
        const data = this.getAllData();
        const weekData = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = this.getDateKey(date);
            const items = data[dateKey] || [];
            const totals = this.calculateTotals(items);

            weekData.push({
                date: dateKey,
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                ...totals
            });
        }

        return weekData;
    }

    /**
     * Check if user exceeded daily calorie limit
     */
    isCalorieExceeded() {
        const totals = this.getTodayTotals();
        return totals.calories > this.dailyTargets.calories;
    }

    /**
     * Get progress percentages for each nutrient
     */
    getProgress() {
        const totals = this.getTodayTotals();
        return {
            calories: Math.min(100, (totals.calories / this.dailyTargets.calories) * 100),
            protein: Math.min(100, (totals.protein / this.dailyTargets.protein) * 100),
            carbs: Math.min(100, (totals.carbs / this.dailyTargets.carbs) * 100),
            fat: Math.min(100, (totals.fat / this.dailyTargets.fat) * 100)
        };
    }

    /**
     * Get formatted date string
     * @param {Date} date - The date
     */
    formatDate(date = new Date()) {
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        });
    }
}
