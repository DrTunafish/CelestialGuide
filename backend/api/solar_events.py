"""
Solar & Lunar Events Tracker API
Calculate sunrise, sunset, moonrise, moonset, and astronomical hours
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
import math

from skyfield.api import load, wgs84
from skyfield import almanac
from skyfield.almanac import find_discrete


router = APIRouter()


# Load ephemeris
eph = load('de421.bsp')
earth = eph['earth']
sun = eph['sun']
moon = eph['moon']


class SolarEventsRequest(BaseModel):
    """Request for solar/lunar events"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    start_date: str = Field(..., description="Start date in YYYY-MM-DD format")
    days: int = Field(7, ge=1, le=30, description="Number of days to calculate")


class DayEvents(BaseModel):
    """Events for a single day"""
    date: str
    sunrise: Optional[str]
    sunset: Optional[str]
    solar_noon: Optional[str]
    golden_hour_morning_start: Optional[str]
    golden_hour_morning_end: Optional[str]
    golden_hour_evening_start: Optional[str]
    golden_hour_evening_end: Optional[str]
    blue_hour_morning_start: Optional[str]
    blue_hour_morning_end: Optional[str]
    blue_hour_evening_start: Optional[str]
    blue_hour_evening_end: Optional[str]
    astronomical_twilight_begin: Optional[str]
    astronomical_twilight_end: Optional[str]
    nautical_twilight_begin: Optional[str]
    nautical_twilight_end: Optional[str]
    civil_twilight_begin: Optional[str]
    civil_twilight_end: Optional[str]
    moonrise: Optional[str]
    moonset: Optional[str]
    moon_phase: str
    moon_illumination: float
    day_length_hours: Optional[float]


class SolarEventsResponse(BaseModel):
    """Response with week of solar/lunar events"""
    events: List[DayEvents]
    location: dict


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


