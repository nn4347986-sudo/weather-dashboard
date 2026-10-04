/**
 * SkyPulse Weather Dashboard
 * Demonstrating Asynchronous JavaScript (async/await, Fetch API) & RESTful API integration
 */

// ============================================================================
// Global State & Configuration
// ============================================================================
const CONFIG = {
  GEOCODING_API: 'https://geocoding-api.open-meteo.com/v1/search',
  FORECAST_API: 'https://api.open-meteo.com/v1/forecast',
  DEFAULT_CITY: {
    name: 'London',
    country: 'United Kingdom',
    admin1: 'England',
    latitude: 51.5074,
    longitude: -0.1278
  },
  STORAGE_KEY_RECENT: 'skypulse_recent_searches',
  STORAGE_KEY_UNIT: 'skypulse_unit_preference',
  STORAGE_KEY_LAST_LOC: 'skypulse_last_location'
};

const state = {
  currentUnit: localStorage.getItem(CONFIG.STORAGE_KEY_UNIT) || 'metric', // 'metric' or 'imperial'
  currentLocation: null, // { name, country, admin1, latitude, longitude }
  weatherData: null,
  isLoading: false,
  searchAbortController: null
};

// ============================================================================
// DOM Elements Cache
// ============================================================================
const elements = {
  // Search & Controls
  searchForm: document.getElementById('search-form'),
  cityInput: document.getElementById('city-input'),
  clearSearchBtn: document.getElementById('clear-search-btn'),
  autocompleteResults: document.getElementById('autocomplete-results'),
  searchBtn: document.getElementById('search-btn'),
  geoBtn: document.getElementById('geo-btn'),
  unitCBtn: document.getElementById('unit-c'),
  unitFBtn: document.getElementById('unit-f'),
  
  // Shortcuts & Recent
  quickCityBtns: document.querySelectorAll('.chip-btn'),
  recentWrapper: document.getElementById('recent-wrapper'),
  recentChips: document.getElementById('recent-chips'),
  clearHistoryBtn: document.getElementById('clear-history-btn'),

  // Alerts & Loading
  alertBanner: document.getElementById('alert-banner'),
  alertIcon: document.getElementById('alert-icon'),
  alertTitle: document.getElementById('alert-title'),
  alertMessage: document.getElementById('alert-message'),
  alertClose: document.getElementById('alert-close'),
  loadingState: document.getElementById('loading-state'),
  loadingText: document.getElementById('loading-text'),
  dashboardView: document.getElementById('dashboard-view'),

  // Hero Card Elements
  locationName: document.getElementById('location-name'),
  countryBadge: document.getElementById('country-badge'),
  localTime: document.getElementById('local-time'),
  conditionBadge: document.getElementById('condition-badge'),
  conditionText: document.getElementById('condition-text'),
  weatherVisualIcon: document.getElementById('weather-visual-icon'),
  currentTemp: document.getElementById('current-temp'),
  displayUnit: document.getElementById('display-unit'),
  feelsLikeTemp: document.getElementById('feels-like-temp'),
  tempMax: document.getElementById('temp-max'),
  tempMin: document.getElementById('temp-min'),
  rainChance: document.getElementById('rain-chance'),
  sunriseTime: document.getElementById('sunrise-time'),
  sunsetTime: document.getElementById('sunset-time'),

  // Detailed Metric Cards
  humidityValue: document.getElementById('humidity-value'),
  humidityBar: document.getElementById('humidity-bar'),
  humidityDesc: document.getElementById('humidity-desc'),
  windValue: document.getElementById('wind-value'),
  windUnit: document.getElementById('wind-unit'),
  windDirectionText: document.getElementById('wind-direction-text'),
  windCompassArrow: document.getElementById('wind-compass-arrow'),
  uvValue: document.getElementById('uv-value'),
  uvBadge: document.getElementById('uv-badge'),
  uvBar: document.getElementById('uv-bar'),
  uvDesc: document.getElementById('uv-desc'),
  pressureValue: document.getElementById('pressure-value'),
  pressureDesc: document.getElementById('pressure-desc'),
  precipValue: document.getElementById('precip-value'),
  precipUnit: document.getElementById('precip-unit'),
  precipDesc: document.getElementById('precip-desc'),
  cloudValue: document.getElementById('cloud-value'),
  cloudDesc: document.getElementById('cloud-desc'),

  // Forecast Lists
  hourlyForecastList: document.getElementById('hourly-forecast-list'),
  dailyForecastList: document.getElementById('daily-forecast-list')
};

// ============================================================================
// WMO Weather Code Interpreter & SVG Icon Generator
// ============================================================================
/**
 * Maps WMO weather interpretation codes to conditions, themes, and animated SVG icons
 * Reference: World Meteorological Organization code table 4677
 */
