/**
 * ProductService - API handler for NutriPlan API (OpenFoodFacts proxy)
 * Handles product search and barcode lookup
 */
export class ProductService {
    constructor() {
        this.baseUrl = 'https://nutriplan-api.vercel.app/api/products';
    }

    /**
     * Get all product categories from the API
     * @param {number} limit - Maximum categories to return (default 50)
     */
    async getCategories(limit = 50) {
        try {
            const response = await fetch(`${this.baseUrl}/categories?limit=${limit}`);
            const data = await response.json();
            const categories = data.results || data.categories || [];
            return categories.map(cat => ({
                id: cat.id,
                name: cat.name,
                productCount: cat.products || cat.product_count || 0,
                url: cat.url
            }));
        } catch (error) {
            console.error('Error fetching product categories:', error);
            return [];
        }
    }

    /**
     * Get products by category
     * @param {string} category - Category name (e.g. "snacks", "beverages", "dairy")
     * @param {number} page - Page number
     * @param {number} limit - Results per page
     */
    async getProductsByCategory(category, page = 1, limit = 24) {
        try {
            const response = await fetch(
                `${this.baseUrl}/category/${encodeURIComponent(category)}?page=${page}&limit=${limit}`
            );
            const data = await response.json();
            const products = data.results || data.products || [];
            if (!Array.isArray(products)) {
                console.warn('Unexpected API response format:', data);
                return [];
            }
            return this.normalizeProducts(products);
        } catch (error) {
            console.error('Error fetching products by category:', error);
            return [];
        }
    }

    /**
     * Search products by name
     * @param {string} query - Search query
     * @param {number} page - Page number
     * @param {number} limit - Results per page
     */
    async searchProducts(query, page = 1, limit = 24) {
        try {
            const response = await fetch(
                `${this.baseUrl}/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`
            );
            const data = await response.json();
            // NutriPlan API returns results array (not products)
            const products = data.results || data.products || data.data || [];
            // Ensure it's an array
            if (!Array.isArray(products)) {
                console.warn('Unexpected API response format:', data);
                return [];
            }
            return this.normalizeProducts(products);
        } catch (error) {
            console.error('Error searching products:', error);
            return [];
        }
    }

    /**
     * Get product by barcode with complete data
     * Fetches from NutriPlan API (nutrition) and OpenFoodFacts (ingredients/allergens)
     * @param {string} barcode - Product barcode
     * @param {boolean} fetchIngredients - Whether to fetch ingredients from OpenFoodFacts (default: true)
     */
    async getProductByBarcode(barcode, fetchIngredients = true) {
        try {
            // Step 1: Get basic nutrition data from NutriPlan API
            const response = await fetch(`${this.baseUrl}/barcode/${barcode}`);
            const data = await response.json();
            const product = data.result || data.product || data.data || data;

            if (!product || !(product.code || product.barcode || product.id || product.name)) {
                return null;
            }

            // Normalize basic product data
            let normalizedProduct = this.normalizeProduct(product);

            // Step 2: If ingredients are missing, fetch from OpenFoodFacts directly
            if (fetchIngredients && !normalizedProduct.ingredients) {
                try {
                    const offData = await this.getProductDetailsFromOpenFoodFacts(barcode);

                    if (offData) {
                        // Merge OpenFoodFacts data
                        normalizedProduct = {
                            ...normalizedProduct,
                            ingredients: offData.ingredients || '',
                            allergens: offData.allergens || '',
                            allergensHierarchy: offData.allergensHierarchy || [],
                            allergensTags: offData.allergensTags || [],
                            traces: offData.traces || '',
                            tracesTags: offData.tracesTags || [],
                            ingredientsAnalysis: offData.ingredientsAnalysis || [],
                            additives: offData.additives || [],
                            // Use better image if available
                            image: normalizedProduct.image || offData.image,
                            imageIngredients: offData.imageIngredients
                        };
                    }
                } catch (offError) {
                    console.warn('Could not fetch ingredients from OpenFoodFacts:', offError);
                    // Continue with NutriPlan data only
                }
            }

            return normalizedProduct;
        } catch (error) {
            console.error('Error fetching product:', error);
            return null;
        }
    }

