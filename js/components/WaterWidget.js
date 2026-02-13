import { Widget } from './Widget.js';
import { store } from '../store.js';

class WaterWidget extends Widget {
    constructor(id, data) {
        super(id, data);
        this.data = data || {};
        this.state = {
            current: data.current || 0,
            target: data.target || 2000,
            history: data.history || [] // Log of drinks? Maybe for later.
        };
    }

    getTitle() {
        return 'Water Tracker';
    }

    getContentHTML() {
        const percent = Math.min(100, Math.round((this.state.current / this.state.target) * 100));

        return `
            <div class="water-container">
                <div class="water-glass">
                    <div class="water-liquid" style="height: ${percent}%">
                        <div class="water-wave"></div>
                        <div class="water-wave-back"></div>
                    </div>
                    <div class="water-glass-highlight"></div>
                    <div class="water-percentage">${percent}%</div>
                </div>
                
                <div class="water-stats">
                    <span class="water-current">${this.state.current}</span>
                    <span class="water-separator">/</span>
                    <span class="water-target">${this.state.target} ml</span>
                </div>

                <div class="water-controls">
                    <button class="water-btn add-btn" data-amount="250">
                        <i class="fas fa-glass-water"></i> +250
                    </button>
                    <button class="water-btn add-btn" data-amount="500">
                        <i class="fas fa-bottle-water"></i> +500
                    </button>
                    <button class="water-btn reset-btn" data-action="reset" title="Reset">
                        <i class="fas fa-undo"></i>
                    </button>
                </div>
            </div>
        `;
    }

    render() {
        const el = super.render();
        el.classList.add('water-widget');
        this.bindEvents(el);
        return el;
    }

    bindEvents(el) {
        el.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const amount = parseInt(btn.dataset.amount);
                this.addWater(amount, el);
            });
        });

        el.querySelector('.reset-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.reset(el);
        });
    }

    addWater(amount, el) {
        this.state.current += amount;
        this.save();
        this.updateUI(el);
        this.animateAdd(el);
    }

    reset(el) {
        this.state.current = 0;
        this.save();
        this.updateUI(el);
    }

    updateUI(el) {
        if (!el) return;

        const percent = Math.min(100, Math.round((this.state.current / this.state.target) * 100));

        const liquid = el.querySelector('.water-liquid');
        const percentageText = el.querySelector('.water-percentage');
        const currentText = el.querySelector('.water-current');

        liquid.style.height = `${percent}%`;
        percentageText.textContent = `${percent}%`;
        currentText.textContent = this.state.current;

        // Visual feedback based on goal
        if (percent >= 100) {
            el.classList.add('goal-reached');
        } else {
            el.classList.remove('goal-reached');
        }
    }

    animateAdd(el) {
        // Create floating bubble effect
        const glass = el.querySelector('.water-glass');
        const bubble = document.createElement('div');
        bubble.className = 'water-bubble';
        bubble.style.left = `${Math.random() * 80 + 10}%`;
        glass.appendChild(bubble);

        setTimeout(() => bubble.remove(), 2000);
    }

    save() {
        store.updateWidget(this.id, {
            current: this.state.current,
            target: this.state.target
        });
    }
}

export { WaterWidget };
