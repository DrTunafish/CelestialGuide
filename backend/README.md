# CelestialGuide Pro - Backend

FastAPI-based backend for astronomical calculations and data management.

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and add API keys
```

### 3. Initialize Catalogs
```bash
python core/catalog_loader.py
```

This downloads and loads:
- Hipparcos Main Catalog
- Bright Star Catalog
- Constellation lines
- Common star names

### 4. Run Server
```bash
python main.py
```

Server runs on: http://localhost:8000

API docs: http://localhost:8000/docs

## API Endpoints

### Star Search
- `POST /api/star/search` - Search star by name or HIP ID
- `GET /api/star/catalog/search` - Autocomplete search

### Environmental Data
- `POST /api/environment/geocode` - City to coordinates
- `GET /api/environment/weather` - Weather data
- `GET /api/environment/light-pollution` - Bortle scale
- `GET /api/environment/complete` - All environmental data

### Sky Map
- `POST /api/map/generate` - Generate sky map (returns base64 image)
- `POST /api/map/download` - Download sky map as PNG

### Telescope
- `POST /api/telescope/calculate-fov` - Calculate field of view
- `GET /api/telescope/presets` - Get equipment presets

### PDF Export
- `POST /api/pdf/generate` - Generate observation plan PDF

## Core Modules

### astronomy.py
High-precision astronomical calculations using Skyfield:
- Star position calculations (Alt/Az)
- Atmospheric refraction correction
- Bulk position calculations
- Sun/Moon tracking

### catalog_loader.py
Catalog management utilities:
- Download catalogs from VizieR
- Parse FITS/CSV data
- Load into SQLite with indexing

### database.py
SQLite database management:
- Table initialization
- Connection pooling
- Indexed queries

### pdf_generator.py
PDF generation using ReportLab:
- Observation plan templates
- Embedded images
- Professional formatting

## Configuration

Edit `core/config.py` or use environment variables:

```python
# API Keys
OPENCAGE_API_KEY=your_key
OPENWEATHERMAP_API_KEY=your_key
LIGHT_POLLUTION_MAP_API_KEY=your_key

# Database
DATABASE_PATH=./data/celestial.db

# Astronomical Settings
MAX_MAGNITUDE=6.0
MIN_ALTITUDE=0.0

# Cache
CACHE_TTL_SECONDS=3600
```

## Database Schema

### hipparcos
- `hip_id` (PRIMARY KEY)
- `ra` (hours)
- `dec` (degrees)
- `vmag` (visual magnitude)
- `parallax` (milliarcseconds)
- `proper_name`

### bright_stars
- `bsc_id` (PRIMARY KEY)
- `hip_id` (FOREIGN KEY)
- `ra` (hours)
- `dec` (degrees)
- `vmag`
- `name`

### star_names
- `common_name`
- `hip_id` (FOREIGN KEY)

### constellation_lines
- `constellation` (abbreviation)
- `hip_id_1` (FOREIGN KEY)
- `hip_id_2` (FOREIGN KEY)

## Performance

- Calculations cached for 1 hour
- Vectorized operations with NumPy
- Database indexes on all lookup fields
- Async API handlers

## Development

### Run Tests
```bash
pytest
```

### Code Style
```bash
black .
flake8
```

### Generate API Client
```bash
# OpenAPI schema available at /openapi.json
curl http://localhost:8000/openapi.json > openapi.json
```

