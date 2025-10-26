"""
Star Map Generation API
Generate accurate sky maps using Azimuthal Equidistant projection
"""
from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import io
import base64

import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import numpy as np

from core.database import get_db_connection
from core.astronomy import ObserverLocation, calculate_bulk_positions, calculate_sun_moon_positions, calculate_planets_positions
from core.config import get_settings


router = APIRouter()
settings = get_settings()


class StarMapRequest(BaseModel):
    """Star map generation request"""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    datetime_utc: Optional[str] = None
    elevation: float = Field(0.0, ge=0)
    show_constellations: bool = Field(True, description="Draw constellation lines")
    show_labels: bool = Field(True, description="Show star labels for bright stars")
    fov_center_ra: Optional[float] = Field(None, description="FOV center RA (degrees)")
    fov_center_dec: Optional[float] = Field(None, description="FOV center Dec (degrees)")
    fov_radius: Optional[float] = Field(None, description="FOV radius (degrees)")


class StarMapResponse(BaseModel):
    """Star map response"""
    image_base64: str
    stars_visible: int
    sun_altitude: float
    moon_altitude: float
    moon_illumination: float


def azimuthal_equidistant_projection(alt: float, az: float) -> tuple:
    """
    Convert altitude/azimuth to X/Y coordinates using Azimuthal Equidistant projection
    
    Args:
        alt: Altitude in degrees (0 = horizon, 90 = zenith)
        az: Azimuth in degrees (0 = North, 90 = East)
    
    Returns:
        (x, y) coordinates for plotting
    """
    # Convert to radians
    alt_rad = np.radians(alt)
    az_rad = np.radians(az)
    
    # Radial distance from center (zenith)
    r = 90 - alt  # 0 at zenith, 90 at horizon
    
    # Convert to Cartesian coordinates
    # Azimuth: 0° = North (top), 90° = East (right)
    x = r * np.sin(az_rad)
    y = r * np.cos(az_rad)
    
    return x, y


