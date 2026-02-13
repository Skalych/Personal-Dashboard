import { Widget } from './Widget.js';
import { store } from '../store.js';

class CurrencyWidget extends Widget {
    constructor(id, data) {
        super(id, data);
        this.data = data || {};
        this.state = {
            amount: data.amount || 1,
            from: data.from || 'USD',
            to: data.to || 'UAH',
            result: null,
            rate: null,
            loading: false
        };
        // Can add flags later if needed
        this.currencies = ['USD', 'EUR', 'UAH', 'GBP', 'PLN', 'BTC', 'ETH', 'JPY', 'CAD'];
        this.fetchRate();
    }

    getTitle() {
        return 'Currency';
    }

    getContentHTML() {
        const { amount, from, to, result, loading, rate } = this.state;

        return `
            <div class="currency-container">
                <div class="currency-row top">
                    <input type="number" class="currency-input" value="${amount}" min="0">
                    ${this.renderCustomSelect('from', from)}
                </div>

                <div class="currency-separator">
                    <button class="swap-btn" title="Swap Currencies">
                        <i class="fas fa-arrow-right-arrow-left"></i>
                    </button>
                    ${rate ? `<span class="rate-info">1 ${from} ≈ ${rate.toFixed(4)} ${to}</span>` : ''}
                </div>

                <div class="currency-row bottom">
                    <div class="currency-result">
                        ${loading ? '<span class="loading-dots">...</span>' : (result !== null ? result : '--')}
                    </div>
                    ${this.renderCustomSelect('to', to)}
                </div>
            </div>
        `;
    }

    renderCustomSelect(type, value) {
        // Renders a custom dropdown structure
        const optionsHTML = this.currencies.map(c => `
            <div class="custom-option ${c === value ? 'selected' : ''}" data-value="${c}">
                <span class="currency-code">${c}</span>
                ${c === value ? '<i class="fas fa-check"></i>' : ''}
            </div>
        `).join('');

        return `
            <div class="custom-select-wrapper" data-type="${type}">
                <div class="custom-select-trigger">
                    <span>${value}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="custom-options">
                    ${optionsHTML}
                </div>
            </div>
        `;
    }

    render() {
        const el = super.render();
        el.classList.add('currency-widget');
        this.bindEvents(el);
        return el;
    }

    bindEvents(el) {
        const input = el.querySelector('.currency-input');
        const swapBtn = el.querySelector('.swap-btn');

        // Input Change
        input.addEventListener('input', () => {
            this.state.amount = parseFloat(input.value) || 0;
            this.calculate(el);
            this.save();
        });

        // Swap Logic
        swapBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            // Visual rotation
            swapBtn.style.transform = 'rotate(180deg)';
            setTimeout(() => swapBtn.style.transform = '', 200);

            // Swap values
            const temp = this.state.from;
            this.state.from = this.state.to;
            this.state.to = temp;

            this.save();
            this.updateUI(el); // Full re-render needed for custom select logic updates
            this.fetchRate(el);
        });

        // Custom Select Logic
        el.querySelectorAll('.custom-select-wrapper').forEach(wrapper => {
            const trigger = wrapper.querySelector('.custom-select-trigger');
            const optionsContainer = wrapper.querySelector('.custom-options');
            const type = wrapper.dataset.type; // 'from' or 'to'

            // Toggle Dropdown
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close other dropdowns
                el.querySelectorAll('.custom-options.open').forEach(opt => {
                    if (opt !== optionsContainer) opt.classList.remove('open');
                });
                const isOpen = optionsContainer.classList.toggle('open');
                trigger.classList.toggle('open');

                if (isOpen) el.classList.add('dropdown-open');
                else if (!el.querySelector('.custom-options.open')) el.classList.remove('dropdown-open');
            });

            // Select Option
            wrapper.querySelectorAll('.custom-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const val = option.dataset.value;

                    if (type === 'from') this.state.from = val;
                    else this.state.to = val;

                    optionsContainer.classList.remove('open');
                    trigger.classList.remove('open');
                    el.classList.remove('dropdown-open');

                    this.save();
                    this.updateUI(el); // Re-render to update UI (simplest way)
                    this.fetchRate(el);
                });
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!el.contains(e.target)) {
                el.querySelectorAll('.custom-options.open').forEach(opt => opt.classList.remove('open'));
                el.querySelectorAll('.custom-select-trigger.open').forEach(tr => tr.classList.remove('open'));
                el.classList.remove('dropdown-open');
            }
        });
    }

    async fetchRate(el) {
        const { from, to } = this.state;
        if (from === to) {
            this.state.rate = 1;
            this.calculate(el);
            if (el) this.updateRateDisplay(el);
            return;
        }

        this.state.loading = true;
        if (el) this.updateResultDisplay(el);

        try {
            const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
            const data = await response.json();

            if (data && data.rates && data.rates[to]) {
                this.state.rate = data.rates[to];
                this.calculate(el);
            } else {
                this.state.result = 'Error';
            }
        } catch (error) {
            console.error('Currency API Error:', error);
            // Fallback logic
            if (from === 'USD' && to === 'UAH') this.state.rate = 41.5;
            else if (from === 'UAH' && to === 'USD') this.state.rate = 1 / 41.5;
            else this.state.rate = null;

            this.calculate(el);
        } finally {
            this.state.loading = false;
            if (el) {
                this.updateResultDisplay(el);
                this.updateRateDisplay(el);
            }
        }
    }

    calculate(el) {
        if (this.state.rate !== null && this.state.amount !== null) {
            const res = this.state.amount * this.state.rate;
            this.state.result = res.toFixed(2);
        } else {
            this.state.result = null;
        }
        if (el) this.updateResultDisplay(el);
    }

    updateResultDisplay(el) {
        const resultEl = el.querySelector('.currency-result');
        if (!resultEl) return;
        resultEl.innerHTML = this.state.loading ? '<span class="loading-dots">...</span>' : (this.state.result !== null ? this.state.result : '--');
    }

    updateRateDisplay(el) {
        const info = el.querySelector('.rate-info');
        if (info) info.textContent = `1 ${this.state.from} ≈ ${this.state.rate ? this.state.rate.toFixed(4) : '?'} ${this.state.to}`;
        else {
            // Handle if missing, though re-render handles typical cases
            const container = el.querySelector('.currency-separator');
            if (container && !container.querySelector('.rate-info') && this.state.rate) {
                const span = document.createElement('span');
                span.className = 'rate-info';
                span.textContent = `1 ${this.state.from} ≈ ${this.state.rate.toFixed(4)} ${this.state.to}`;
                container.appendChild(span);
            }
        }
    }

    updateUI(el) {
        if (!el) return;
        el.querySelector('.widget-content').innerHTML = this.getContentHTML();
        this.bindEvents(el);
    }

    save() {
        store.updateWidget(this.id, {
            amount: this.state.amount,
            from: this.state.from,
            to: this.state.to
        });
    }
}

export { CurrencyWidget };
