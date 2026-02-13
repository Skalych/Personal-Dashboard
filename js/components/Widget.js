import { store } from '../store.js';

/**
 * Widget.js - Base class for all widgets
 */
class Widget {
    constructor(id, data, container) {
        this.id = id;
        this.data = data || {};
        this.container = container;
        this.element = null;
    }

    render() {
        this.element = document.createElement('div');
        this.element.classList.add('widget');
        this.element.setAttribute('data-id', this.id);
        this.element.style.width = `calc(${this.data.w} * var(--grid-size) * 10 - var(--gap))`; // Simple sizing for now
        this.element.style.height = `calc(${this.data.h} * var(--grid-size) * 10 - var(--gap))`;

        // Position handled by main/drag logic, but initial render needs it
        this.updatePosition(this.data.x, this.data.y);

        this.element.innerHTML = `
            <div class="widget-header">
                <h3>${this.getTitle()}</h3>
                <div class="widget-controls">
                    <i class="fas fa-times close-btn"></i>
                </div>
            </div>
            <div class="widget-content">
                ${this.getContentHTML()}
            </div>
        `;

        // Bind events
        this.element.querySelector('.close-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent drag start
            this.onRemove();
        });

        return this.element;
    }

    updatePosition(x, y) {
        this.element.style.transform = `translate(${x}px, ${y}px)`;
        this.data.x = x;
        this.data.y = y;
    }

    getTitle() {
        return 'Widget';
    }

    getContentHTML() {
        return '<p>Widget Content</p>';
    }

    onRemove() {
        const event = new CustomEvent('widget-remove', { detail: { id: this.id } });
        document.dispatchEvent(event);
    }
}

export { Widget };
