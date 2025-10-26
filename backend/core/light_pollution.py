"""
NASA VIIRS Nighttime Lights (VNL) V2.2 Light Pollution Module
High-precision light pollution assessment using satellite imagery
"""
import os
import math
import numpy as np
from typing import Optional, Tuple
import logging

# Rasterio imports (optional dependency)
try:
    import rasterio  # type: ignore
    from rasterio.transform import rowcol  # type: ignore
    HAS_RASTERIO = True
except ImportError:
    HAS_RASTERIO = False

logger = logging.getLogger(__name__)

# Global variables for lazy loading
_vnl_dataset = None
_vnl_transform = None
_vnl_crs = None


def load_vnl_dataset():
    """
    Lazy load VNL GeoTIFF dataset
    Only loads once and caches in memory
    """
    global _vnl_dataset, _vnl_transform, _vnl_crs
    
    if _vnl_dataset is not None:
        return _vnl_dataset, _vnl_transform, _vnl_crs
    
    if not HAS_RASTERIO:
        logger.error("rasterio not installed. Install with: pip install rasterio")
        return None, None, None
    
    try:
        # Path to VNL GeoTIFF
        vnl_path = os.path.join(
            os.path.dirname(__file__), 
            '..', 
            'data', 
            'light_pollution',
            'VNL_npp_2024_global_vcmslcfg_v2_c202502261200.average.dat.tif'
        )
        
        if not os.path.exists(vnl_path):
            logger.error(f"VNL dataset not found at {vnl_path}")
            return None, None, None
        
        # Open the dataset
        dataset = rasterio.open(vnl_path)
        _vnl_dataset = dataset.read(1)  # Read first band
        _vnl_transform = dataset.transform
        _vnl_crs = dataset.crs
        
        logger.info(f"VNL dataset loaded: {dataset.width}x{dataset.height} pixels")
        logger.info(f"CRS: {_vnl_crs}, Transform: {_vnl_transform}")
        
        return _vnl_dataset, _vnl_transform, _vnl_crs
        
    except ImportError:
        logger.error("rasterio not installed. Install with: pip install rasterio")
        return None, None, None
    except Exception as e:
        logger.error(f"Error loading VNL dataset: {e}")
        return None, None, None


def latlon_to_pixel(lat: float, lon: float, transform) -> Tuple[Optional[int], Optional[int]]:
    """
    Convert lat/lon to pixel coordinates using affine transform
    
    Args:
        lat: Latitude in degrees
        lon: Longitude in degrees
        transform: Rasterio affine transform
        
    Returns:
        (row, col) pixel coordinates
    """
    if not HAS_RASTERIO:
        logger.error("rasterio not installed")
        return None, None
    
    try:
        row, col = rowcol(transform, lon, lat)
        return int(row), int(col)
    except Exception as e:
        logger.error(f"Error converting coordinates: {e}")
        return None, None


def get_radiance_at_location(latitude: float, longitude: float) -> Optional[float]:
    """
    Get VIIRS radiance value at specific location
    
    Args:
        latitude: Latitude in degrees (-90 to 90)
        longitude: Longitude in degrees (-180 to 180)
        
    Returns:
        Radiance value in nanoWatts/cm²/sr, or None if unavailable
    """
    dataset, transform, crs = load_vnl_dataset()
    
    if dataset is None:
        return None
    
    try:
        # Convert lat/lon to pixel coordinates
        row, col = latlon_to_pixel(latitude, longitude, transform)
        
        if row is None or col is None:
            return None
        
        # Check bounds
        if row < 0 or row >= dataset.shape[0] or col < 0 or col >= dataset.shape[1]:
            logger.warning(f"Coordinates ({latitude}, {longitude}) out of dataset bounds")
            return None
        
        # Get radiance value
        radiance = float(dataset[row, col])
        
        # Handle no-data values (typically 0 or negative for water/ice)
        if radiance < 0:
            radiance = 0.0
        
        return radiance
        
    except Exception as e:
        logger.error(f"Error getting radiance at ({latitude}, {longitude}): {e}")
        return None


def radiance_to_bortle(radiance: float) -> int:
    """
    Convert VIIRS radiance to Bortle Dark-Sky Scale
    
    Based on calibration from Falchi et al. (2016) and VIIRS observations
    
    Radiance ranges (nanoWatts/cm²/sr):
    - 0.000 - 0.171: Bortle 1 (Excellent dark sky)
    - 0.171 - 0.333: Bortle 2 (Typical truly dark site)
    - 0.333 - 0.630: Bortle 3 (Rural sky)
    - 0.630 - 1.260: Bortle 4 (Rural/suburban transition)
    - 1.260 - 2.520: Bortle 5 (Suburban sky)
    - 2.520 - 5.040: Bortle 6 (Bright suburban sky)
    - 5.040 - 10.08: Bortle 7 (Suburban/urban transition)
    - 10.08 - 20.16: Bortle 8 (City sky)
    - 20.16+:        Bortle 9 (Inner-city sky)
    
    Args:
        radiance: VIIRS radiance in nanoWatts/cm²/sr
        
    Returns:
        Bortle scale value (1-9)
    """
    if radiance <= 0.171:
        return 1
    elif radiance <= 0.333:
        return 2
    elif radiance <= 0.630:
        return 3
    elif radiance <= 1.260:
        return 4
    elif radiance <= 2.520:
        return 5
    elif radiance <= 5.040:
        return 6
    elif radiance <= 10.08:
        return 7
    elif radiance <= 20.16:
        return 8
    else:
        return 9


