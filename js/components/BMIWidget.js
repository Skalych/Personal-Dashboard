import { Widget } from './Widget.js';
import { store } from '../store.js';

class BMIWidget extends Widget {
    constructor(id, data) {
        super(id, data);
        this.data = data || {};
        this.state = {
            height: data.height || '',
            weight: data.weight || '',
            bmi: null,
            category: null
        };
    }

    getTitle() {
        return 'BMI Calculator';
    }

    getContentHTML() {
        return `
            <div class="bmi-content">
                <div class="input-group">
                    <label>Height (cm)</label>
                    <input type="number" class="bmi-input" id="bmi-height" placeholder="170" value="${this.state.height}">
                </div>
                <div class="input-group">
                    <label>Weight (kg)</label>
                    <input type="number" class="bmi-input" id="bmi-weight" placeholder="70" value="${this.state.weight}">
                </div>
                
                <div class="bmi-result ${this.state.bmi ? 'has-result' : ''}">
                    <div class="bmi-value">${this.state.bmi || '--'}</div>
                    <div class="bmi-category">${this.state.category || 'Enter details'}</div>
                </div>
                
                <div class="bmi-scale">
                    <div class="scale-bar"></div>
                    <div class="scale-marker" style="left: 0%"></div>
                </div>
            </div>
        `;
    }

    render() {
        const el = super.render();
        el.classList.add('bmi-widget');
        this.bindEvents(el);
        this.updateUI(el); // Initial update
        return el;
    }

    bindEvents(el) {
        const inputs = el.querySelectorAll('.bmi-input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.calculate(el);
            });
        });
    }

    calculate(el) {
        const heightInput = el.querySelector('#bmi-height').value;
        const weightInput = el.querySelector('#bmi-weight').value;

        this.state.height = heightInput;
        this.state.weight = weightInput;

        const h = parseFloat(heightInput);
        const w = parseFloat(weightInput);

        if (h > 0 && w > 0) {
            const hM = h / 100;
            const bmi = w / (hM * hM);
            this.state.bmi = bmi.toFixed(1);
            this.state.category = this.getCategory(bmi);
        } else {
            this.state.bmi = null;
            this.state.category = null;
        }

        this.save();
        this.updateUI(el);
    }

    getCategory(bmi) {
        if (bmi < 18.5) return 'Underweight';
        if (bmi < 25) return 'Normal weight';
        if (bmi < 30) return 'Overweight';
        return 'Obese';
    }

    updateUI(el) {
        if (!el) return;

        const resultEl = el.querySelector('.bmi-result');
        const valueEl = el.querySelector('.bmi-value');
        const categoryEl = el.querySelector('.bmi-category');
        const marker = el.querySelector('.scale-marker');

        if (this.state.bmi) {
            resultEl.classList.add('has-result');
            valueEl.textContent = this.state.bmi;
            categoryEl.textContent = this.state.category;

            // Color coding
            resultEl.className = 'bmi-result has-result'; // Reset
            if (this.state.bmi < 18.5) resultEl.classList.add('blue');
            else if (this.state.bmi < 25) resultEl.classList.add('green');
            else if (this.state.bmi < 30) resultEl.classList.add('orange');
            else resultEl.classList.add('red');

            // Marker Position (approximate mapping)
            // 15 -> 0%, 22 -> 33%, 27 -> 66%, 35 -> 100%
            let pos = 0;
            const b = parseFloat(this.state.bmi);
            if (b < 18.5) pos = (b - 15) / (18.5 - 15) * 25;
            else if (b < 25) pos = 25 + (b - 18.5) / (25 - 18.5) * 25;
            else if (b < 30) pos = 50 + (b - 25) / (30 - 25) * 25;
            else pos = 75 + (b - 30) / (40 - 30) * 25;

            pos = Math.max(0, Math.min(100, pos));
            marker.style.left = `${pos}%`;

        } else {
            resultEl.classList.remove('has-result');
            valueEl.textContent = '--';
            categoryEl.textContent = 'Enter details';
            marker.style.left = '0%';
        }
    }

    save() {
        store.updateWidget(this.id, {
            height: this.state.height,
            weight: this.state.weight
        });
    }
}

export { BMIWidget };
