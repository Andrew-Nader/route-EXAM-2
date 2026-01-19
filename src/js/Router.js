/**
 * Router - Client-side navigation using History API
 * Handles URL routing without page reloads
 */
export class Router {
    constructor() {
        this.routes = {
            '/': 'home',
            '/home': 'home',
            '/scanner': 'scanner',
            '/foodlog': 'foodlog',
            '/meal-details': 'meal-details'
        };
        this.currentRoute = null;
        this.onRouteChange = null;

        // Listen for browser back/forward
        window.addEventListener('popstate', () => this.handleRoute());
    }

    /**
     * Initialize router and handle current URL
     */
    init() {
        this.handleRoute();
    }

    /**
     * Navigate to a new path
     * @param {string} path - The path to navigate to
     * @param {object} state - Optional state object
     */
    navigate(path, state = {}) {
        // Clear cached base path to ensure fresh detection every time
        this._basePath = undefined;

        const basePath = this.getBasePath();
        console.log(`🧭 [${new Date().toISOString()}] Navigate called with path:`, path);
        console.log('🧭 Base path:', basePath);
        console.log('🧭 Current pathname:', window.location.pathname);

        // Normalize the path: remove leading slash to make it relative, then prepend base path
        let normalizedPath = path;
        if (normalizedPath.startsWith('/')) {
            normalizedPath = normalizedPath.substring(1); // Remove leading slash
        }

        // Construct full path: basePath + '/' + normalizedPath
        const fullPath = basePath + '/' + normalizedPath;
        console.log('🧭 Full path for pushState:', fullPath);

        window.history.pushState(state, '', fullPath);
        this.handleRoute();
    }

    /**
     * Handle the current route
     */
    handleRoute() {
        const path = window.location.pathname;
        const basePath = this.getBasePath();
        let relativePath = path.replace(basePath, '') || '/';

        // Ensure path starts with /
        if (!relativePath.startsWith('/')) {
            relativePath = '/' + relativePath;
        }

        // Also check the full path for meal-details (fallback)
        const fullPath = path;

        // Check if it's a meal details route
        let route = 'home';
        let mealId = null;

        if (relativePath.startsWith('/meal-details/') || relativePath.startsWith('/meal/') ||
            fullPath.includes('/meal-details/') || fullPath.includes('/meal/')) {
            route = 'meal-details';
            // Extract mealId from whichever path contains it
            const pathToUse = relativePath.includes('/meal-details/') || relativePath.includes('/meal/')
                ? relativePath : fullPath;
            mealId = pathToUse.split('/').pop();
        } else if (this.routes[relativePath]) {
            route = this.routes[relativePath];
        } else if (relativePath === '/index.html' || relativePath.endsWith('/index.html')) {
            route = 'home';
        }

        this.currentRoute = route;

        // Call the route change handler if defined
        if (this.onRouteChange) {
            this.onRouteChange(route, mealId);
        }
    }


    /**
     * Get the base path for the application
     */
    getBasePath() {
        // Return cached value if already computed
        if (this._basePath !== undefined) {
            console.log('📍 Using cached base path:', this._basePath);
            return this._basePath;
        }

        // Method 1: Try to detect from current URL
        const pathname = window.location.pathname;
        console.log('🔍 Detecting base path from pathname:', pathname);

        // Check if pathname contains /Nutriplan-Design - also handle case sensitivity
        if (pathname.toLowerCase().includes('/nutriplan-design')) {
            const match = pathname.match(/^(\/Nutriplan-Design)/i);
            if (match) {
                this._basePath = match[1];
                console.log('📍 Base path detected from URL:', this._basePath);
                return this._basePath;
            }
        }

        // Method 2: Detect from script tag
        const scripts = document.querySelectorAll('script[src*="main.js"]');
        console.log('🔍 Found scripts with main.js:', scripts.length);
        if (scripts.length > 0) {
            const src = scripts[0].src;
            console.log('🔍 Script src:', src);
            try {
                const url = new URL(src);
                const pathParts = url.pathname.split('/');
                // Find Nutriplan-Design in the path
                const nutriplanIndex = pathParts.findIndex(p => p.toLowerCase() === 'nutriplan-design');
                if (nutriplanIndex !== -1) {
                    this._basePath = '/' + pathParts.slice(1, nutriplanIndex + 1).join('/');
                    console.log('📍 Base path detected from script path:', this._basePath);
                    return this._basePath;
                }
                // Fallback: use path up to src folder
                pathParts.pop(); // Remove main.js
                pathParts.pop(); // Remove js
                pathParts.pop(); // Remove src
                this._basePath = pathParts.join('/') || '/Nutriplan-Design';
                console.log('📍 Base path detected from script (fallback):', this._basePath);
                return this._basePath;
            } catch (e) {
                console.warn('Failed to parse script URL:', e);
            }
        }

        // Fallback
        this._basePath = '/Nutriplan-Design';
        console.log('📍 Using fallback base path:', this._basePath);
        return this._basePath;
    }

    /**
     * Get the current route name
     */
    getCurrentRoute() {
        return this.currentRoute;
    }
}
