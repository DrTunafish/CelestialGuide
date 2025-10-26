"""
Astrology API
Natal charts, transits, and astrological calculations
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import pytz

from core.astrology_calc import (
    calculate_natal_chart,
    find_retrograde_periods,
    PLANETS,
    HOUSE_SYSTEMS
)
from core.ai_commentary import generate_astrology_commentary
import swisseph as swe


router = APIRouter()


class NatalChartRequest(BaseModel):
    """Natal chart request"""
    datetime: str = Field(..., description="Birth datetime (YYYY-MM-DD HH:MM:SS)")
    lat: float = Field(..., ge=-90, le=90, description="Birth latitude")
    lon: float = Field(..., ge=-180, le=180, description="Birth longitude")
    tz_name: str = Field("UTC", description="IANA timezone name (e.g., Europe/Istanbul)")
    house_system: str = Field("Placidus", description="House system (Placidus, Koch, Whole Sign, Equal)")


class PlanetPosition(BaseModel):
    """Planet position data"""
    name: str
    degree: float
    sign: str
    degree_in_sign: float
    house: int
    formatted: str


class HouseCusp(BaseModel):
    """House cusp data"""
    house: int
    degree: float
    sign: str
    degree_in_sign: float


class Aspect(BaseModel):
    """Aspect between planets"""
    planet1: str
    planet2: str
    type: str
    angle: float
    orb: float
    applying: bool


class NatalChartResponse(BaseModel):
    """Natal chart response"""
    ascendant_degree: float
    ascendant_sign: str
    ascendant_formatted: str
    midheaven_degree: float
    midheaven_sign: str
    midheaven_formatted: str
    house_system: str
    house_cusps: List[HouseCusp]
    planet_positions: List[PlanetPosition]
    aspects: List[Aspect]
    birth_info: dict


class TransitEvent(BaseModel):
    """Transit/celestial event"""
    date: str
    event: str
    description: Optional[str] = None


@router.post("/natal-chart", response_model=NatalChartResponse)
async def get_natal_chart(request: NatalChartRequest):
    """
    Calculate complete natal/birth chart
    
    Returns planetary positions, house cusps, Ascendant, MC, and major aspects
    """
    try:
        print(f"[ASTROLOGY API] Received request: {request.datetime}, {request.lat}, {request.lon}, {request.tz_name}, {request.house_system}")
        
        # Parse datetime
        dt = datetime.strptime(request.datetime, "%Y-%m-%d %H:%M:%S")
        
        # Validate timezone
        try:
            pytz.timezone(request.tz_name)
        except pytz.exceptions.UnknownTimeZoneError:
            raise HTTPException(status_code=400, detail=f"Invalid timezone: {request.tz_name}")
        
        # Validate house system
        if request.house_system not in HOUSE_SYSTEMS:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid house system. Choose from: {', '.join(HOUSE_SYSTEMS.keys())}"
            )
        
        # Calculate natal chart
        chart_data = calculate_natal_chart(
            dt=dt,
            lat=request.lat,
            lon=request.lon,
            tz_name=request.tz_name,
            house_system=request.house_system
        )
        
        print(f"[ASTROLOGY API] Chart calculated successfully")
        return chart_data
        
    except ValueError as e:
        print(f"[ASTROLOGY API ERROR] ValueError: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[ASTROLOGY API ERROR] Exception: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")


@router.get("/transit-dates", response_model=List[TransitEvent])
async def get_transit_dates(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)")
):
    """
    Find important astrological events in date range
    
    Includes:
    - Mercury retrograde periods
    - Full moons and new moons
    - Major planetary ingresses
    """
    try:
        # Parse dates
        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")
        
        if start_dt >= end_dt:
            raise HTTPException(status_code=400, detail="Start date must be before end date")
        
        events = []
        
        # Find Mercury retrograde periods
        mercury_retrogrades = find_retrograde_periods(start_dt, end_dt, swe.MERCURY)
        for period in mercury_retrogrades:
            events.append({
                "date": period["start_date"],
                "event": "Mercury Retrograde Starts",
                "description": "Mercury begins retrograde motion"
            })
            events.append({
                "date": period["end_date"],
                "event": "Mercury Retrograde Ends",
                "description": "Mercury resumes direct motion"
            })
        
        # Find New Moons and Full Moons
        jd_start = swe.julday(start_dt.year, start_dt.month, start_dt.day, 0)
        jd_end = swe.julday(end_dt.year, end_dt.month, end_dt.day, 0)
        
        jd = jd_start
        while jd <= jd_end:
            # Get Sun and Moon positions
            sun_pos, _ = swe.calc_ut(jd, swe.SUN)
            moon_pos, _ = swe.calc_ut(jd, swe.MOON)
            
            sun_lon = sun_pos[0]
            moon_lon = moon_pos[0]
            
            # Calculate angular distance
            diff = abs(moon_lon - sun_lon)
            if diff > 180:
                diff = 360 - diff
            
            # Check for New Moon (conjunction)
            if diff < 2:
                dt = swe.revjul(jd)
                date_str = f"{int(dt[0])}-{int(dt[1]):02d}-{int(dt[2]):02d}"
                from core.astrology_calc import degree_to_sign_info
                sign, _ = degree_to_sign_info(sun_lon)
                events.append({
                    "date": date_str,
                    "event": "New Moon",
                    "description": f"New Moon in {sign}"
                })
            
            # Check for Full Moon (opposition)
            elif 178 < diff < 182:
                dt = swe.revjul(jd)
                date_str = f"{int(dt[0])}-{int(dt[1]):02d}-{int(dt[2]):02d}"
                from core.astrology_calc import degree_to_sign_info
                moon_sign, _ = degree_to_sign_info(moon_lon)
                sun_sign, _ = degree_to_sign_info(sun_lon)
                events.append({
                    "date": date_str,
                    "event": "Full Moon",
                    "description": f"Full Moon - Moon in {moon_sign}, Sun in {sun_sign}"
                })
            
            jd += 1  # Check next day
        
        # Sort events by date
        events.sort(key=lambda x: x["date"])
        
        return events
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")


@router.get("/house-systems")
async def get_house_systems():
    """
    Get list of available house systems
    """
    return {
        "house_systems": list(HOUSE_SYSTEMS.keys()),
        "default": "Placidus"
    }


@router.get("/zodiac-signs")
async def get_zodiac_signs():
    """
    Get list of zodiac signs
    """
    from core.astrology_calc import ZODIAC_SIGNS
    return {
        "signs": ZODIAC_SIGNS
    }


@router.get("/planets")
async def get_planets_list():
    """
    Get list of planets/points used in calculations
    """
    return {
        "planets": list(PLANETS.keys())
    }


@router.post("/commentary/deep")
async def get_deep_commentary(request: NatalChartRequest):
    """
    Generate deep AI-powered astrological commentary using Gemini 2.5 Flash
    
    This endpoint:
    1. Calculates the complete natal chart
    2. Formats the data for AI interpretation
    3. Generates comprehensive commentary in 6 structured sections
    
    Returns Markdown-formatted commentary analyzing:
    - Personal identity and appearance (ASC)
    - Life purpose and career path (Sun, MC)
    - Emotional world and inner needs (Moon)
    - Relationships and harmony dynamics (Venus, Mars, 7th house)
    - Challenges and growth areas (Saturn, outer planets, hard aspects)
    - Life mission (Lunar Nodes)
    """
    try:
        print(f"[AI COMMENTARY API] Received request: {request.datetime}, {request.lat}, {request.lon}")
        
        # Parse datetime
        dt = datetime.strptime(request.datetime, "%Y-%m-%d %H:%M:%S")
        
        # Validate timezone
        try:
            pytz.timezone(request.tz_name)
        except pytz.exceptions.UnknownTimeZoneError:
            raise HTTPException(status_code=400, detail=f"Invalid timezone: {request.tz_name}")
        
        # Validate house system
        if request.house_system not in HOUSE_SYSTEMS:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid house system. Choose from: {', '.join(HOUSE_SYSTEMS.keys())}"
            )
        
        # Step 1: Calculate natal chart
        print("[AI COMMENTARY API] Calculating natal chart...")
        chart_data = calculate_natal_chart(
            dt=dt,
            lat=request.lat,
            lon=request.lon,
            tz_name=request.tz_name,
            house_system=request.house_system
        )
        
        # Step 2: Generate AI commentary
        print("[AI COMMENTARY API] Generating AI commentary with Gemini...")
        commentary_text = generate_astrology_commentary(chart_data)
        
        print(f"[AI COMMENTARY API] Successfully generated {len(commentary_text)} characters")
        
        return {
            "commentary_text": commentary_text,
            "chart_data": chart_data,
            "model": "gemini-2.0-flash-exp",
            "sections": [
                "Kişisel Kimlik ve Görünüm (ASC ve Yöneticisi)",
                "Hayat Amacı ve Kariyer Yolu (Güneş, MC ve Yöneticileri)",
                "Duygusal Dünya ve İçsel İhtiyaçlar (Ay Konumu ve Açıları)",
                "İlişkiler ve Uyum Dinamikleri (Venüs, Mars ve 7. Ev)",
                "Meydan Okumalar ve Gelişim Alanları (Satürn, Dış Gezegenler ve Kare/Karşıt Açılar)",
                "Yaşam Boyu Misyon (Ay Düğümleri ve Misyon)"
            ]
        }
        
    except ValueError as e:
        print(f"[AI COMMENTARY API ERROR] ValueError: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[AI COMMENTARY API ERROR] Exception: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Commentary generation error: {str(e)}")

