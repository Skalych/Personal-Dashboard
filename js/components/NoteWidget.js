/**
 * NoteWidget.js - Simple generic note widget
 */
// Widget and store are now global

import { Widget } from './Widget.js';
import { store } from '../store.js';

class NoteWidget extends Widget {
    constructor(id, data) {
        super(id, data);
        this.data = data;
    }

    getTitle() {
        return 'Note';
    }

    getContentHTML() {
        const text = this.data.data.text || '';
        return `
            <textarea class="note-content" placeholder="Type something...">${text}</textarea>
        `;
    }

    render() {
        const el = super.render();
        const textarea = el.querySelector('textarea');

        textarea.addEventListener('input', (e) => {
            store.updateWidget(this.id, {
                data: { ...this.data.data, text: e.target.value }
            });
        });

        // Prevent drag when typing
        textarea.addEventListener('mousedown', (e) => e.stopPropagation());

        return el;
    }
}

export { NoteWidget };