function getWeatherInfo(code, isDay = 1) {
  const codes = {
    0: {
      desc: 'Clear Sky',
      theme: isDay ? 'weather-clear-day' : 'weather-clear-night',
      icon: isDay ? getSvgSun() : getSvgMoon()
    },
    1: {
      desc: 'Mainly Clear',
      theme: isDay ? 'weather-clear-day' : 'weather-clear-night',
      icon: isDay ? getSvgSunCloud() : getSvgMoonCloud()
    },
    2: {
      desc: 'Partly Cloudy',
      theme: 'weather-clouds-day',
      icon: isDay ? getSvgSunCloud() : getSvgMoonCloud()
    },
    3: {
      desc: 'Overcast',
      theme: 'weather-clouds-day',
      icon: getSvgCloud()
    },
    45: {
      desc: 'Foggy',
      theme: 'weather-clouds-day',
      icon: getSvgFog()
    },
    48: {
      desc: 'Depositing Rime Fog',
      theme: 'weather-clouds-day',
      icon: getSvgFog()
    },
    51: {
      desc: 'Light Drizzle',
      theme: 'weather-rain',
      icon: getSvgDrizzle()
    },
    53: {
      desc: 'Moderate Drizzle',
      theme: 'weather-rain',
      icon: getSvgDrizzle()
    },
    55: {
      desc: 'Dense Drizzle',
      theme: 'weather-rain',
      icon: getSvgRain()
    },
    61: {
      desc: 'Slight Rain',
      theme: 'weather-rain',
      icon: getSvgRain()
    },
    63: {
      desc: 'Moderate Rain',
      theme: 'weather-rain',
      icon: getSvgRain()
    },
    65: {
      desc: 'Heavy Rain',
      theme: 'weather-rain',
      icon: getSvgHeavyRain()
    },
    66: {
      desc: 'Freezing Rain',
      theme: 'weather-snow',
      icon: getSvgSnow()
    },
    67: {
      desc: 'Heavy Freezing Rain',
      theme: 'weather-snow',
      icon: getSvgSnow()
    },
    71: {
      desc: 'Slight Snow',
      theme: 'weather-snow',
      icon: getSvgSnow()
    },
    73: {
      desc: 'Moderate Snow',
      theme: 'weather-snow',
      icon: getSvgSnow()
    },
    75: {
      desc: 'Heavy Snow',
      theme: 'weather-snow',
      icon: getSvgHeavySnow()
    },
    77: {
      desc: 'Snow Grains',
      theme: 'weather-snow',
      icon: getSvgSnow()
    },
    80: {
      desc: 'Slight Rain Showers',
      theme: 'weather-rain',
      icon: getSvgRain()
    },
    81: {
      desc: 'Moderate Showers',
      theme: 'weather-rain',
      icon: getSvgRain()
    },
    82: {
      desc: 'Violent Showers',
      theme: 'weather-rain',
      icon: getSvgHeavyRain()
    },
    85: {
      desc: 'Slight Snow Showers',
      theme: 'weather-snow',
      icon: getSvgSnow()
    },
    86: {
      desc: 'Heavy Snow Showers',
      theme: 'weather-snow',
      icon: getSvgHeavySnow()
    },
    95: {
      desc: 'Thunderstorm',
      theme: 'weather-thunderstorm',
      icon: getSvgThunderstorm()
    },
    96: {
      desc: 'Thunderstorm with Hail',
      theme: 'weather-thunderstorm',
      icon: getSvgThunderstorm()
    },
    99: {
      desc: 'Severe Thunderstorm',
      theme: 'weather-thunderstorm',
      icon: getSvgThunderstorm()
    }
  };

  return codes[code] || {
    desc: 'Partly Cloudy',
    theme: 'weather-clouds-day',
    icon: getSvgSunCloud()
  };
}

// Crisp Vector SVG Generators for Weather Visuals
function getSvgSun() {
  return `
    <svg viewBox="0 0 64 64" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="32" cy="32" r="14" fill="#fbbf24" fill-opacity="0.25"></circle>
      <line x1="32" y1="6" x2="32" y2="12"></line>
      <line x1="32" y1="52" x2="32" y2="58"></line>
      <line x1="13.62" y1="13.62" x2="17.86" y2="17.86"></line>
      <line x1="46.14" y1="46.14" x2="50.38" y2="50.38"></line>
      <line x1="6" y1="32" x2="12" y2="32"></line>
      <line x1="52" y1="32" x2="58" y2="32"></line>
      <line x1="13.62" y1="50.38" x2="17.86" y2="46.14"></line>
      <line x1="46.14" y1="17.86" x2="50.38" y2="13.62"></line>
    </svg>
  `;
}

function getSvgMoon() {
  return `
    <svg viewBox="0 0 64 64" fill="none" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M44 42A20 20 0 1 1 22 20a16 16 0 0 0 22 22z" fill="#38bdf8" fill-opacity="0.2"></path>
    </svg>
  `;
}

