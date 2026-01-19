/**
 * UIController - Main DOM controller
 * Handles common UI operations and section visibility
 */
export class UIController {
    constructor() {
        // Cache DOM elements
        this.elements = {
            loadingOverlay: document.getElementById('app-loading-overlay'),
            sidebar: document.getElementById('sidebar'),
            sidebarOverlay: document.getElementById('sidebar-overlay'),
            mainContent: document.getElementById('main-content'),
            header: document.getElementById('header'),
            headerMenuBtn: document.getElementById('header-menu-btn'),
            sidebarCloseBtn: document.getElementById('sidebar-close-btn'),

            // Sections
            searchFiltersSection: document.getElementById('search-filters-section'),
            categoriesSection: document.getElementById('meal-categories-section'),
            recipesSection: document.getElementById('all-recipes-section'),
            mealDetailsSection: document.getElementById('meal-details'),
            productsSection: document.getElementById('products-section'),
            foodlogSection: document.getElementById('foodlog-section'),

            // Navigation links
            navLinks: document.querySelectorAll('.nav-link')
        };

        this.initSidebarToggle();
    }

    /**
     * Initialize sidebar toggle functionality
     */
    initSidebarToggle() {
        const { headerMenuBtn, sidebarCloseBtn, sidebarOverlay, sidebar } = this.elements;

        if (headerMenuBtn) {
            headerMenuBtn.addEventListener('click', () => this.toggleSidebar(true));
        }

        if (sidebarCloseBtn) {
            sidebarCloseBtn.addEventListener('click', () => this.toggleSidebar(false));
        }

        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => this.toggleSidebar(false));
        }
    }

    /**
     * Toggle sidebar visibility (for mobile)
     * @param {boolean} show - Whether to show the sidebar
     */
    toggleSidebar(show) {
        const { sidebar, sidebarOverlay } = this.elements;

        if (show) {
            sidebar?.classList.add('sidebar-open');
            sidebarOverlay?.classList.add('active');
        } else {
            sidebar?.classList.remove('sidebar-open');
            sidebarOverlay?.classList.remove('active');
        }
    }

    /**
     * Hide the loading overlay
     */
    hideLoading() {
        const { loadingOverlay } = this.elements;
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
            }, 500);
        }
    }

    /**
     * Show the loading overlay
     */
    showLoading() {
        const { loadingOverlay } = this.elements;
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
            loadingOverlay.style.opacity = '1';
        }
    }

    /**
     * Set active navigation item
     * @param {string} page - The active page name
     */
    setActiveNav(page) {
        const { navLinks } = this.elements;
        const pageIndex = {
            'home': 0,
            'scanner': 1,
            'foodlog': 2
        };

        navLinks.forEach((link, index) => {
            if (index === pageIndex[page]) {
                link.classList.add('bg-emerald-50', 'text-emerald-700');
                link.classList.remove('text-gray-600', 'hover:bg-gray-50');
                link.querySelector('span')?.classList.add('font-semibold');
                link.querySelector('span')?.classList.remove('font-medium');
            } else {
                link.classList.remove('bg-emerald-50', 'text-emerald-700');
                link.classList.add('text-gray-600', 'hover:bg-gray-50');
                link.querySelector('span')?.classList.remove('font-semibold');
                link.querySelector('span')?.classList.add('font-medium');
            }
        });
    }

    /**
     * Update header title and description
     * @param {string} title - The page title
     * @param {string} description - The page description
     */
    updateHeader(title, description) {
        const { header } = this.elements;
        const titleEl = header?.querySelector('h1');
        const descEl = header?.querySelector('p');

        if (titleEl) titleEl.textContent = title;
        if (descEl) descEl.textContent = description;
    }

    /**
     * Show a specific page/section
     * @param {string} page - The page to show
     */
    showPage(page) {
        const {
            searchFiltersSection,
            categoriesSection,
            recipesSection,
            mealDetailsSection,
            productsSection,
            foodlogSection
        } = this.elements;

        // Hide all sections first
        const allSections = [
            searchFiltersSection,
            categoriesSection,
            recipesSection,
            mealDetailsSection,
            productsSection,
            foodlogSection
        ];

        allSections.forEach(section => {
            if (section) section.style.display = 'none';
        });

        // Show appropriate sections based on page
        switch (page) {
            case 'home':
                if (searchFiltersSection) searchFiltersSection.style.display = '';
                if (categoriesSection) categoriesSection.style.display = '';
                if (recipesSection) recipesSection.style.display = '';
                this.updateHeader('Meals & Recipes', 'Discover delicious and nutritious recipes tailored for you');
                break;

            case 'meal-details':
                if (mealDetailsSection) mealDetailsSection.style.display = '';
                this.updateHeader('Meal Details', 'View nutritional information and recipe details');
                break;

            case 'scanner':
                if (productsSection) productsSection.style.display = '';
                this.updateHeader('Product Scanner', 'Search for packaged food products to view nutrition information');
                break;

            case 'foodlog':
                if (foodlogSection) foodlogSection.style.display = '';
                this.updateHeader('Daily Food Log', 'Track and monitor your daily nutrition intake');
                break;
        }

        this.setActiveNav(page);
        this.toggleSidebar(false); // Close sidebar on mobile
    }

    /**
     * Show a toast notification
     * @param {string} message - The message to show
     * @param {string} type - The type (success, error, info)
     */
    showToast(message, type = 'success') {
        // Remove existing toast
        const existingToast = document.querySelector('.nutriplan-toast');
        if (existingToast) existingToast.remove();

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };

        const colors = {
            success: 'bg-emerald-500',
            error: 'bg-red-500',
            info: 'bg-blue-500'
        };

        const toast = document.createElement('div');
        toast.className = `nutriplan-toast fixed bottom-6 right-6 ${colors[type]} text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-bounce`;
        toast.innerHTML = `
            <i class="fa-solid ${icons[type]} text-xl"></i>
            <span class="font-medium">${message}</span>
        `;

        document.body.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Create a loading spinner element
     */
    createSpinner() {
        const div = document.createElement('div');
        div.className = 'flex items-center justify-center py-12';
        div.innerHTML = '<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>';
        return div;
    }

    /**
     * Create an empty state element
     * @param {string} message - The message to show
     * @param {string} subMessage - The sub message
     */
    createEmptyState(message = 'No items found', subMessage = 'Try adjusting your search') {
        const div = document.createElement('div');
        div.className = 'flex flex-col items-center justify-center py-12 text-center col-span-full';
        div.innerHTML = `
            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <i class="fa-solid fa-search text-gray-400 text-2xl"></i>
            </div>
            <p class="text-gray-500 text-lg">${message}</p>
            <p class="text-gray-400 text-sm mt-2">${subMessage}</p>
        `;
        return div;
    }
}
