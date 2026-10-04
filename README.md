# SkyPulse — Real-Time Weather Dashboard

A modern, responsive, real-time weather dashboard built with **vanilla Asynchronous JavaScript (ES6+)**, **HTML5 Semantic Elements**, and modern **CSS (Glassmorphism & CSS Grid)**. Powered by the public RESTful APIs from **Open-Meteo**.

---

## 🌟 Key Features

1. **Modern Asynchronous JavaScript & RESTful Architecture**:
   - Uses native `fetch()` API with `async` / `await` for clean, readable asynchronous logic.
   - Robust error handling for network disconnection, bad HTTP responses, timeout, and geolocation permissions.
   - Real-time processing and dynamic DOM rendering of complex nested JSON structures (`current`, `hourly`, `daily`, `timezone`).

2. **Accurate City Search with Autocomplete**:
   - Search any city across the world using Open-Meteo's Geocoding REST API.
   - Debounced input querying with active `AbortController` cancellation for rapid, smooth search suggestions.
   - Quick-select trending cities (London, New York, Tokyo, Paris, Dubai, Sydney).
   - Recent search history saved locally in `localStorage`.

3. **Current Device Geolocation**:
   - Single-click **"My Location"** button utilizing the HTML5 Geolocation API (`navigator.geolocation.getCurrentPosition`).
   - Retrieves high-accuracy GPS coordinates and instantly pulls localized weather data.
   - Handles location permission states (`PERMISSION_DENIED`, `POSITION_UNAVAILABLE`, `TIMEOUT`) gracefully with user-friendly alerts.

4. **Live Weather Metrics**:
   - **Current Temperature** with "Feels Like" (apparent) and daily High/Low extremes.
   - **Humidity** (%) with visual gauge and air moisture classification.
   - **Wind Speed & Direction** with an animated compass bearing needle (degrees and cardinal heading).
   - **UV Index** with danger scale classifications (Low, Moderate, High, Very High, Extreme).
   - **Atmospheric Pressure** (hPa) & **Cloud Cover** (%).
   - **Precipitation** (mm / in) and Rain probability (%).
   - **Sunrise & Sunset** timestamps.

5. **Extended Forecasts**:
   - **24-Hour Hourly Timeline**: Horizontally scrollable timeline showing upcoming temperatures, icons, and rain chances.
   - **7-Day Extended Forecast**: Daily weather icons, conditions, precipitation probability, and visual temperature range bars.

6. **Unit Toggling (°C / °F)**:
   - Instant toggle between Metric (°C, km/h, mm) and Imperial (°F, mph, in) units.

7. **Dynamic Adaptive Themes**:
   - Real-time day/night and condition-aware glassmorphic backgrounds (clear day, clear night, clouds, rain, snow, thunderstorm).

---

## 📁 File Structure

```
weather-dashboard/
├── index.html       # Semantic HTML5 layout and accessibility attributes
├── style.css        # Modern glassmorphism UI, CSS variables, responsive grid
├── app.js           # Asynchronous JavaScript, Fetch API, Geolocation & JSON parsing
└── README.md        # Documentation and assignment walkthrough
```

---

## 🚀 How to Run

Because modern browsers enforce CORS and security policies on Geolocation when served over protocols, it is best to run via a local web server:

### Option 1: Using VS Code Live Server
1. Open the folder `weather-dashboard` in VS Code.
2. Click **Go Live** in the status bar or right-click `index.html` and choose **"Open with Live Server"**.

### Option 2: Using Node.js / npx
Open PowerShell in the project folder and run:
```bash
npx serve .
# or
npx http-server .
```
Then navigate to `http://localhost:3000` (or the port displayed in terminal).

### Option 3: Direct Browser Launch
You can also double-click `index.html` directly in File Explorer to open in Chrome, Edge, or Firefox.

---

## 📡 REST API Details

- **Geocoding API**: `https://geocoding-api.open-meteo.com/v1/search?name={query}&count=6&language=en&format=json`
- **Weather Forecast API**: `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=...&hourly=...&daily=...`
- **Public & Free**: No API key required, high availability, accurate global coverage.
