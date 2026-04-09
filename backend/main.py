from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from routes.weather import router as weather_router

app = FastAPI(
    title="Weather API",
    description="Real-time weather data powered by OpenWeatherMap",
    version="1.0.0"
)

# CORS (keep open for now)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(weather_router)

# ✅ Serve static files (CSS, JS, images)
app.mount("/assets", StaticFiles(directory="frontend/assets"), name="assets")

# ✅ Serve frontend UI
@app.get("/")
async def serve_frontend():
    return FileResponse("frontend/index.html")

# ✅ Optional health check (good for interview)
@app.get("/health")
async def health():
    return {"status": "OK"}