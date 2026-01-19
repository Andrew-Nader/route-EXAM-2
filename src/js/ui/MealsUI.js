/**
 * MealsUI - Handles rendering for the Meals/Home page
 * Manages meal cards, categories, and meal details
 */
export class MealsUI {
    constructor(mealService, foodLog, uiController, router, nutritionService = null) {
        this.mealService = mealService;
        this.foodLog = foodLog;
        this.uiController = uiController;
        this.router = router;
        this.nutritionService = nutritionService;

        this.elements = {
            categoriesGrid: document.getElementById('categories-grid'),
            recipesGrid: document.getElementById('recipes-grid'),
            recipesCount: document.getElementById('recipes-count'),
            searchInput: document.getElementById('search-input'),
            viewToggle: document.getElementById('view-toggle'),
            gridViewBtn: document.getElementById('grid-view-btn'),
            listViewBtn: document.getElementById('list-view-btn'),
            backBtn: document.getElementById('back-to-meals-btn')
        };

        this.currentView = 'grid';
        this.allMeals = [];
        this.filteredMeals = [];
        this.areas = [];

        this.initEventListeners();
    }

    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Search input
        this.elements.searchInput?.addEventListener('input',
            this.debounce((e) => this.handleSearch(e.target.value), 300)
        );

        // View toggle
        this.elements.gridViewBtn?.addEventListener('click', () => this.setView('grid'));
        this.elements.listViewBtn?.addEventListener('click', () => this.setView('list'));

        // Back button
        this.elements.backBtn?.addEventListener('click', () => {
            this.router.navigate('/home');
        });

