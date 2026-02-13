import { Widget } from './Widget.js';
import { store } from '../store.js';

class TimerWidget extends Widget {
    constructor(id, data, container) {
        super(id, data, container);
        this.data.mode = this.data.mode || 'timer'; // 'timer' or 'stopwatch'
        this.data.timerState = this.data.timerState || {
            status: 'stopped', // stopped, running, paused
            initialDuration: 0,
            endTime: null,
            remaining: 0
        };
        this.data.stopwatchState = this.data.stopwatchState || {
            status: 'stopped',
            startTime: null,
            elapsed: 0,
            laps: []
        };
        this.interval = null;
    }

    getTitle() {
        return 'Timer & Stopwatch';
    }

    render() {
        const el = super.render();
        el.classList.add('timer-widget');
        el.innerHTML = `
            <div class="widget-header">
                <h3>${this.getTitle()}</h3>
                <div class="widget-controls">
                    <i class="fas fa-times close-btn"></i>
                </div>
            </div>
            <div class="widget-content">
                <div class="timer-tabs">
                    <button class="tab-btn ${this.data.mode === 'timer' ? 'active' : ''}" data-mode="timer">Timer</button>
                    <button class="tab-btn ${this.data.mode === 'stopwatch' ? 'active' : ''}" data-mode="stopwatch">Stopwatch</button>
                </div>
                
                <div class="timer-view ${this.data.mode === 'timer' ? 'active' : ''}">
                    <div class="timer-display">00:00:00</div>
                    <div class="timer-inputs">
                        <input type="number" class="time-input" placeholder="00" min="0" max="99" data-unit="h"> :
                        <input type="number" class="time-input" placeholder="00" min="0" max="59" data-unit="m"> :
                        <input type="number" class="time-input" placeholder="00" min="0" max="59" data-unit="s">
                    </div>
                    <div class="timer-controls">
                        <button class="btn-control start-btn">
                            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                        </button>
                        <button class="btn-control pause-btn" style="display:none;">
                            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                        </button>
                        <button class="btn-control reset-btn">
                            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                        </button>
                    </div>
                </div>

                <div class="stopwatch-view ${this.data.mode === 'stopwatch' ? 'active' : ''}">
                    <div class="stopwatch-display">00:00.00</div>
                    <div class="timer-controls">
                        <button class="btn-control sw-start-btn">
                            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                        </button>
                        <button class="btn-control sw-pause-btn" style="display:none;">
                            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                        </button>
                        <button class="btn-control sw-lap-btn">
                            <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg>
                        </button>
                        <button class="btn-control sw-reset-btn">
                           <svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                        </button>
                    </div>
                    <ul class="stopwatch-laps"></ul>
                </div>
            </div>
        `;

        this.bindEvents(el);
        this.startTicker();
        this.updateUI(el);

        // Bind Close
        el.querySelector('.close-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.onRemove();
        });

