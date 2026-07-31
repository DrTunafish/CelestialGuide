"""
Environmental Data API
Geolocation, weather data, and light pollution information
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Dict
import httpx

from core.config import get_settings
from core.light_pollution import get_light_pollution_data


router = APIRouter()
settings = get_settings()


class LocationRequest(BaseModel):
    """Location geocoding request"""
    city: str = Field(..., description="City name")
    country: Optional[str] = Field(None, description="Country name or code")


class LocationResponse(BaseModel):
    """Location response with coordinates"""
    city: str
    country: str
    latitude: float
    longitude: float
    formatted_address: str


class WeatherResponse(BaseModel):
    """Weather data response"""
    temperature_c: float
    humidity: int
    cloud_cover: int = Field(..., description="Cloud cover percentage (0-100)")
    description: str
    conditions: str = Field(..., description="Weather condition summary")


class LightPollutionResponse(BaseModel):
    """Light pollution data response"""
    bortle_scale: float = Field(..., description="Bortle scale value (1-9)")
    brightness: float = Field(..., description="Sky brightness in mag/arcsec²")
    description: str


class EnvironmentalDataResponse(BaseModel):
    """Complete environmental data"""
    location: LocationResponse
    weather: WeatherResponse
    light_pollution: LightPollutionResponse
    observation_quality: str = Field(..., description="Overall observation quality assessment")


@router.post("/geocode", response_model=LocationResponse)
async def geocode_location(request: LocationRequest):
    """
    Geocode city name to latitude/longitude using OpenCage API
    """
    if not settings.opencage_api_key:
        raise HTTPException(status_code=500, detail="OpenCage API key not configured")
    
    query = request.city
    if request.country:
        query += f", {request.country}"
    
    url = "https://api.opencagedata.com/geocode/v1/json"
    params = {
        "q": query,
        "key": settings.opencage_api_key,
        "limit": 1
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
        
        if not data.get("results"):
            raise HTTPException(status_code=404, detail=f"Location '{query}' not found")
        
        result = data["results"][0]
        geometry = result["geometry"]
        components = result["components"]
        
        return LocationResponse(
            city=components.get("city", components.get("town", components.get("village", request.city))),
            country=components.get("country", ""),
            latitude=geometry["lat"],
            longitude=geometry["lng"],
            formatted_address=result["formatted"]
        )
    
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Geocoding error: {str(e)}")


@router.get("/weather", response_model=WeatherResponse)
async def get_weather(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format (for forecast)")
):
    """
    Get weather data using OpenWeatherMap API
    Supports both current weather and 5-day forecast
    """
    if not settings.openweathermap_api_key:
        raise HTTPException(status_code=500, detail="OpenWeatherMap API key not configured")
    
    from datetime import datetime, timedelta
    
    # If date is provided, use forecast API
    if date:
        try:
            target_date = datetime.strptime(date, '%Y-%m-%d')
            now = datetime.now()
            
            # Check if date is in the past (not supported by OpenWeatherMap)
            if target_date.date() < now.date():
                raise HTTPException(
                    status_code=400, 
                    detail="Historical weather data is not supported. Please select today or a future date."
                )
            
            # Use forecast API for future dates
            url = "https://api.openweathermap.org/data/2.5/forecast"
            params = {
                "lat": latitude,
                "lon": longitude,
                "appid": settings.openweathermap_api_key,
                "units": "metric",
                "cnt": 40  # 5 days * 8 intervals per day = 40
            }
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    else:
        # Use current weather API
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "lat": latitude,
            "lon": longitude,
            "appid": settings.openweathermap_api_key,
            "units": "metric"
        }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
        
        # Handle forecast response
        if date:
            # Find the forecast entry closest to the target date
            forecast_list = data.get("list", [])
            if not forecast_list:
                raise HTTPException(status_code=404, detail="No forecast data available for this date")
            
            # Get forecast for the day (use first forecast entry for that day)
            target_datetime = datetime.strptime(date, '%Y-%m-%d')
            best_forecast = None
            min_diff = float('inf')
            
            for forecast in forecast_list:
                forecast_dt = datetime.fromtimestamp(forecast['dt'])
                diff = abs((forecast_dt.date() - target_datetime.date()).days)
                if diff < min_diff:
                    min_diff = diff
                    best_forecast = forecast
            
            if not best_forecast:
                raise HTTPException(status_code=404, detail="No forecast data available for this date")
            
            data = best_forecast
        
        cloud_cover = data.get("clouds", {}).get("all", 0)
        
        # Assess conditions
        if cloud_cover < 10:
            conditions = "Excellent - Clear skies"
        elif cloud_cover < 30:
            conditions = "Good - Mostly clear"
        elif cloud_cover < 60:
            conditions = "Fair - Partly cloudy"
        elif cloud_cover < 80:
            conditions = "Poor - Mostly cloudy"
        else:
            conditions = "Very Poor - Overcast"
        
        return WeatherResponse(
            temperature_c=data["main"]["temp"],
            humidity=data["main"]["humidity"],
            cloud_cover=cloud_cover,
            description=data["weather"][0]["description"],
            conditions=conditions
        )
    
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Weather API error: {str(e)}")


@router.get("/light-pollution", response_model=LightPollutionResponse)
async def get_light_pollution(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180)
):
    """
    Get light pollution data using NASA VIIRS Nighttime Lights V2.2
    
    Provides:
    - Bortle Dark-Sky Scale (1-9)
    - Sky brightness in mag/arcsec²
    - Actual satellite-measured radiance
    - High precision location-specific data
    """
    # Get NASA VNL data
    lp_data = get_light_pollution_data(latitude, longitude)
    
    if not lp_data['available']:
        # Fallback if VNL data unavailable
        return LightPollutionResponse(
            bortle_scale=4.0,
            brightness=20.0,
            description="VNL data unavailable - using estimated value"
        )
    
    return LightPollutionResponse(
        bortle_scale=float(lp_data['bortle_scale']),
        brightness=lp_data['sky_brightness_mpsas'],
        description=f"{lp_data['description']} (NASA VIIRS {lp_data.get('source', 'V2.2')})"
    )


@router.get("/complete", response_model=EnvironmentalDataResponse)
async def get_complete_environmental_data(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    city: Optional[str] = Query(None, description="City name for context"),
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format (for forecast)")
):
    """
    Get complete environmental data (location, weather, light pollution)
    """
    # Get weather and light pollution in parallel
    weather_data = await get_weather(latitude, longitude, date)
    light_pollution_data = await get_light_pollution(latitude, longitude)
    
    # Create location response
    location = LocationResponse(
        city=city or "Custom Location",
        country="",
        latitude=latitude,
        longitude=longitude,
        formatted_address=f"{latitude:.4f}°, {longitude:.4f}°"
    )
    
    # Calculate overall observation quality
    quality_score = 0
    
    # Weather contribution (0-40 points)
    if weather_data.cloud_cover < 10:
        quality_score += 40
    elif weather_data.cloud_cover < 30:
        quality_score += 30
    elif weather_data.cloud_cover < 60:
        quality_score += 15
    
    # Light pollution contribution (0-40 points)
    if light_pollution_data.bortle_scale <= 3:
        quality_score += 40
    elif light_pollution_data.bortle_scale <= 5:
        quality_score += 25
    elif light_pollution_data.bortle_scale <= 6:
        quality_score += 15
    elif light_pollution_data.bortle_scale <= 7:
        quality_score += 5
    
    # Temperature contribution (0-20 points) - comfort factor
    if -10 <= weather_data.temperature_c <= 25:
        quality_score += 20
    elif -20 <= weather_data.temperature_c <= 35:
        quality_score += 10
    
    if quality_score >= 80:
        observation_quality = "Excellent - Perfect conditions for observation"
    elif quality_score >= 60:
        observation_quality = "Good - Favorable conditions"
    elif quality_score >= 40:
        observation_quality = "Fair - Acceptable conditions"
    elif quality_score >= 20:
        observation_quality = "Poor - Challenging conditions"
    else:
        observation_quality = "Very Poor - Not recommended"
    
    return EnvironmentalDataResponse(
        location=location,
        weather=weather_data,
        light_pollution=light_pollution_data,
        observation_quality=observation_quality
    )

