from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.weather import router as weather_router

app = FastAPI(
    title="Weather API",
    description="Real-time weather data powered by OpenWeatherMap",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(weather_router)


@app.get("/")
async def root():
    return {"message": "Weather API is running", "docs": "/docs"}
