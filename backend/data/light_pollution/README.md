# NASA VIIRS Nighttime Lights (VNL) V2.2 - Light Pollution Data

## 📊 Dataset Information

**Source**: NASA Earth Observations & NOAA National Centers for Environmental Information  
**Product**: VIIRS Day/Night Band (DNB) Nighttime Lights  
**Version**: V2.2 (2024 Annual Composite)  
**Resolution**: ~500 meters at equator  
**Coverage**: Global  
**Format**: GeoTIFF  

## 🌍 What This Data Provides

The VIIRS Nighttime Lights dataset measures artificial light at night from the Suomi NPP satellite. This provides:

1. **Radiance Values** (nanoWatts/cm²/sr)
   - Actual satellite-measured light intensity
   - Scientific unit for light pollution assessment

2. **Bortle Dark-Sky Scale** (1-9)
   - 1: Excellent dark sky site
   - 4-5: Suburban/rural transition
   - 9: Inner-city sky
   
3. **Sky Brightness** (mag/arcsec²)
   - Standard astronomical measure
   - Lower numbers = brighter sky = worse for astronomy

## 📁 File Structure

```
backend/data/light_pollution/
└── VNL_npp_2024_global_vcmslcfg_v2_c202502261200.average.dat.tif
    └── Global nighttime radiance map (GeoTIFF format)
```

## 🔬 Technical Details

### Calibration

The VNL data has been calibrated to remove:
- Stray light
- Background noise
- Lunar contamination
- Atmospheric effects

### Radiance to Bortle Scale Conversion

Based on Falchi et al. (2016) and empirical observations:

| Radiance (nW/cm²/sr) | Bortle | Sky Quality |
|----------------------|--------|-------------|
| 0.000 - 0.171        | 1      | Excellent dark sky |
| 0.171 - 0.333        | 2      | Typical dark site |
| 0.333 - 0.630        | 3      | Rural sky |
| 0.630 - 1.260        | 4      | Rural/suburban |
| 1.260 - 2.520        | 5      | Suburban sky |
| 2.520 - 5.040        | 6      | Bright suburban |
| 5.040 - 10.08        | 7      | Suburban/urban |
| 10.08 - 20.16        | 8      | City sky |
| 20.16+               | 9      | Inner-city sky |

### Sky Brightness Formula

```python
MPSAS = 21.9 - 2.5 * log10(radiance + 0.001)
```

Where:
- MPSAS = Magnitudes Per Square Arcsecond
- Lower MPSAS = Brighter sky = Worse for astronomy
- Natural dark sky: ~21.5-22.0 mag/arcsec²
- Urban sky: ~16-18 mag/arcsec²

## 🛠️ Usage in CelestialGuide

### Python API

```python
from core.light_pollution import get_light_pollution_data

# Get data for a location
data = get_light_pollution_data(latitude=38.732, longitude=35.485)

print(f"Bortle Scale: {data['bortle_scale']}")
print(f"Radiance: {data['radiance']} nanoWatts/cm²/sr")
print(f"Sky Brightness: {data['sky_brightness_mpsas']} mag/arcsec²")
```

### REST API

```bash
GET /api/environment/light-pollution?latitude=38.732&longitude=35.485
```

Response:
```json
{
  "bortle_scale": 9,
  "brightness": 17.0,
  "description": "Inner-city sky - Only brightest objects visible (NASA VIIRS V2.2)"
}
```

## 📚 References

1. **VIIRS DNB Product**: https://eogdata.mines.edu/products/vnl/
2. **Falchi et al. (2016)**: "The new world atlas of artificial night sky brightness"
3. **Bortle Scale**: John E. Bortle (2001), Sky & Telescope Magazine
4. **NOAA/NASA Documentation**: https://www.ngdc.noaa.gov/eog/viirs/

## 📝 Data Citation

```
Earth Observation Group, Payne Institute for Public Policy
Colorado School of Mines
VIIRS Nighttime Light Version 2, 2024
https://eogdata.mines.edu/products/vnl/
```

## ⚠️ Important Notes

1. **No-Data Values**: Ocean and polar regions may return 0 or negative values
2. **Resolution Limits**: 500m resolution means small dark sky sites may be averaged with surroundings
3. **Annual Composite**: Represents yearly average, not seasonal variations
4. **Cloud-Free**: Data is from clear-sky conditions only

## 🔄 Updating the Dataset

To update to a newer version:

1. Download latest VNL data from: https://eogdata.mines.edu/products/vnl/
2. Replace the GeoTIFF file in this directory
3. Update the filename reference in `core/light_pollution.py`
4. Test with: `python -m pytest tests/test_light_pollution.py`

## 📊 Validation

The VNL data has been validated against:
- Ground-based Sky Quality Meter (SQM) measurements
- Globe at Night citizen science data
- Professional observatory light pollution assessments

Typical accuracy: ±0.5 Bortle units in most locations.

