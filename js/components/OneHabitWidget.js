import { Widget } from './Widget.js';
import { store } from '../store.js';

class OneHabitWidget extends Widget {
    constructor(id, data) {
        super(id, data);
        this.data = data || {};
        this.state = {
            habitName: data.habitName || 'My Goal',
            streak: data.streak || 0,
            lastChecked: data.lastChecked || null, // Date string YYYY-MM-DD
            history: data.history || [] // Keep history for calendar view if needed later?
        };
    }

    getTitle() {
        return 'One Habit';
    }

    getContentHTML() {
        const today = new Date().toISOString().split('T')[0];
        const isCheckedToday = this.state.lastChecked === today;

        let flameClass = 'flame-small';
        if (this.state.streak >= 7) flameClass = 'flame-medium';
        if (this.state.streak >= 30) flameClass = 'flame-large';
        if (this.state.streak >= 100) flameClass = 'flame-inferno';

        return `
            <div class="one-habit-container">
                <div class="habit-title-container">
                    <input type="text" class="habit-title-input" value="${this.state.habitName}" placeholder="Name your habit...">
                </div>

                <div class="habit-action-area">
                    <button class="habit-check-btn ${isCheckedToday ? 'checked' : ''}" ${isCheckedToday ? 'disabled' : ''}>
                        <div class="btn-inner">
                            ${isCheckedToday ? '<i class="fas fa-check"></i>' : '<i class="fas fa-fire"></i>'}
                        </div>
                        <div class="btn-ripple"></div>
                    </button>
                    ${isCheckedToday ? '<div class="habit-message">Done for today!</div>' : '<div class="habit-message">Keep the streak alive!</div>'}
                </div>

                <div class="habit-streak-display">
                    <div class="streak-flame ${flameClass}">
                        <div class="flame-core"></div>
                        <div class="flame-particle p1"></div>
                        <div class="flame-particle p2"></div>
                        <div class="flame-particle p3"></div>
                    </div>
                    <div class="streak-count">
                        <span class="count-value">${this.state.streak}</span>
                        <span class="count-label">DAYS</span>
                    </div>
                </div>

                <!-- Debug Controls (Hidden by default, hover to show) -->
                <div class="habit-debug-controls">
                    <button class="debug-btn" data-action="add-day" title="+1 Streak (Simulate Tomorrow)">🐞 +1</button>
                    <button class="debug-btn" data-action="reset" title="Reset Streak">↻</button>
                </div>
            </div>
        `;
    }

    render() {
        const el = super.render();
        el.classList.add('one-habit-widget');
        this.bindEvents(el);
        // Check streak validity on load (reset if missed yesterday)
        this.checkStreakValidity(el);
        return el;
    }

    bindEvents(el) {
        const titleInput = el.querySelector('.habit-title-input');
        const checkBtn = el.querySelector('.habit-check-btn');

        titleInput.addEventListener('change', () => {
            this.state.habitName = titleInput.value;
            this.save();
        });

        checkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!checkBtn.classList.contains('checked')) {
                this.checkIn(el);
            }
        });

        // Debug Actions
        el.querySelectorAll('.debug-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                if (action === 'add-day') {
                    this.debugAddDay(el);
                } else if (action === 'reset') {
                    this.state.streak = 0;
                    this.state.lastChecked = null;
                    this.save();
                    this.updateUI(el);
                }
            });
        });
    }

    debugAddDay(el) {
        // Increment streak but pretend we checked YESTERDAY
        this.state.streak++;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        this.state.lastChecked = yesterday.toISOString().split('T')[0];

        this.save();
        this.updateUI(el);
    }

    checkStreakValidity(el) {
        if (!this.state.lastChecked) return;

        const today = new Date();
        const last = new Date(this.state.lastChecked);

        // Calculate diff in days
        const diffTime = Math.abs(today - last);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // Note: diffDays is rough. Better to use day start comparison.

        const todayStr = today.toISOString().split('T')[0];
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (this.state.lastChecked !== todayStr && this.state.lastChecked !== yesterdayStr) {
            // Missed a day! Reset streak.
            // But only if streak > 0
            if (this.state.streak > 0) {
                // Logic: If last checked was NOT today AND NOT yesterday (so 2+ days ago) -> Reset.
                this.state.streak = 0;
                this.save();
                this.updateUI(el);
            }
        }
    }

    checkIn(el) {
        const today = new Date().toISOString().split('T')[0];

        this.state.streak++;
        this.state.lastChecked = today;
        this.state.history.push(today);

        this.save();
        this.updateUI(el);
        this.triggerCelebration(el);
    }

    updateUI(el) {
        if (!el) return;
        el.querySelector('.widget-content').innerHTML = this.getContentHTML();
        this.bindEvents(el); // Rebind events after HTML replacement
    }

    triggerCelebration(el) {
        // Add confetti or particle effects
        const btn = el.querySelector('.habit-check-btn');
        btn.classList.add('pulse-animation');

        // Flame flairs up
        const flame = el.querySelector('.streak-flame');
        flame.classList.add('flare-up');
        setTimeout(() => flame.classList.remove('flare-up'), 1000);

        // Sound?
        // const audio = new Audio('assets/fire-whoosh.mp3'); // If we had assets
    }

    save() {
        store.updateWidget(this.id, {
            habitName: this.state.habitName,
            streak: this.state.streak,
            lastChecked: this.state.lastChecked,
            history: this.state.history
        });
    }
}

export { OneHabitWidget };
