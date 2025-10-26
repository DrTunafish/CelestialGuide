"""
Astrology Calculations Module
Uses Swiss Ephemeris (pyswisseph) for high-precision astrological calculations
"""
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import swisseph as swe
import pytz
import math

# Initialize Swiss Ephemeris path (will use built-in ephemeris files)
swe.set_ephe_path(None)

# Zodiac signs
ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", 
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

# Planet names and their Swiss Ephemeris IDs
PLANETS = {
    "Sun": swe.SUN,
    "Moon": swe.MOON,
    "Mercury": swe.MERCURY,
    "Venus": swe.VENUS,
    "Mars": swe.MARS,
    "Jupiter": swe.JUPITER,
    "Saturn": swe.SATURN,
    "Uranus": swe.URANUS,
    "Neptune": swe.NEPTUNE,
    "Pluto": swe.PLUTO,
    "North Node": swe.MEAN_NODE,
    # Note: Chiron requires additional ephemeris files (seas_18.se1)
    # Uncomment if you have the files installed:
    # "Chiron": swe.CHIRON
}

# House systems
HOUSE_SYSTEMS = {
    "Placidus": b'P',
    "Koch": b'K',
    "Whole Sign": b'W',
    "Equal": b'E',
    "Campanus": b'C',
    "Regiomontanus": b'R'
}

# Aspects
ASPECTS = {
    "Conjunction": (0, 10),      # (angle, orb)
    "Opposition": (180, 10),
    "Trine": (120, 8),
    "Square": (90, 8),
    "Sextile": (60, 6),
    "Quincunx": (150, 3),
    "Semi-Sextile": (30, 2)
}


def datetime_to_julian_day(dt: datetime, tz_name: str) -> float:
    """
    Convert datetime to Julian Day (UT)
    
    Args:
        dt: Datetime object
        tz_name: IANA timezone name (e.g., 'Europe/Istanbul')
    
    Returns:
        Julian Day Number (UT)
    """
    try:
        # Get timezone
        tz = pytz.timezone(tz_name)
        
        # If datetime is naive, localize it
        if dt.tzinfo is None:
            dt_local = tz.localize(dt)
        else:
            dt_local = dt.astimezone(tz)
        
        # Convert to UTC
        dt_utc = dt_local.astimezone(pytz.UTC)
        
        # Calculate Julian Day
        jd = swe.julday(
            dt_utc.year,
            dt_utc.month,
            dt_utc.day,
            dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0
        )
        
        return jd
    except Exception as e:
        raise ValueError(f"Error converting datetime to Julian Day: {e}")


