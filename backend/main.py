"""
CelestialGuide - FastAPI Backend
Main application entry point
"""
from contextlib import asynccontextmanager
from pathlib import Path
import os

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from api import (
    star_search,
    environmental,
    star_map,
    pdf_export,
    astrology,
    astrophotography,
    solar_events,
)
from core.database import init_database

STATIC_DIR = Path(__file__).resolve().parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    init_database()
    yield


app = FastAPI(
    title="CelestialGuide API",
    description="Advanced sky visualization and observation planning tool",
    version="1.1.1",
    lifespan=lifespan,
)

allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://celestialguide.vercel.app",
    "https://celestialguide-pro.vercel.app",
]

# Extra origins for split frontend deployments
for env_key in ("FRONTEND_URL", "RAILWAY_PUBLIC_DOMAIN", "RAILWAY_STATIC_URL"):
    value = os.getenv(env_key)
    if not value:
        continue
    if env_key == "RAILWAY_PUBLIC_DOMAIN" and not value.startswith("http"):
        value = f"https://{value}"
    if value not in allowed_origins:
        allowed_origins.append(value)

# Comma-separated list, e.g. "https://a.com,https://b.com"
extra_origins = os.getenv("CORS_ORIGINS", "")
for origin in [part.strip() for part in extra_origins.split(",") if part.strip()]:
    if origin not in allowed_origins:
        allowed_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(star_search.router, prefix="/api/star", tags=["Star Search"])
app.include_router(environmental.router, prefix="/api/environment", tags=["Environmental Data"])
app.include_router(star_map.router, prefix="/api/map", tags=["Sky Map"])
app.include_router(pdf_export.router, prefix="/api/pdf", tags=["PDF Export"])
app.include_router(astrology.router, prefix="/api/astrology", tags=["Astrology"])
app.include_router(astrophotography.router, prefix="/api/astrophotography", tags=["Astrophotography"])
app.include_router(solar_events.router, prefix="/api/solar-events", tags=["Solar & Lunar Events"])


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.get("/api/status")
async def api_status():
    """API metadata (kept under /api so SPA can own /)"""
    return {
        "message": "CelestialGuide API",
        "version": "1.1.1",
        "docs": "/docs",
    }


def _spa_enabled() -> bool:
    return (STATIC_DIR / "index.html").is_file()


if _spa_enabled():
    assets_dir = STATIC_DIR / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/")
    async def serve_spa_root():
        return FileResponse(STATIC_DIR / "index.html")

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        if (
            full_path == "api"
            or full_path == "health"
            or full_path.startswith(("api/", "docs", "redoc", "openapi", "assets/"))
        ):
            raise HTTPException(status_code=404, detail="Not found")

        candidate = STATIC_DIR / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(STATIC_DIR / "index.html")
else:

    @app.get("/")
    async def root():
        return {
            "message": "CelestialGuide API",
            "version": "1.1.1",
            "docs": "/docs",
            "hint": "Frontend static files not found. Build the SPA into backend/static.",
        }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
