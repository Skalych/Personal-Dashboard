import { Widget } from './Widget.js';
import { store } from '../store.js';

class TodoWidget extends Widget {
    constructor(id, data, container) {
        super(id, data, container);
        this.data.todos = this.data.todos || [];
    }

    getTitle() {
        return 'To-Do List';
    }

    render() {
        const el = super.render();
        el.classList.add('todo-widget');

        // Additional setup after base render
        const listEl = el.querySelector('.todo-list');
        this.renderList(listEl);
        this.bindEvents(el);

        return el;
    }

    getContentHTML() {
        return `
            <div class="todo-container">
                <div class="todo-input-wrap">
                    <input type="text" class="todo-input" placeholder="Add a task...">
                    <button class="todo-add-btn"><i class="fas fa-plus"></i></button>
                </div>
                <ul class="todo-list">
                    <!-- Items rendered here -->
                </ul>
            </div>
        `;
    }

    renderList(listEl) {
        if (!listEl) return;

        if (this.data.todos.length === 0) {
            listEl.innerHTML = '<li class="todo-empty">No tasks yet</li>';
            return;
        }

        listEl.innerHTML = this.data.todos.map((todo, index) => `
            <li class="todo-item ${todo.completed ? 'completed' : ''}" data-index="${index}">
                <label class="todo-checkbox">
                    <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                    <span class="checkmark"></span>
                </label>
                <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                <button class="todo-delete-btn"><i class="fas fa-times"></i></button>
            </li>
        `).join('');
    }

    bindEvents(el) {
        const input = el.querySelector('.todo-input');
        const addBtn = el.querySelector('.todo-add-btn');
        const list = el.querySelector('.todo-list');

        const addTodo = () => {
            const text = input.value.trim();
            if (text) {
                this.data.todos.push({ text, completed: false });
                this.save();
                this.renderList(list);
                input.value = '';
            }
        };

        addBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent drag
            addTodo();
        });

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTodo();
        });

        // Checkboxes and Delete
        list.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const item = e.target.closest('.todo-item');
                if (item) {
                    const index = parseInt(item.dataset.index);
                    this.data.todos[index].completed = e.target.checked;
                    this.save();
                    this.renderList(list);
                }
            }
        });

        list.addEventListener('click', (e) => {
            const delBtn = e.target.closest('.todo-delete-btn');
            if (delBtn) {
                e.stopPropagation();
                const item = delBtn.closest('.todo-item');
                const index = parseInt(item.dataset.index);
                this.data.todos.splice(index, 1);
                this.save();
                this.renderList(list);
            }
        });

        // Prevent drag on interactive elements
        input.addEventListener('mousedown', e => e.stopPropagation());
        list.addEventListener('mousedown', e => e.stopPropagation());
    }

    save() {
        store.updateWidget(this.id, { todos: this.data.todos });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

export { TodoWidget };