def degree_to_sign_info(degree: float) -> Tuple[str, float]:
    """
    Convert absolute degree (0-360) to sign and degree within sign
    
    Args:
        degree: Absolute degree (0-360)
    
    Returns:
        (sign_name, degree_in_sign)
    """
    degree = degree % 360
    sign_index = int(degree // 30)
    degree_in_sign = degree % 30
    
    return ZODIAC_SIGNS[sign_index], degree_in_sign


def get_planet_position(planet_id: int, jd: float) -> Dict:
    """
    Get planet position in ecliptic longitude
    
    Args:
        planet_id: Swiss Ephemeris planet ID
        jd: Julian Day
    
    Returns:
        Dict with position data
    """
    # Calculate planet position
    # Returns: [longitude, latitude, distance, speed_long, speed_lat, speed_dist]
    position, ret_flag = swe.calc_ut(jd, planet_id)
    
    longitude = position[0]  # Ecliptic longitude
    sign, degree_in_sign = degree_to_sign_info(longitude)
    
    return {
        "longitude": longitude,
        "sign": sign,
        "degree_in_sign": round(degree_in_sign, 2),
        "formatted": f"{int(degree_in_sign)}° {sign}"
    }


def calculate_houses(jd: float, lat: float, lon: float, house_system: str = "Placidus") -> Dict:
    """
    Calculate house cusps and angles (Ascendant, MC)
    
    Args:
        jd: Julian Day
        lat: Latitude
        lon: Longitude
        house_system: House system name
    
    Returns:
        Dict with house cusps, Ascendant, and MC
    """
    try:
        # Get house system code
        hsys = HOUSE_SYSTEMS.get(house_system, b'P')
        
        # Calculate houses
        # swe.houses returns tuple of (cusps_tuple, ascmc_tuple)
        # cusps has 13 elements: cusps[0] is unused, cusps[1-12] are house cusps
        # ascmc has 10 elements: [Ascendant, MC, ARMC, Vertex, ...]
        result = swe.houses(jd, lat, lon, hsys)
        
        # Convert tuples to lists for easier access
        cusps = list(result[0])
        ascmc = list(result[1])
        
        # Debug output
        print(f"[ASTROLOGY] Houses calculation: cusps length={len(cusps)}, ascmc length={len(ascmc)}")
        
        # Get Ascendant and MC
        if len(ascmc) < 2:
            raise ValueError(f"Invalid ascmc data: length {len(ascmc)}")
        
        ascendant = ascmc[0]
        mc = ascmc[1]
        
        asc_sign, asc_deg = degree_to_sign_info(ascendant)
        mc_sign, mc_deg = degree_to_sign_info(mc)
        
        # House cusps - pyswisseph returns 12 elements (one for each house)
        house_cusps = []
        if len(cusps) < 12:
            raise ValueError(f"Invalid cusps data: expected at least 12 elements, got {len(cusps)}")
        
        for i in range(12):
            cusp_degree = cusps[i]
            cusp_sign, cusp_deg = degree_to_sign_info(cusp_degree)
            house_cusps.append({
                "house": i + 1,  # House numbers are 1-12
                "degree": cusp_degree,
                "sign": cusp_sign,
                "degree_in_sign": round(cusp_deg, 2)
            })
        
        return {
            "ascendant": {
                "degree": ascendant,
                "sign": asc_sign,
                "degree_in_sign": round(asc_deg, 2),
                "formatted": f"{int(asc_deg)}° {asc_sign}"
            },
            "midheaven": {
                "degree": mc,
                "sign": mc_sign,
                "degree_in_sign": round(mc_deg, 2),
                "formatted": f"{int(mc_deg)}° {mc_sign}"
            },
            "house_cusps": house_cusps
        }
    except Exception as e:
        print(f"[ASTROLOGY ERROR] calculate_houses failed: {e}")
        print(f"[ASTROLOGY ERROR] jd={jd}, lat={lat}, lon={lon}, hsys={hsys}")
        raise


def get_house_for_planet(planet_longitude: float, house_cusps: List[Dict]) -> int:
    """
    Determine which house a planet is in
    
    Args:
        planet_longitude: Planet's ecliptic longitude
        house_cusps: List of house cusp data
    
    Returns:
        House number (1-12)
    """
    for i in range(12):
        cusp_start = house_cusps[i]["degree"]
        cusp_end = house_cusps[(i + 1) % 12]["degree"]
        
        # Handle wrap-around at 360/0 degrees
        if cusp_start > cusp_end:
            if planet_longitude >= cusp_start or planet_longitude < cusp_end:
                return i + 1
        else:
            if cusp_start <= planet_longitude < cusp_end:
                return i + 1
    
    return 1  # Default to 1st house


def calculate_aspect(angle1: float, angle2: float) -> Optional[Dict]:
    """
    Calculate aspect between two planets
    
    Args:
        angle1: First planet's longitude
        angle2: Second planet's longitude
    
    Returns:
        Dict with aspect info or None if no major aspect
    """
    # Calculate angular distance
    diff = abs(angle1 - angle2)
    if diff > 180:
        diff = 360 - diff
    
    # Check each aspect
    for aspect_name, (aspect_angle, orb) in ASPECTS.items():
        if abs(diff - aspect_angle) <= orb:
            actual_orb = abs(diff - aspect_angle)
            return {
                "type": aspect_name,
                "angle": aspect_angle,
                "orb": round(actual_orb, 2),
                "applying": True  # Simplified, would need speed calculation
            }
    
    return None


def calculate_natal_chart(
    dt: datetime,
    lat: float,
    lon: float,
    tz_name: str,
    house_system: str = "Placidus"
) -> Dict:
    """
    Calculate complete natal chart
    
    Args:
        dt: Birth datetime
        lat: Birth latitude
        lon: Birth longitude
        tz_name: IANA timezone name
        house_system: House system to use
    
    Returns:
        Complete natal chart data
    """
    # Convert to Julian Day
    jd = datetime_to_julian_day(dt, tz_name)
    
    # Calculate houses
    houses_data = calculate_houses(jd, lat, lon, house_system)
    
    # Calculate planet positions
    planet_positions = []
    planet_longitudes = {}
    
    for planet_name, planet_id in PLANETS.items():
        try:
            position = get_planet_position(planet_id, jd)
            
            # Determine house
            house = get_house_for_planet(position["longitude"], houses_data["house_cusps"])
            
            planet_data = {
                "name": planet_name,
                "degree": position["longitude"],
                "sign": position["sign"],
                "degree_in_sign": position["degree_in_sign"],
                "house": house,
                "formatted": position["formatted"]
            }
            
            planet_positions.append(planet_data)
            planet_longitudes[planet_name] = position["longitude"]
        except Exception as e:
            print(f"Error calculating {planet_name}: {e}")
            continue
    
    # Calculate aspects between major planets
    major_planets = ["Sun", "Moon", "Mercury", "Venus", "Mars", 
                     "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]
    aspects = []
    
    for i, p1 in enumerate(major_planets):
        if p1 not in planet_longitudes:
            continue
        for p2 in major_planets[i+1:]:
            if p2 not in planet_longitudes:
                continue
            
            aspect = calculate_aspect(planet_longitudes[p1], planet_longitudes[p2])
            if aspect:
                aspects.append({
                    "planet1": p1,
                    "planet2": p2,
                    **aspect
                })
    
    return {
        "ascendant_degree": houses_data["ascendant"]["degree"],
        "ascendant_sign": houses_data["ascendant"]["sign"],
        "ascendant_formatted": houses_data["ascendant"]["formatted"],
        "midheaven_degree": houses_data["midheaven"]["degree"],
        "midheaven_sign": houses_data["midheaven"]["sign"],
        "midheaven_formatted": houses_data["midheaven"]["formatted"],
        "house_system": house_system,
        "house_cusps": houses_data["house_cusps"],
        "planet_positions": planet_positions,
        "aspects": aspects,
        "birth_info": {
            "datetime": dt.isoformat(),
            "timezone": tz_name,
            "latitude": lat,
            "longitude": lon
        }
    }


def find_retrograde_periods(start_date: datetime, end_date: datetime, planet_id: int) -> List[Dict]:
    """
    Find retrograde periods for a planet in date range
    
    Args:
        start_date: Start date
        end_date: End date
        planet_id: Swiss Ephemeris planet ID
    
    Returns:
        List of retrograde period dicts
    """
    retrograde_periods = []
    jd_start = swe.julday(start_date.year, start_date.month, start_date.day, 0)
    jd_end = swe.julday(end_date.year, end_date.month, end_date.day, 0)
    
    # Check every day
    jd = jd_start
    in_retrograde = False
    retro_start = None
    
    while jd <= jd_end:
        position, _ = swe.calc_ut(jd, planet_id)
        speed = position[3]  # Longitude speed
        
        if speed < 0 and not in_retrograde:
            # Entering retrograde
            in_retrograde = True
            retro_start = jd
        elif speed >= 0 and in_retrograde:
            # Exiting retrograde
            in_retrograde = False
            if retro_start:
                # Convert JD back to date
                start_dt = swe.revjul(retro_start)
                end_dt = swe.revjul(jd)
                retrograde_periods.append({
                    "start_date": f"{int(start_dt[0])}-{int(start_dt[1]):02d}-{int(start_dt[2]):02d}",
                    "end_date": f"{int(end_dt[0])}-{int(end_dt[1]):02d}-{int(end_dt[2]):02d}"
                })
        
        jd += 1  # Next day
    
    return retrograde_periods

