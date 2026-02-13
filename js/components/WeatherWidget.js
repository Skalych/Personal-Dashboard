/**
 * WeatherWidget.js - Full Weather Display with City Search & 3-Day Forecast
 * Uses Open-Meteo API (No API Key required)
 * Uses Open-Meteo Geocoding API for city search
 */

import { Widget } from './Widget.js';
import { store } from '../store.js';

class WeatherWidget extends Widget {
    constructor(id, data) {
        super(id, data);
        this.location = this.data.data.location || { lat: 50.45, lon: 30.52, name: 'Kyiv' };
        this.searchTimeout = null;
    }

    getTitle() {
        return 'Weather';
    }

    getContentHTML() {
        return `
            <div class="weather-container">
                <div class="weather-current">
                    <div class="weather-main">
                        <div class="weather-temp-block">
                            <span class="weather-icon">🌤️</span>
                            <span class="weather-temp">--°</span>
                        </div>
                        <div class="weather-info">
                            <div class="weather-desc">Loading...</div>
                            <div class="weather-feels">Feels like --°</div>
                        </div>
                    </div>
                    <div class="weather-details">
                        <div class="weather-detail-item">
                            <i class="fas fa-tint"></i>
                            <span class="weather-precip">-- mm</span>
                        </div>
                        <div class="weather-detail-item">
                            <i class="fas fa-sun"></i>
                            <span class="weather-sunrise">--:--</span>
                        </div>
                        <div class="weather-detail-item">
                            <i class="fas fa-moon"></i>
                            <span class="weather-sunset">--:--</span>
                        </div>
                    </div>
                </div>
                <div class="weather-forecast"></div>
                <div class="weather-search-area">
                    <div class="weather-search-wrap">
                        <i class="fas fa-map-marker-alt weather-search-icon"></i>
                        <input type="text" class="weather-search" value="${this.location.name}" placeholder="Search city..." autocomplete="off">
                    </div>
                    <ul class="weather-results"></ul>
                </div>
            </div>
        `;
    }

    render() {
        const el = super.render();
        el.classList.add('weather-widget');

        // Let widget grow to fit content (override fixed height from base)
        el.style.height = 'auto';
        el.style.minHeight = 'unset';

        // Hide the config (gear) button — not needed
        const configBtn = el.querySelector('.config-btn');
        if (configBtn) configBtn.style.display = 'none';

        this.fetchWeather(el);
        this.bindSearch(el);
        return el;
    }

