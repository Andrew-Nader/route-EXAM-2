/**
 * ProductsUI - Handles rendering for the Product Scanner page
 */
export class ProductsUI {
    constructor(productService, foodLog, uiController) {
        this.productService = productService;
        this.foodLog = foodLog;
        this.uiController = uiController;
        this.products = [];
        this.categories = [];
        this.currentGrade = '';
        this.elements = {
            searchInput: document.getElementById('product-search-input'),
            barcodeInput: document.getElementById('barcode-input'),
            searchBtn: document.getElementById('search-product-btn'),
            lookupBtn: document.getElementById('lookup-barcode-btn'),
            productsGrid: document.getElementById('products-grid'),
            productsCount: document.getElementById('products-count'),
            nutriScoreFilters: document.querySelectorAll('.nutri-score-filter'),
            categoriesContainer: document.getElementById('product-categories')
        };
        this.initEventListeners();
    }

    /**
     * Initialize the UI - loads categories from API
     */
    async initialize() {
        await this.loadCategories();
    }

    /**
     * Load product categories from API
     */
    async loadCategories() {
        try {
            this.categories = await this.productService.getCategories(40);
            this.renderCategories(this.categories);
        } catch (error) {
            console.error('Error loading product categories:', error);
        }
    }

    /**
     * Render category buttons dynamically
     * @param {array} categories - Categories from API
     */
    renderCategories(categories) {
        const container = this.elements.categoriesContainer;
        if (!container) return;

        // Category colors using hex values (Tailwind can't detect dynamic classes)
        const colorSchemes = [
            { bg: '#f59e0b', hover: '#d97706' },  // amber
            { bg: '#2563eb', hover: '#1d4ed8' },  // blue
            { bg: '#22c55e', hover: '#16a34a' },  // green
            { bg: '#a855f7', hover: '#9333ea' },  // purple
            { bg: '#ef4444', hover: '#dc2626' },  // red
            { bg: '#10b981', hover: '#059669' },  // emerald
            { bg: '#ec4899', hover: '#db2777' },  // pink
            { bg: '#06b6d4', hover: '#0891b2' },  // cyan
            { bg: '#f97316', hover: '#ea580c' },  // orange
            { bg: '#6366f1', hover: '#4f46e5' }   // indigo
        ];

        // Icon mapping for common categories
        const icons = {
            'snacks': 'fa-cookie',
            'beverages': 'fa-glass-water',
            'dairies': 'fa-cheese',
            'meats': 'fa-drumstick-bite',
            'seafood': 'fa-fish',
            'breads': 'fa-bread-slice',
            'cereals': 'fa-wheat-awn',
            'desserts': 'fa-ice-cream',
            'fruits': 'fa-apple-whole',
            'vegetables': 'fa-carrot',
            'pasta': 'fa-bowl-rice',
            'sauces': 'fa-bottle-droplet',
            'frozen': 'fa-snowflake',
            'plant': 'fa-leaf',
            'yogurts': 'fa-jar',
            'cheeses': 'fa-cheese',
            'biscuits': 'fa-cookie-bite',
            'breakfast': 'fa-mug-saucer',
            'confectioneries': 'fa-candy-cane',
            'spreads': 'fa-jar',
            'fats': 'fa-droplet',
            'meals': 'fa-utensils',
            'canned': 'fa-can-food',
            'groceries': 'fa-basket-shopping',
            'alcoholic': 'fa-wine-glass',
            'sweet': 'fa-candy-cane',
            'fermented': 'fa-wine-bottle',
            'condiments': 'fa-bottle-droplet'
        };

        // Get icon for category based on name keywords
        const getIcon = (name) => {
            const nameLower = name.toLowerCase();
            for (const [keyword, icon] of Object.entries(icons)) {
                if (nameLower.includes(keyword)) return icon;
            }
            return 'fa-tag';
        };

        // Build category buttons with inline styles for reliable coloring
        container.innerHTML = categories.map((cat, i) => {
            const color = colorSchemes[i % colorSchemes.length];
            const icon = getIcon(cat.name);
            return `
                <button class="product-category-btn px-4 py-2 text-white rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 shadow-sm"
                        style="background-color: ${color.bg};"
                        data-category="${cat.name}"
                        data-hover-color="${color.hover}"
                        onmouseover="this.style.backgroundColor='${color.hover}'"
                        onmouseout="this.style.backgroundColor='${color.bg}'">
                    <i class="fa-solid ${icon}"></i>
                    <span>${cat.name}</span>
                    <span class="text-xs opacity-75">(${this.formatCount(cat.productCount)})</span>
                </button>
            `;
        }).join('');

        // Re-attach click handlers
        container.querySelectorAll('.product-category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cat = btn.dataset.category;
                this.elements.searchInput.value = cat;
                this.handleSearch();
            });
        });
    }

    /**
     * Format large numbers with K/M suffix
     */
    formatCount(count) {
        if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
        if (count >= 1000) return (count / 1000).toFixed(0) + 'K';
        return count.toString();
    }

    initEventListeners() {
        this.elements.searchBtn?.addEventListener('click', () => this.handleSearch());
        this.elements.searchInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.handleSearch(); });
        this.elements.lookupBtn?.addEventListener('click', () => this.handleBarcodeLookup());
        this.elements.barcodeInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') this.handleBarcodeLookup(); });
        this.elements.nutriScoreFilters?.forEach(btn => {
            btn.addEventListener('click', () => this.filterByNutriScore(btn.dataset.grade, btn));
        });
        // Category buttons are now dynamically loaded via loadCategories/renderCategories

        // Setup product card click handler (delegation)
        this.elements.productsGrid?.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            if (card) {
                const barcode = card.dataset.barcode;
                this.showProductDetail(barcode);
            }
        });

        // Setup modal close handlers
        this.setupModalCloseHandlers();
    }

    async handleSearch() {
        const query = this.elements.searchInput?.value.trim();
        if (!query) return;
        this.showLoading();
        try {
            this.products = await this.productService.searchProducts(query);
            this.currentGrade = '';
            this.renderProducts(this.products);
        } catch (e) { console.error(e); }
    }

    async handleBarcodeLookup() {
        const barcode = this.elements.barcodeInput?.value.trim();
        if (!barcode) return;
        this.showLoading();
        try {
            const product = await this.productService.getProductByBarcode(barcode);
            if (product) {
                this.products = [product];
                this.renderProducts([product]);
            } else {
                this.products = [];
                this.elements.productsGrid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500"><i class="fa-solid fa-box-open text-4xl mb-3 text-gray-300"></i><p class="font-medium">Product not found</p></div>';
                this.updateCount(0);
            }
        } catch (e) { console.error(e); }
    }

    showLoading() {
        if (this.elements.productsGrid) {
            this.elements.productsGrid.innerHTML = '<div class="col-span-full flex justify-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>';
        }
    }

    filterByNutriScore(grade, activeBtn) {
        this.elements.nutriScoreFilters?.forEach(b => {
            b.classList.remove('bg-emerald-600', 'text-white');
            b.classList.add('bg-gray-100', 'text-gray-700');
        });
        activeBtn.classList.add('bg-emerald-600', 'text-white');
        activeBtn.classList.remove('bg-gray-100', 'text-gray-700');
        this.currentGrade = grade;
        if (!grade) {
            this.renderProducts(this.products);
        } else {
            const filtered = this.products.filter(p => p.nutriScore?.toLowerCase() === grade);
            this.renderProducts(filtered);
        }
    }

    renderProducts(products) {
        const grid = this.elements.productsGrid;
        if (!grid) return;
        this.updateCount(products.length);
        if (products.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-500"><i class="fa-solid fa-search text-4xl mb-3 text-gray-300"></i><p class="font-medium">No products found</p></div>';
            return;
        }
        grid.innerHTML = products.map(p => this.createProductCard(p)).join('');
        grid.querySelectorAll('.add-product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => { e.stopPropagation(); this.addProductToLog(btn.dataset.barcode); });
        });
    }

    createProductCard(p) {
        const scoreColors = { a: 'green', b: 'lime', c: 'yellow', d: 'orange', e: 'red' };
        const scoreCol = scoreColors[p.nutriScore?.toLowerCase()] || 'gray';
        const novaColors = { 1: 'green', 2: 'lime', 3: 'yellow', 4: 'red' };
        const novaCol = novaColors[p.novaGroup] || 'gray';

        // Calculate weight display
        const weight = p.quantity || p.servingSize || '';
        const caloriesPer100g = p.nutrition.caloriesPer100g || p.nutrition.calories || 0;

        return `<div class="product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group" data-barcode="${p.barcode}">
            <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                ${p.image ? `<img class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" src="${p.image}" alt="${p.name}" loading="lazy" />` : '<i class="fa-solid fa-box text-gray-300 text-4xl"></i>'}
                ${p.nutriScore ? `<div class="absolute top-2 left-2 bg-${scoreCol}-500 text-white text-xs font-bold px-2 py-0.5 rounded uppercase">Nutri-Score ${p.nutriScore.toUpperCase()}</div>` : ''}
                ${p.novaGroup ? `<div class="absolute top-2 right-2 bg-${novaCol}-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">${p.novaGroup}</div>` : ''}
            </div>
            <div class="p-4">
                <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${p.brand || 'Unknown Brand'}</p>
                <h3 class="font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-emerald-600 transition-colors">${p.name}</h3>
                <div class="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    ${weight ? `<span class="flex items-center gap-1"><i class="fa-solid fa-weight-scale"></i>${weight}</span>` : ''}
                    <span class="flex items-center gap-1"><i class="fa-solid fa-fire"></i>${caloriesPer100g} kcal/100g</span>
                </div>
                <div class="flex gap-2">
                    <div class="flex-1 text-center py-2 px-1 rounded" style="background-color: #06b6d4;">
                        <div class="font-bold text-white text-sm">${p.nutrition.protein}g</div>
                        <div class="text-white text-[10px] opacity-90">Protein</div>
                    </div>
                    <div class="flex-1 text-center py-2 px-1 rounded" style="background-color: #3b82f6;">
                        <div class="font-bold text-white text-sm">${p.nutrition.carbs}g</div>
                        <div class="text-white text-[10px] opacity-90">Carbs</div>
                    </div>
                    <div class="flex-1 text-center py-2 px-1 rounded" style="background-color: #a855f7;">
                        <div class="font-bold text-white text-sm">${p.nutrition.fat}g</div>
                        <div class="text-white text-[10px] opacity-90">Fat</div>
                    </div>
                    <div class="flex-1 text-center py-2 px-1 rounded" style="background-color: #f97316;">
                        <div class="font-bold text-white text-sm">${p.nutrition.sugar || 0}g</div>
                        <div class="text-white text-[10px] opacity-90">Sugar</div>
                    </div>
                </div>
            </div>
        </div>`;
    }

    updateCount(count) {
        if (this.elements.productsCount) {
            this.elements.productsCount.textContent = count > 0 ? `Showing ${count} product${count !== 1 ? 's' : ''}` : 'Search for products to see results';
        }
    }

    addProductToLog(barcode) {
        const product = this.products.find(p => p.barcode === barcode);
        if (!product) return;
        this.foodLog.addItem({
            name: `${product.brand} - ${product.name}`,
            type: 'product',
            image: product.image,
            calories: product.nutrition.calories,
            protein: product.nutrition.protein,
            carbs: product.nutrition.carbs,
            fat: product.nutrition.fat
        });
        this.uiController.showToast(`${product.name} added to food log!`, 'success');
    }

    setupModalCloseHandlers() {
        const modal = document.getElementById('product-modal');
        if (!modal) return;

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeProductModal();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                this.closeProductModal();
            }
        });
    }

    async showProductDetail(barcode) {
        // Fetch fresh product data with ingredients from OpenFoodFacts
        const product = await this.productService.getProductByBarcode(barcode, true);

        if (!product) {
            console.error('Product not found');
            return;
        }

        const scoreColors = { a: 'green', b: 'lime', c: 'yellow', d: 'orange', e: 'red' };
        const scoreColor = scoreColors[product.nutriScore?.toLowerCase()] || 'gray';
        const scoreText = { a: 'Excellent', b: 'Good', c: 'Fair', d: 'Poor', e: 'Bad' };
        const scoreLabel = scoreText[product.nutriScore?.toLowerCase()] || 'Unknown';

        const novaColors = { 1: 'green', 2: 'yellow', 3: 'orange', 4: 'red' };
        const novaColor = novaColors[product.novaGroup] || 'gray';
        const novaLabels = { 1: 'Unprocessed', 2: 'Processed', 3: 'Processed', 4: 'Ultra-processed' };
        const novaLabel = novaLabels[product.novaGroup] || '';

        // Calculate percentages for progress bars
        const total = product.nutrition.protein + product.nutrition.carbs + product.nutrition.fat;
        const proteinPercent = total > 0 ? (product.nutrition.protein / total * 100) : 0;
        const carbsPercent = total > 0 ? (product.nutrition.carbs / total * 100) : 0;
        const fatPercent = total > 0 ? (product.nutrition.fat / total * 100) : 0;
        const sugarPercent = product.nutrition.carbs > 0 ? (product.nutrition.sugar / product.nutrition.carbs * 100) : 0;

        const modalHTML = `
            <div class="p-8">
                <!-- Close Button -->
                <button onclick="window.productsUI.closeProductModal()" class="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors p-2 z-10">
                    <i class="fa-solid fa-times text-3xl"></i>
                </button>

                <!-- Product Header -->
                <div class="flex gap-6 mb-8">
                    <!-- Product Image -->
                    <div class="w-32 h-32 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                        ${product.image ? `<img src="${product.image}" alt="${product.name}" class="w-full h-full object-contain" />` : '<i class="fa-solid fa-box text-gray-300 text-4xl"></i>'}
                    </div>
                    
                    <!-- Product Info -->
                    <div class="flex-1">
                        <p class="text-lg text-emerald-600 font-semibold mb-2">${product.brand || 'Unknown Brand'}</p>
                        <h2 class="text-3xl font-bold text-gray-900 mb-3">${product.name}</h2>
                        <p class="text-gray-600 text-lg mb-4">${product.quantity || product.servingSize || ''}</p>
                        
                        <!-- Badges Row -->
                        <div class="flex gap-3">
                            ${product.nutriScore ? `
                                <div class="inline-flex items-center gap-2 px-4 py-2 bg-${scoreColor}-100 rounded-lg border border-${scoreColor}-200">
                                    <div class="bg-${scoreColor}-600 text-white font-bold px-3 py-1.5 rounded text-sm uppercase">
                                        ${product.nutriScore.toUpperCase()}
                                    </div>
                                    <div>
                                        <div class="text-${scoreColor}-800 font-semibold text-sm">Nutri-Score</div>
                                        <div class="text-${scoreColor}-700 text-sm">${scoreLabel}</div>
                                    </div>
                                </div>
                            ` : ''}
                            ${product.novaGroup ? `
                                <div class="inline-flex items-center gap-2 px-4 py-2 bg-${novaColor}-100 rounded-lg border border-${novaColor}-200">
                                    <div class="bg-${novaColor}-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center text-base">
                                        ${product.novaGroup}
                                    </div>
                                    <div>
                                        <div class="text-${novaColor}-800 font-semibold text-sm">NOVA</div>
                                        <div class="text-${novaColor}-700 text-sm">${novaLabel}</div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>

                <!-- Nutrition Facts Section -->
                <div class="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 mb-6">
                    <h3 class="flex items-center gap-2 text-xl font-bold text-gray-900 mb-6">
                        <i class="fa-solid fa-apple-whole text-emerald-600 text-xl"></i>
                        Nutrition Facts
                        <span class="text-base font-normal text-gray-500">(per 100g)</span>
                    </h3>
                    
                    <!-- Calories -->
                    <div class="text-center mb-8">
                        <div class="text-7xl font-bold text-gray-900 mb-2">${product.nutrition.caloriesPer100g || product.nutrition.calories || 0}</div>
                        <div class="text-gray-600 text-lg">Calories</div>
                    </div>
                    
                    <div class="border-t-2 border-emerald-200 my-6"></div>
                    
                    <!-- Macronutrients with Progress Bars -->
                    <div class="grid grid-cols-4 gap-6 mb-6">
                        <!-- Protein -->
                        <div class="text-center">
                            <div class="mb-3">
                                <div class="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                                    <div class="h-full rounded-full" style="width: ${Math.min(proteinPercent, 100)}%; background-color: #06b6d4;"></div>
                                </div>
                            </div>
                            <div class="text-2xl font-bold mb-1" style="color: #06b6d4;">${product.nutrition.protein}g</div>
                            <div class="text-sm text-gray-600">Protein</div>
                        </div>
                        
                        <!-- Carbs -->
                        <div class="text-center">
                            <div class="mb-3">
                                <div class="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                                    <div class="h-full rounded-full" style="width: ${Math.min(carbsPercent, 100)}%; background-color: #3b82f6;"></div>
                                </div>
                            </div>
                            <div class="text-2xl font-bold mb-1" style="color: #3b82f6;">${product.nutrition.carbs}g</div>
                            <div class="text-sm text-gray-600">Carbs</div>
                        </div>
                        
                        <!-- Fat -->
                        <div class="text-center">
                            <div class="mb-3">
                                <div class="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                                    <div class="h-full rounded-full" style="width: ${Math.min(fatPercent, 100)}%; background-color: #a855f7;"></div>
                                </div>
                            </div>
                            <div class="text-2xl font-bold mb-1" style="color: #a855f7;">${product.nutrition.fat}g</div>
                            <div class="text-sm text-gray-600">Fat</div>
                        </div>
                        
                        <!-- Sugar -->
                        <div class="text-center">
                            <div class="mb-3">
                                <div class="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                                    <div class="h-full rounded-full" style="width: ${Math.min(sugarPercent, 100)}%; background-color: #f97316;"></div>
                                </div>
                            </div>
                            <div class="text-2xl font-bold mb-1" style="color: #f97316;">${product.nutrition.sugar || 0}g</div>
                            <div class="text-sm text-gray-600">Sugar</div>
                        </div>
                    </div>
                    
                    <!-- Additional Nutrition -->
                    <div class="grid grid-cols-3 gap-6 pt-5 border-t-2 border-emerald-200 text-center">
                        <div>
                            <div class="text-lg font-bold text-gray-900">${product.nutrition.saturatedFat || '0.0'}g</div>
                            <div class="text-sm text-gray-600">Saturated Fat</div>
                        </div>
                        <div>
                            <div class="text-lg font-bold text-gray-900">${product.nutrition.fiber || '0.0'}g</div>
                            <div class="text-sm text-gray-600">Fiber</div>
                        </div>
                        <div>
                            <div class="text-lg font-bold text-gray-900">${(product.nutrition.salt || product.nutrition.sodium || 0).toFixed(2)}g</div>
                            <div class="text-sm text-gray-600">Salt</div>
                        </div>
                    </div>
                </div>

                <!-- Ingredients Section -->
                ${product.ingredients ? `
                    <div class="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                        <h3 class="flex items-center gap-2 text-xl font-bold text-gray-900 mb-4">
                            <i class="fa-solid fa-list text-gray-700"></i>
                            Ingredients
                        </h3>
                        <p class="text-gray-700 text-base leading-relaxed">${product.ingredients}</p>
                    </div>
                ` : ''}

                <!-- Allergens Section -->
                ${product.allergens || (product.ingredients && (product.ingredients.toLowerCase().includes('gluten') || product.ingredients.toLowerCase().includes('milk') || product.ingredients.toLowerCase().includes('nuts'))) ? `
                    <div class="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                        <h3 class="flex items-center gap-2 text-xl font-bold text-red-900 mb-4">
                            <i class="fa-solid fa-triangle-exclamation text-red-600"></i>
                            Allergens
                        </h3>
                        <p class="text-red-800 text-base leading-relaxed">${product.allergens || 'en:gluten'}</p>
                    </div>
                ` : ''}

                <!-- Action Buttons -->
                <div class="flex gap-4 pt-6">
                    <button onclick="window.productsUI.logProductFromModal('${barcode}')" 
                            class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg text-lg">
                        <i class="fa-solid fa-plus"></i>
                        Log This Food
                    </button>
                    <button onclick="window.productsUI.closeProductModal()" 
                            class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-4 px-8 rounded-xl transition-all text-lg">
                        Close
                    </button>
                </div>
            </div>
        `;

        const modal = document.getElementById('product-modal');
        const modalContent = modal.querySelector('.bg-white');
        modalContent.innerHTML = modalHTML;
        modal.classList.remove('hidden');
    }

    closeProductModal() {
        const modal = document.getElementById('product-modal');
        modal.classList.add('hidden');
    }

    logProductFromModal(barcode) {
        this.addProductToLog(barcode);
        this.closeProductModal();
    }
}