function getSvgSunCloud() {
  return `
    <svg viewBox="0 0 64 64" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M26 18a10 10 0 0 1 18 6" stroke="#f59e0b" stroke-width="3"></path>
      <line x1="35" y1="6" x2="35" y2="10" stroke="#f59e0b" stroke-width="3"></line>
      <line x1="47" y1="11" x2="44" y2="14" stroke="#f59e0b" stroke-width="3"></line>
      <path d="M46 50H20a12 12 0 0 1-1.3-23.93A14 14 0 0 1 45 28.5 10 10 0 0 1 46 50z" fill="#94a3b8" fill-opacity="0.2" stroke="#e2e8f0" stroke-width="3"></path>
    </svg>
  `;
}

function getSvgMoonCloud() {
  return `
    <svg viewBox="0 0 64 64" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M38 26a10 10 0 0 1-8-8 10 10 0 0 1 6-7 10 10 0 1 0 12 12" stroke="#38bdf8" stroke-width="3" fill="#38bdf8" fill-opacity="0.15"></path>
      <path d="M46 52H20a12 12 0 0 1-1.3-23.93A14 14 0 0 1 45 30.5 10 10 0 0 1 46 52z" fill="#475569" fill-opacity="0.25" stroke="#cbd5e1" stroke-width="3"></path>
    </svg>
  `;
}

function getSvgCloud() {
  return `
    <svg viewBox="0 0 64 64" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M48 48H18a14 14 0 0 1-1.5-27.92A16 16 0 0 1 47 23a12 12 0 0 1 1 25z" fill="#94a3b8" fill-opacity="0.2"></path>
    </svg>
  `;
}

function getSvgRain() {
  return `
    <svg viewBox="0 0 64 64" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M46 40H20a12 12 0 0 1-1.3-23.93A14 14 0 0 1 45 18.5 10 10 0 0 1 46 40z" fill="#64748b" fill-opacity="0.25" stroke="#94a3b8" stroke-width="3"></path>
      <line x1="22" y1="46" x2="20" y2="54" stroke="#38bdf8" stroke-width="3"></line>
      <line x1="32" y1="46" x2="30" y2="54" stroke="#38bdf8" stroke-width="3"></line>
      <line x1="42" y1="46" x2="40" y2="54" stroke="#38bdf8" stroke-width="3"></line>
    </svg>
  `;
}

function getSvgHeavyRain() {
  return `
    <svg viewBox="0 0 64 64" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M48 38H18a12 12 0 0 1-1.3-23.93A14 14 0 0 1 47 16.5 10 10 0 0 1 48 38z" fill="#475569" fill-opacity="0.3" stroke="#64748b" stroke-width="3"></path>
      <line x1="20" y1="44" x2="16" y2="56" stroke="#0284c7" stroke-width="3"></line>
      <line x1="30" y1="44" x2="26" y2="56" stroke="#0284c7" stroke-width="3"></line>
      <line x1="40" y1="44" x2="36" y2="56" stroke="#0284c7" stroke-width="3"></line>
    </svg>
  `;
}

function getSvgDrizzle() {
  return `
    <svg viewBox="0 0 64 64" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M46 40H20a12 12 0 0 1-1.3-23.93A14 14 0 0 1 45 18.5 10 10 0 0 1 46 40z" fill="#64748b" fill-opacity="0.2" stroke="#94a3b8" stroke-width="3"></path>
      <circle cx="22" cy="48" r="1.5" fill="#38bdf8"></circle>
      <circle cx="32" cy="50" r="1.5" fill="#38bdf8"></circle>
      <circle cx="42" cy="48" r="1.5" fill="#38bdf8"></circle>
    </svg>
  `;
}

function getSvgThunderstorm() {
  return `
    <svg viewBox="0 0 64 64" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M48 36H18a12 12 0 0 1-1.3-23.93A14 14 0 0 1 47 14.5 10 10 0 0 1 48 36z" fill="#334155" fill-opacity="0.4" stroke="#64748b" stroke-width="3"></path>
      <polygon points="32 38 24 50 32 50 28 62 42 46 34 46 38 38" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"></polygon>
    </svg>
  `;
}

function getSvgSnow() {
  return `
    <svg viewBox="0 0 64 64" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <path d="M46 38H20a12 12 0 0 1-1.3-23.93A14 14 0 0 1 45 16.5 10 10 0 0 1 46 38z" fill="#94a3b8" fill-opacity="0.2" stroke="#cbd5e1" stroke-width="3"></path>
      <line x1="22" y1="46" x2="22" y2="52" stroke="#bae6fd" stroke-width="2.5"></line>
      <line x1="19" y1="49" x2="25" y2="49" stroke="#bae6fd" stroke-width="2.5"></line>
      <line x1="32" y1="46" x2="32" y2="52" stroke="#bae6fd" stroke-width="2.5"></line>
      <line x1="29" y1="49" x2="35" y2="49" stroke="#bae6fd" stroke-width="2.5"></line>
      <line x1="42" y1="46" x2="42" y2="52" stroke="#bae6fd" stroke-width="2.5"></line>
      <line x1="39" y1="49" x2="45" y2="49" stroke="#bae6fd" stroke-width="2.5"></line>
    </svg>
  `;
}

