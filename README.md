# 🌦️ Nimbus — Weather App

A clean, atmospheric weather dashboard built with **FastAPI** (backend) and vanilla **HTML/CSS/JS** (frontend).

---

## ✨ Features
- 🔍 Search weather by city name
- 📍 Auto-detect location via Geolocation API
- 🌡️ Toggle Celsius / Fahrenheit
- 📅 5-day forecast with daily summaries
- 💨 Wind speed & direction, humidity, visibility, cloud cover
- 🌅 Sunrise & sunset times
- 🕐 Live local clock for searched city
- 🕘 Recent searches (persisted in localStorage)
- 🌙 Dark / Light mode toggle
- 🎨 Dynamic card background based on weather condition
- ✨ Animated starfield background
- 📱 Fully responsive (mobile + desktop)

---

## 🗂️ Project Structure

```
weather-app/
├── backend/
│   ├── main.py                    # FastAPI app entry point
│   ├── requirements.txt
│   ├── routes/
│   │   └── weather.py             # API route handlers
│   └── services/
│       └── weather_service.py     # OpenWeatherMap API calls
└── frontend/
    ├── index.html                 # Main HTML
    ├── css/
    │   └── style.css              # All styles
    └── js/
        └── app.js                 # All frontend logic
```

---

## 🚀 Setup Instructions

### 1. Get an OpenWeatherMap API Key
1. Sign up at https://openweathermap.org/api (free tier is fine)
2. Go to **My API Keys** and copy your key
3. The free tier allows 60 calls/minute — more than enough

---

### 2. Configure the Backend

```bash
cd weather-app/backend
```

**Option A — Environment Variable (recommended)**
```bash
export OPENWEATHER_API_KEY=your_key_here
```

**Option B — `.env` file**
Create `backend/.env`:
```
OPENWEATHER_API_KEY=your_key_here
```
Then add this to `main.py` (top, before imports):
```python
from dotenv import load_dotenv
load_dotenv()
```

**Option C — Quick test (not for production)**

Open `services/weather_service.py` and replace:
```python
API_KEY = os.getenv("OPENWEATHER_API_KEY", "YOUR_API_KEY_HERE")
```
with your actual key string.

---

### 3. Install Python Dependencies

```bash
cd weather-app/backend
pip install -r requirements.txt
```

---

### 4. Run the Backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be live at: **http://localhost:8000**
Interactive docs at: **http://localhost:8000/docs**

---

### 5. Open the Frontend

Simply open `frontend/index.html` in your browser.

Or serve it with Python for a cleaner experience:
```bash
cd weather-app/frontend
python3 -m http.server 3000
```
Then visit: **http://localhost:3000**

---

## 📡 API Endpoints

### GET `/api/weather?city={city}&units={metric|imperial}`
Returns current weather for a city.

**Example:** `GET /api/weather?city=London&units=metric`

```json
{
  "city": "London",
  "country": "GB",
  "temperature": 14.2,
  "feels_like": 12.8,
  "temp_min": 11.0,
  "temp_max": 16.5,
  "humidity": 72,
  "pressure": 1015,
  "description": "Scattered Clouds",
  "icon": "03d",
  "icon_url": "https://openweathermap.org/img/wn/03d@2x.png",
  "wind_speed": 4.1,
  "wind_deg": 220,
  "visibility": 10,
  "clouds": 40,
  "sunrise": 1712379600,
  "sunset": 1712427600,
  "timezone": 3600,
  "units": "metric",
  "lat": 51.5074,
  "lon": -0.1278
}
```

---

### GET `/api/forecast?city={city}&units={metric|imperial}`
Returns 5-day daily forecast.

**Example:** `GET /api/forecast?city=Tokyo&units=metric`

```json
{
  "city": "Tokyo",
  "country": "JP",
  "units": "metric",
  "forecast": [
    {
      "date": "2026-04-06",
      "temp_min": 12.3,
      "temp_max": 20.1,
      "temp_avg": 16.4,
      "description": "Light Rain",
      "icon": "10d",
      "icon_url": "https://openweathermap.org/img/wn/10d@2x.png",
      "humidity": 68,
      "wind_speed": 3.2
    }
  ]
}
```

---

### GET `/api/weather/coords?lat={lat}&lon={lon}&units={metric|imperial}`
Returns current weather by geographic coordinates.

---

## ⚠️ Error Handling

| Status | Meaning |
|--------|---------|
| 400 | Empty or invalid city name |
| 401 | Invalid API key |
| 404 | City not found |
| 502 | OpenWeatherMap returned an error |
| 503 | Cannot connect to weather service |

---

## 🧩 Tech Stack

| Layer    | Technology |
|----------|-----------|
| Backend  | Python 3.10+, FastAPI, HTTPX |
| Frontend | HTML5, CSS3, Vanilla JS |
| Fonts    | DM Serif Display + DM Sans (Google Fonts) |
| Icons    | OpenWeatherMap icon CDN |
| Weather  | OpenWeatherMap API (free tier) |

---

## 💡 Tips

- The app auto-refreshes the local clock every minute
- Recent searches are saved to `localStorage` — they persist across sessions
- Click **◈** on the location button (crosshair icon) to use your device's GPS
- The card gradient changes dynamically with the weather condition