    /**
     * Fetch full product details directly from OpenFoodFacts API
     * This is used to get ingredients and allergens that NutriPlan API doesn't provide
     * @param {string} barcode - Product barcode
     * @returns {Promise<object>} Product details with ingredients and allergens
     */
    async getProductDetailsFromOpenFoodFacts(barcode) {
        try {
            const response = await fetch(
                `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
            );

            if (!response.ok) {
                return null;
            }

            const data = await response.json();

            if (data.status !== 1 || !data.product) {
                return null;
            }

            const product = data.product;

            return {
                ingredients: product.ingredients_text || product.ingredients_text_en || '',
                allergens: product.allergens || product.allergens_tags?.join(', ') || '',
                allergensHierarchy: product.allergens_hierarchy || [],
                allergensTags: product.allergens_tags || [],
                traces: product.traces || product.traces_tags?.join(', ') || '',
                tracesTags: product.traces_tags || [],
                ingredientsAnalysis: product.ingredients_analysis_tags || [],
                additives: product.additives_tags || [],
                image: product.image_front_url || product.image_url || null,
                imageIngredients: product.image_ingredients_url || null
            };
        } catch (error) {
            console.error('Error fetching from OpenFoodFacts:', error);
            return null;
        }
    }

    /**
     * Normalize product data for consistent format
     * @param {object} product - Raw product from API
     */
    normalizeProduct(product) {
        // NutriPlan API uses 'nutrients' key for nutrition data
        const nutrients = product.nutrients || product.nutriments || product.nutrition || {};

        // Check if already has nutrients from NutriPlan API (pre-normalized)
        if (product.nutrients && typeof product.nutrients.calories === 'number') {
            return {
                id: product.barcode || product.id || product.code || product._id,
                barcode: product.barcode || product.code,
                name: product.name || product.product_name || 'Unknown Product',
                brand: product.brand || product.brands || 'Unknown Brand',
                image: product.image || product.image_front_url || product.image_url || null,
                quantity: product.quantity || '',
                categories: product.categories || '',
                nutriScore: product.nutritionGrade || product.nutriScore || product.nutrition_grades || null,
                novaGroup: product.novaGroup || product.nova_group || null,
                ingredients: product.ingredients || product.ingredients_text || '',
                servingSize: product.servingSize || product.serving_size || '',
                nutrition: {
                    calories: Math.round(nutrients.calories || 0),
                    caloriesPer100g: Math.round(nutrients.calories || 0),
                    protein: Math.round((nutrients.protein || 0) * 10) / 10,
                    carbs: Math.round((nutrients.carbs || 0) * 10) / 10,
                    fat: Math.round((nutrients.fat || 0) * 10) / 10,
                    sugar: Math.round((nutrients.sugar || 0) * 10) / 10,
                    fiber: Math.round((nutrients.fiber || 0) * 10) / 10,
                    salt: Math.round((nutrients.sodium || nutrients.salt || 0) * 1000) / 1000,
                    sodium: Math.round((nutrients.sodium || nutrients.salt || 0) * 1000) / 1000,
                    saturatedFat: Math.round((nutrients.saturatedFat || nutrients['saturated-fat'] || 0) * 10) / 10
                }
            };
        }

        // Original normalization for raw OpenFoodFacts data
        return {
            id: product.code || product._id,
            barcode: product.code,
            name: product.product_name || 'Unknown Product',
            brand: product.brands || 'Unknown Brand',
            image: product.image_front_url || product.image_url || null,
            quantity: product.quantity || '',
            categories: product.categories || '',
            nutriScore: product.nutrition_grades || null,
            novaGroup: product.nova_group || null,
            ingredients: product.ingredients_text || '',
            servingSize: product.serving_size || '',
            nutrition: {
                calories: Math.round(nutrients['energy-kcal_100g'] || nutrients.energy_100g / 4.184 || 0),
                caloriesPer100g: Math.round(nutrients['energy-kcal_100g'] || nutrients.energy_100g / 4.184 || 0),
                protein: Math.round((nutrients.proteins_100g || 0) * 10) / 10,
                carbs: Math.round((nutrients.carbohydrates_100g || 0) * 10) / 10,
                fat: Math.round((nutrients.fat_100g || 0) * 10) / 10,
                sugar: Math.round((nutrients.sugars_100g || 0) * 10) / 10,
                fiber: Math.round((nutrients.fiber_100g || 0) * 10) / 10,
                salt: Math.round((nutrients.salt_100g || 0) * 1000) / 1000,
                sodium: Math.round((nutrients.salt_100g || 0) * 1000) / 1000,
                saturatedFat: Math.round((nutrients['saturated-fat_100g'] || 0) * 10) / 10
            }
        };
    }

    /**
     * Normalize array of products
     * @param {array} products - Raw products array
     */
    normalizeProducts(products) {
        return products
            .filter(p => p.product_name || p.name) // Only products with names
            .map(p => this.normalizeProduct(p));
    }

    /**
     * Get Nutri-Score color class
     * @param {string} grade - Nutri-Score grade (a-e)
     */
    getNutriScoreColor(grade) {
        const colors = {
            'a': 'bg-green-500',
            'b': 'bg-lime-500',
            'c': 'bg-yellow-500',
            'd': 'bg-orange-500',
            'e': 'bg-red-500'
        };
        return colors[grade?.toLowerCase()] || 'bg-gray-500';
    }

    /**
     * Get NOVA group color class
     * @param {number} group - NOVA group (1-4)
     */
    getNovaGroupColor(group) {
        const colors = {
            1: 'bg-green-500',
            2: 'bg-lime-500',
            3: 'bg-yellow-500',
            4: 'bg-red-500'
        };
        return colors[group] || 'bg-gray-500';
    }
}
