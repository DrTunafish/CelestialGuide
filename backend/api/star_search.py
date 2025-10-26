"""
Star Search API
Search for stars by common name or HIP ID and get Alt/Az calculations
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from core.database import get_db_connection
from core.astronomy import calculate_star_position, ObserverLocation


router = APIRouter()


class StarSearchRequest(BaseModel):
    """Star search request model"""
    query: str = Field(..., description="Star name or HIP ID")
    latitude: float = Field(..., ge=-90, le=90, description="Observer latitude")
    longitude: float = Field(..., ge=-180, le=180, description="Observer longitude")
    datetime_utc: Optional[str] = Field(None, description="Observation time (ISO format)")
    elevation: float = Field(0.0, ge=0, description="Observer elevation in meters")


class StarSearchResponse(BaseModel):
    """Star search response model"""
    name: str
    hip_id: Optional[int]
    ra: float = Field(..., description="Right Ascension (degrees)")
    dec: float = Field(..., description="Declination (degrees)")
    altitude: float = Field(..., description="Altitude (degrees)")
    azimuth: float = Field(..., description="Azimuth (degrees)")
    magnitude: float
    is_visible: bool
    distance_pc: Optional[float] = Field(None, description="Distance in parsecs")
    description: str = Field(..., description="Human-readable description")


@router.post("/search", response_model=StarSearchResponse)
async def search_star(request: StarSearchRequest):
    """
    Search for a star by name or HIP ID and calculate its position
    
    Returns detailed Alt/Az coordinates and visibility status
    """
    # Parse datetime
    obs_time = None
    if request.datetime_utc:
        try:
            obs_time = datetime.fromisoformat(request.datetime_utc.replace('Z', '+00:00'))
        except:
            raise HTTPException(status_code=400, detail="Invalid datetime format")
    else:
        obs_time = datetime.utcnow()
    
    # Create observer
    observer = ObserverLocation(
        latitude=request.latitude,
        longitude=request.longitude,
        elevation=request.elevation,
        datetime_utc=obs_time
    )
    
    # Search for star in database
    conn = get_db_connection()
    cursor = conn.cursor()
    
    star_data = None
    
    # Try to parse as HIP ID
    try:
        hip_id = int(request.query)
        cursor.execute("""
            SELECT hip_id, ra, dec, vmag, parallax, proper_name
            FROM hipparcos
            WHERE hip_id = ?
        """, (hip_id,))
        star_data = cursor.fetchone()
    except ValueError:
        # Search by common name
        cursor.execute("""
            SELECT h.hip_id, h.ra, h.dec, h.vmag, h.parallax, h.proper_name
            FROM star_names sn
            JOIN hipparcos h ON sn.hip_id = h.hip_id
            WHERE LOWER(sn.common_name) = LOWER(?)
        """, (request.query,))
        star_data = cursor.fetchone()
        
        # If not found, try proper name in Hipparcos
        if not star_data:
            cursor.execute("""
                SELECT hip_id, ra, dec, vmag, parallax, proper_name
                FROM hipparcos
                WHERE LOWER(proper_name) LIKE LOWER(?)
            """, (f"%{request.query}%",))
            star_data = cursor.fetchone()
    
    conn.close()
    
    if not star_data:
        raise HTTPException(status_code=404, detail=f"Star '{request.query}' not found")
    
    # Extract star data
    hip_id = star_data['hip_id']
    ra_hours = star_data['ra']
    dec_deg = star_data['dec']
    magnitude = star_data['vmag'] if star_data['vmag'] else 99.0
    parallax = star_data['parallax']
    proper_name = star_data['proper_name'] if star_data['proper_name'] else f"HIP {hip_id}"
    
    # Calculate position
    position = calculate_star_position(
        ra_hours=ra_hours,
        dec_degrees=dec_deg,
        observer=observer,
        magnitude=magnitude,
        name=proper_name,
        hip_id=hip_id,
        parallax_mas=parallax
    )
    
    # Generate human-readable description
    visibility_text = "Visible" if position.is_visible else "Below horizon"
    
    if position.is_visible:
        if position.altitude > 60:
            quality = "Excellent viewing - high in the sky"
        elif position.altitude > 30:
            quality = "Good viewing conditions"
        elif position.altitude > 15:
            quality = "Fair viewing - relatively low"
        else:
            quality = "Poor viewing - very low on horizon"
    else:
        quality = "Not visible at this time"
    
    if magnitude < 1.0:
        brightness_text = "Extremely bright, excellent for beginners"
    elif magnitude < 2.0:
        brightness_text = "Very bright, easily visible"
    elif magnitude < 3.0:
        brightness_text = "Bright, visible in suburban skies"
    elif magnitude < 4.0:
        brightness_text = "Moderate brightness, needs darker skies"
    elif magnitude < 5.0:
        brightness_text = "Faint, requires dark skies"
    else:
        brightness_text = "Very faint, requires excellent conditions"
    
    description = f"{visibility_text} – Alt: {position.altitude:.1f}°, Az: {position.azimuth:.1f}°, Mag: {magnitude:.2f}. {quality}. {brightness_text}."
    
    return StarSearchResponse(
        name=proper_name,
        hip_id=hip_id,
        ra=position.ra,
        dec=position.dec,
        altitude=position.altitude,
        azimuth=position.azimuth,
        magnitude=magnitude,
        is_visible=position.is_visible,
        distance_pc=position.distance,
        description=description
    )


@router.get("/catalog/search")
async def search_catalog(
    query: str = Query(..., description="Search query"),
    limit: int = Query(10, ge=1, le=100, description="Maximum results")
):
    """
    Search star catalog by name
    Returns list of matching stars for autocomplete
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Search common names
    cursor.execute("""
        SELECT sn.common_name, h.hip_id, h.vmag
        FROM star_names sn
        JOIN hipparcos h ON sn.hip_id = h.hip_id
        WHERE LOWER(sn.common_name) LIKE LOWER(?)
        ORDER BY h.vmag
        LIMIT ?
    """, (f"%{query}%", limit))
    
    results = []
    for row in cursor.fetchall():
        results.append({
            "name": row['common_name'],
            "hip_id": row['hip_id'],
            "magnitude": row['vmag']
        })
    
    conn.close()
    
    return {"results": results}