def get_bortle_description(bortle: int) -> str:
    """Get human-readable description for Bortle scale"""
    descriptions = {
        1: "Excellent dark sky site - Milky Way casts shadows",
        2: "Typical truly dark site - Airglow visible",
        3: "Rural sky - Some light pollution horizon",
        4: "Rural/suburban transition - Milky Way still impressive",
        5: "Suburban sky - Milky Way very weak",
        6: "Bright suburban sky - Milky Way invisible",
        7: "Suburban/urban transition - Sky strongly lit",
        8: "City sky - Entire sky grayish white",
        9: "Inner-city sky - Only brightest objects visible"
    }
    return descriptions.get(bortle, "Unknown")


def radiance_to_mpsas(radiance: float) -> float:
    """
    Convert VIIRS radiance to Sky Brightness (mag/arcsec²)
    
    Using the calibration: MPSAS = 21.9 - 2.5 * log10(radiance + 0.001)
    
    Args:
        radiance: VIIRS radiance in nanoWatts/cm²/sr
        
    Returns:
        Sky brightness in magnitudes per square arcsecond
    """
    # Avoid log(0)
    if radiance <= 0:
        return 22.0  # Darkest natural sky
    
    # Calibration formula
    mpsas = 21.9 - 2.5 * math.log10(radiance + 0.001)
    
    # Clamp to reasonable range (16-22 mag/arcsec²)
    return max(16.0, min(22.0, mpsas))


def get_light_pollution_data(latitude: float, longitude: float) -> dict:
    """
    Get comprehensive light pollution data for a location
    
    Args:
        latitude: Latitude in degrees
        longitude: Longitude in degrees
        
    Returns:
        Dictionary with light pollution metrics
    """
    radiance = get_radiance_at_location(latitude, longitude)
    
    if radiance is None:
        return {
            'available': False,
            'error': 'VNL data not available for this location',
            'bortle_scale': 4,  # Default fallback
            'description': 'Data unavailable - using default value',
            'radiance': None,
            'sky_brightness_mpsas': None
        }
    
    bortle = radiance_to_bortle(radiance)
    mpsas = radiance_to_mpsas(radiance)
    
    return {
        'available': True,
        'bortle_scale': bortle,
        'description': get_bortle_description(bortle),
        'radiance': round(radiance, 4),
        'radiance_unit': 'nanoWatts/cm²/sr',
        'sky_brightness_mpsas': round(mpsas, 2),
        'sky_brightness_unit': 'mag/arcsec²',
        'source': 'NASA VIIRS Nighttime Lights V2.2 (2024)',
        'quality': 'High precision satellite measurement'
    }


def get_nearby_darkness_stats(latitude: float, longitude: float, radius_km: float = 50) -> dict:
    """
    Get light pollution statistics for area around location
    Useful for finding darker observing sites nearby
    
    Args:
        latitude: Center latitude
        longitude: Center longitude
        radius_km: Search radius in kilometers (default 50km)
        
    Returns:
        Statistics about nearby area
    """
    dataset, transform, crs = load_vnl_dataset()
    
    if dataset is None:
        return None
    
    try:
        # Convert radius to approximate pixels
        # VNL resolution is ~500m, so 1km ≈ 2 pixels
        radius_pixels = int(radius_km * 2)
        
        # Get center pixel
        center_row, center_col = latlon_to_pixel(latitude, longitude, transform)
        
        if center_row is None:
            return None
        
        # Extract region
        row_start = max(0, center_row - radius_pixels)
        row_end = min(dataset.shape[0], center_row + radius_pixels)
        col_start = max(0, center_col - radius_pixels)
        col_end = min(dataset.shape[1], center_col + radius_pixels)
        
        region = dataset[row_start:row_end, col_start:col_end]
        region = region[region >= 0]  # Filter out no-data
        
        if len(region) == 0:
            return None
        
        return {
            'mean_radiance': float(np.mean(region)),
            'min_radiance': float(np.min(region)),
            'max_radiance': float(np.max(region)),
            'std_radiance': float(np.std(region)),
            'darkest_bortle': radiance_to_bortle(float(np.min(region))),
            'brightest_bortle': radiance_to_bortle(float(np.max(region))),
            'radius_km': radius_km
        }
        
    except Exception as e:
        logger.error(f"Error calculating nearby stats: {e}")
        return None

