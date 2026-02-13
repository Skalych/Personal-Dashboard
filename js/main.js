/**
 * Main.js - Application Entry Point
 */
import { store } from './store.js';
import { initDragAndDrop } from './drag.js';
import { initResize } from './resize.js';
import { NoteWidget } from './components/NoteWidget.js';
import { AIWidget } from './components/AIWidget.js';
import { WeatherWidget } from './components/WeatherWidget.js';
import { TodoWidget } from './components/TodoWidget.js';
import { TimerWidget } from './components/TimerWidget.js';
import { CalculatorWidget } from './components/CalculatorWidget.js';
import { BMIWidget } from './components/BMIWidget.js';
import { WaterWidget } from './components/WaterWidget.js';
import { OneHabitWidget } from './components/OneHabitWidget.js';
import { CurrencyWidget } from './components/CurrencyWidget.js';
import './cursor-glow.js';

// Registry of available widgets (classes are global)
const WIDGET_REGISTRY = {
    'note': NoteWidget,
    'ai': AIWidget,
    'weather': WeatherWidget,
    'todo': TodoWidget,
    'timer': TimerWidget,
    'calculator': CalculatorWidget,
    'bmi': BMIWidget,
    'water': WaterWidget,
    'habit': OneHabitWidget,
    'currency': CurrencyWidget
};

// Main App Controller
class App {
    constructor() {
        this.dashboard = document.getElementById('dashboard');
        this.widgetMap = new Map(); // id -> widget instance

        this.init();
    }

    init() {
        // Initialize Drag and Drop
        initDragAndDrop();

        // Initialize Resize
        initResize();

        // Subscribe to store changes
        store.subscribe(this.onStateChange.bind(this));

        // Initial Render
        this.renderWidgets(store.getWidgets());

        // Setup Event Listeners
        this.setupEventListeners();

        // Check Onboarding
        this.checkOnboarding();

        // Load Settings
        this.loadSettings();
    }

    setupEventListeners() {
        // Add Widget Logic
        // Widget Menu Logic
        const menu = document.getElementById('widget-menu');
        const addBtn = document.getElementById('add-widget-btn');

        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('hidden');
            // Animate icon rotation
            const icon = addBtn.querySelector('i');
            if (menu.classList.contains('hidden')) {
                icon.style.transform = 'rotate(0deg)';
            } else {
                icon.style.transform = 'rotate(45deg)';
            }
        });

        // Close menu when clicking backdrop or close button
        const closeMenu = () => {
            menu.classList.add('hidden');
            addBtn.querySelector('i').style.transform = 'rotate(0deg)';
        };

        menu.addEventListener('click', (e) => {
            if (e.target === menu) closeMenu();
        });

        const menuCloseBtn = menu.querySelector('.menu-close-btn');
        if (menuCloseBtn) {
            menuCloseBtn.addEventListener('click', closeMenu);
        }

        // Add Widget from Menu
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const type = item.getAttribute('data-type');
                if (type && WIDGET_REGISTRY[type]) {
                    // Add to center of view (approximate)
                    const widget = store.addWidget(type, 100, 100);
                    this.renderWidget(widget);

                    // Close menu
                    menu.classList.add('hidden');
                    addBtn.querySelector('i').style.transform = 'rotate(0deg)';
                }
            });
        });

        document.addEventListener('widget-remove', (e) => {
            const id = e.detail.id;
            this.removeWidget(id);
        });

        // Settings Modal
        const settingsModal = document.getElementById('settings-modal');
        const apiKeyInput = document.getElementById('api-key');

        document.getElementById('save-settings').addEventListener('click', () => {
            store.setSetting('apiKey', apiKeyInput.value);

            // Green border flash animation
            const modalContent = settingsModal.querySelector('.modal-content');
            modalContent.classList.add('save-success');

            // Remove animation class and close modal after animation
            setTimeout(() => {
                modalContent.classList.remove('save-success');
                settingsModal.classList.add('hidden');
            }, 1200);
        });

        document.getElementById('close-settings').addEventListener('click', () => {
            settingsModal.classList.add('hidden');
        });

        // Add floating settings button
        if (!document.getElementById('settings-btn')) {
            const btn = document.createElement('button');
            btn.id = 'settings-btn';
            btn.className = 'settings-btn'; // Use CSS class
            btn.innerHTML = '<i class="fas fa-cog"></i>';
            // Inline styles removed - moving to styles.css for better theme support

            btn.addEventListener('click', () => {
                apiKeyInput.value = store.getSettings().apiKey || '';
                settingsModal.classList.remove('hidden');
            });
            document.body.appendChild(btn);
        }

        // Theme Toggle Logic
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('change', (e) => {
                const newTheme = e.target.checked ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', newTheme);
                store.setSetting('theme', newTheme);
            });
        }
    }

    onStateChange(state) {
        // For simple updates (like text), the widget handles itself.
        // For structural changes (add/remove), we might need to reconcile.
        // Currently, we only add/remove manually.
    }

    renderWidgets(widgets) {
        this.dashboard.innerHTML = '';
        this.widgetMap.clear();
        widgets.forEach(w => this.renderWidget(w));
    }

    renderWidget(widgetData) {
        const WidgetClass = WIDGET_REGISTRY[widgetData.type];
        if (!WidgetClass) return;

        const widgetInstance = new WidgetClass(widgetData.id, widgetData);
        const element = widgetInstance.render();

        this.dashboard.appendChild(element);
        this.widgetMap.set(widgetData.id, widgetInstance);
    }

    removeWidget(id) {
        const widgetInstance = this.widgetMap.get(id);
        if (widgetInstance) {
            widgetInstance.element.remove();
            this.widgetMap.delete(id);
            store.removeWidget(id);
        }
    }

    checkOnboarding() {
        if (store.getWidgets().length === 0) {
            // New user, show onboarding
            const onboarding = document.getElementById('onboarding');
            onboarding.classList.remove('hidden');

            const startBtn = document.getElementById('get-started-btn');
            startBtn.addEventListener('click', () => {
                onboarding.classList.add('hidden');

                // Add initial widgets
                const w1 = store.addWidget('ai', 50, 50);
                const w2 = store.addWidget('weather', 450, 50);
                const w3 = store.addWidget('note', 50, 450);

                this.renderWidget(w1);
                this.renderWidget(w2);
                this.renderWidget(w3);
            });
        }
    }

    loadSettings() {
        const settings = store.getSettings();
        if (settings.apiKey) {
            const apiKeyInput = document.getElementById('api-key');
            if (apiKeyInput) apiKeyInput.value = settings.apiKey;
        }

        // Load Theme
        const theme = settings.theme || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.checked = theme === 'dark';
        }
    }
}

// Start App
const app = new App();