    bindSearch(el) {
        const searchInput = el.querySelector('.weather-search');
        const resultsList = el.querySelector('.weather-results');

        // Prevent drag system from capturing mousedown on search elements
        searchInput.addEventListener('mousedown', (e) => e.stopPropagation());
        resultsList.addEventListener('mousedown', (e) => e.stopPropagation());

        searchInput.addEventListener('focus', () => {
            searchInput.select();
            el.classList.add('searching');
        });

        searchInput.addEventListener('input', () => {
            clearTimeout(this.searchTimeout);
            const query = searchInput.value.trim();

            if (query.length < 2) {
                resultsList.innerHTML = '';
                resultsList.style.display = 'none';
                return;
            }

            resultsList.innerHTML = '<li class="weather-result-loading">Searching...</li>';
            resultsList.style.display = '';

            this.searchTimeout = setTimeout(() => {
                this.searchCity(query, resultsList, el);
            }, 300);
        });

        searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                resultsList.style.display = 'none';
                el.classList.remove('searching');
            }, 200);
        });
    }

    async searchCity(query, resultsList, widgetEl) {
        try {
            const res = await fetch(
                `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en`
            );
            if (!res.ok) throw new Error('Geocoding error');
            const data = await res.json();

            if (!data.results || data.results.length === 0) {
                resultsList.innerHTML = '<li class="weather-result-empty">No cities found</li>';
                return;
            }

            resultsList.innerHTML = data.results.map(city => {
                const displayName = `${city.name}${city.admin1 ? ', ' + city.admin1 : ''}, ${city.country || ''}`;
                return `
                    <li class="weather-result-item" 
                        data-lat="${city.latitude}" 
                        data-lon="${city.longitude}" 
                        data-name="${displayName}">
                        <span class="weather-result-name">${city.name}</span>
                        <span class="weather-result-detail">${city.admin1 ? city.admin1 + ', ' : ''}${city.country || ''}</span>
                    </li>
                `;
            }).join('');

            resultsList.querySelectorAll('.weather-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.selectCity({
                        lat: parseFloat(item.dataset.lat),
                        lon: parseFloat(item.dataset.lon),
                        name: item.dataset.name
                    }, widgetEl);
                });
            });
        } catch (e) {
            console.error('City search error:', e);
            resultsList.innerHTML = '<li class="weather-result-empty">Search failed</li>';
        }
    }

    selectCity(location, widgetEl) {
        this.location = location;

        if (!this.data.data) this.data.data = {};
        this.data.data.location = location;
        store.updateWidget(this.id, { data: { ...this.data.data } });

        const searchInput = widgetEl.querySelector('.weather-search');
        const resultsList = widgetEl.querySelector('.weather-results');
        searchInput.value = location.name;
        resultsList.innerHTML = '';
        resultsList.style.display = 'none';

        widgetEl.querySelector('.weather-temp').textContent = '--°';
        widgetEl.querySelector('.weather-desc').textContent = 'Loading...';
        widgetEl.querySelector('.weather-feels').textContent = 'Feels like --°';

        this.fetchWeather(widgetEl);
    }

    async fetchWeather(el) {
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${this.location.lat}&longitude=${this.location.lon}&current_weather=true&hourly=temperature_2m,apparent_temperature,precipitation,weathercode&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&forecast_days=3&timezone=auto`;

            const res = await fetch(url);
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();

            // Current weather
            const temp = data.current_weather.temperature;
            const weatherCode = data.current_weather.weathercode;
            const currentTime = data.current_weather.time;

            // Find current hour index in hourly data
            const currentHourIdx = data.hourly.time.indexOf(currentTime);
            const feelsLike = currentHourIdx >= 0 ? data.hourly.apparent_temperature[currentHourIdx] : temp;
            const precip = currentHourIdx >= 0 ? data.hourly.precipitation[currentHourIdx] : 0;

            el.querySelector('.weather-temp').textContent = `${Math.round(temp)}°`;
            el.querySelector('.weather-desc').textContent = this.getWeatherDesc(weatherCode);
            el.querySelector('.weather-feels').textContent = `Feels like ${Math.round(feelsLike)}°`;
            el.querySelector('.weather-icon').textContent = this.getWeatherEmoji(weatherCode);
            el.querySelector('.weather-precip').textContent = `${precip} mm`;

            // Sunrise / Sunset (today)
            if (data.daily.sunrise && data.daily.sunset) {
                const sunrise = new Date(data.daily.sunrise[0]);
                const sunset = new Date(data.daily.sunset[0]);
                el.querySelector('.weather-sunrise').textContent = sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                el.querySelector('.weather-sunset').textContent = sunset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }

            // Build forecast
            this.buildForecast(el, data);

        } catch (e) {
            console.error('Weather fetch error:', e);
            el.querySelector('.weather-desc').textContent = 'Offline';
            el.querySelector('.weather-temp').textContent = '--';
        }
    }

    buildForecast(el, data) {
        const forecastContainer = el.querySelector('.weather-forecast');
        const now = new Date(data.current_weather.time);
        const todayDate = now.toISOString().split('T')[0];
        let html = '';

        // Today: next hours in ~5h steps (3-4 entries)
        const hourlyTimes = data.hourly.time;
        const todayHours = [];
        for (let i = 0; i < hourlyTimes.length; i++) {
            const t = new Date(hourlyTimes[i]);
            if (t <= now) continue; // Skip past hours
            if (hourlyTimes[i].startsWith(todayDate)) {
                // Pick roughly every 5 hours
                if (todayHours.length === 0 || (t - todayHours[todayHours.length - 1].date) >= 4 * 3600000) {
                    todayHours.push({
                        date: t,
                        label: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        temp: Math.round(data.hourly.temperature_2m[i]),
                        code: data.hourly.weathercode[i],
                        precip: data.hourly.precipitation[i]
                    });
                }
            }
            if (todayHours.length >= 3) break;
        }

        // Days 2, 3 from daily data
        const dailyForecasts = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let d = 1; d < data.daily.time.length; d++) {
            const date = new Date(data.daily.time[d] + 'T12:00');
            dailyForecasts.push({
                label: dayNames[date.getDay()],
                high: Math.round(data.daily.temperature_2m_max[d]),
                low: Math.round(data.daily.temperature_2m_min[d]),
                code: data.daily.weathercode[d],
                precip: data.daily.precipitation_sum[d]
            });
        }

        // Render today's hourly
        if (todayHours.length > 0) {
            html += '<div class="forecast-section">';
            html += '<div class="forecast-label">Today</div>';
            html += '<div class="forecast-row">';
            todayHours.forEach(h => {
                html += `
                    <div class="forecast-item">
                        <span class="forecast-time">${h.label}</span>
                        <span class="forecast-emoji">${this.getWeatherEmoji(h.code)}</span>
                        <span class="forecast-temp">${h.temp}°</span>
                    </div>`;
            });
            html += '</div></div>';
        }

        // Render daily forecast
        if (dailyForecasts.length > 0) {
            html += '<div class="forecast-section">';
            html += '<div class="forecast-row forecast-daily">';
            dailyForecasts.forEach(d => {
                html += `
                    <div class="forecast-item forecast-day-item">
                        <span class="forecast-time">${d.label}</span>
                        <span class="forecast-emoji">${this.getWeatherEmoji(d.code)}</span>
                        <span class="forecast-temp">${d.high}°<span class="forecast-low">/${d.low}°</span></span>
                    </div>`;
            });
            html += '</div></div>';
        }

        forecastContainer.innerHTML = html;
    }

    getWeatherDesc(code) {
        const codes = {
            0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
            45: 'Fog', 48: 'Fog',
            51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
            61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
            71: 'Light snow', 73: 'Snow', 75: 'Heavy snow',
            80: 'Rain showers', 81: 'Rain showers', 82: 'Heavy showers',
            85: 'Snow showers', 95: 'Thunderstorm',
            96: 'Thunderstorm + hail', 99: 'Thunderstorm + hail'
        };
        return codes[code] || 'Unknown';
    }

    getWeatherEmoji(code) {
        const emojis = {
            0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
            45: '🌫️', 48: '🌫️',
            51: '🌦️', 53: '🌧️', 55: '🌧️',
            61: '🌦️', 63: '🌧️', 65: '🌧️',
            71: '🌨️', 73: '❄️', 75: '❄️',
            80: '🌦️', 81: '🌧️', 82: '⛈️',
            85: '🌨️', 95: '⛈️', 96: '⛈️', 99: '⛈️'
        };
        return emojis[code] || '🌡️';
    }
}

export { WeatherWidget };
