"""
Astrophotography Assistant API
Suggests optimal imaging times for deep sky objects
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import json
import os
import math

from skyfield.api import load, wgs84
from skyfield import almanac
from skyfield.positionlib import Angle


router = APIRouter()


# Load ephemeris
eph = load('de421.bsp')
earth = eph['earth']
sun = eph['sun']
moon = eph['moon']


class AstrophotographyRequest(BaseModel):
    """Request for astrophotography timing"""
    target: str = Field(..., description="Target name (e.g., 'Andromeda Galaxy', 'M31')")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    min_altitude: float = Field(30.0, ge=0, le=90, description="Minimum target altitude (degrees)")
    max_cloud_cover: float = Field(30.0, ge=0, le=100, description="Maximum acceptable cloud cover (%)")


class AstrophotographyResponse(BaseModel):
    """Response with best imaging time"""
    target_name: str
    target_id: str
    best_time_utc: Optional[str]
    best_time_local: Optional[str]
    altitude: Optional[float]
    azimuth: Optional[float]
    moon_phase: str
    moon_illumination: float
    moon_separation: Optional[float]
    sun_altitude: Optional[float]
    transit_time: Optional[str]
    astronomical_night_start: Optional[str]
    astronomical_night_end: Optional[str]
    recommendation: str
    quality_score: Optional[float]
    timeline: List[Dict]


def load_deep_sky_catalog():
    """Load Messier/NGC catalog"""
    catalog_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'messier_ngc_catalog.json')
    with open(catalog_path, 'r') as f:
        return json.load(f)


def find_target_coordinates(target_name: str):
    """Find target coordinates from catalog"""
    catalog = load_deep_sky_catalog()
    
    # Normalize target name
    target_normalized = target_name.strip().lower()
    
    # Search in Messier objects
    for obj in catalog['messier_objects']:
        if (obj['id'].lower() == target_normalized or 
            obj['name'].lower() == target_normalized):
            return {
                'id': obj['id'],
                'name': obj['name'],
                'type': obj['type'],
                'ra_hours': obj['ra_hours'],
                'dec_degrees': obj['dec_degrees'],
                'magnitude': obj['magnitude']
            }
    
    # Check if it's a planet
    for planet in catalog['planets']:
        if planet['name'].lower() == target_normalized:
            return {
                'id': planet['id'],
                'name': planet['name'],
                'type': planet['type'],
                'ra_hours': None,
                'dec_degrees': None,
                'magnitude': None
            }
    
    return None


def get_moon_phase_name(illumination: float) -> str:
    """Get moon phase name from illumination percentage"""
    if illumination < 0.05:
        return "New Moon"
    elif illumination < 0.25:
        return "Waxing Crescent"
    elif illumination < 0.35:
        return "First Quarter"
    elif illumination < 0.65:
        return "Waxing Gibbous"
    elif illumination < 0.75:
        return "Full Moon"
    elif illumination < 0.85:
        return "Waning Gibbous"
    elif illumination < 0.95:
        return "Last Quarter"
    else:
        return "Waning Crescent"


def angular_separation(ra1, dec1, ra2, dec2):
    """Calculate angular separation between two points (in degrees)"""
    ra1_rad = math.radians(ra1 * 15)  # Convert hours to degrees to radians
    dec1_rad = math.radians(dec1)
    ra2_rad = math.radians(ra2 * 15)
    dec2_rad = math.radians(dec2)
    
    cos_sep = (math.sin(dec1_rad) * math.sin(dec2_rad) + 
               math.cos(dec1_rad) * math.cos(dec2_rad) * math.cos(ra1_rad - ra2_rad))
    
    # Clamp to [-1, 1] to avoid domain errors
    cos_sep = max(-1, min(1, cos_sep))
    
    return math.degrees(math.acos(cos_sep))


@router.post("/calculate", response_model=AstrophotographyResponse)
async def calculate_best_time(request: AstrophotographyRequest):
    """
    Calculate the best time to photograph a target
    """
    # Find target in catalog
    target_data = find_target_coordinates(request.target)
    
    if not target_data:
        raise HTTPException(
            status_code=404,
            detail=f"Target '{request.target}' not found in catalog. Try 'Andromeda Galaxy', 'M31', 'Orion Nebula', etc."
        )
    
    # Parse date
    try:
        observation_date = datetime.strptime(request.date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Setup observer location
    ts = load.timescale()
    topos = wgs84.latlon(request.latitude, request.longitude)
    observer = earth + topos
    
    # Get target object
    is_planet = target_data['type'] == 'Planet'
    
    if is_planet:
        # Handle planets
        if target_data['id'] == 'jupiter':
            target_body = eph['jupiter barycenter']
        elif target_data['id'] == 'saturn':
            target_body = eph['saturn barycenter']
        elif target_data['id'] == 'mars':
            target_body = eph['mars barycenter']
        elif target_data['id'] == 'venus':
            target_body = eph['venus barycenter']
        else:
            raise HTTPException(status_code=400, detail=f"Planet {target_data['name']} not supported")
    
    # Calculate for the night (from noon to noon next day)
    t_start = ts.utc(observation_date.year, observation_date.month, observation_date.day, 12, 0)
    t_end = ts.utc(observation_date.year, observation_date.month, observation_date.day + 1, 12, 0)
    
    # Find sunset and sunrise times to determine night
    f_sunrise_sunset = almanac.sunrise_sunset(eph, topos)
    sun_times, sun_events = almanac.find_discrete(t_start, t_end, f_sunrise_sunset)
    
    # Find sunset and sunrise for the observation date
    sunset_time = None
    sunrise_time = None
    
    for t, event in zip(sun_times, sun_events):
        if not event and sunset_time is None:  # False = sunset
            sunset_time = t
        elif event and sunset_time is not None:  # True = sunrise (next day)
            sunrise_time = t
            break
    
    if sunset_time is None or sunrise_time is None:
        return AstrophotographyResponse(
            target_name=target_data['name'],
            target_id=target_data['id'],
            best_time_utc=None,
            best_time_local=None,
            altitude=None,
            azimuth=None,
            moon_phase="Unknown",
            moon_illumination=0.0,
            moon_separation=None,
            sun_altitude=None,
            transit_time=None,
            astronomical_night_start=None,
            astronomical_night_end=None,
            recommendation="Could not determine night times for this location and date",
            quality_score=None,
            timeline=[]
        )
    
    # Use astronomical night approximation (90 min after sunset to 90 min before sunrise)
    astro_night_start = ts.tt_jd(sunset_time.tt + (90 / (24 * 60)))
    astro_night_end = ts.tt_jd(sunrise_time.tt - (90 / (24 * 60)))
    
    # Calculate moon phase
    moon_observer = observer.at(sunset_time)
    moon_astrometric = moon_observer.observe(moon)
    sun_astrometric = moon_observer.observe(sun)
    moon_sun_angle = moon_astrometric.separation_from(sun_astrometric).degrees
    moon_illumination = (1 - math.cos(math.radians(moon_sun_angle))) / 2
    moon_phase = get_moon_phase_name(moon_illumination)
    
    # Sample every 5 minutes during astronomical night
    timeline = []
    best_time = None
    best_score = -1
    best_altitude = None
    best_azimuth = None
    best_moon_sep = None
    best_sun_alt = None
    
    current_time = astro_night_start
    time_step = 5 / (24 * 60)  # 5 minutes in days
    
    while current_time.tt < astro_night_end.tt:
        observer_at_time = observer.at(current_time)
        
        # Get sun altitude
        sun_alt = observer_at_time.observe(sun).apparent().altaz()[0].degrees
        
        # Get moon position
        moon_pos = observer_at_time.observe(moon).apparent()
        moon_alt = moon_pos.altaz()[0].degrees
        moon_ra, moon_dec, _ = moon_pos.radec()
        
        # Get target position
        if is_planet:
            target_pos = observer_at_time.observe(target_body).apparent()
            target_alt, target_az, _ = target_pos.altaz()
            target_ra, target_dec, _ = target_pos.radec()
        else:
            # Fixed star/DSO position
            from skyfield.api import Star
            target_star = Star(
                ra_hours=target_data['ra_hours'],
                dec_degrees=target_data['dec_degrees']
            )
            target_pos = observer_at_time.observe(target_star).apparent()
            target_alt, target_az, _ = target_pos.altaz()
            target_ra = target_data['ra_hours']
            target_dec = target_data['dec_degrees']
        
        target_alt_deg = target_alt.degrees
        target_az_deg = target_az.degrees
        
        # Calculate moon separation
        moon_sep = angular_separation(
            target_ra if not is_planet else target_ra.hours,
            target_dec if not is_planet else target_dec.degrees,
            moon_ra.hours,
            moon_dec.degrees
        )
        
        # Quality score calculation
        score = 0
        
        # Target altitude (higher is better, above minimum)
        if target_alt_deg > request.min_altitude:
            altitude_score = min(100, (target_alt_deg / 60) * 100)
            score += altitude_score * 0.4
        
        # Sun below -18° (astronomical night)
        if sun_alt < -18:
            score += 100 * 0.2
        
        # Moon separation (more distance is better)
        moon_score = min(100, (moon_sep / 90) * 100)
        score += moon_score * 0.2
        
        # Moon altitude (lower moon is better)
        if moon_alt < 0:
            score += 100 * 0.2
        else:
            score += max(0, 100 - moon_alt * 2) * 0.2
        
        timeline.append({
            'time_utc': current_time.utc_iso(),
            'altitude': round(target_alt_deg, 2),
            'azimuth': round(target_az_deg, 2),
            'moon_separation': round(moon_sep, 2),
            'moon_altitude': round(moon_alt, 2),
            'sun_altitude': round(sun_alt, 2),
            'quality_score': round(score, 2)
        })
        
        if score > best_score and target_alt_deg > request.min_altitude:
            best_score = score
            best_time = current_time
            best_altitude = target_alt_deg
            best_azimuth = target_az_deg
            best_moon_sep = moon_sep
            best_sun_alt = sun_alt
        
        current_time = ts.tt_jd(current_time.tt + time_step)
    
    # Generate recommendation
    if best_time is not None:
        if best_score > 80:
            recommendation = "Excellent imaging conditions!"
        elif best_score > 60:
            recommendation = "Good imaging conditions."
        elif best_score > 40:
            recommendation = "Fair imaging conditions - some compromises needed."
        else:
            recommendation = "Poor imaging conditions - consider another date."
    else:
        recommendation = f"Target does not rise above {request.min_altitude}° during astronomical night."
    
    return AstrophotographyResponse(
        target_name=target_data['name'],
        target_id=target_data['id'],
        best_time_utc=best_time.utc_iso() if best_time is not None else None,
        best_time_local=best_time.utc_iso() if best_time is not None else None,
        altitude=round(best_altitude, 2) if best_altitude else None,
        azimuth=round(best_azimuth, 2) if best_azimuth else None,
        moon_phase=moon_phase,
        moon_illumination=round(moon_illumination, 3),
        moon_separation=round(best_moon_sep, 2) if best_moon_sep else None,
        sun_altitude=round(best_sun_alt, 2) if best_sun_alt else None,
        transit_time=None,
        astronomical_night_start=astro_night_start.utc_iso(),
        astronomical_night_end=astro_night_end.utc_iso(),
        recommendation=recommendation,
        quality_score=round(best_score, 2) if best_score > 0 else None,
        timeline=timeline
    )


@router.get("/targets")
async def get_targets():
    """Get list of available targets"""
    catalog = load_deep_sky_catalog()
    
    targets = []
    for obj in catalog['messier_objects']:
        targets.append({
            'id': obj['id'],
            'name': obj['name'],
            'type': obj['type'],
            'magnitude': obj['magnitude']
        })
    
    for planet in catalog['planets']:
        targets.append({
            'id': planet['id'],
            'name': planet['name'],
            'type': planet['type'],
            'magnitude': None
        })
    
    return {'targets': targets}

