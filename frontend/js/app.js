/* =============================================
   NIMBUS WEATHER — APP LOGIC
   ============================================= */

const API_BASE = 'http://localhost:8000/api';

// ─── State ─────────────────────────────────────
let state = {
  units: localStorage.getItem('nimbus_units') || 'metric',
  theme: localStorage.getItem('nimbus_theme') || 'dark',
  recent: JSON.parse(localStorage.getItem('nimbus_recent') || '[]'),
  weather: null,
  forecast: null,
};

// ─── DOM Refs ───────────────────────────────────
const $ = id => document.getElementById(id);
const cityInput    = $('cityInput');
const searchBtn    = $('searchBtn');
const locationBtn  = $('locationBtn');
const unitToggle   = $('unitToggle');
const themeToggle  = $('themeToggle');
const errorBanner  = $('errorBanner');
const errorText    = $('errorText');
const loadingState = $('loadingState');
const weatherContent = $('weatherContent');
const emptyState   = $('emptyState');
const recentSearches = $('recentSearches');
const recentChips  = $('recentChips');
const clearRecent  = $('clearRecent');

// ─── Background Canvas ──────────────────────────
const canvas = $('bg-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let animReq;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function initParticles() {
  particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.5 + 0.4,
    dx: (Math.random() - 0.5) * 0.25,
    dy: (Math.random() - 0.5) * 0.25,
    alpha: Math.random() * 0.5 + 0.1,
  }));
}

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const starColor = isDark ? '200,220,255' : '80,100,180';

  particles.forEach(p => {
    p.x += p.dx;
    p.y += p.dy;
    if (p.x < 0) p.x = canvas.width;
    if (p.x > canvas.width) p.x = 0;
    if (p.y < 0) p.y = canvas.height;
    if (p.y > canvas.height) p.y = 0;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${starColor},${p.alpha})`;
    ctx.fill();
  });

  animReq = requestAnimationFrame(drawCanvas);
}

resizeCanvas();
initParticles();
drawCanvas();
window.addEventListener('resize', () => { resizeCanvas(); initParticles(); });

// ─── Theme ──────────────────────────────────────
function applyTheme(t) {
  state.theme = t;
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('nimbus_theme', t);
  const icon = $('themeIcon');
  if (t === 'dark') {
    icon.setAttribute('d', 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
  } else {
    icon.setAttribute('d', 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 1 0 0 14A7 7 0 0 0 12 5z');
  }
}

themeToggle.addEventListener('click', () => {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
});

applyTheme(state.theme);

// ─── Units ──────────────────────────────────────
function applyUnits(u) {
  state.units = u;
  localStorage.setItem('nimbus_units', u);
  $('unitLabel').textContent = u === 'metric' ? '°C' : '°F';
  $('tempUnit').textContent = u === 'metric' ? '°C' : '°F';
  if (state.weather) renderWeather(state.weather, state.forecast);
}

unitToggle.addEventListener('click', () => {
  const newUnit = state.units === 'metric' ? 'imperial' : 'metric';
  const city = state.weather?.city;
  applyUnits(newUnit);
  if (city) fetchAll(city);
});

applyUnits(state.units);

// ─── Recent Searches ────────────────────────────
function renderRecent() {
  if (!state.recent.length) {
    recentSearches.style.display = 'none';
    return;
  }
  recentSearches.style.display = 'flex';
  recentChips.innerHTML = state.recent
    .map(c => `<button class="recent-chip" data-city="${c}">${c}</button>`)
    .join('');
  recentChips.querySelectorAll('.recent-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      cityInput.value = chip.dataset.city;
      fetchAll(chip.dataset.city);
    });
  });
}

function addRecent(city) {
  state.recent = [city, ...state.recent.filter(c => c.toLowerCase() !== city.toLowerCase())].slice(0, 5);
  localStorage.setItem('nimbus_recent', JSON.stringify(state.recent));
  renderRecent();
}

clearRecent.addEventListener('click', () => {
  state.recent = [];
  localStorage.removeItem('nimbus_recent');
  renderRecent();
});

renderRecent();

// ─── UI States ──────────────────────────────────
function showLoading() {
  hideError();
  loadingState.style.display = 'flex';
  weatherContent.style.display = 'none';
  emptyState.style.display = 'none';
}

function showWeather() {
  loadingState.style.display = 'none';
  weatherContent.style.display = 'flex';
  emptyState.style.display = 'none';
}

function showEmpty() {
  loadingState.style.display = 'none';
  weatherContent.style.display = 'none';
  emptyState.style.display = 'flex';
}

function showError(msg) {
  errorText.textContent = msg;
  errorBanner.style.display = 'flex';
  setTimeout(hideError, 5000);
}

function hideError() {
  errorBanner.style.display = 'none';
}

// ─── API ────────────────────────────────────────
async function fetchAll(city) {
  if (!city.trim()) { showError('Please enter a city name.'); return; }
  showLoading();
  hideError();
  try {
    const [weatherRes, forecastRes] = await Promise.all([
      fetch(`${API_BASE}/weather?city=${encodeURIComponent(city)}&units=${state.units}`),
      fetch(`${API_BASE}/forecast?city=${encodeURIComponent(city)}&units=${state.units}`),
    ]);

    if (!weatherRes.ok) {
      const err = await weatherRes.json();
      throw new Error(err.detail || 'City not found.');
    }
    if (!forecastRes.ok) {
      const err = await forecastRes.json();
      throw new Error(err.detail || 'Forecast unavailable.');
    }

    const weather = await weatherRes.json();
    const forecast = await forecastRes.json();
    state.weather = weather;
    state.forecast = forecast;

    addRecent(weather.city);
    renderWeather(weather, forecast);
    showWeather();
  } catch (e) {
    showEmpty();
    showError(e.message || 'Could not fetch weather data.');
  }
}

async function fetchByCoords(lat, lon) {
  showLoading();
  hideError();
  try {
    const weatherRes = await fetch(`${API_BASE}/weather/coords?lat=${lat}&lon=${lon}&units=${state.units}`);
    if (!weatherRes.ok) throw new Error('Could not get weather for your location.');
    const weather = await weatherRes.json();

    const forecastRes = await fetch(`${API_BASE}/forecast?city=${encodeURIComponent(weather.city)}&units=${state.units}`);
    const forecast = forecastRes.ok ? await forecastRes.json() : null;

    state.weather = weather;
    state.forecast = forecast;
    cityInput.value = weather.city;
    addRecent(weather.city);
    renderWeather(weather, forecast);
    showWeather();
  } catch (e) {
    showEmpty();
    showError(e.message || 'Location weather failed.');
  }
}

// ─── Render ─────────────────────────────────────
function formatTime(unixTs, timezone) {
  const d = new Date((unixTs + timezone) * 1000);
  return d.toUTCString().slice(-12, -4);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  if (dateStr === today.toISOString().split('T')[0]) return 'Today';
  if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function windDirection(deg) {
  const dirs = ['N','NE','E','SE','S','SW','W','NW'];
  return dirs[Math.round(deg / 45) % 8];
}

function getWeatherBg(icon) {
  if (!icon) return;
  const id = icon.replace('n','d');
  const map = {
    '01d': ['rgba(255,180,50,0.15)', 'rgba(255,120,30,0.08)'],
    '02d': ['rgba(120,160,255,0.12)', 'rgba(200,200,255,0.06)'],
    '03d': ['rgba(150,150,170,0.12)', 'rgba(100,120,160,0.06)'],
    '04d': ['rgba(100,100,120,0.15)', 'rgba(80,80,100,0.08)'],
    '09d': ['rgba(80,120,200,0.15)', 'rgba(60,100,180,0.08)'],
    '10d': ['rgba(80,120,220,0.15)', 'rgba(100,140,200,0.08)'],
    '11d': ['rgba(160,100,255,0.15)', 'rgba(120,80,200,0.08)'],
    '13d': ['rgba(200,220,255,0.20)', 'rgba(180,200,240,0.10)'],
    '50d': ['rgba(180,190,200,0.15)', 'rgba(160,170,185,0.08)'],
  };
  const colors = map[id] || map['02d'];
  const card = document.querySelector('.current-card');
  if (card) {
    card.style.background = `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, var(--surface))`;
  }
}

function renderWeather(w, f) {
  $('cityName').textContent = w.city;
  $('countryCode').textContent = w.country;
  $('currentTime').textContent = formatTime(Math.floor(Date.now() / 1000), w.timezone);
  $('tempValue').textContent = Math.round(w.temperature);
  $('tempUnit').textContent = state.units === 'metric' ? '°C' : '°F';
  $('weatherDesc').textContent = w.description;
  $('weatherIcon').src = w.icon_url;
  $('weatherIcon').alt = w.description;

  const u = state.units === 'metric' ? '°C' : '°F';
  const ws = state.units === 'metric' ? 'm/s' : 'mph';
  $('feelsLike').textContent = `${Math.round(w.feels_like)}${u}`;
  $('tempMax').textContent = `${Math.round(w.temp_max)}${u}`;
  $('tempMin').textContent = `${Math.round(w.temp_min)}${u}`;
  $('humidity').textContent = `${w.humidity}%`;
  $('windSpeed').textContent = `${w.wind_speed} ${ws} ${windDirection(w.wind_deg)}`;
  $('visibility').textContent = `${w.visibility} km`;
  $('clouds').textContent = `${w.clouds}%`;
  $('sunrise').textContent = formatTime(w.sunrise, w.timezone);
  $('sunset').textContent = formatTime(w.sunset, w.timezone);

  getWeatherBg(w.icon);

  // Forecast
  if (f) {
    const grid = $('forecastGrid');
    grid.innerHTML = f.forecast.map(day => `
      <div class="forecast-card">
        <span class="forecast-day">${formatDate(day.date)}</span>
        <img class="forecast-icon" src="${day.icon_url}" alt="${day.description}" />
        <span class="forecast-desc">${day.description}</span>
        <div class="forecast-temps">
          <span class="forecast-high">${Math.round(day.temp_max)}°</span>
          <span class="forecast-low">${Math.round(day.temp_min)}°</span>
        </div>
        <div class="forecast-meta">
          <div class="forecast-meta-item">
            <span class="forecast-meta-label">Humidity</span>
            <span class="forecast-meta-value">${day.humidity}%</span>
          </div>
          <div class="forecast-meta-item">
            <span class="forecast-meta-label">Wind</span>
            <span class="forecast-meta-value">${day.wind_speed} ${ws}</span>
          </div>
        </div>
      </div>
    `).join('');
  }
}

// ─── Events ─────────────────────────────────────
searchBtn.addEventListener('click', () => fetchAll(cityInput.value));

cityInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') fetchAll(cityInput.value);
});

locationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) { showError('Geolocation is not supported by your browser.'); return; }
  locationBtn.style.opacity = '0.5';
  navigator.geolocation.getCurrentPosition(
    pos => {
      locationBtn.style.opacity = '1';
      fetchByCoords(pos.coords.latitude, pos.coords.longitude);
    },
    err => {
      locationBtn.style.opacity = '1';
      showError('Could not get your location. Please check permissions.');
    }
  );
});

// Auto-update clock
setInterval(() => {
  if (state.weather) {
    $('currentTime').textContent = formatTime(Math.floor(Date.now() / 1000), state.weather.timezone);
  }
}, 60000);

// Initial state
showEmpty();
