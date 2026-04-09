import httpx
import os
from fastapi import HTTPException

API_KEY = os.getenv("OPENWEATHER_API_KEY")

if not API_KEY:
    raise RuntimeError("OPENWEATHER_API_KEY not set in environment")
BASE_URL = "https://api.openweathermap.org/data/2.5"
GEO_URL = "https://api.openweathermap.org/geo/1.0"


async def fetch_current_weather(city: str, units: str = "metric") -> dict:
    """Fetch current weather for a city."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(
                f"{BASE_URL}/weather",
                params={
                    "q": city,
                    "appid": API_KEY,
                    "units": units,
                },
            )
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"City '{city}' not found.")
            if response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid API key.")
            if response.status_code != 200:
                raise HTTPException(status_code=502, detail="Weather API error.")

            data = response.json()
            return {
                "city": data["name"],
                "country": data["sys"]["country"],
                "temperature": round(data["main"]["temp"], 1),
                "feels_like": round(data["main"]["feels_like"], 1),
                "temp_min": round(data["main"]["temp_min"], 1),
                "temp_max": round(data["main"]["temp_max"], 1),
                "humidity": data["main"]["humidity"],
                "pressure": data["main"]["pressure"],
                "description": data["weather"][0]["description"].title(),
                "icon": data["weather"][0]["icon"],
                "icon_url": f"https://openweathermap.org/img/wn/{data['weather'][0]['icon']}@2x.png",
                "wind_speed": data["wind"]["speed"],
                "wind_deg": data["wind"].get("deg", 0),
                "visibility": data.get("visibility", 0) // 1000,
                "clouds": data["clouds"]["all"],
                "sunrise": data["sys"]["sunrise"],
                "sunset": data["sys"]["sunset"],
                "timezone": data["timezone"],
                "units": units,
                "lat": data["coord"]["lat"],
                "lon": data["coord"]["lon"],
            }

        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Could not connect to weather service.")


async def fetch_forecast(city: str, units: str = "metric") -> dict:
    """Fetch 5-day / 3-hour forecast for a city."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(
                f"{BASE_URL}/forecast",
                params={
                    "q": city,
                    "appid": API_KEY,
                    "units": units,
                    "cnt": 40,
                },
            )
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"City '{city}' not found.")
            if response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid API key.")
            if response.status_code != 200:
                raise HTTPException(status_code=502, detail="Weather API error.")

            data = response.json()
            daily: dict = {}

            for item in data["list"]:
                date = item["dt_txt"].split(" ")[0]
                if date not in daily:
                    daily[date] = {
                        "date": date,
                        "temps": [],
                        "icons": [],
                        "descriptions": [],
                        "humidity": [],
                        "wind_speed": [],
                    }
                daily[date]["temps"].append(item["main"]["temp"])
                daily[date]["icons"].append(item["weather"][0]["icon"])
                daily[date]["descriptions"].append(item["weather"][0]["description"].title())
                daily[date]["humidity"].append(item["main"]["humidity"])
                daily[date]["wind_speed"].append(item["wind"]["speed"])

            forecast_days = []
            for date, values in list(daily.items())[:5]:
                temps = values["temps"]
                # Pick the most common icon for the day
                icon = max(set(values["icons"]), key=values["icons"].count)
                forecast_days.append({
                    "date": date,
                    "temp_min": round(min(temps), 1),
                    "temp_max": round(max(temps), 1),
                    "temp_avg": round(sum(temps) / len(temps), 1),
                    "description": max(set(values["descriptions"]), key=values["descriptions"].count),
                    "icon": icon,
                    "icon_url": f"https://openweathermap.org/img/wn/{icon}@2x.png",
                    "humidity": round(sum(values["humidity"]) / len(values["humidity"])),
                    "wind_speed": round(sum(values["wind_speed"]) / len(values["wind_speed"]), 1),
                })

            return {
                "city": data["city"]["name"],
                "country": data["city"]["country"],
                "units": units,
                "forecast": forecast_days,
            }

        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Could not connect to weather service.")


async def fetch_weather_by_coords(lat: float, lon: float, units: str = "metric") -> dict:
    """Fetch current weather by coordinates."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(
                f"{BASE_URL}/weather",
                params={
                    "lat": lat,
                    "lon": lon,
                    "appid": API_KEY,
                    "units": units,
                },
            )
            if response.status_code != 200:
                raise HTTPException(status_code=502, detail="Weather API error.")

            data = response.json()
            return {
                "city": data["name"],
                "country": data["sys"]["country"],
                "temperature": round(data["main"]["temp"], 1),
                "feels_like": round(data["main"]["feels_like"], 1),
                "temp_min": round(data["main"]["temp_min"], 1),
                "temp_max": round(data["main"]["temp_max"], 1),
                "humidity": data["main"]["humidity"],
                "pressure": data["main"]["pressure"],
                "description": data["weather"][0]["description"].title(),
                "icon": data["weather"][0]["icon"],
                "icon_url": f"https://openweathermap.org/img/wn/{data['weather'][0]['icon']}@2x.png",
                "wind_speed": data["wind"]["speed"],
                "wind_deg": data["wind"].get("deg", 0),
                "visibility": data.get("visibility", 0) // 1000,
                "clouds": data["clouds"]["all"],
                "sunrise": data["sys"]["sunrise"],
                "sunset": data["sys"]["sunset"],
                "timezone": data["timezone"],
                "units": units,
                "lat": data["coord"]["lat"],
                "lon": data["coord"]["lon"],
            }

        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Could not connect to weather service.")
