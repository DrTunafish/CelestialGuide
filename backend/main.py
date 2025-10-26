"""
CelestialGuide Pro - FastAPI Backend
Main application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from api import star_search, environmental, star_map, pdf_export, astrology, astrophotography, solar_events
from core.database import init_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup: Initialize database
    init_database()
    yield
    # Shutdown: Cleanup if needed
    pass


app = FastAPI(
    title="CelestialGuide Pro API",
    description="Advanced sky visualization and observation planning tool",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(star_search.router, prefix="/api/star", tags=["Star Search"])
app.include_router(environmental.router, prefix="/api/environment", tags=["Environmental Data"])
app.include_router(star_map.router, prefix="/api/map", tags=["Sky Map"])
app.include_router(pdf_export.router, prefix="/api/pdf", tags=["PDF Export"])
app.include_router(astrology.router, prefix="/api/astrology", tags=["Astrology"])
app.include_router(astrophotography.router, prefix="/api/astrophotography", tags=["Astrophotography"])
app.include_router(solar_events.router, prefix="/api/solar-events", tags=["Solar & Lunar Events"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "CelestialGuide Pro API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