        return el;
    }

    bindEvents(el) {
        // Tabs
        el.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent drag
                this.data.mode = btn.dataset.mode;
                this.save();
                this.updateUI(el);
            });
            btn.addEventListener('mousedown', e => e.stopPropagation());
        });

        const inputs = el.querySelectorAll('.time-input');
        inputs.forEach(inp => inp.addEventListener('mousedown', e => e.stopPropagation()));

        // Timer Controls
        el.querySelector('.start-btn').addEventListener('click', (e) => { e.stopPropagation(); this.startTimer(el); });
        el.querySelector('.pause-btn').addEventListener('click', (e) => { e.stopPropagation(); this.pauseTimer(); });
        el.querySelector('.reset-btn').addEventListener('click', (e) => { e.stopPropagation(); this.resetTimer(el); });

        // Stopwatch Controls
        el.querySelector('.sw-start-btn').addEventListener('click', (e) => { e.stopPropagation(); this.startStopwatch(); });
        el.querySelector('.sw-pause-btn').addEventListener('click', (e) => { e.stopPropagation(); this.pauseStopwatch(); });
        el.querySelector('.sw-reset-btn').addEventListener('click', (e) => { e.stopPropagation(); this.resetStopwatch(el); });
        el.querySelector('.sw-lap-btn').addEventListener('click', (e) => { e.stopPropagation(); this.lapStopwatch(el); });

        // Prevent drag on controls
        el.querySelectorAll('button').forEach(b => b.addEventListener('mousedown', e => e.stopPropagation()));
    }

    startTicker() {
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(() => {
            this.tick();
        }, 100);
        this.tick(); // Immediate update
    }

    tick() {
        if (!this.element) return;

        const now = Date.now();

        // Update Timer
        if (this.data.timerState.status === 'running') {
            const remaining = Math.max(0, this.data.timerState.endTime - now);
            if (remaining === 0) {
                this.data.timerState.status = 'finished';
                this.onTimerFinish();
            }
            this.updateTimerDisplay(remaining);
        } else if (this.data.timerState.status === 'paused') {
            this.updateTimerDisplay(this.data.timerState.remaining);
        } else if (this.data.timerState.status === 'stopped') {
            // Keep display at set inputs or 0
        }

        // Update Stopwatch
        if (this.data.stopwatchState.status === 'running') {
            const elapsed = (now - this.data.stopwatchState.startTime) + this.data.stopwatchState.elapsed;
            this.updateStopwatchDisplay(elapsed);
        } else {
            this.updateStopwatchDisplay(this.data.stopwatchState.elapsed);
        }
    }

    // --- Timer Logic ---
    startTimer(el) {
        this.stopAlarm(); // clear alarm if any
        if (this.data.timerState.status === 'running') return;


        let duration = 0;
        if (this.data.timerState.status === 'paused') {
            duration = this.data.timerState.remaining;
        } else {
            // Read inputs
            const h = parseInt(el.querySelector('[data-unit="h"]').value) || 0;
            const m = parseInt(el.querySelector('[data-unit="m"]').value) || 0;
            const s = parseInt(el.querySelector('[data-unit="s"]').value) || 0;
            duration = ((h * 3600) + (m * 60) + s) * 1000;
            if (duration <= 0) return;
            this.data.timerState.initialDuration = duration;
        }

        this.data.timerState.status = 'running';
        this.data.timerState.endTime = Date.now() + duration;
        this.save();
        this.updateUI(el);
    }

    pauseTimer() {
        if (this.data.timerState.status !== 'running') return;
        const now = Date.now();
        this.data.timerState.remaining = Math.max(0, this.data.timerState.endTime - now);
        this.data.timerState.status = 'paused';
        this.save();
        this.updateUI(this.element);
    }

    resetTimer(el) {
        this.stopAlarm();
        this.data.timerState.status = 'stopped';
        this.data.timerState.remaining = 0;
        this.data.timerState.endTime = null;
        this.save();
        this.updateUI(el);
        this.updateTimerDisplay(0);
        // Reset inputs? Maybe keep them.
    }

    onTimerFinish() {
        this.data.timerState.status = 'alarm';
        this.save();
        this.updateUI(this.element);
        this.startAlarm();
    }

    updateTimerDisplay(ms) {
        if (!this.element) return;
        const totalSec = Math.ceil(ms / 1000);
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = totalSec % 60;

        const pad = (n) => n.toString().padStart(2, '0');
        this.element.querySelector('.timer-display').textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
    }

    // --- Stopwatch Logic ---
    startStopwatch() {
        if (this.data.stopwatchState.status === 'running') return;

        this.data.stopwatchState.status = 'running';
        this.data.stopwatchState.startTime = Date.now();
        this.save();
        this.updateUI(this.element);
    }

    pauseStopwatch() {
        if (this.data.stopwatchState.status !== 'running') return;

        const now = Date.now();
        this.data.stopwatchState.elapsed += (now - this.data.stopwatchState.startTime);
        this.data.stopwatchState.status = 'paused';
        this.save();
        this.updateUI(this.element);
    }

    resetStopwatch(el) {
        this.data.stopwatchState.status = 'stopped';
        this.data.stopwatchState.elapsed = 0;
        this.data.stopwatchState.startTime = null;
        this.data.stopwatchState.laps = []; // Clear laps
        this.save();
        this.updateUI(el);
    }

    lapStopwatch(el) {
        if (this.data.stopwatchState.status !== 'running') return;
        const now = Date.now();
        const currentElapsed = (now - this.data.stopwatchState.startTime) + this.data.stopwatchState.elapsed;
        this.data.stopwatchState.laps.push(currentElapsed);
        this.save();
        this.renderLaps(el);
    }

    updateStopwatchDisplay(ms) {
        if (!this.element) return;

        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        const cs = Math.floor((ms % 1000) / 10); // centiseconds

        const pad = (n) => n.toString().padStart(2, '0');
        this.element.querySelector('.stopwatch-display').textContent = `${pad(m)}:${pad(s)}.${pad(cs)}`;
    }

    renderLaps(el) {
        const list = el.querySelector('.stopwatch-laps');
        list.innerHTML = this.data.stopwatchState.laps.map((lap, i) => {
            const m = Math.floor(lap / 60000);
            const s = Math.floor((lap % 60000) / 1000);
            const cs = Math.floor((lap % 1000) / 10);
            return `<li><span>Lap ${i + 1}</span> <span>${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}</span></li>`;
        }).reverse().join('');
    }

    updateUI(el) {
        if (!el) return;

        // Update Tabs
        el.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === this.data.mode));
        el.querySelector('.timer-view').classList.toggle('active', this.data.mode === 'timer');
        el.querySelector('.stopwatch-view').classList.toggle('active', this.data.mode === 'stopwatch');

        // Update Controls Visibility
        // Timer
        const tStatus = this.data.timerState.status;
        el.querySelector('.timer-inputs').style.display = tStatus === 'stopped' ? 'flex' : 'none';
        el.querySelector('.timer-display').style.display = tStatus === 'stopped' ? 'none' : 'block';

        el.querySelector('.start-btn').style.display = tStatus !== 'running' ? 'flex' : 'none';
        el.querySelector('.pause-btn').style.display = tStatus === 'running' ? 'flex' : 'none';

        // Stopwatch
        const sStatus = this.data.stopwatchState.status;
        el.querySelector('.sw-start-btn').style.display = sStatus !== 'running' ? 'flex' : 'none';
        el.querySelector('.sw-pause-btn').style.display = sStatus === 'running' ? 'flex' : 'none';

        this.renderLaps(el);
    }

    // --- Alarm Logic ---
    startAlarm() {
        if (this.alarmInterval) return;
        this.element.classList.add('alarm-active');
        this.playAlarmSound();
        this.alarmInterval = setInterval(() => this.playAlarmSound(), 1000);
    }

    stopAlarm() {
        if (this.alarmInterval) {
            clearInterval(this.alarmInterval);
            this.alarmInterval = null;
        }
        if (this.element) {
            this.element.classList.remove('alarm-active');
        }
    }

    playAlarmSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            // Calmer sound: Sine wave
            osc.type = 'sine';

            // Pleasant pitch (C5)
            osc.frequency.setValueAtTime(523.25, ctx.currentTime);

            // Gentle envelope (Bell-like)
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.05); // Soft attack
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8); // Long smooth tail

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 1);
        } catch (e) {
            console.error('Audio play failed', e);
        }
    }

    onRemove() {
        this.stopAlarm();
        if (this.interval) clearInterval(this.interval);
        super.onRemove();
    }

    save() {
        store.updateWidget(this.id, {
            mode: this.data.mode,
            timerState: this.data.timerState,
            stopwatchState: this.data.stopwatchState
        });
    }
}

export { TimerWidget };