@router.post("/generate", response_model=StarMapResponse)
async def generate_star_map(request: StarMapRequest):
    """
    Generate star map with accurate Azimuthal Equidistant projection
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
    
    # Debug: Log observer location
    print(f"[STAR MAP] Generating map for: Lat={request.latitude:.4f}, Lon={request.longitude:.4f}, Time={obs_time}")
    
    # Get ALL stars from Bright Star Catalog
    # BSC contains ~9,000 stars - NumPy can handle this efficiently
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT ra, dec, vmag, name, hip_id
        FROM bright_stars
        WHERE vmag IS NOT NULL AND vmag < 10.0
        ORDER BY vmag
    """)
    
    stars = cursor.fetchall()
    
    print(f"[STAR MAP] Loaded {len(stars)} stars from BSC catalog")
    
    # Calculate positions for all stars using NumPy-optimized bulk calculation
    stars_data = [(s['ra'], s['dec'], s['vmag']) for s in stars]
    positions = calculate_bulk_positions(stars_data, observer)
    
    # Filter visible stars
    visible_stars = []
    for i, pos in enumerate(positions):
        if pos.is_visible:
            star = stars[i]
            visible_stars.append({
                'altitude': pos.altitude,
                'azimuth': pos.azimuth,
                'magnitude': pos.magnitude,
                'name': star['name'],
                'hip_id': star['hip_id']
            })
    
    # Get constellation lines if requested
    constellation_lines = []
    if request.show_constellations:
        cursor.execute("""
            SELECT cl.hip_id_1, cl.hip_id_2, 
                   h1.ra as ra1, h1.dec as dec1,
                   h2.ra as ra2, h2.dec as dec2
            FROM constellation_lines cl
            JOIN hipparcos h1 ON cl.hip_id_1 = h1.hip_id
            JOIN hipparcos h2 ON cl.hip_id_2 = h2.hip_id
        """)
        
        const_lines = cursor.fetchall()
        
        # OPTIMIZATION: Collect all constellation star positions and calculate in bulk
        const_stars_data = []
        for line in const_lines:
            const_stars_data.append((line['ra1'], line['dec1'], 0.0))
            const_stars_data.append((line['ra2'], line['dec2'], 0.0))
        
        # Calculate all constellation star positions at once
        if const_stars_data:
            const_positions = calculate_bulk_positions(const_stars_data, observer)
            
            # Build constellation lines from bulk results
            for i, line in enumerate(const_lines):
                pos1 = const_positions[i * 2]
                pos2 = const_positions[i * 2 + 1]
                
                # Only draw if both stars are visible
                if pos1.is_visible and pos2.is_visible:
                    constellation_lines.append({
                        'alt1': pos1.altitude,
                        'az1': pos1.azimuth,
                        'alt2': pos2.altitude,
                        'az2': pos2.azimuth
                    })
    
    conn.close()
    
    # Get Sun, Moon, and Planets positions
    sun_moon = calculate_sun_moon_positions(observer)
    planets = calculate_planets_positions(observer)
    
    # Generate map image - larger size for more detail with full BSC
    fig, ax = plt.subplots(figsize=(14, 14), facecolor='#0a0a0a')
    ax.set_facecolor('#0a0a0a')
    
    # Set up circular plot (horizon circle)
    ax.set_xlim(-95, 95)
    ax.set_ylim(-95, 95)
    ax.set_aspect('equal')
    
    # Draw horizon circle
    horizon = plt.Circle((0, 0), 90, fill=False, color='white', linewidth=2, linestyle='--', alpha=0.5)
    ax.add_patch(horizon)
    
    # Draw altitude circles (30°, 60°)
    for alt_circle in [30, 60]:
        r = 90 - alt_circle
        circle = plt.Circle((0, 0), r, fill=False, color='gray', linewidth=0.5, linestyle=':', alpha=0.3)
        ax.add_patch(circle)
        ax.text(0, r + 2, f"{alt_circle}°", color='gray', ha='center', fontsize=8, alpha=0.5)
    
    # Draw cardinal directions
    directions = [
        (0, 95, 'N'), (95, 0, 'E'), (0, -95, 'S'), (-95, 0, 'W'),
        (67, 67, 'NE'), (67, -67, 'SE'), (-67, -67, 'SW'), (-67, 67, 'NW')
    ]
    for x, y, label in directions:
        ax.text(x, y, label, color='white', ha='center', va='center', 
                fontsize=12, fontweight='bold', alpha=0.7)
    
    # Draw constellation lines
    for line in constellation_lines:
        x1, y1 = azimuthal_equidistant_projection(line['alt1'], line['az1'])
        x2, y2 = azimuthal_equidistant_projection(line['alt2'], line['az2'])
        ax.plot([x1, x2], [y1, y2], color='cyan', linewidth=0.5, alpha=0.3)
    
    # Plot stars - optimized for large number of stars (BSC full catalog)
    for star in visible_stars:
        x, y = azimuthal_equidistant_projection(star['altitude'], star['azimuth'])
        
        # Size based on magnitude (brighter = larger)
        # Adjusted scale for better visibility with ~9000 stars
        size = 80 * (10 ** (-star['magnitude'] / 2.5))
        size = np.clip(size, 0.3, 150)
        
        # Color and alpha based on magnitude for better depth perception
        if star['magnitude'] < 1.0:
            color = 'white'
            alpha = 1.0
        elif star['magnitude'] < 2.5:
            color = 'lightcyan'
            alpha = 0.95
        elif star['magnitude'] < 4.0:
            color = 'lightsteelblue'
            alpha = 0.85
        elif star['magnitude'] < 5.5:
            color = 'lightgray'
            alpha = 0.70
        elif star['magnitude'] < 7.0:
            color = 'silver'
            alpha = 0.55
        else:
            color = 'gray'
            alpha = 0.35
        
        ax.scatter(x, y, s=size, color=color, alpha=alpha, edgecolors='none')
        
        # Label only very bright stars to avoid clutter
        if request.show_labels and star['magnitude'] < 1.8 and star['name']:
            ax.text(x, y + 3, star['name'], color='yellow', fontsize=7, 
                   ha='center', va='bottom', alpha=0.9,
                   bbox=dict(boxstyle='round,pad=0.2', facecolor='black', alpha=0.3, edgecolor='none'))
    
    # Draw Planets
    for planet_name, planet_data in planets.items():
        if planet_data['is_visible']:
            px, py = azimuthal_equidistant_projection(planet_data['altitude'], planet_data['azimuth'])
            
            # Planet size based on magnitude (larger for brighter planets)
            planet_size = 150 * (10 ** (-planet_data['magnitude'] / 2.5))
            planet_size = np.clip(planet_size, 50, 400)
            
            # Draw planet with distinctive marker - gold edge for solar system objects
            ax.scatter(px, py, s=planet_size, color=planet_data['color'], 
                      marker='o', edgecolors='gold', linewidths=2.5, alpha=0.95, zorder=10)
            
            # Always label planets
            if request.show_labels:
                ax.text(px, py + 5, planet_data['name'], color=planet_data['color'], 
                       fontsize=9, ha='center', va='bottom', fontweight='bold', alpha=1.0,
                       bbox=dict(boxstyle='round,pad=0.3', facecolor='black', alpha=0.6, edgecolor='gold', linewidth=0.5))
    
    # Draw FOV circle if specified
    if request.fov_center_ra is not None and request.fov_center_dec is not None and request.fov_radius:
        # Convert FOV center to Alt/Az
        from core.astronomy import calculate_star_position
        fov_center_pos = calculate_star_position(
            ra_hours=request.fov_center_ra / 15.0,
            dec_degrees=request.fov_center_dec,
            observer=observer
        )
        
        if fov_center_pos.is_visible:
            cx, cy = azimuthal_equidistant_projection(fov_center_pos.altitude, fov_center_pos.azimuth)
            fov_circle = plt.Circle((cx, cy), request.fov_radius, fill=False, 
                                   color='red', linewidth=2, linestyle='-', alpha=0.8)
            ax.add_patch(fov_circle)
            ax.plot(cx, cy, 'r+', markersize=15, markeredgewidth=2)
    
    # Remove axes
    ax.axis('off')
    
    # Title with full location details and magnitude breakdown
    time_str = obs_time.strftime("%Y-%m-%d %H:%M UTC")
    lat_str = f"{abs(request.latitude):.4f}°{'N' if request.latitude >= 0 else 'S'}"
    lon_str = f"{abs(request.longitude):.4f}°{'E' if request.longitude >= 0 else 'W'}"
    
    # Count stars by magnitude for statistics
    mag_bright = sum(1 for s in visible_stars if s['magnitude'] < 3.0)
    mag_medium = sum(1 for s in visible_stars if 3.0 <= s['magnitude'] < 5.5)
    mag_faint = sum(1 for s in visible_stars if s['magnitude'] >= 5.5)
    
    plt.title(f"Sky Map - Observer: {lat_str}, {lon_str}\n{time_str}\n"
             f"{len(visible_stars)} stars visible (BSC Full Catalog: {mag_bright} bright | {mag_medium} medium | {mag_faint} faint)",
             color='white', fontsize=11, pad=20)
    
    # Save to bytes with higher DPI for better quality with more stars
    buf = io.BytesIO()
    plt.tight_layout()
    plt.savefig(buf, format='png', dpi=180, facecolor='#0a0a0a', edgecolor='none')
    buf.seek(0)
    plt.close(fig)
    
    # Encode to base64
    image_base64 = base64.b64encode(buf.read()).decode('utf-8')
    
    return StarMapResponse(
        image_base64=image_base64,
        stars_visible=len(visible_stars),
        sun_altitude=sun_moon['sun']['altitude'],
        moon_altitude=sun_moon['moon']['altitude'],
        moon_illumination=sun_moon['moon']['illumination']
    )


@router.post("/download")
async def download_star_map(request: StarMapRequest):
    """
    Download star map as PNG file
    """
    response = await generate_star_map(request)
    
    # Decode base64 to bytes
    image_bytes = base64.b64decode(response.image_base64)
    
    return Response(
        content=image_bytes,
        media_type="image/png",
        headers={
            "Content-Disposition": f"attachment; filename=star_map_{request.latitude}_{request.longitude}.png"
        }
    )