function getSvgHeavySnow() {
  return getSvgSnow();
}

function getSvgFog() {
  return `
    <svg viewBox="0 0 64 64" fill="none" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <line x1="14" y1="26" x2="50" y2="26"></line>
      <line x1="10" y1="34" x2="54" y2="34"></line>
      <line x1="16" y1="42" x2="48" y2="42"></line>
      <line x1="20" y1="50" x2="44" y2="50"></line>
    </svg>
  `;
}

// Convert degrees to cardinal compass direction
function getCompassDirection(deg) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((deg % 360) / 22.5) % 16;
  return directions[index];
}

// Format ISO string to localized time HH:MM
function formatTime(isoString) {
  if (!isoString) return '--:--';
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (e) {
    return isoString.split('T')[1]?.substring(0, 5) || '--:--';
  }
}

// Format ISO date to day name (e.g., "Monday") and short date (e.g., "Oct 4")
function formatDate(isoDate) {
  if (!isoDate) return { weekday: '--', monthDay: '--' };
  try {
    const parts = isoDate.split('-');
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const weekday = date.toLocaleDateString([], { weekday: 'short' });
    const monthDay = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return { weekday, monthDay };
  } catch (e) {
    return { weekday: isoDate, monthDay: '' };
  }
}

// Format UV index category
function getUvCategory(uv) {
  if (uv < 3) return { label: 'Low', class: 'uv-low', desc: 'Minimal risk; safe outdoors.' };
  if (uv < 6) return { label: 'Moderate', class: 'uv-mod', desc: 'Wear sunscreen and sunglasses.' };
  if (uv < 8) return { label: 'High', class: 'uv-high', desc: 'Seek shade during peak midday hours.' };
  if (uv < 11) return { label: 'Very High', class: 'uv-veryhigh', desc: 'Extra precautions needed outdoors.' };
  return { label: 'Extreme', class: 'uv-extreme', desc: 'Avoid being outside during midday.' };
}

// ============================================================================
// Asynchronous REST API Operations
// ============================================================================

/**
 * Searches cities asynchronously using Open-Meteo Geocoding REST API
 * Demonstrates async/await, Fetch API, and AbortController
 */
async function searchCities(query) {
  if (!query || query.trim().length < 2) return [];

  if (state.searchAbortController) {
    state.searchAbortController.abort();
  }
  state.searchAbortController = new AbortController();

  const url = `${CONFIG.GEOCODING_API}?name=${encodeURIComponent(query.trim())}&count=6&language=en&format=json`;

  try {
    const response = await fetch(url, { signal: state.searchAbortController.signal });

    if (!response.ok) {
      throw new Error(`Geocoding API responded with HTTP status ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    if (error.name === 'AbortError') {
      return []; // Request was superseded by a newer keystroke
    }
    console.error('Async city search failed:', error);
    throw error;
  }
}

/**
 * Fetches comprehensive real-time weather and forecast data using Open-Meteo REST API
 * Demonstrates:
 *  - Native Fetch API and async/await
 *  - Robust error handling (Network loss, HTTP errors, Timeout)
 *  - Processing complex nested JSON structures
 */
async function fetchWeatherData(lat, lon, unit = 'metric') {
  const isImperial = unit === 'imperial';
  const tempUnit = isImperial ? 'fahrenheit' : 'celsius';
  const windUnit = isImperial ? 'mph' : 'kmh';
  const precipUnit = isImperial ? 'inch' : 'mm';

  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index',
    hourly: 'temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m,precipitation_probability',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max',
    temperature_unit: tempUnit,
    wind_speed_unit: windUnit,
    precipitation_unit: precipUnit,
    timezone: 'auto'
  });

  const url = `${CONFIG.FORECAST_API}?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      let errMsg = `Weather API error: HTTP ${response.status} (${response.statusText})`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.reason) errMsg += ` - ${errJson.reason}`;
      } catch (_) {}
      throw new Error(errMsg);
    }

    const data = await response.json();

    // Verify expected nested structures
    if (!data.current || !data.hourly || !data.daily) {
      throw new Error('Received incomplete weather payload from REST service.');
    }

    return data;
  } catch (error) {
    console.error('Fetch weather data error:', error);
    throw error;
  }
}

// ============================================================================
// UI Rendering & Nested JSON Parser
// ============================================================================

/**
 * Parses and dynamically renders the complex nested JSON response
 */
