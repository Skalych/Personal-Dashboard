/**
 * Store.js - Manages application state and LocalStorage persistence
 */
class Store {
    constructor() {
        this.state = {
            widgets: [],
            settings: {
                theme: 'light',
                apiKey: '',
                username: ''
            },
            nextId: 1
        };
        this.listeners = [];
        this.load();
    }

    load() {
        const saved = localStorage.getItem('dashboard_state');
        if (saved) {
            try {
                this.state = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load state', e);
            }
        }
    }

    save() {
        localStorage.setItem('dashboard_state', JSON.stringify(this.state));
        this.notify();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    // specific actions
    addWidget(type, x = 0, y = 0) {
        const id = `widget-${this.state.nextId++}`;
        const newWidget = {
            id,
            type,
            x,
            y,
            w: 2, // default width (cols)
            h: 2,  // default height (rows)
            data: {}
        };
        this.state.widgets.push(newWidget);
        this.save();
        return newWidget;
    }

    updateWidget(id, updates) {
        const widget = this.state.widgets.find(w => w.id === id);
        if (widget) {
            Object.assign(widget, updates);
            this.save();
        }
    }

    removeWidget(id) {
        this.state.widgets = this.state.widgets.filter(w => w.id !== id);
        this.save();
    }

    setSetting(key, value) {
        this.state.settings[key] = value;
        this.save();
    }

    getSettings() {
        return this.state.settings;
    }

    getWidgets() {
        return this.state.widgets;
    }
}

export { Store };
export const store = new Store();
