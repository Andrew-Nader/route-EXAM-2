/**
 * FoodLogUI - Handles rendering for the Food Log page
 * @version 2.1 - Added Browse Recipes and Scan Product buttons
 */
export class FoodLogUI {
    constructor(foodLog, uiController, router) {
        this.foodLog = foodLog;
        this.uiController = uiController;
        this.router = router;
        this.elements = {
            dateDisplay: document.getElementById('foodlog-date'),
            todaySection: document.getElementById('foodlog-today-section'),
            loggedItemsList: document.getElementById('logged-items-list'),
            weeklyChart: document.getElementById('weekly-chart'),
            clearBtn: document.getElementById('clear-foodlog'),
            quickLogBtns: document.querySelectorAll('.quick-log-btn')
        };
        this.initEventListeners();
    }

    initEventListeners() {
        this.elements.clearBtn?.addEventListener('click', () => this.handleClearAll());
        this.elements.quickLogBtns?.forEach((btn, i) => {
            btn.addEventListener('click', () => {
                if (i === 0) this.router.navigate('/home');
                else if (i === 1) this.router.navigate('/scanner');
                else this.showCustomEntryModal();
            });
        });
    }

    render() {
        this.updateDate();
        this.renderProgressBars();
        this.renderLoggedItems();
        this.renderWeeklyChart();
        this.renderWeeklyOverview();
        this.renderWeeklyStats();
    }

    updateDate() {
        if (this.elements.dateDisplay) {
            this.elements.dateDisplay.textContent = this.foodLog.formatDate();
        }
    }

    renderProgressBars() {
        const totals = this.foodLog.getTodayTotals();
        const progress = this.foodLog.getProgress();
        const targets = this.foodLog.dailyTargets;
        const bars = [
            { name: 'Calories', val: totals.calories, tgt: targets.calories, unit: 'kcal', pct: progress.calories, col: 'blue', colText: 'blue', exc: totals.calories > targets.calories },
            { name: 'Protein', val: Math.round(totals.protein), tgt: targets.protein, unit: 'g', pct: progress.protein, col: 'purple', colText: 'purple' },
            { name: 'Carbs', val: Math.round(totals.carbs), tgt: targets.carbs, unit: 'g', pct: progress.carbs, col: 'orange', colText: 'orange' },
            { name: 'Fat', val: Math.round(totals.fat), tgt: targets.fat, unit: 'g', pct: progress.fat, col: 'pink', colText: 'pink' }
        ];
        const container = this.elements.todaySection?.querySelector('#nutrition-progress-bars');
        if (!container) return;
        container.innerHTML = bars.map(b => `
            <div class="border border-gray-200 rounded-xl p-4">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-700">${b.name}</span>
                    <span class="text-sm font-semibold text-${b.colText}-500">${Math.round(b.pct)}%</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2 mb-2">
                    <div class="bg-${b.col}-500 h-2 rounded-full transition-all" style="width: ${Math.min(100, b.pct)}%"></div>
                </div>
                <div class="flex justify-between text-xs">
                    <span class="font-semibold text-${b.colText}-600">${b.val} ${b.unit}</span>
                    <span class="text-gray-400">/ ${b.tgt} ${b.unit}</span>
                </div>
            </div>
        `).join('');
    }

    renderLoggedItems() {
        const items = this.foodLog.getTodayItems();
        const container = this.elements.loggedItemsList;
        if (!container) return;
        const header = container.parentElement?.querySelector('h4');
        if (header) header.textContent = `Logged Items (${items.length})`;
        if (this.elements.clearBtn) this.elements.clearBtn.style.display = items.length > 0 ? '' : 'none';
        if (items.length === 0) {
            container.innerHTML = `<div class="text-center py-12">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fa-solid fa-utensils text-2xl text-gray-400"></i>
                </div>
                <p class="font-semibold text-gray-900 mb-1">No food logged today</p>
                <p class="text-sm text-gray-500 mb-6">Start tracking your nutrition by logging meals or scanning products</p>
                <div class="flex justify-center gap-3">
                    <button id="browse-recipes-btn" class="px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-all text-sm">
                        <i class="fa-solid fa-plus mr-1.5"></i>Browse Recipes
                    </button>
                    <button id="scan-product-btn" class="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-all text-sm">
                        <i class="fa-solid fa-barcode mr-1.5"></i>Scan Product
                    </button>
                </div>
            </div>`;
            // Add event listeners for the CTA buttons
            container.querySelector('#browse-recipes-btn')?.addEventListener('click', () => this.router.navigate('/home'));
            container.querySelector('#scan-product-btn')?.addEventListener('click', () => this.router.navigate('/scanner'));
            return;
        }
        container.innerHTML = items.map(item => {
            const icon = item.type === 'product' ? 'fa-barcode' : 'fa-utensils';
            const col = item.type === 'product' ? 'teal' : 'emerald';
            return `<div class="logged-item flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
                ${item.image ? `<img src="${item.image}" class="w-16 h-16 rounded-lg object-cover" />` : `<div class="w-16 h-16 rounded-lg bg-${col}-100 flex items-center justify-center"><i class="fa-solid ${icon} text-${col}-600 text-xl"></i></div>`}
                <div class="flex-1"><h4 class="font-semibold text-gray-900">${item.name}</h4><div class="flex gap-4 text-sm text-gray-500 mt-1"><span><i class="fa-solid fa-fire text-orange-500 mr-1"></i>${item.calories} kcal</span><span><i class="fa-solid fa-dumbbell text-blue-500 mr-1"></i>${item.protein}g</span></div></div>
                <button class="delete-item-btn p-2 text-gray-400 hover:text-red-500" data-item-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
            </div>`;
        }).join('');
        container.querySelectorAll('.delete-item-btn').forEach(btn => {
            btn.addEventListener('click', () => { this.foodLog.removeItem(btn.dataset.itemId); this.render(); });
        });
    }

