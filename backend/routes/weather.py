from fastapi import APIRouter, Query, HTTPException
from services.weather_service import fetch_current_weather, fetch_forecast, fetch_weather_by_coords

router = APIRouter(prefix="/api", tags=["weather"])


@router.get("/weather")
async def get_weather(
    city: str = Query(..., min_length=1, description="City name"),
    units: str = Query("metric", regex="^(metric|imperial)$", description="Units: metric or imperial"),
):
    """Get current weather for a city."""
    if not city.strip():
        raise HTTPException(status_code=400, detail="City name cannot be empty.")
    return await fetch_current_weather(city.strip(), units)


@router.get("/forecast")
async def get_forecast(
    city: str = Query(..., min_length=1, description="City name"),
    units: str = Query("metric", regex="^(metric|imperial)$", description="Units: metric or imperial"),
):
    """Get 5-day forecast for a city."""
    if not city.strip():
        raise HTTPException(status_code=400, detail="City name cannot be empty.")
    return await fetch_forecast(city.strip(), units)


@router.get("/weather/coords")
async def get_weather_by_coords(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    units: str = Query("metric", regex="^(metric|imperial)$", description="Units: metric or imperial"),
):
    """Get current weather by geographic coordinates."""
    return await fetch_weather_by_coords(lat, lon, units)


@router.get("/forecast/coords")
async def get_forecast_by_coords(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    units: str = Query("metric", regex="^(metric|imperial)$", description="Units: metric or imperial"),
):
    """Get forecast by geographic coordinates (resolves city name first)."""
    weather = await fetch_weather_by_coords(lat, lon, units)
    return await fetch_forecast(weather["city"], units)
