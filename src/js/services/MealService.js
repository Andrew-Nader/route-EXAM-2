/**
 * MealService - API handler for NutriPlan API (TheMealDB proxy)
 * Handles all meal-related API calls
 */
export class MealService {
    constructor() {
        this.baseUrl = 'https://nutriplan-api.vercel.app/api/meals';
        this.cache = new Map();
    }

    /**
     * Fetch all categories
     */
    async getCategories() {
        if (this.cache.has('categories')) {
            return this.cache.get('categories');
        }

        try {
            const response = await fetch(`${this.baseUrl}/categories`);
            const data = await response.json();
            // NutriPlan API returns 'results' array for categories
            const categories = data.results || data.categories || data.data || [];
            this.cache.set('categories', categories);
            return categories;
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    }

    /**
     * Fetch all areas/cuisines
     */
    async getAreas() {
        if (this.cache.has('areas')) {
            return this.cache.get('areas');
        }

        try {
            const response = await fetch(`${this.baseUrl}/areas`);
            const data = await response.json();
            // NutriPlan API returns 'results' array for areas
            const areas = data.results || data.areas || data.data || [];
            this.cache.set('areas', areas);
            return areas;
        } catch (error) {
            console.error('Error fetching areas:', error);
            return [];
        }
    }

    /**
     * Fetch meals with pagination
     * @param {number} page - Page number
     * @param {number} limit - Results per page
     */
    async getMeals(page = 1, limit = 25) {
        try {
            // Use search with empty query to get all meals, or use random
            const response = await fetch(`${this.baseUrl}/random?count=${limit}`);
            const data = await response.json();
            // NutriPlan API returns 'results' array
            return data.results || data.meals || data.data || [];
        } catch (error) {
            console.error('Error fetching meals:', error);
            return [];
        }
    }

    /**
     * Get meal by ID
     * @param {string} id - Meal ID
     */
    async getMealById(id) {
        const cacheKey = `meal_${id}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(`${this.baseUrl}/${id}`);
            const data = await response.json();
            // NutriPlan API returns 'result' (singular) for single meal
            const meal = data.result || data.meal || data.data || data;
            if (meal && (meal.id || meal.idMeal || meal.name)) {
                this.cache.set(cacheKey, meal);
                return meal;
            }
            return null;
        } catch (error) {
            console.error('Error fetching meal:', error);
            return null;
        }
    }

    /**
     * Filter meals by category
     * @param {string} category - Category name
     * @param {number} page - Page number
     * @param {number} limit - Results per page
     */
    async filterByCategory(category, page = 1, limit = 25) {
        try {
            const response = await fetch(
                `${this.baseUrl}/filter?category=${encodeURIComponent(category)}&page=${page}&limit=${limit}`
            );
            const data = await response.json();
            return data.results || data.meals || data.data || [];
        } catch (error) {
            console.error('Error filtering by category:', error);
            return [];
        }
    }

    /**
     * Filter meals by area/cuisine
     * @param {string} area - Area name
     * @param {number} page - Page number
     * @param {number} limit - Results per page
     */
    async filterByArea(area, page = 1, limit = 25) {
        try {
            const response = await fetch(
                `${this.baseUrl}/filter?area=${encodeURIComponent(area)}&page=${page}&limit=${limit}`
            );
            const data = await response.json();
            return data.results || data.meals || data.data || [];
        } catch (error) {
            console.error('Error filtering by area:', error);
            return [];
        }
    }

    /**
     * Filter meals by ingredient
     * @param {string} ingredient - Ingredient name
     * @param {number} page - Page number
     * @param {number} limit - Results per page
     */
    async filterByIngredient(ingredient, page = 1, limit = 25) {
        try {
            const response = await fetch(
                `${this.baseUrl}/filter?ingredient=${encodeURIComponent(ingredient)}&page=${page}&limit=${limit}`
            );
            const data = await response.json();
            return data.results || data.meals || data.data || [];
        } catch (error) {
            console.error('Error filtering by ingredient:', error);
            return [];
        }
    }

    /**
     * Search meals by name
     * @param {string} query - Search query
     * @param {number} page - Page number
     * @param {number} limit - Results per page
     */
    async searchMeals(query, page = 1, limit = 25) {
        try {
            const response = await fetch(
                `${this.baseUrl}/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
            );
            const data = await response.json();
            return data.results || data.meals || data.data || [];
        } catch (error) {
            console.error('Error searching meals:', error);
            return [];
        }
    }

    /**
     * Search meals by first letter
     * @param {string} letter - First letter
     * @param {number} page - Page number
     * @param {number} limit - Results per page
     */
    async searchByLetter(letter, page = 1, limit = 25) {
        try {
            const response = await fetch(
                `${this.baseUrl}/search?f=${encodeURIComponent(letter)}&page=${page}&limit=${limit}`
            );
            const data = await response.json();
            return data.results || data.meals || data.data || [];
        } catch (error) {
            console.error('Error searching by letter:', error);
            return [];
        }
    }

    /**
     * Get random meals
     * @param {number} count - Number of random meals
     */
    async getRandomMeals(count = 1) {
        try {
            const response = await fetch(`${this.baseUrl}/random?count=${count}`);
            const data = await response.json();
            return data.results || data.meals || data.data || [];
        } catch (error) {
            console.error('Error fetching random meals:', error);
            return [];
        }
    }

    /**
     * Extract ingredients from meal object
     * @param {object} meal - Meal object
     */
    getIngredients(meal) {
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ingredient && ingredient.trim()) {
                ingredients.push({
                    ingredient: ingredient.trim(),
                    measure: measure ? measure.trim() : ''
                });
            }
        }
        return ingredients;
    }

    /**
     * Calculate estimated nutrition based on ingredients
     * This is an estimation since TheMealDB doesn't provide nutrition data
     * @param {object} meal - Meal object
     */
    estimateNutrition(meal) {
        // Base estimation values (realistic averages)
        const ingredients = this.getIngredients(meal);
        const numIngredients = ingredients.length;

        // Calculate based on category and ingredient count
        let baseCalories = 350;
        let baseProtein = 25;
        let baseCarbs = 35;
        let baseFat = 12;
        let baseSaturatedFat = 4;
        let baseCholesterol = 45;
        let baseSodium = 400;

        // Vitamins & Minerals (% Daily Value)
        let vitaminA = 10;
        let vitaminC = 15;
        let vitaminD = 5;
        let calcium = 6;
        let iron = 10;
        let potassium = 350;

        // Diet labels array
        let dietLabels = [];

        const category = (meal.category || meal.strCategory || '').toLowerCase();

        // Adjust based on category
        if (category.includes('beef') || category.includes('lamb')) {
            baseCalories = 450;
            baseProtein = 38;
            baseFat = 22;
            baseSaturatedFat = 9;
            baseCholesterol = 95;
            baseSodium = 520;
            vitaminA = 8;
            vitaminC = 5;
            iron = 25;
            potassium = 450;
            dietLabels = ['High-Protein'];
        } else if (category.includes('chicken')) {
            baseCalories = 380;
            baseProtein = 35;
            baseFat = 14;
            baseSaturatedFat = 4;
            baseCholesterol = 85;
            baseSodium = 480;
            vitaminA = 6;
            vitaminC = 10;
            iron = 12;
            potassium = 380;
            dietLabels = ['High-Protein', 'Low-Carb'];
        } else if (category.includes('seafood')) {
            baseCalories = 300;
            baseProtein = 32;
            baseFat = 10;
            baseSaturatedFat = 2;
            baseCholesterol = 65;
            baseSodium = 550;
            vitaminA = 15;
            vitaminC = 8;
            vitaminD = 25;
            iron = 8;
            potassium = 420;
            dietLabels = ['High-Protein', 'Low-Carb', 'Heart-Healthy'];
        } else if (category.includes('vegetarian') || category.includes('vegan')) {
            baseCalories = 280;
            baseProtein = 15;
            baseCarbs = 45;
            baseFat = 10;
            baseSaturatedFat = 2;
            baseCholesterol = 0;
            baseSodium = 350;
            vitaminA = 35;
            vitaminC = 45;
            calcium = 12;
            iron = 15;
            potassium = 550;
            dietLabels = ['Vegetarian', 'Low-Fat'];
            if (category.includes('vegan')) {
                dietLabels = ['Vegan', 'Dairy-Free', 'Low-Fat'];
            }
        } else if (category.includes('dessert')) {
            baseCalories = 420;
            baseProtein = 6;
            baseCarbs = 58;
            baseFat = 18;
            baseSaturatedFat = 10;
            baseCholesterol = 55;
            baseSodium = 280;
            vitaminA = 8;
            vitaminC = 4;
            calcium = 8;
            dietLabels = ['Indulgent'];
        } else if (category.includes('pasta')) {
            baseCalories = 400;
            baseCarbs = 55;
            baseProtein = 18;
            baseSaturatedFat = 5;
            baseCholesterol = 35;
            baseSodium = 620;
            iron = 18;
            dietLabels = ['Comfort-Food'];
        } else if (category.includes('side') || category.includes('starter')) {
            baseCalories = 180;
            baseProtein = 8;
            baseCarbs = 25;
            baseFat = 6;
            baseSaturatedFat = 2;
            baseCholesterol = 15;
            baseSodium = 320;
            vitaminA = 20;
            vitaminC = 25;
            dietLabels = ['Light'];
        } else if (category.includes('breakfast')) {
            baseCalories = 350;
            baseProtein = 18;
            baseCarbs = 40;
            baseFat = 14;
            baseSaturatedFat = 5;
            baseCholesterol = 180;
            baseSodium = 450;
            vitaminA = 15;
            vitaminD = 15;
            calcium = 15;
            dietLabels = ['Breakfast'];
        }

        // Slight variation based on ingredient count
        const variation = 1 + (numIngredients - 8) * 0.03;

        return {
            calories: Math.round(baseCalories * variation),
            protein: Math.round(baseProtein * variation),
            carbs: Math.round(baseCarbs * variation),
            fat: Math.round(baseFat * variation),
            fiber: Math.round(4 + Math.random() * 4),
            sugar: Math.round(8 + Math.random() * 10),
            saturatedFat: Math.round(baseSaturatedFat * variation),
            cholesterol: Math.round(baseCholesterol * variation),
            sodium: Math.round(baseSodium * variation),
            vitaminA: Math.round(vitaminA + Math.random() * 10),
            vitaminC: Math.round(vitaminC + Math.random() * 15),
            vitaminD: Math.round(vitaminD),
            calcium: Math.round(calcium + Math.random() * 5),
            iron: Math.round(iron + Math.random() * 8),
            potassium: Math.round(potassium + Math.random() * 100),
            dietLabels: dietLabels,
            servings: 4
        };
    }
}
