/**
 * NutriPlan - Main Entry Point
 * Initializes all modules and wires the app together
 * Version 1.14 - Integrated NutritionService for real USDA nutrition data
 */

// Import core classes - v1.13 cache bust
import { Router } from './Router.js?v=1.13';
import { FoodLog } from './FoodLog.js?v=1.13';

// Import configuration
import { USDA_API_KEY } from './config.js?v=1.13';

// Import services
import { MealService } from './services/MealService.js?v=1.13';
import { ProductService } from './services/ProductService.js?v=1.13';
import { NutritionService } from './services/NutritionService.js?v=1.13';

// Import UI controllers
import { UIController } from './ui/UIController.js?v=1.13';
import { MealsUI } from './ui/MealsUI.js?v=1.13';
import { FoodLogUI } from './ui/FoodLogUI.js?v=1.13';
import { ProductsUI } from './ui/ProductsUI.js?v=1.13';


/**
 * Main App Class - Orchestrates all components
 */
class NutriPlanApp {
    constructor() {
        // Initialize core services
        this.router = new Router();
        this.foodLog = new FoodLog();
        this.mealService = new MealService();
        this.productService = new ProductService();
        this.nutritionService = new NutritionService(USDA_API_KEY);  // USDA nutrition API with configured key

        // Initialize UI controllers
        this.uiController = new UIController();
        this.mealsUI = new MealsUI(this.mealService, this.foodLog, this.uiController, this.router, this.nutritionService);
        this.foodLogUI = new FoodLogUI(this.foodLog, this.uiController, this.router);
        this.productsUI = new ProductsUI(this.productService, this.foodLog, this.uiController);

        // Make productsUI globally accessible for modal onclick handlers
        window.productsUI = this.productsUI;

        // Bind route change handler
        this.router.onRouteChange = (route, mealId) => this.handleRouteChange(route, mealId);
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('🥗 NutriPlan initializing...');

        try {
            // Setup navigation
            this.setupNavigation();

            // Load initial data for all UI components
            await Promise.all([
                this.mealsUI.loadInitialData(),
                this.productsUI.initialize()
            ]);

            // Initialize router (handles current URL)
            this.router.init();

            // Hide loading overlay
            this.uiController.hideLoading();

            console.log('✅ NutriPlan ready!');
        } catch (error) {
            console.error('❌ Error initializing app:', error);
            this.uiController.hideLoading();
        }
    }

    /**
     * Setup sidebar navigation click handlers
     */
    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const routes = ['/home', '/scanner', '/foodlog'];

        navLinks.forEach((link, index) => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.router.navigate(routes[index]);
            });
        });
    }

    /**
     * Handle route changes
     */
    handleRouteChange(route, mealId) {
        console.log(`📍 Route changed to: ${route}`, mealId ? `(meal: ${mealId})` : '');

        // Show the appropriate page
        this.uiController.showPage(route);

        // Handle page-specific logic
        switch (route) {
            case 'home':
                // Home page is already loaded
                break;

            case 'meal-details':
                if (mealId) {
                    this.mealsUI.loadMealDetails(mealId);
                }
                break;

            case 'scanner':
                // Product scanner - ready for user input
                break;

            case 'foodlog':
                // Render food log with latest data
                this.foodLogUI.render();
                break;
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new NutriPlanApp();
    app.init();
});
