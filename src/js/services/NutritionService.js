/**
 * NutritionService - API handler for NutriPlan Nutrition API (USDA proxy)
 * Handles food nutrition data and recipe analysis
 * NOTE: All endpoints require a USDA API key in the x-api-key header
 * Get your key at: https://fdc.nal.usda.gov/api-key-signup.html
 */
export class NutritionService {
    constructor(apiKey = null) {
        this.baseUrl = 'https://nutriplan-api.vercel.app/api/nutrition';
        this.apiKey = apiKey;
    }

    /**
     * Set the USDA API key
     * @param {string} apiKey - Your USDA API key
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * Check if API key is configured
     * @returns {boolean}
     */
    hasApiKey() {
        return !!this.apiKey;
    }

    /**
     * Get headers with API key
     * @returns {object}
     */
    getHeaders() {
        if (!this.apiKey) {
            throw new Error('USDA API key required. Get one at https://fdc.nal.usda.gov/api-key-signup.html');
        }
        return {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Search USDA foods
     * @param {string} query - Search term
     * @param {number} page - Page number (default 1)
     * @returns {Promise<Array>} Array of food results
     */
    async searchFoods(query, page = 1) {
        try {
            const response = await fetch(
                `${this.baseUrl}/search?q=${encodeURIComponent(query)}&page=${page}`,
                { headers: this.getHeaders() }
            );

            if (response.status === 401) {
                throw new Error('API key required. Provide your USDA API key.');
            }
            if (response.status === 403) {
                throw new Error('Invalid API key.');
            }

            const data = await response.json();
            return {
                results: data.results || [],
                pagination: data.pagination || {
                    total: 0,
                    totalPages: 0,
                    currentPage: page,
                    limit: 25
                }
            };
        } catch (error) {
            console.error('Error searching foods:', error);
            throw error;
        }
    }

    /**
     * Get food details by USDA Food ID
     * @param {string|number} id - USDA Food ID
     * @returns {Promise<object>} Food details with nutrients
     */
    async getFoodById(id) {
        try {
            const response = await fetch(
                `${this.baseUrl}/food/${id}`,
                { headers: this.getHeaders() }
            );

            if (response.status === 401) {
                throw new Error('API key required. Provide your USDA API key.');
            }
            if (response.status === 403) {
                throw new Error('Invalid API key.');
            }

            const data = await response.json();
            return data.result || null;
        } catch (error) {
            console.error('Error fetching food:', error);
            throw error;
        }
    }

    /**
     * Analyze a recipe to get comprehensive nutrition data
     * @param {string} recipeName - Recipe name
     * @param {Array<string>} ingredients - Array of ingredient strings (e.g., "2 tbsp Soy Sauce")
     * @returns {Promise<object>} Analysis result with comprehensive nutrition data
     */
    async analyzeRecipe(recipeName, ingredients) {
        try {
            const response = await fetch(
                `${this.baseUrl}/analyze`,
                {
                    method: 'POST',
                    headers: this.getHeaders(),
                    body: JSON.stringify({ recipeName, ingredients })
                }
            );

            if (response.status === 401) {
                throw new Error('API key required. Provide your USDA API key.');
            }
            if (response.status === 403) {
                throw new Error('Invalid API key.');
            }
            if (response.status === 400) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Invalid request');
            }

            const result = await response.json();

            // API returns: { success: true, data: { recipeName, servings, totalWeight, totals, perServing, ingredients } }
            if (!result.success) {
                throw new Error(result.error?.message || 'Recipe analysis failed');
            }

            return {
                success: true,
                recipeName: result.data.recipeName,
                servings: result.data.servings,
                totalWeight: result.data.totalWeight,
                totals: result.data.totals || {
                    calories: 0,
                    protein: 0,
                    fat: 0,
                    carbs: 0,
                    fiber: 0,
                    sugar: 0,
                    saturatedFat: 0,
                    cholesterol: 0,
                    sodium: 0
                },
                perServing: result.data.perServing || {
                    calories: 0,
                    protein: 0,
                    fat: 0,
                    carbs: 0,
                    fiber: 0,
                    sugar: 0,
                    saturatedFat: 0,
                    cholesterol: 0,
                    sodium: 0
                },
                ingredients: result.data.ingredients || []
            };
        } catch (error) {
            console.error('Error analyzing recipe:', error);
            throw error;
        }
    }

    /**
     * Normalize food data for consistent format
     * @param {object} food - Raw food from API
     */
    normalizeFood(food) {
        const nutrients = food.nutrients || {};
        return {
            id: food.id,
            description: food.description || 'Unknown Food',
            brand: food.brand || null,
            nutrition: {
                calories: Math.round(nutrients.calories || 0),
                protein: Math.round((nutrients.protein || 0) * 10) / 10,
                carbs: Math.round((nutrients.carbs || 0) * 10) / 10,
                fat: Math.round((nutrients.fat || 0) * 10) / 10
            }
        };
    }
}