@router.post("/calculate", response_model=SolarEventsResponse)
async def calculate_solar_events(request: SolarEventsRequest):
    """
    Calculate solar and lunar events for the requested period
    """
    # Parse start date
    try:
        start_date = datetime.strptime(request.start_date, '%Y-%m-%d')
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Setup observer location
    ts = load.timescale()
    topos = wgs84.latlon(request.latitude, request.longitude)
    observer = earth + topos
    
    events_list = []
    
    for day_offset in range(request.days):
        current_date = start_date + timedelta(days=day_offset)
        
        # Time range for this day
        t_start = ts.utc(current_date.year, current_date.month, current_date.day, 0, 0)
        t_end = ts.utc(current_date.year, current_date.month, current_date.day, 23, 59)
        
        # Calculate sunrise and sunset
        f_sunrise_sunset = almanac.sunrise_sunset(eph, topos)
        sun_times, sun_events = find_discrete(t_start, t_end, f_sunrise_sunset)
        
        sunrise_time = None
        sunset_time = None
        
        for t, event in zip(sun_times, sun_events):
            if event:  # True = sunrise
                sunrise_time = t
            else:  # False = sunset
                sunset_time = t
        
        # Calculate solar noon (sun at highest point)
        solar_noon = None
        if sunrise_time is not None and sunset_time is not None:
            # Solar noon is approximately halfway between sunrise and sunset
            noon_jd = (sunrise_time.tt + sunset_time.tt) / 2
            solar_noon = ts.tt_jd(noon_jd)
        
        # Calculate day length
        day_length = None
        if sunrise_time is not None and sunset_time is not None:
            day_length = (sunset_time.tt - sunrise_time.tt) * 24  # Convert to hours
        
        # Calculate twilight times - simplified approach using approximate offsets
        # These are rough estimates based on sunrise/sunset
        civil_twilight_begin = None
        civil_twilight_end = None
        nautical_twilight_begin = None
        nautical_twilight_end = None
        astro_twilight_begin = None
        astro_twilight_end = None
        
        if sunrise_time is not None:
            # Civil twilight starts ~30 min before sunrise
            civil_twilight_begin = ts.tt_jd(sunrise_time.tt - (30 / (24 * 60)))
            # Nautical twilight starts ~60 min before sunrise
            nautical_twilight_begin = ts.tt_jd(sunrise_time.tt - (60 / (24 * 60)))
            # Astronomical twilight starts ~90 min before sunrise
            astro_twilight_begin = ts.tt_jd(sunrise_time.tt - (90 / (24 * 60)))
        
        if sunset_time is not None:
            # Civil twilight ends ~30 min after sunset
            civil_twilight_end = ts.tt_jd(sunset_time.tt + (30 / (24 * 60)))
            # Nautical twilight ends ~60 min after sunset
            nautical_twilight_end = ts.tt_jd(sunset_time.tt + (60 / (24 * 60)))
            # Astronomical twilight ends ~90 min after sunset
            astro_twilight_end = ts.tt_jd(sunset_time.tt + (90 / (24 * 60)))
        
        # Golden hour approximations
        golden_morning_start = None
        golden_morning_end = sunrise_time
        golden_evening_start = sunset_time
        golden_evening_end = None
        
        if sunrise_time is not None:
            # Golden hour starts ~1 hour before sunrise
            golden_morning_start = ts.tt_jd(sunrise_time.tt - (60 / (24 * 60)))
        
        if sunset_time is not None:
            # Golden hour ends ~1 hour after sunset
            golden_evening_end = ts.tt_jd(sunset_time.tt + (60 / (24 * 60)))
        
        # Blue hour approximations
        blue_morning_start = None
        blue_morning_end = None
        blue_evening_start = None
        blue_evening_end = None
        
        if sunrise_time is not None:
            # Blue hour: 30-50 min before sunrise
            blue_morning_start = ts.tt_jd(sunrise_time.tt - (50 / (24 * 60)))
            blue_morning_end = ts.tt_jd(sunrise_time.tt - (30 / (24 * 60)))
        
        if sunset_time is not None:
            # Blue hour: 30-50 min after sunset
            blue_evening_start = ts.tt_jd(sunset_time.tt + (30 / (24 * 60)))
            blue_evening_end = ts.tt_jd(sunset_time.tt + (50 / (24 * 60)))
        
        # Calculate moonrise and moonset
        f_moonrise = almanac.risings_and_settings(eph, moon, topos)
        moon_times, moon_events = find_discrete(t_start, t_end, f_moonrise)
        
        moonrise_time = None
        moonset_time = None
        
        for t, event in zip(moon_times, moon_events):
            if event:  # True = rising
                moonrise_time = t
            else:  # False = setting
                moonset_time = t
        
        # Calculate moon phase
        moon_observer = observer.at(t_start)
        moon_astrometric = moon_observer.observe(moon)
        sun_astrometric = moon_observer.observe(sun)
        moon_sun_angle = moon_astrometric.separation_from(sun_astrometric).degrees
        moon_illumination = (1 - math.cos(math.radians(moon_sun_angle))) / 2
        moon_phase_name = get_moon_phase_name(moon_illumination)
        
        # Format times as HH:MM
        def format_time(t):
            if t is None:
                return None
            dt = t.utc_datetime()
            return dt.strftime('%H:%M')
        
        events_list.append(DayEvents(
            date=current_date.strftime('%Y-%m-%d'),
            sunrise=format_time(sunrise_time),
            sunset=format_time(sunset_time),
            solar_noon=format_time(solar_noon),
            golden_hour_morning_start=format_time(golden_morning_start),
            golden_hour_morning_end=format_time(sunrise_time),
            golden_hour_evening_start=format_time(sunset_time),
            golden_hour_evening_end=format_time(golden_evening_end),
            blue_hour_morning_start=format_time(blue_morning_start),
            blue_hour_morning_end=format_time(blue_morning_end),
            blue_hour_evening_start=format_time(blue_evening_start),
            blue_hour_evening_end=format_time(blue_evening_end),
            astronomical_twilight_begin=format_time(astro_twilight_begin),
            astronomical_twilight_end=format_time(astro_twilight_end),
            nautical_twilight_begin=format_time(nautical_twilight_begin),
            nautical_twilight_end=format_time(nautical_twilight_end),
            civil_twilight_begin=format_time(civil_twilight_begin),
            civil_twilight_end=format_time(civil_twilight_end),
            moonrise=format_time(moonrise_time),
            moonset=format_time(moonset_time),
            moon_phase=moon_phase_name,
            moon_illumination=round(moon_illumination, 3),
            day_length_hours=round(day_length, 2) if day_length else None
        ))
    
    return SolarEventsResponse(
        events=events_list,
        location={
            'latitude': request.latitude,
            'longitude': request.longitude
        }
    )