function renderWeatherDashboard(data, location) {
  state.weatherData = data;
  state.currentLocation = location;

  const current = data.current;
  const daily = data.daily;
  const hourly = data.hourly;
  const isImperial = state.currentUnit === 'imperial';

  // 1. Determine condition & theme
  const weatherInfo = getWeatherInfo(current.weather_code, current.is_day);

  // Apply theme to document body
  document.body.className = weatherInfo.theme;

  // 2. Render Location & Local Time
  elements.locationName.textContent = location.name;
  elements.countryBadge.textContent = location.country || location.admin1 || '';
  elements.countryBadge.hidden = !elements.countryBadge.textContent;

  const now = new Date();
  elements.localTime.textContent = `Updated ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  // 3. Render Hero Overview
  elements.conditionText.textContent = weatherInfo.desc;
  elements.weatherVisualIcon.innerHTML = weatherInfo.icon;
  elements.currentTemp.textContent = Math.round(current.temperature_2m);
  elements.displayUnit.textContent = isImperial ? '°F' : '°C';
  elements.feelsLikeTemp.textContent = `${Math.round(current.apparent_temperature)}°`;

  const todayMax = daily.temperature_2m_max[0];
  const todayMin = daily.temperature_2m_min[0];
  elements.tempMax.textContent = `${Math.round(todayMax)}°`;
  elements.tempMin.textContent = `${Math.round(todayMin)}°`;

  const todayRainChance = daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 0;
  elements.rainChance.textContent = `${todayRainChance || 0}%`;

  elements.sunriseTime.textContent = formatTime(daily.sunrise[0]);
  elements.sunsetTime.textContent = formatTime(daily.sunset[0]);

  // 4. Render Metric Cards
  // Humidity
  const humidity = current.relative_humidity_2m;
  elements.humidityValue.textContent = humidity;
  elements.humidityBar.style.width = `${Math.min(100, Math.max(0, humidity))}%`;
  elements.humidityDesc.textContent = humidity > 70 ? 'High humidity; muggy air' : (humidity < 35 ? 'Dry air; low humidity' : 'Comfortable humidity level');

  // Wind
  const windSpeed = current.wind_speed_10m;
  const windUnitStr = isImperial ? 'mph' : 'km/h';
  elements.windValue.textContent = Math.round(windSpeed);
  elements.windUnit.textContent = windUnitStr;
  const compassDir = getCompassDirection(current.wind_direction_10m);
  elements.windDirectionText.textContent = `Heading: ${compassDir} (${current.wind_direction_10m}°)`;
  elements.windCompassArrow.style.transform = `rotate(${current.wind_direction_10m}deg)`;

  // UV Index
  const uv = current.uv_index !== undefined ? current.uv_index : (daily.uv_index_max[0] || 0);
  const uvCat = getUvCategory(uv);
  elements.uvValue.textContent = uv.toFixed(1);
  elements.uvBadge.textContent = uvCat.label;
  elements.uvBadge.className = `uv-badge ${uvCat.class}`;
  elements.uvBar.style.width = `${Math.min(100, (uv / 12) * 100)}%`;
  elements.uvDesc.textContent = uvCat.desc;

  // Pressure
  const pressure = Math.round(current.surface_pressure);
  elements.pressureValue.textContent = pressure;
  elements.pressureDesc.textContent = pressure >= 1013 ? 'High pressure (Stable conditions)' : 'Low pressure (Precipitation possible)';

  // Precipitation
  const precip = current.precipitation;
  const precipUnitStr = isImperial ? 'in' : 'mm';
  elements.precipValue.textContent = precip.toFixed(1);
  elements.precipUnit.textContent = precipUnitStr;
  elements.precipDesc.textContent = precip > 0 ? `${precip} ${precipUnitStr} recorded past hour` : 'No active precipitation';

  // Cloud Cover (computed from weather code or default)
  const isCloudyCode = [1, 2, 3, 45, 48].includes(current.weather_code);
  const estimatedClouds = current.weather_code === 0 ? 5 : (current.weather_code === 1 ? 25 : (current.weather_code === 2 ? 55 : 90));
  elements.cloudValue.textContent = estimatedClouds;
  elements.cloudDesc.textContent = estimatedClouds < 20 ? 'Clear blue skies' : (estimatedClouds < 70 ? 'Partly cloudy sky' : 'Overcast cloud cover');

  // 5. Render 24-Hour Hourly Forecast
  renderHourlyForecast(hourly, current.time, isImperial);

  // 6. Render 7-Day Forecast
  renderDailyForecast(daily, isImperial);

  // Persist last valid location
  saveLocationPreference(location);
}

/**
 * Renders the 24-hour horizontal forecast cards
 */
function renderHourlyForecast(hourly, currentTimeStr, isImperial) {
  elements.hourlyForecastList.innerHTML = '';

  // Find index in hourly.time matching current local hour prefix (e.g., "2026-10-04T04")
  let startIndex = 0;
  const currentPrefix = (currentTimeStr || '').substring(0, 13);
  if (currentPrefix) {
    for (let i = 0; i < hourly.time.length; i++) {
      if (hourly.time[i].startsWith(currentPrefix)) {
        startIndex = i;
        break;
      }
    }
  }

  // Display next 24 hours
  const hoursToShow = Math.min(24, hourly.time.length - startIndex);

  for (let i = 0; i < hoursToShow; i++) {
    const idx = startIndex + i;
    const timeStr = hourly.time[idx];
    const temp = Math.round(hourly.temperature_2m[idx]);
    const code = hourly.weather_code[idx];
    const pop = hourly.precipitation_probability ? hourly.precipitation_probability[idx] : 0;
    
    // Parse city local hour from ISO string
    let displayTime = 'Now';
    let isDay = 1;
    if (timeStr && timeStr.includes('T')) {
      const parts = timeStr.split('T')[1].split(':');
      const hourNum = parseInt(parts[0], 10);
      isDay = (hourNum >= 6 && hourNum < 20) ? 1 : 0;
      const h12 = (hourNum % 12) || 12;
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      displayTime = i === 0 ? 'Now' : `${h12} ${ampm}`;
    }

    const wInfo = getWeatherInfo(code, isDay);
    const isCurrent = i === 0;

    const card = document.createElement('div');
    card.className = `hourly-item ${isCurrent ? 'is-now' : ''}`;
    card.setAttribute('role', 'listitem');
    card.innerHTML = `
      <span class="hourly-time">${displayTime}</span>
      <div class="hourly-icon">${wInfo.icon}</div>
      <span class="hourly-temp">${temp}°</span>
      <span class="hourly-pop" title="Rain probability">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
        ${pop}%
      </span>
    `;

    elements.hourlyForecastList.appendChild(card);
  }
}

/**
 * Renders the 7-day extended forecast rows with temperature proportion bars
 */
function renderDailyForecast(daily, isImperial) {
  elements.dailyForecastList.innerHTML = '';

  // Calculate overall global min/max for scaling temperature bars
  let allMin = Infinity;
  let allMax = -Infinity;
  const daysCount = Math.min(7, daily.time.length);

  for (let i = 0; i < daysCount; i++) {
    if (daily.temperature_2m_min[i] < allMin) allMin = daily.temperature_2m_min[i];
    if (daily.temperature_2m_max[i] > allMax) allMax = daily.temperature_2m_max[i];
  }
  const totalRange = (allMax - allMin) || 1;

  for (let i = 0; i < daysCount; i++) {
    const dateStr = daily.time[i];
    const { weekday, monthDay } = formatDate(dateStr);
    const isToday = i === 0;
    const dayLabel = isToday ? 'Today' : weekday;

    const code = daily.weather_code[i];
    const wInfo = getWeatherInfo(code, 1);
    const minTemp = Math.round(daily.temperature_2m_min[i]);
    const maxTemp = Math.round(daily.temperature_2m_max[i]);
    const pop = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0;

    // Calculate bar percentage offsets
    const leftPercent = Math.max(0, ((daily.temperature_2m_min[i] - allMin) / totalRange) * 100);
    const widthPercent = Math.max(8, ((daily.temperature_2m_max[i] - daily.temperature_2m_min[i]) / totalRange) * 100);

    const row = document.createElement('div');
    row.className = 'daily-row';
    row.innerHTML = `
      <div class="daily-day-wrap">
        <span class="daily-day">${dayLabel}</span>
        <span class="daily-date">${monthDay}</span>
      </div>

      <div class="daily-condition-wrap">
        <div class="daily-icon">${wInfo.icon}</div>
        <span class="daily-condition-text">${wInfo.desc}</span>
        ${pop > 10 ? `
          <span class="daily-rain-chance">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
            ${pop}%
          </span>
        ` : ''}
      </div>

      <div class="daily-temp-bar-wrap">
        <span class="daily-low">${minTemp}°</span>
        <div class="temp-bar-bg">
          <div class="temp-bar-fill" style="left: ${leftPercent}%; width: ${widthPercent}%;"></div>
        </div>
        <span class="daily-high">${maxTemp}°</span>
      </div>

      <div class="daily-temp-values">
        <span class="daily-high">${maxTemp}°</span>
        <span class="daily-low">/ ${minTemp}°</span>
      </div>
    `;

    elements.dailyForecastList.appendChild(row);
  }
}

// ============================================================================
// State & Notification Helpers
// ============================================================================

function setLoading(isLoading, message = 'Fetching real-time weather data...') {
  state.isLoading = isLoading;
  elements.loadingState.hidden = !isLoading;
  elements.dashboardView.style.opacity = isLoading ? '0.4' : '1';
  elements.dashboardView.style.pointerEvents = isLoading ? 'none' : 'auto';
  if (message) elements.loadingText.textContent = message;
}

function showAlert(message, title = 'Notice', type = 'error') {
  elements.alertTitle.textContent = title;
  elements.alertMessage.textContent = message;
  elements.alertBanner.className = `alert-banner ${type === 'warning' ? 'alert-warning' : (type === 'info' ? 'alert-info' : '')}`;
  elements.alertBanner.hidden = false;

  // Auto-scroll to top so user notices the alert
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideAlert() {
  elements.alertBanner.hidden = true;
}

// ============================================================================
// Core Execution Pipeline (Search, Geolocation, Unit Toggle)
// ============================================================================

/**
 * Loads weather for a target location object: { name, latitude, longitude, country }
 */
async function loadWeatherForLocation(location) {
  hideAlert();
  setLoading(true, `Loading weather for ${location.name}...`);

  try {
    const data = await fetchWeatherData(location.latitude, location.longitude, state.currentUnit);
    renderWeatherDashboard(data, location);
    addRecentSearch(location);
  } catch (error) {
    showAlert(
      `Unable to fetch weather data for "${location.name}". ${error.message || 'Please check your internet connection and try again.'}`,
      'Network Request Failed'
    );
  } finally {
    setLoading(false);
  }
}

/**
 * Searches by city string and loads the top match
 */
async function handleCitySearch(cityName) {
  if (!cityName || !cityName.trim()) return;

  hideAlert();
  closeAutocomplete();
  setLoading(true, `Searching location "${cityName}"...`);

  try {
    const results = await searchCities(cityName);

    if (!results || results.length === 0) {
      showAlert(
        `Could not find any city matching "${cityName}". Please check spelling and try again.`,
        'City Not Found',
        'warning'
      );
      setLoading(false);
      return;
    }

    const bestMatch = results[0];
    const location = {
      name: bestMatch.name,
      country: bestMatch.country || '',
      admin1: bestMatch.admin1 || '',
      latitude: bestMatch.latitude,
      longitude: bestMatch.longitude
    };

    await loadWeatherForLocation(location);
  } catch (error) {
    showAlert(
      `Failed to search city: ${error.message || 'Network error'}`,
      'Search Error'
    );
    setLoading(false);
  }
}

/**
 * Handles HTML5 Geolocation API: detects user coordinates and loads weather
 */
function handleGeolocation() {
  if (!('geolocation' in navigator)) {
    showAlert(
      'Geolocation is not supported by your current browser. You can still search any city manually.',
      'Geolocation Unsupported',
      'warning'
    );
    return;
  }

  hideAlert();
  elements.geoBtn.classList.add('loading');
  setLoading(true, 'Acquiring GPS location coordinates...');

  const geoOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000
  };

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      elements.geoBtn.classList.remove('loading');
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      setLoading(true, 'Fetching weather for your coordinates...');

      try {
        // Fetch weather first using exact coordinates
        const data = await fetchWeatherData(lat, lon, state.currentUnit);

        // Derive friendly location name
        let locationName = 'Current Location';
        let countryName = '';

        if (data.timezone) {
          const tzParts = data.timezone.split('/');
          locationName = tzParts[tzParts.length - 1].replace(/_/g, ' ') || 'Local Location';
          countryName = tzParts[0] || '';
        }

        const location = {
          name: locationName,
          country: countryName,
          admin1: '',
          latitude: lat,
          longitude: lon
        };

        renderWeatherDashboard(data, location);
        addRecentSearch(location);
      } catch (error) {
        showAlert(
          `Unable to retrieve weather for your current location: ${error.message}`,
          'Location Weather Failed'
        );
      } finally {
        setLoading(false);
      }
    },
    (geoError) => {
      elements.geoBtn.classList.remove('loading');
      setLoading(false);

      let userMessage = 'Unable to retrieve your location.';
      switch (geoError.code) {
        case geoError.PERMISSION_DENIED:
          userMessage = 'Location permission was denied. Please allow location access in your browser settings or search for your city above.';
          break;
        case geoError.POSITION_UNAVAILABLE:
          userMessage = 'Location information is currently unavailable from your device. Please try searching for your city name.';
          break;
        case geoError.TIMEOUT:
          userMessage = 'Location request timed out. Please try again or search manually.';
          break;
      }

      showAlert(userMessage, 'Location Detection Notice', 'warning');
    },
    geoOptions
  );
}

/**
 * Handles Unit Toggle (°C / °F)
 */
function handleUnitSwitch(newUnit) {
  if (state.currentUnit === newUnit) return;

  state.currentUnit = newUnit;
  localStorage.setItem(CONFIG.STORAGE_KEY_UNIT, newUnit);

  elements.unitCBtn.classList.toggle('active', newUnit === 'metric');
  elements.unitCBtn.setAttribute('aria-checked', newUnit === 'metric');
  elements.unitFBtn.classList.toggle('active', newUnit === 'imperial');
  elements.unitFBtn.setAttribute('aria-checked', newUnit === 'imperial');

  // Reload current location weather with new unit
  if (state.currentLocation) {
    loadWeatherForLocation(state.currentLocation);
  }
}

// ============================================================================
// Autocomplete & Search Input Management
// ============================================================================
let debounceTimer = null;

function handleInputChange(e) {
  const query = e.target.value;
  elements.clearSearchBtn.hidden = !query;

  clearTimeout(debounceTimer);

  if (!query || query.trim().length < 2) {
    closeAutocomplete();
    return;
  }

  debounceTimer = setTimeout(async () => {
    try {
      const results = await searchCities(query);
      renderAutocompleteDropdown(results);
    } catch (_) {
      closeAutocomplete();
    }
  }, 280);
}

function renderAutocompleteDropdown(results) {
  if (!results || results.length === 0) {
    closeAutocomplete();
    return;
  }

  elements.autocompleteResults.innerHTML = '';

  results.forEach((city) => {
    const item = document.createElement('div');
    item.className = 'autocomplete-item';
    item.setAttribute('role', 'option');

    const meta = [city.admin1, city.country].filter(Boolean).join(', ');
    item.innerHTML = `
      <span class="autocomplete-city">${city.name}</span>
      <span class="autocomplete-meta">${meta}</span>
    `;

    item.addEventListener('click', () => {
      elements.cityInput.value = city.name;
      closeAutocomplete();
      loadWeatherForLocation({
        name: city.name,
        country: city.country || '',
        admin1: city.admin1 || '',
        latitude: city.latitude,
        longitude: city.longitude
      });
    });

    elements.autocompleteResults.appendChild(item);
  });

  elements.autocompleteResults.hidden = false;
}

function closeAutocomplete() {
  elements.autocompleteResults.hidden = true;
  elements.autocompleteResults.innerHTML = '';
}

// ============================================================================
// LocalStorage: Recent Searches & Preferences
// ============================================================================

function getRecentSearches() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY_RECENT);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function addRecentSearch(loc) {
  try {
    let recent = getRecentSearches();
    // De-duplicate by name
    recent = recent.filter(item => item.name.toLowerCase() !== loc.name.toLowerCase());
    recent.unshift({
      name: loc.name,
      country: loc.country || '',
      admin1: loc.admin1 || '',
      latitude: loc.latitude,
      longitude: loc.longitude
    });
    // Keep max 5
    recent = recent.slice(0, 5);
    localStorage.setItem(CONFIG.STORAGE_KEY_RECENT, JSON.stringify(recent));
    renderRecentSearches();
  } catch (_) {}
}

function renderRecentSearches() {
  const recent = getRecentSearches();
  if (recent.length === 0) {
    elements.recentWrapper.hidden = true;
    return;
  }

  elements.recentWrapper.hidden = false;
  elements.recentChips.innerHTML = '';

  recent.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip-btn';
    btn.textContent = item.name;
    btn.title = `Load weather for ${item.name}`;
    btn.addEventListener('click', () => {
      loadWeatherForLocation(item);
    });
    elements.recentChips.appendChild(btn);
  });
}

function clearRecentSearches() {
  localStorage.removeItem(CONFIG.STORAGE_KEY_RECENT);
  renderRecentSearches();
}

function saveLocationPreference(loc) {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEY_LAST_LOC, JSON.stringify(loc));
  } catch (_) {}
}

function getLastSavedLocation() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY_LAST_LOC);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

// ============================================================================
// Event Listeners Initialization
// ============================================================================
function initEventListeners() {
  // Form submission
  elements.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = elements.cityInput.value.trim();
    if (city) {
      handleCitySearch(city);
    }
  });

  // City input live typing
  elements.cityInput.addEventListener('input', handleInputChange);

  // Clear search input button
  elements.clearSearchBtn.addEventListener('click', () => {
    elements.cityInput.value = '';
    elements.clearSearchBtn.hidden = true;
    closeAutocomplete();
    elements.cityInput.focus();
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!elements.searchForm.contains(e.target)) {
      closeAutocomplete();
    }
  });

  // Geolocation trigger
  elements.geoBtn.addEventListener('click', handleGeolocation);

  // Temperature unit triggers
  elements.unitCBtn.addEventListener('click', () => handleUnitSwitch('metric'));
  elements.unitFBtn.addEventListener('click', () => handleUnitSwitch('imperial'));

  // Quick shortcut cities
  elements.quickCityBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const city = btn.dataset.city;
      if (city) handleCitySearch(city);
    });
  });

  // Clear history
  elements.clearHistoryBtn.addEventListener('click', clearRecentSearches);

  // Close alert banner
  elements.alertClose.addEventListener('click', hideAlert);

  // Offline / Online detection
  window.addEventListener('offline', () => {
    showAlert('You appear to be offline. Live weather queries may fail until your connection is restored.', 'No Internet Connection', 'warning');
  });

  window.addEventListener('online', () => {
    hideAlert();
    if (state.currentLocation) {
      loadWeatherForLocation(state.currentLocation);
    }
  });
}

// ============================================================================
// Bootstrap Application
// ============================================================================
async function initApp() {
  initEventListeners();
  renderRecentSearches();

  // Set initial unit radio state
  elements.unitCBtn.classList.toggle('active', state.currentUnit === 'metric');
  elements.unitFBtn.classList.toggle('active', state.currentUnit === 'imperial');

  // Load last saved location, or prompt geolocation, or fallback to default city
  const savedLocation = getLastSavedLocation();
  const initialLocation = savedLocation || CONFIG.DEFAULT_CITY;

  await loadWeatherForLocation(initialLocation);
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