    renderWeeklyChart() {
        const container = this.elements.weeklyChart;
        if (!container || typeof Plotly === 'undefined') return;
        const data = this.foodLog.getWeeklyData();
        const trace = { x: data.map(d => d.dayName), y: data.map(d => d.calories), type: 'bar', marker: { color: '#10b981' } };
        const layout = { showlegend: false, margin: { t: 20, l: 50, r: 20, b: 40 }, paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)' };
        container.innerHTML = '';
        Plotly.newPlot(container, [trace], layout, { responsive: true, displayModeBar: false });
    }

    handleClearAll() {
        if (confirm('Clear all logged items for today?')) {
            this.foodLog.clearToday();
            this.render();
            this.uiController.showToast('Food log cleared', 'info');
        }
    }

    showCustomEntryModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
        modal.innerHTML = `<div class="bg-white rounded-2xl p-6 w-full max-w-md mx-4"><h3 class="text-xl font-bold mb-4"><i class="fa-solid fa-pencil text-purple-600 mr-2"></i>Add Custom Food</h3>
            <form id="custom-form" class="space-y-4"><div><label class="block text-sm font-medium mb-1">Name *</label><input type="text" name="name" required class="w-full px-4 py-2 border rounded-lg" /></div>
            <div class="grid grid-cols-2 gap-4"><div><label class="block text-sm font-medium mb-1">Calories *</label><input type="number" name="calories" required min="0" class="w-full px-4 py-2 border rounded-lg" /></div><div><label class="block text-sm font-medium mb-1">Protein (g)</label><input type="number" name="protein" min="0" value="0" class="w-full px-4 py-2 border rounded-lg" /></div></div>
            <div class="grid grid-cols-2 gap-4"><div><label class="block text-sm font-medium mb-1">Carbs (g)</label><input type="number" name="carbs" min="0" value="0" class="w-full px-4 py-2 border rounded-lg" /></div><div><label class="block text-sm font-medium mb-1">Fat (g)</label><input type="number" name="fat" min="0" value="0" class="w-full px-4 py-2 border rounded-lg" /></div></div>
            <div class="flex gap-3 pt-4"><button type="button" id="cancel-btn" class="flex-1 px-4 py-2 border rounded-lg">Cancel</button><button type="submit" class="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg">Add</button></div></form></div>`;
        document.body.appendChild(modal);
        modal.querySelector('#cancel-btn').addEventListener('click', () => modal.remove());
        modal.querySelector('#custom-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            this.foodLog.addItem({ name: fd.get('name'), type: 'custom', calories: +fd.get('calories'), protein: +fd.get('protein') || 0, carbs: +fd.get('carbs') || 0, fat: +fd.get('fat') || 0 });
            modal.remove(); this.render(); this.uiController.showToast('Custom food added!', 'success');
        });
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    }

    renderWeeklyOverview() {
        const container = document.getElementById('weekly-days-grid');
        if (!container) return;

        const weekData = this.foodLog.getWeeklyData();
        const today = new Date().toISOString().split('T')[0];

        container.innerHTML = weekData.map(day => {
            const isToday = day.date === today;
            const date = new Date(day.date);
            const dayNum = date.getDate();

            return `
                <div class="text-center p-3 rounded-lg ${isToday ? 'bg-indigo-100 border border-indigo-200' : 'border border-gray-100'}">
                    <p class="text-xs ${isToday ? 'text-indigo-600' : 'text-gray-400'} mb-1">${day.dayName}</p>
                    <p class="font-bold ${isToday ? 'text-indigo-700' : 'text-gray-700'}">${dayNum}</p>
                    <p class="text-sm font-medium ${isToday ? 'text-indigo-600' : 'text-gray-500'} mt-2">${Math.round(day.calories)}</p>
                    <p class="text-xs ${isToday ? 'text-indigo-400' : 'text-gray-400'}">kcal</p>
                </div>
            `;
        }).join('');
    }

    renderWeeklyStats() {
        const weekData = this.foodLog.getWeeklyData();
        const allData = this.foodLog.getAllData();

        // Calculate weekly average
        const totalCalories = weekData.reduce((sum, day) => sum + day.calories, 0);
        const avgCalories = Math.round(totalCalories / 7);

        // Count total items this week
        let totalItems = 0;
        weekData.forEach(day => {
            const items = allData[day.date] || [];
            totalItems += items.length;
        });

        // Count days on goal (within 90%-110% of target)
        const target = this.foodLog.dailyTargets.calories;
        let daysOnGoal = 0;
        weekData.forEach(day => {
            if (day.calories >= target * 0.9 && day.calories <= target * 1.1) {
                daysOnGoal++;
            }
        });

        // Update DOM elements
        const avgEl = document.getElementById('weekly-avg-kcal');
        const itemsEl = document.getElementById('weekly-total-items');
        const goalsEl = document.getElementById('days-on-goal');

        if (avgEl) avgEl.textContent = `${avgCalories} kcal`;
        if (itemsEl) itemsEl.textContent = `${totalItems} items`;
        if (goalsEl) goalsEl.textContent = `${daysOnGoal} / 7`;
    }
}