        // Log meal button (opens modal)
        document.getElementById('log-meal-btn')?.addEventListener('click', (e) => {
            this.openLogMealModal();
        });
    }

    /**
     * Debounce helper function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Load and display initial data
     */
    async loadInitialData() {
        try {
            // Load categories, areas, and meals in parallel
            const [categories, areas, meals] = await Promise.all([
                this.mealService.getCategories(),
                this.mealService.getAreas(),
                this.mealService.getMeals()
            ]);

            this.allMeals = meals;
            this.filteredMeals = meals;
            this.areas = areas;

            this.renderCategories(categories);
            this.renderAreaFilters(areas);
            this.renderMeals(meals);
            this.updateRecipeCount(meals.length);

        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    /**
     * Render category cards
     * @param {array} categories - Categories array
     */
    renderCategories(categories) {
        const grid = this.elements.categoriesGrid;
        if (!grid) return;

        const categoryIcons = {
            'Beef': 'fa-drumstick-bite',
            'Chicken': 'fa-drumstick-bite',
            'Dessert': 'fa-ice-cream',
            'Lamb': 'fa-drumstick-bite',
            'Miscellaneous': 'fa-utensils',
            'Pasta': 'fa-wheat-awn',
            'Pork': 'fa-bacon',
            'Seafood': 'fa-fish',
            'Side': 'fa-plate-wheat',
            'Starter': 'fa-utensils',
            'Vegan': 'fa-leaf',
            'Vegetarian': 'fa-carrot',
            'Breakfast': 'fa-egg',
            'Goat': 'fa-drumstick-bite'
        };

        // Each category gets a unique color scheme to match the design
        const categoryColors = {
            'Beef': { bg: 'from-orange-400 to-red-500', border: 'border-orange-200 hover:border-orange-400', card: 'from-orange-50 to-red-50' },
            'Chicken': { bg: 'from-green-400 to-emerald-500', border: 'border-green-200 hover:border-green-400', card: 'from-green-50 to-emerald-50' },
            'Dessert': { bg: 'from-blue-400 to-indigo-500', border: 'border-blue-200 hover:border-blue-400', card: 'from-blue-50 to-indigo-50' },
            'Lamb': { bg: 'from-amber-400 to-orange-500', border: 'border-amber-200 hover:border-amber-400', card: 'from-amber-50 to-orange-50' },
            'Miscellaneous': { bg: 'from-gray-500 to-gray-600', border: 'border-gray-200 hover:border-gray-400', card: 'from-gray-50 to-gray-50' },
            'Pasta': { bg: 'from-yellow-400 to-amber-500', border: 'border-yellow-200 hover:border-yellow-400', card: 'from-yellow-50 to-amber-50' },
            'Pork': { bg: 'from-pink-400 to-rose-500', border: 'border-pink-200 hover:border-pink-400', card: 'from-pink-50 to-rose-50' },
            'Seafood': { bg: 'from-cyan-400 to-teal-500', border: 'border-cyan-200 hover:border-cyan-400', card: 'from-cyan-50 to-teal-50' },
            'Side': { bg: 'from-teal-400 to-cyan-500', border: 'border-teal-200 hover:border-teal-400', card: 'from-teal-50 to-cyan-50' },
            'Starter': { bg: 'from-indigo-600 to-purple-600', border: 'border-indigo-200 hover:border-indigo-400', card: 'from-indigo-100 to-purple-50' },
            'Vegan': { bg: 'from-lime-400 to-green-500', border: 'border-lime-200 hover:border-lime-400', card: 'from-lime-50 to-green-50' },
            'Vegetarian': { bg: 'from-emerald-400 to-green-500', border: 'border-emerald-200 hover:border-emerald-400', card: 'from-emerald-50 to-green-50' },
            'Breakfast': { bg: 'from-orange-300 to-yellow-400', border: 'border-orange-200 hover:border-orange-400', card: 'from-orange-50 to-yellow-50' },
            'Goat': { bg: 'from-stone-400 to-amber-500', border: 'border-stone-200 hover:border-stone-400', card: 'from-stone-50 to-amber-50' }
        };

        const defaultColor = { bg: 'from-emerald-400 to-green-500', border: 'border-emerald-200 hover:border-emerald-400', card: 'from-emerald-50 to-teal-50' };

        grid.innerHTML = categories.slice(0, 12).map(cat => {
            const categoryName = cat.name || cat.strCategory;
            const colors = categoryColors[categoryName] || defaultColor;
            return `
            <div class="category-card bg-gradient-to-br ${colors.card} rounded-xl p-3 border ${colors.border} hover:shadow-md cursor-pointer transition-all group"
                 data-category="${categoryName}">
                <div class="flex items-center gap-2.5">
                    <div class="text-white w-9 h-9 bg-gradient-to-br ${colors.bg} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <i class="fa-solid ${categoryIcons[categoryName] || 'fa-utensils'}"></i>
                    </div>
                    <div>
                        <h3 class="text-sm font-bold text-gray-900">${categoryName}</h3>
                    </div>
                </div>
            </div>
        `}).join('');

        // Add click handlers
        grid.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                this.filterByCategory(card.dataset.category);
            });
        });
    }

    /**
     * Render area/cuisine filter buttons
     * @param {array} areas - Areas array
     */
    renderAreaFilters(areas) {
        const container = this.elements.searchInput?.closest('section')?.querySelector('.overflow-x-auto');
        if (!container) return;

        const buttons = [
            `<button class="area-filter-btn px-4 py-2 bg-emerald-600 text-white rounded-full font-medium text-sm whitespace-nowrap hover:bg-emerald-700 transition-all" data-area="">
                All Cuisines
            </button>`
        ];

        areas.slice(0, 10).forEach(area => {
            const areaName = area.name || area.strArea;
            buttons.push(`
                <button class="area-filter-btn px-4 py-2 bg-gray-100 text-gray-700 rounded-full font-medium text-sm whitespace-nowrap hover:bg-gray-200 transition-all" data-area="${areaName}">
                    ${areaName}
                </button>
            `);
        });

        container.innerHTML = buttons.join('');

        // Add click handlers
        container.querySelectorAll('.area-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setActiveAreaFilter(btn);
                if (btn.dataset.area) {
                    this.filterByArea(btn.dataset.area);
                } else {
                    this.resetFilters();
                }
            });
        });
    }

    /**
     * Set active area filter button
     * @param {Element} activeBtn - The active button
     */
    setActiveAreaFilter(activeBtn) {
        const container = activeBtn.parentElement;
        container.querySelectorAll('.area-filter-btn').forEach(btn => {
            if (btn === activeBtn) {
                btn.classList.remove('bg-gray-100', 'text-gray-700');
                btn.classList.add('bg-emerald-600', 'text-white');
            } else {
                btn.classList.add('bg-gray-100', 'text-gray-700');
                btn.classList.remove('bg-emerald-600', 'text-white');
            }
        });
    }

    /**
     * Render meal cards
     * @param {array} meals - Meals array
     */
    renderMeals(meals) {
        const grid = this.elements.recipesGrid;
        if (!grid) return;

        if (meals.length === 0) {
            grid.innerHTML = '';
            grid.appendChild(this.uiController.createEmptyState('No recipes found', 'Try a different search or filter'));
            return;
        }

        grid.innerHTML = meals.map(meal => this.createMealCard(meal)).join('');
        this.updateRecipeCount(meals.length);

        // Add click handlers with explicit debug logging
        grid.querySelectorAll('.recipe-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const mealId = card.dataset.mealId;
                console.log('🍽️ Meal card clicked! Meal ID:', mealId);
                console.log('🍽️ Router instance:', this.router);
                try {
                    if (this.router && typeof this.router.navigate === 'function') {
                        this.router.navigate(`/meal-details/${mealId}`);
                    } else {
                        console.error('❌ Router not available or navigate is not a function!');
                    }
                } catch (error) {
                    console.error('❌ Error during navigation:', error);
                }
            });
        });
    }

    /**
     * Create a meal card HTML
     * @param {object} meal - Meal object
     */
    createMealCard(meal) {
        // Support both normalized API format (name, id, thumbnail) and legacy format (strMeal, idMeal, strMealThumb)
        const mealId = meal.id || meal.idMeal;
        const mealName = meal.name || meal.strMeal;
        const mealThumb = meal.thumbnail || meal.strMealThumb;
        const mealCategory = meal.category || meal.strCategory;
        const mealArea = meal.area || meal.strArea;

        return `
            <div class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                 data-meal-id="${mealId}">
                <div class="relative h-48 overflow-hidden">
                    <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                         src="${mealThumb}"
                         alt="${mealName}"
                         loading="lazy" />
                    <div class="absolute bottom-3 left-3 flex gap-2">
                    ${mealCategory ? `
                        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold rounded-full shadow-lg">
                            <i class="fa-solid fa-utensils"></i>
                            ${mealCategory}
                        </span>
                    ` : ''}
                    ${mealArea ? `
                        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                            <i class="fa-solid fa-flag"></i>
                            ${mealArea}
                        </span>
                    ` : ''}
                </div>
                </div>
                <div class="p-4">
                    <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">
                        ${mealName}
                    </h3>
                    <p class="text-xs text-gray-600 mb-3 line-clamp-2">
                        Delicious ${mealCategory || ''} recipe${mealArea ? ` from ${mealArea}` : ''}
                    </p>
                    <div class="flex items-center justify-between text-xs">
                        <span class="font-semibold text-gray-900">
                            <i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>
                            ${mealCategory || 'Meal'}
                        </span>
                        <span class="font-semibold text-gray-500">
                            <i class="fa-solid fa-globe text-blue-500 mr-1"></i>
                            ${mealArea || 'Various'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Update recipe count text
     * @param {number} count - The count
     */
    updateRecipeCount(count) {
        if (this.elements.recipesCount) {
            this.elements.recipesCount.textContent = `Showing ${count} recipe${count !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Handle search
     * @param {string} query - Search query
     */
    async handleSearch(query) {
        if (!query.trim()) {
            this.renderMeals(this.allMeals);
            return;
        }

        const results = await this.mealService.searchMeals(query);
        this.filteredMeals = results;
        this.renderMeals(results);
    }

    /**
     * Filter by category
     * @param {string} category - Category name
     */
    async filterByCategory(category) {
        const filtered = await this.mealService.filterByCategory(category);
        this.filteredMeals = filtered;
        this.renderMeals(filtered);
    }

    /**
     * Filter by area
     * @param {string} area - Area name
     */
    async filterByArea(area) {
        const filtered = await this.mealService.filterByArea(area);
        this.filteredMeals = filtered;
        this.renderMeals(filtered);
    }

    /**
     * Reset all filters
     */
    resetFilters() {
        this.filteredMeals = this.allMeals;
        this.renderMeals(this.allMeals);
    }

    /**
     * Set view mode (grid/list)
     * @param {string} view - View mode
     */
    setView(view) {
        this.currentView = view;
        const { recipesGrid, gridViewBtn, listViewBtn } = this.elements;

        if (view === 'grid') {
            recipesGrid?.classList.remove('grid-cols-1');
            recipesGrid?.classList.add('grid-cols-4');
            gridViewBtn?.classList.add('bg-white', 'shadow-sm');
            listViewBtn?.classList.remove('bg-white', 'shadow-sm');
        } else {
            recipesGrid?.classList.add('grid-cols-1');
            recipesGrid?.classList.remove('grid-cols-4');
            listViewBtn?.classList.add('bg-white', 'shadow-sm');
            gridViewBtn?.classList.remove('bg-white', 'shadow-sm');
        }
    }

    /**
     * Load and display meal details
     * @param {string} mealId - The meal ID
     */
    async loadMealDetails(mealId) {
        try {
            const meal = await this.mealService.getMealById(mealId);
            if (meal) {
                // First render with estimated nutrition (fast)
                this.renderMealDetails(meal);

                // Then try to fetch real nutrition data from USDA API
                await this.fetchRealNutrition(meal);
            }
        } catch (error) {
            console.error('Error loading meal details:', error);
        }
    }

    /**
     * Fetch real nutrition data from USDA API and update display
     * @param {object} meal - The meal object
     */
    async fetchRealNutrition(meal) {
        // Check if nutrition service is available
        if (!this.nutritionService || !this.nutritionService.hasApiKey()) {
            console.log('ℹ️ NutritionService not available, using estimated nutrition');
            return;
        }

        const mealName = meal.name || meal.strMeal;
        const ingredients = meal.ingredients || this.mealService.getIngredients(meal);

        // Format ingredients for API: "measure ingredient"
        const ingredientStrings = ingredients.map(ing => {
            const measure = ing.measure || '';
            const ingredient = ing.ingredient || '';
            return `${measure} ${ingredient}`.trim();
        }).filter(s => s);

        if (ingredientStrings.length === 0) {
            console.log('ℹ️ No ingredients found, using estimated nutrition');
            return;
        }

        // Show loading indicator on nutrition section
        this.showNutritionLoading();

        try {
            console.log('🔬 Fetching real nutrition data from USDA...');
            const result = await this.nutritionService.analyzeRecipe(mealName, ingredientStrings);

            if (result && result.success !== false) {
                console.log('✅ Real nutrition data received:', result);

                // Convert API response to our nutrition format
                const realNutrition = this.convertApiNutrition(result);

                // Update the display with real data
                const section = document.getElementById('meal-details');
                this.renderNutrition(section, realNutrition, null, true);

                // Update current meal for logging
                if (this.currentMeal) {
                    this.currentMeal.nutrition = realNutrition;
                    this.currentMeal.isRealNutrition = true;
                }

                // Update hero calories
                const heroCalories = section?.querySelector('#hero-calories');
                if (heroCalories) {
                    heroCalories.textContent = `${realNutrition.calories} cal/serving`;
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not fetch real nutrition, using estimates:', error.message);
            this.hideNutritionLoading();
        }
    }

    /**
     * Convert API nutrition response to our format
     * @param {object} apiResult - Result from nutritionService.analyzeRecipe()
     */
    convertApiNutrition(apiResult) {
        const perServing = apiResult.perServing || apiResult.totals || {};
        const servings = apiResult.servings || 4;

        return {
            calories: Math.round(perServing.calories || 0),
            protein: Math.round(perServing.protein || 0),
            carbs: Math.round(perServing.carbs || 0),
            fat: Math.round(perServing.fat || 0),
            fiber: Math.round(perServing.fiber || 0),
            sugar: Math.round(perServing.sugar || 0),
            saturatedFat: Math.round(perServing.saturatedFat || 0),
            cholesterol: Math.round(perServing.cholesterol || 0),
            sodium: Math.round(perServing.sodium || 0),
            // Vitamins - API doesn't provide these, use placeholder
            vitaminA: 0,
            vitaminC: 0,
            vitaminD: 0,
            calcium: 0,
            iron: 0,
            potassium: 0,
            dietLabels: ['USDA Verified'],
            servings: servings,
            isRealData: true,
            totalWeight: apiResult.totalWeight || 0
        };
    }

    /**
     * Show loading state on nutrition section
     */
    showNutritionLoading() {
        const container = document.getElementById('nutrition-facts-container');
        if (container) {
            container.classList.add('opacity-50');
            const loadingBadge = document.getElementById('nutrition-loading-badge');
            if (!loadingBadge) {
                const badge = document.createElement('div');
                badge.id = 'nutrition-loading-badge';
                badge.className = 'absolute top-4 right-4 bg-blue-500 text-white text-xs px-2 py-1 rounded-full animate-pulse';
                badge.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Loading USDA data...';
                container.style.position = 'relative';
                container.appendChild(badge);
            }
        }
    }

    /**
     * Hide loading state on nutrition section
     */
    hideNutritionLoading() {
        const container = document.getElementById('nutrition-facts-container');
        if (container) {
            container.classList.remove('opacity-50');
            const loadingBadge = document.getElementById('nutrition-loading-badge');
            if (loadingBadge) {
                loadingBadge.remove();
            }
        }
    }

    /**
     * Render meal details page
     * @param {object} meal - The meal object
     */
    renderMealDetails(meal) {
        const section = document.getElementById('meal-details');
        if (!section) return;

        // Support both normalized API format and legacy format
        const mealId = meal.id || meal.idMeal;
        const mealName = meal.name || meal.strMeal;
        const mealThumb = meal.thumbnail || meal.strMealThumb;
        const mealCategory = meal.category || meal.strCategory;
        const mealArea = meal.area || meal.strArea;
        const mealYoutube = meal.youtube || meal.strYoutube;
        const mealTags = meal.tags || (meal.strTags ? meal.strTags.split(',') : []);
        const mealSource = meal.source || meal.strSource; // Recipe source URL

        // Handle ingredients - API returns array, legacy uses strIngredient1-20
        const ingredients = meal.ingredients || this.mealService.getIngredients(meal);
        const nutrition = this.mealService.estimateNutrition(meal);

        // Handle instructions - API returns array, legacy uses strInstructions string
        let instructions;
        if (Array.isArray(meal.instructions)) {
            instructions = meal.instructions;
        } else if (meal.strInstructions) {
            instructions = meal.strInstructions.split('\r\n').filter(s => s.trim());
        } else {
            instructions = [];
        }

        // Store current meal for logging
        this.currentMeal = { meal, mealName, mealThumb, nutrition };

        // Update hero section
        const heroImg = section.querySelector('.relative.h-80 img, .relative.h-96 img');
        if (heroImg) heroImg.src = mealThumb;
        if (heroImg) heroImg.alt = mealName;

        // Update title
        const title = section.querySelector('.text-3xl, .text-4xl');
        if (title) title.textContent = mealName;

        // Update tags
        const tagsContainer = section.querySelector('.flex.items-center.gap-3.mb-3');
        if (tagsContainer) {
            const firstTag = Array.isArray(mealTags) ? mealTags[0] : mealTags;
            tagsContainer.innerHTML = `
                <span class="px-3 py-1 bg-emerald-500 text-white text-sm font-semibold rounded-full">${mealCategory}</span>
                <span class="px-3 py-1 bg-blue-500 text-white text-sm font-semibold rounded-full">${mealArea}</span>
                ${firstTag ? `<span class="px-3 py-1 bg-purple-500 text-white text-sm font-semibold rounded-full">${firstTag}</span>` : ''}
            `;
        }

        // Update calories display in hero
        const heroCalories = section.querySelector('#hero-calories');
        if (heroCalories) heroCalories.textContent = `${nutrition.calories} cal/serving`;

        // Update log button data
        const logBtn = document.getElementById('log-meal-btn');
        if (logBtn) logBtn.dataset.mealId = mealId;

        // Render ingredients
        this.renderIngredients(section, ingredients);

        // Render instructions
        this.renderInstructions(section, instructions);

        // Render video
        this.renderVideo(section, mealYoutube);

        // Render nutrition with source URL
        this.renderNutrition(section, nutrition, mealSource);
    }

    /**
     * Render ingredients list
     */
    renderIngredients(section, ingredients) {
        const container = section.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.gap-3');
        if (!container) return;

        container.innerHTML = ingredients.map(ing => `
            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors">
                <input type="checkbox" class="ingredient-checkbox w-5 h-5 text-emerald-600 rounded border-gray-300" />
                <span class="text-gray-700">
                    <span class="font-medium text-gray-900">${ing.measure}</span>
                    ${ing.ingredient}
                </span>
            </div>
        `).join('');

        // Update count
        const countSpan = section.querySelector('.text-sm.font-normal.text-gray-500.ml-auto');
        if (countSpan) countSpan.textContent = `${ingredients.length} items`;
    }

    /**
     * Render instructions
     */
    renderInstructions(section, instructions) {
        const container = section.querySelector('.space-y-4');
        if (!container || container.closest('.bg-white')?.querySelector('h2')?.textContent.includes('Nutrition')) return;

        // Find the instructions container specifically
        const instructionsCard = section.querySelector('.lg\\:col-span-2 .space-y-8 > div:nth-child(2) .space-y-4');
        if (!instructionsCard) return;

        instructionsCard.innerHTML = instructions.map((step, i) => `
            <div class="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                    ${i + 1}
                </div>
                <p class="text-gray-700 leading-relaxed pt-2">${step}</p>
            </div>
        `).join('');
    }

    /**
     * Render YouTube video
     */
    renderVideo(section, youtubeUrl) {
        const iframe = section.querySelector('iframe');
        if (!iframe) return;

        if (youtubeUrl) {
            const videoId = youtubeUrl.split('v=')[1]?.split('&')[0];
            iframe.src = `https://www.youtube.com/embed/${videoId}`;
            iframe.closest('.bg-white')?.style.setProperty('display', '');
        } else {
            iframe.closest('.bg-white')?.style.setProperty('display', 'none');
        }
    }

    /**
     * Render nutrition facts - comprehensive display
     * @param {Element} section - The section element
     * @param {object} nutrition - Nutrition data object
     * @param {string} mealSourceUrl - Optional source URL
     * @param {boolean} isRealData - Whether this is real USDA data or estimated
     */
    renderNutrition(section, nutrition, mealSourceUrl = null, isRealData = false) {
        const nutritionContainer = document.getElementById('nutrition-facts-container');
        if (!nutritionContainer) return;

        // Hide loading indicator
        this.hideNutritionLoading();

        // Add or update data source badge
        let dataBadge = document.getElementById('nutrition-data-source');
        if (!dataBadge) {
            dataBadge = document.createElement('div');
            dataBadge.id = 'nutrition-data-source';
            dataBadge.className = 'absolute top-4 right-4 text-xs px-2 py-1 rounded-full font-semibold';
            nutritionContainer.style.position = 'relative';
            nutritionContainer.appendChild(dataBadge);
        }

        if (isRealData || nutrition.isRealData) {
            dataBadge.className = 'absolute top-4 right-4 text-xs px-2 py-1 rounded-full font-semibold bg-green-100 text-green-700';
            dataBadge.innerHTML = '<i class="fa-solid fa-check-circle mr-1"></i> USDA Verified';
        } else {
            dataBadge.className = 'absolute top-4 right-4 text-xs px-2 py-1 rounded-full font-semibold bg-amber-100 text-amber-700';
            dataBadge.innerHTML = '<i class="fa-solid fa-calculator mr-1"></i> Estimated';
        }

        // Update calorie display
        const calorieValue = document.getElementById('calorie-value');
        if (calorieValue) calorieValue.textContent = nutrition.calories;

        const totalCalorie = document.getElementById('total-calorie');
        if (totalCalorie) totalCalorie.textContent = `Total: ${nutrition.calories * nutrition.servings} cal`;

        // Define macros including Saturated Fat
        const macros = [
            { name: 'Protein', value: nutrition.protein, color: 'emerald', max: 50 },
            { name: 'Carbs', value: nutrition.carbs, color: 'blue', max: 100 },
            { name: 'Fat', value: nutrition.fat, color: 'purple', max: 65 },
            { name: 'Fiber', value: nutrition.fiber, color: 'orange', max: 30 },
            { name: 'Sugar', value: nutrition.sugar, color: 'pink', max: 50 },
            { name: 'Saturated Fat', value: nutrition.saturatedFat, color: 'red', max: 20 }
        ];

        // Render macros with progress bars
        const macrosContainer = document.getElementById('macros-container');
        if (macrosContainer) {
            macrosContainer.innerHTML = macros.map(m => `
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full bg-${m.color}-500"></div>
                        <span class="text-gray-700">${m.name}</span>
                    </div>
                    <span class="font-bold text-gray-900">${m.value}g</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                    <div class="bg-${m.color}-500 h-2 rounded-full" style="width: ${Math.min(100, (m.value / m.max) * 100)}%"></div>
                </div>
            `).join('');
        }

        // Render Vitamins & Minerals
        const vitaminsContainer = document.getElementById('vitamins-container');
        if (vitaminsContainer) {
            const vitamins = [
                { name: 'Vitamin A', value: `${nutrition.vitaminA}%` },
                { name: 'Vitamin C', value: `${nutrition.vitaminC}%` },
                { name: 'Calcium', value: `${nutrition.calcium}%` },
                { name: 'Iron', value: `${nutrition.iron}%` },
                { name: 'Vitamin D', value: `${nutrition.vitaminD}%` },
                { name: 'Potassium', value: `${nutrition.potassium}mg` }
            ];

            vitaminsContainer.innerHTML = vitamins.map(v => `
                <div class="flex justify-between">
                    <span class="text-gray-600">${v.name}</span>
                    <span class="font-medium">${v.value}</span>
                </div>
            `).join('');
        }

        // Render Other (Cholesterol, Sodium)
        const otherContainer = document.getElementById('other-nutrition-container');
        if (otherContainer) {
            otherContainer.innerHTML = `
                <div class="flex justify-between">
                    <span class="text-gray-600">Cholesterol</span>
                    <span class="font-medium">${nutrition.cholesterol}mg</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Sodium</span>
                    <span class="font-medium">${nutrition.sodium}mg</span>
                </div>
            `;
        }

        // Render Diet Labels
        const dietLabelsContainer = document.getElementById('diet-labels-container');
        if (dietLabelsContainer) {
            const labelColors = {
                'High-Protein': 'bg-emerald-100 text-emerald-700',
                'Low-Carb': 'bg-orange-100 text-orange-700',
                'Gluten-Free': 'bg-purple-100 text-purple-700',
                'Dairy-Free': 'bg-blue-100 text-blue-700',
                'Vegetarian': 'bg-green-100 text-green-700',
                'Vegan': 'bg-lime-100 text-lime-700',
                'Low-Fat': 'bg-cyan-100 text-cyan-700',
                'Heart-Healthy': 'bg-pink-100 text-pink-700',
                'Indulgent': 'bg-amber-100 text-amber-700',
                'Comfort-Food': 'bg-yellow-100 text-yellow-700',
                'Light': 'bg-teal-100 text-teal-700',
                'Breakfast': 'bg-orange-100 text-orange-700',
                'USDA Verified': 'bg-green-100 text-green-700'
            };

            if (nutrition.dietLabels && nutrition.dietLabels.length > 0) {
                dietLabelsContainer.innerHTML = nutrition.dietLabels.map(label => {
                    const colorClass = labelColors[label] || 'bg-gray-100 text-gray-700';
                    return `<span class="px-3 py-1 ${colorClass} text-xs font-semibold rounded-full">${label}</span>`;
                }).join('');
            } else {
                dietLabelsContainer.innerHTML = '<span class="text-gray-400 text-sm">No specific labels</span>';
            }
        }

        // Update Recipe Source link
        const sourceLink = document.getElementById('meal-source-link');
        if (sourceLink && mealSourceUrl) {
            sourceLink.href = mealSourceUrl;
            sourceLink.style.display = '';
        } else if (sourceLink) {
            sourceLink.style.display = 'none';
        }
    }

    /**
     * Open the log meal modal
     */
    openLogMealModal() {
        if (!this.currentMeal) return;

        const { mealName, mealThumb, nutrition } = this.currentMeal;
        const modal = document.getElementById('log-meal-modal');

        if (!modal) return;

        // Populate modal with meal data
        const mealImage = document.getElementById('modal-meal-image');
        const mealNameEl = document.getElementById('modal-meal-name');
        const servingInput = document.getElementById('modal-serving-input');

        if (mealImage) mealImage.src = mealThumb || '';
        if (mealNameEl) mealNameEl.textContent = mealName || 'Unknown Meal';
        if (servingInput) servingInput.value = '1';

        // Update nutrition display
        this.updateModalNutrition(nutrition, 1);

        // Show modal
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        // Initialize event listeners for this modal instance
        this.initModalEventListeners(nutrition);
    }

    /**
     * Initialize modal event listeners
     */
    initModalEventListeners(nutrition) {
        const modal = document.getElementById('log-meal-modal');
        const minusBtn = document.getElementById('modal-serving-minus');
        const plusBtn = document.getElementById('modal-serving-plus');
        const servingInput = document.getElementById('modal-serving-input');
        const cancelBtn = document.getElementById('modal-cancel-btn');
        const confirmBtn = document.getElementById('modal-confirm-btn');

        // Remove previous listeners (clone technique)
        const newMinusBtn = minusBtn?.cloneNode(true);
        const newPlusBtn = plusBtn?.cloneNode(true);
        const newCancelBtn = cancelBtn?.cloneNode(true);
        const newConfirmBtn = confirmBtn?.cloneNode(true);

        minusBtn?.parentNode?.replaceChild(newMinusBtn, minusBtn);
        plusBtn?.parentNode?.replaceChild(newPlusBtn, plusBtn);
        cancelBtn?.parentNode?.replaceChild(newCancelBtn, cancelBtn);
        confirmBtn?.parentNode?.replaceChild(newConfirmBtn, confirmBtn);

        // Minus button
        newMinusBtn?.addEventListener('click', () => {
            const input = document.getElementById('modal-serving-input');
            let value = parseInt(input.value) || 1;
            if (value > 1) {
                value--;
                input.value = value;
                this.updateModalNutrition(nutrition, value);
            }
        });

        // Plus button
        newPlusBtn?.addEventListener('click', () => {
            const input = document.getElementById('modal-serving-input');
            let value = parseInt(input.value) || 1;
            if (value < 10) {
                value++;
                input.value = value;
                this.updateModalNutrition(nutrition, value);
            }
        });

        // Input change
        servingInput?.addEventListener('change', () => {
            let value = parseInt(servingInput.value) || 1;
            value = Math.max(1, Math.min(10, value));
            servingInput.value = value;
            this.updateModalNutrition(nutrition, value);
        });

        // Cancel button
        newCancelBtn?.addEventListener('click', () => {
            this.closeLogMealModal();
        });

        // Confirm button
        newConfirmBtn?.addEventListener('click', () => {
            const input = document.getElementById('modal-serving-input');
            const servings = parseInt(input?.value) || 1;
            this.confirmLogMeal(servings);
        });

        // Close on backdrop click
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeLogMealModal();
            }
        });
    }

    /**
     * Update modal nutrition display based on servings
     */
    updateModalNutrition(nutrition, servings) {
        const calories = document.getElementById('modal-calories');
        const protein = document.getElementById('modal-protein');
        const carbs = document.getElementById('modal-carbs');
        const fat = document.getElementById('modal-fat');

        if (calories) calories.textContent = Math.round(nutrition.calories * servings);
        if (protein) protein.textContent = `${Math.round(nutrition.protein * servings)}g`;
        if (carbs) carbs.textContent = `${Math.round(nutrition.carbs * servings)}g`;
        if (fat) fat.textContent = `${Math.round(nutrition.fat * servings)}g`;
    }

    /**
     * Close the log meal modal
     */
    closeLogMealModal() {
        const modal = document.getElementById('log-meal-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    /**
     * Confirm and log the meal with selected servings
     */
    confirmLogMeal(servings = 1) {
        if (!this.currentMeal) return;

        const { mealName, mealThumb, nutrition } = this.currentMeal;

        this.foodLog.addItem({
            name: mealName,
            type: 'meal',
            image: mealThumb,
            calories: Math.round(nutrition.calories * servings),
            protein: Math.round(nutrition.protein * servings),
            carbs: Math.round(nutrition.carbs * servings),
            fat: Math.round(nutrition.fat * servings),
            quantity: servings
        });

        this.closeLogMealModal();
        this.uiController.showToast(`${mealName} (${servings} serving${servings > 1 ? 's' : ''}) added to food log!`, 'success');
    }
}
