import { Widget } from './Widget.js';
import { store } from '../store.js';

class CalculatorWidget extends Widget {
    constructor(id, data) {
        super(id, data);
        this.state = {
            displayValue: data.displayValue || '0',
            firstOperand: data.firstOperand || null,
            operator: data.operator || null,
            waitingForSecondOperand: data.waitingForSecondOperand || false
        };
    }

    getTitle() {
        return 'Calculator';
    }

    getContentHTML() {
        return `
            <div class="calculator-display" data-value="${this.state.displayValue}">${this.state.displayValue}</div>
            <div class="calculator-keypad">
                <button class="calc-btn op-btn" data-action="clear">C</button>
                <button class="calc-btn op-btn" data-action="toggle-sign">+/-</button>
                <button class="calc-btn op-btn" data-action="percent">%</button>
                <button class="calc-btn op-btn" data-action="operator" data-op="/">÷</button>
                
                <button class="calc-btn num-btn" data-num="7">7</button>
                <button class="calc-btn num-btn" data-num="8">8</button>
                <button class="calc-btn num-btn" data-num="9">9</button>
                <button class="calc-btn op-btn" data-action="operator" data-op="*">×</button>
                
                <button class="calc-btn num-btn" data-num="4">4</button>
                <button class="calc-btn num-btn" data-num="5">5</button>
                <button class="calc-btn num-btn" data-num="6">6</button>
                <button class="calc-btn op-btn" data-action="operator" data-op="-">−</button>
                
                <button class="calc-btn num-btn" data-num="1">1</button>
                <button class="calc-btn num-btn" data-num="2">2</button>
                <button class="calc-btn num-btn" data-num="3">3</button>
                <button class="calc-btn op-btn" data-action="operator" data-op="+">+</button>
                
                <button class="calc-btn num-btn zero-btn" data-num="0">0</button>
                <button class="calc-btn num-btn" data-action="decimal">.</button>
                <button class="calc-btn equals-btn" data-action="calculate">=</button>
            </div>
        `;
    }

    render() {
        // Use base Widget render to create container and header
        const el = super.render();
        el.classList.add('calculator-widget');
        this.bindEvents(el);
        return el;
    }

    bindEvents(el) {
        // Widget base class does not have bindEvents, but we handle our own events here
        // Note: Close button is handled by super.render()

        const keypad = el.querySelector('.calculator-keypad');
        keypad.addEventListener('click', (e) => {
            if (!e.target.matches('button')) return;
            e.stopPropagation(); // Prevent drag

            const btn = e.target;
            const action = btn.dataset.action;
            const num = btn.dataset.num;

            if (num !== undefined) {
                this.inputDigit(num);
            } else if (action === 'operator') {
                this.handleOperator(btn.dataset.op);
            } else if (action === 'decimal') {
                this.inputDecimal();
            } else if (action === 'clear') {
                this.reset();
            } else if (action === 'calculate') {
                this.calculate();
            } else if (action === 'toggle-sign') {
                this.toggleSign();
            } else if (action === 'percent') {
                this.inputPercent();
            }

            this.updateDisplay(el);
            this.save();
        });

        // Prevent drag on keypad buttons explicitly
        keypad.querySelectorAll('button').forEach(b => {
            b.addEventListener('mousedown', e => e.stopPropagation());
        });
    }

    inputDigit(digit) {
        const { displayValue, waitingForSecondOperand } = this.state;

        if (waitingForSecondOperand) {
            this.state.displayValue = digit;
            this.state.waitingForSecondOperand = false;
        } else {
            this.state.displayValue = displayValue === '0' ? digit : displayValue + digit;
        }
    }

    inputDecimal() {
        if (this.state.waitingForSecondOperand) {
            this.state.displayValue = '0.';
            this.state.waitingForSecondOperand = false;
            return;
        }

        if (!this.state.displayValue.includes('.')) {
            this.state.displayValue += '.';
        }
    }

    handleOperator(nextOperator) {
        const { firstOperand, displayValue, operator } = this.state;
        const inputValue = parseFloat(displayValue);

        if (operator && this.state.waitingForSecondOperand) {
            this.state.operator = nextOperator;
            return;
        }

        if (firstOperand == null && !isNaN(inputValue)) {
            this.state.firstOperand = inputValue;
        } else if (operator) {
            const result = this.performCalculation(operator, firstOperand, inputValue);
            this.state.displayValue = String(result);
            this.state.firstOperand = result;
        }

        this.state.waitingForSecondOperand = true;
        this.state.operator = nextOperator;
    }

    performCalculation(operator, first, second) {
        if (operator === '+') return first + second;
        if (operator === '-') return first - second;
        if (operator === '*') return first * second;
        if (operator === '/') return second === 0 ? 'Error' : first / second;
        return second;
    }

    calculate() {
        const { firstOperand, displayValue, operator } = this.state;
        const inputValue = parseFloat(displayValue);

        if (operator && !this.state.waitingForSecondOperand) {
            const result = this.performCalculation(operator, firstOperand, inputValue);
            this.state.displayValue = String(result);
            this.state.firstOperand = null;
            this.state.operator = null;
            this.state.waitingForSecondOperand = true;
        }
    }

    reset() {
        this.state = {
            displayValue: '0',
            firstOperand: null,
            operator: null,
            waitingForSecondOperand: false
        };
    }

    toggleSign() {
        const val = parseFloat(this.state.displayValue);
        if (val !== 0) {
            this.state.displayValue = String(val * -1);
        }
    }

    inputPercent() {
        const val = parseFloat(this.state.displayValue);
        this.state.displayValue = String(val / 100);
    }

    updateDisplay(el) {
        if (!el) return;
        const display = el.querySelector('.calculator-display');

        let val = this.state.displayValue;
        if (val.length > 12) {
            const num = parseFloat(val);
            if (!isNaN(num)) val = num.toPrecision(10).toString();
        }
        display.textContent = val;
    }

    save() {
        store.updateWidget(this.id, {
            displayValue: this.state.displayValue,
            firstOperand: this.state.firstOperand,
            operator: this.state.operator,
            waitingForSecondOperand: this.state.waitingForSecondOperand
        });
    }
}

export { CalculatorWidget };
