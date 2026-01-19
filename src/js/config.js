/**
 * NutriPlan Configuration
 * Contains API keys and application settings
 * 
 * IMPORTANT: In production, move sensitive keys to environment variables
 * or a secure backend service. Never commit API keys to public repositories.
 */

export const config = {
    // USDA FoodData Central API Key
    // Get your key at: https://fdc.nal.usda.gov/api-key-signup.html
    usda: {
        apiKey: 'DOGJb8W27gF7QVf0Nvwp2B2RN5ietyfk4gM4Qt1Z'
    },

    // API endpoints
    api: {
        nutritionBaseUrl: 'https://nutriplan-api.vercel.app/api/nutrition'
    },

    // App settings
    app: {
        name: 'NutriPlan',
        version: '1.13',
        defaultServingSize: 100, // grams
        maxSearchResults: 25
    }
};

// Export individual configs for convenience
export const USDA_API_KEY = config.usda.apiKey;
export const NUTRITION_API_URL = config.api.nutritionBaseUrl;
