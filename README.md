# 🔭 CelestialGuide Pro

**Advanced Sky Visualization & Observation Planning Tool**

A professional full-stack web application for astronomers and astrophotographers providing high-precision sky maps, star search, deep sky object imaging planning, and comprehensive environmental data analysis using NASA satellite imagery.

![CelestialGuide Pro](https://img.shields.io/badge/Python-3.10+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green.svg)
![React](https://img.shields.io/badge/React-18.2-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)

---

## ✨ Features

### 🌟 Star Search & Tracking
- Search stars by common name (e.g., "Vega", "Sirius") or Hipparcos ID
- Real-time altitude/azimuth calculations with atmospheric refraction correction
- Detailed visibility analysis and magnitude information
- Distance calculations based on parallax data

### 🗺️ Sky Map Generation
- Accurate **Azimuthal Equidistant Projection** for horizon-based viewing
- Constellation line overlays from Stellarium data
- Bright star labeling (magnitude < 1.5)
- Real-time sky rendering based on observer location and time
- Sun and Moon position tracking with illumination phase
- High-resolution PNG export

### 📷 Astrophotography Assistant
- Find optimal imaging time for deep sky objects (Messier catalog)
- Calculate best time based on:
  - Target altitude (customizable minimum: 30° recommended)
  - Moon phase and angular separation from target
  - Astronomical darkness (sun below -18°)
  - Overall quality scoring system (0-100)
- Interactive timeline chart showing altitude and quality throughout the night
- Support for 15+ popular Messier objects
- Planetary imaging support (Jupiter, Saturn, Mars, Venus)

**Catalog Targets**:
- M31 (Andromeda Galaxy), M42 (Orion Nebula), M45 (Pleiades)
- M13 (Hercules Cluster), M51 (Whirlpool Galaxy)
- M1 (Crab Nebula), M8 (Lagoon Nebula), M16 (Eagle Nebula)
- M20 (Trifid Nebula), M27 (Dumbbell Nebula), M33 (Triangulum Galaxy)
- M57 (Ring Nebula), M81/82 (Bode's & Cigar Galaxies), M104 (Sombrero Galaxy)

### 🌅 Solar & Lunar Events Tracker
- Sunrise and sunset times
- Moonrise and moonset times
- Solar noon calculation
- **Golden hour** (morning & evening) - Soft, warm light for landscape photography
- **Blue hour** (morning & evening) - Deep blue sky for photography
- Twilight periods (civil, nautical, astronomical)
- Moon phase with illumination percentage
- Day length calculation
- **Up to 30 days forecast**
- **Automatic timezone conversion** - Times displayed in your local timezone

### 🌤️ Environmental Data Integration
- **Geolocation**: City-to-coordinates conversion (OpenCage API)
- **Weather**: Cloud cover, temperature, humidity (OpenWeatherMap API)
- **Light Pollution**: **NASA VIIRS Nighttime Lights V2.2** satellite data
  - Bortle Dark-Sky Scale (1-9)
  - Actual satellite-measured radiance (nanoWatts/cm²/sr)
  - Sky brightness (mag/arcsec²)
  - ~500m resolution for location-specific precision
- Comprehensive observation quality assessment

### 📄 PDF Export
- Generate professional observation plans
- Include location, weather, light pollution data
- Target star lists with Alt/Az coordinates
- Embedded sky map images
- Custom observation notes

---

## 🏗️ Architecture

### Backend (Python + FastAPI)
- **Framework**: FastAPI for high-performance async API
- **Astronomical Calculations**: Skyfield with JPL DE421 ephemeris
- **Database**: SQLite with indexed catalogs
- **Light Pollution**: NASA VIIRS V2.2 satellite imagery (GeoTIFF)
- **Catalogs**:
  - Hipparcos Main Catalog (118,000+ stars)
  - Bright Star Catalog (visual mag < 6.0)
  - Messier/NGC Deep Sky Objects (15+ objects)
  - Constellation lines from Stellarium

### Frontend (React + TypeScript + TailwindCSS)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development
- **Styling**: TailwindCSS with custom dark astronomy theme
- **Visualization**: Recharts for timeline graphs
- **Icons**: Lucide React
- **HTTP Client**: Axios

---

## 📦 Installation

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and npm
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/celestialguide-pro.git
cd celestialguide-pro
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create `.env` file in `backend/` directory:

```env
OPENCAGE_API_KEY=your_opencage_key
OPENWEATHERMAP_API_KEY=your_openweather_key
GEMINI_API_KEY=your_gemini_key  # Optional, for AI astrology features
```

**API Keys Required**:
1. **OpenCage Geocoding API**
   - Sign up: https://opencagedata.com/
   - Free tier: 2,500 requests/day

2. **OpenWeatherMap API**
   - Sign up: https://openweathermap.org/api
   - Free tier: 1,000 requests/day

### 4. Initialize Astronomical Catalogs

**Important**: This step downloads catalogs from VizieR and loads them into SQLite. Takes 2-5 minutes.

```bash
python core/catalog_loader.py
```

Expected output:
```
Downloading Hipparcos catalog from VizieR...
Downloaded Hipparcos catalog: 118218 stars
Downloading Bright Star Catalog from VizieR...
Downloaded Bright Star Catalog: 9110 stars
Loaded 118218 Hipparcos stars into database
Loaded 5612 bright stars into database
✓ All catalogs loaded successfully!
```

### 5. Start Backend Server

```bash
python main.py
```

Backend runs on: `http://localhost:8000`
API docs: `http://localhost:8000/docs`

### 6. Frontend Setup

**New terminal window**:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on: `http://localhost:3000`

---

## 🚀 Quick Start Guide

### 1. Set Your Location
- Navigate to **Location** tab
- Search by city name (e.g., "Istanbul, Turkey")
- System fetches weather and **NASA satellite-based light pollution data**

### 2. Search for Stars
- Go to **Search** tab
- Enter star name (e.g., "Vega") or HIP ID
- View position, visibility, and magnitude

### 3. Astrophotography Planning
- Open **Astrophotography** tab
- Select target (e.g., "Andromeda Galaxy")
- Choose date and minimum altitude
- Get optimal imaging time with quality score
- View timeline chart for entire night

### 4. Solar & Lunar Events
- Navigate to **Solar & Lunar** tab
- View sunrise/sunset, moonrise/moonset
- Check golden hour & blue hour times
- See moon phase and illumination
- Plan photography sessions

### 5. Generate Sky Map
- Visit **Sky Map** tab
- Click "Generate Map" for real-time visualization
- Toggle constellation lines and star labels
- Download high-resolution PNG

### 6. Check Observing Conditions
- **Weather** tab: Cloud cover, temperature, humidity
- Get Bortle scale from **NASA satellite data**
- See observation quality recommendations

---

## 📚 API Documentation

**Interactive Docs**: `http://localhost:8000/docs`

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/star/search` | POST | Search star and calculate position |
| `/api/environment/complete` | GET | Get all environmental data |
| `/api/environment/light-pollution` | GET | Get NASA VIIRS light pollution data |
| `/api/map/generate` | POST | Generate sky map |
| `/api/astrophotography/calculate` | POST | Calculate optimal imaging time |
| `/api/astrophotography/targets` | GET | Get available deep sky targets |
| `/api/solar-events/calculate` | POST | Get solar/lunar events |
| `/api/pdf/generate` | POST | Export observation plan PDF |
| `/api/astrology/natal-chart` | POST | Calculate astrological chart |

---

## 🛰️ NASA VIIRS Light Pollution Data

**Source**: NASA VIIRS Nighttime Lights V2.2 (2024 Annual Composite)

**Features**:
- **Resolution**: ~500 meters (city block level precision)
- **Global Coverage**: Every location on Earth
- **Scientific Accuracy**: Satellite-measured radiance values
- **Metrics Provided**:
  - Radiance (nanoWatts/cm²/sr)
  - Bortle Dark-Sky Scale (1-9)
  - Sky Brightness (mag/arcsec²)

**Dataset**: Included in `backend/data/light_pollution/` directory
- File: `VNL_npp_2024_global_vcmslcfg_v2_c202502261200.average.dat.tif`

**Usage**: Fully integrated into environmental API, no additional setup required.

---

## 🔬 Technical Details

### Astronomical Precision
- **Time System**: UTC with automatic timezone handling
- **Coordinate System**: ICRS (J2000.0)
- **Atmospheric Refraction**: Applied using Skyfield's standard model
- **Ephemeris**: JPL DE421 for planetary positions
- **Projection**: Azimuthal Equidistant for horizon-based sky maps

### Catalog Details
- **Hipparcos**: 118,218 stars with precise positions and parallaxes
- **Bright Star Catalog**: 5,612 stars with magnitude < 6.0
- **Messier Objects**: 15+ deep sky objects for imaging
- **Constellation Lines**: Stellarium open-source dataset (88 constellations)

### Performance
- **Caching**: Astronomical calculations cached for 1 hour
- **Vectorized Operations**: NumPy for bulk star calculations
- **Database Indexing**: SQLite indexes on magnitude, HIP ID
- **Lazy Loading**: NASA VNL data loaded once and cached in memory

---

## 🚢 Deployment

### Railway.app (Recommended)

Railway provides free tier for both frontend and backend:

**Backend Deployment**:
1. Push to GitHub
2. Connect to Railway.app
3. Set root directory to `backend`
4. Add environment variables:
   - `OPENCAGE_API_KEY`
   - `OPENWEATHERMAP_API_KEY`
   - `GEMINI_API_KEY` (optional)
5. Railway auto-deploys

**Frontend Deployment (Vercel)**:
1. Connect GitHub repo to Vercel
2. Set root directory to `frontend`
3. Add environment variable:
   - `VITE_API_URL=https://your-backend.railway.app`
4. Vercel auto-deploys

**Alternative**: Both on Railway
- Deploy backend as Python service
- Deploy frontend as Node.js service
- Set up internal networking

---

## 📁 Project Structure

```
CelestialGuide/
├── backend/
│   ├── main.py                    # FastAPI application
│   ├── requirements.txt           # Python dependencies
│   ├── core/
│   │   ├── astronomy.py           # Skyfield calculations
│   │   ├── light_pollution.py     # NASA VIIRS processing
│   │   ├── catalog_loader.py      # Catalog parsing
│   │   ├── database.py            # SQLite management
│   │   ├── config.py              # Configuration
│   │   └── pdf_generator.py       # PDF export
│   ├── api/
│   │   ├── star_search.py         # Star search endpoints
│   │   ├── environmental.py       # Weather/location endpoints
│   │   ├── star_map.py            # Map generation endpoints
│   │   ├── astrophotography.py    # Imaging planning endpoints
│   │   ├── solar_events.py        # Solar/lunar events endpoints
│   │   ├── astrology.py           # Astrology endpoints
│   │   └── pdf_export.py          # PDF export endpoints
│   └── data/
│       ├── celestial.db           # SQLite database (generated)
│       ├── light_pollution/
│       │   ├── VNL_npp_2024...tif # NASA VIIRS data
│       │   └── README.md          # Dataset documentation
│       └── raw/                   # Downloaded catalogs
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AstrophotographyTab.tsx
│   │   │   ├── SolarEventsTab.tsx
│   │   │   ├── LocationTab.tsx
│   │   │   ├── SearchTab.tsx
│   │   │   └── SkyMapTab.tsx
│   │   ├── services/
│   │   │   └── api.ts             # API client
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript definitions
│   │   ├── App.tsx                # Main application
│   │   └── main.tsx               # Entry point
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 🐛 Troubleshooting

### Catalog Loading Issues
```bash
# Re-download catalogs
cd backend
python core/catalog_loader.py
```

### NASA VNL Not Loading
- Ensure `rasterio` and `pyproj` are installed: `pip install -r requirements.txt`
- Verify VNL GeoTIFF file exists in `backend/data/light_pollution/`
- Check backend logs for VNL loading messages

### API Key Errors
- Ensure `.env` file exists in `backend/` directory
- Verify API keys are valid and have available quota

### Frontend Connection
- Ensure backend is running on port 8000
- Check CORS settings in `backend/main.py`
- Verify proxy in `frontend/vite.config.ts`

### Database Errors
```bash
# Reset database
cd backend
rm data/celestial.db
python core/catalog_loader.py
```

---

## 🎯 Feature Details

### Astrophotography Assistant
**Quality Score Calculation**:
- Target altitude (40%) - Higher is better
- Astronomical darkness (20%) - Sun below -18°
- Moon separation (20%) - More distance is better
- Moon altitude (20%) - Lower moon is better

**Usage**: Select target, date, minimum altitude → Get optimal imaging window

### Solar & Lunar Events
**Timezone Support**: All times automatically converted to your browser's local timezone
**Twilight Definitions**:
- **Civil**: Sun 0° to -6° (daylight visible)
- **Nautical**: Sun -6° to -12° (horizon clear)
- **Astronomical**: Sun -12° to -18° (faint stars visible)
- **Night**: Sun below -18° (darkest skies)

**Photography Windows**:
- **Golden Hour**: Sun 6° to -4° (warm, soft light)
- **Blue Hour**: Sun -4° to -8° (deep blue sky)

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Skyfield** by Brandon Rhodes for astronomical calculations
- **Hipparcos Catalogue** (ESA)
- **Bright Star Catalogue** (Yale)
- **NASA VIIRS Nighttime Lights** (Earth Observation Group, Colorado School of Mines)
- **Stellarium** for constellation line data
- **OpenCage**, **OpenWeatherMap** for environmental APIs
- **Recharts** for data visualization

---

## 🗺️ Roadmap

- [x] Deep-sky object catalog (Messier objects)
- [x] Planet positions and visibility
- [x] Solar/lunar event tracking
- [x] Moon phase calendar
- [ ] Multi-user accounts
- [ ] Observation session logging
- [ ] Mobile app (React Native)
- [ ] Real-time telescope control (ASCOM/INDI)
- [ ] Comet and asteroid tracking

---

**Happy Observing! 🌌✨**
