# Railway Deployment

CelestialGuide deploys as **one Docker service**: FastAPI serves the API and the built React SPA.

## Railway setup

1. Create a new project → **Deploy from GitHub** → `DrTunafish/CelestialGuide`
2. Leave **Root Directory** empty (repo root). `railway.toml` uses the root `Dockerfile`.
3. Do **not** set custom build/start commands like `pip install` or `start.sh` (those caused the previous failure).
4. Set environment variables (Variables tab):

| Variable | Required | Notes |
|----------|----------|-------|
| `OPENCAGE_API_KEY` | Yes | Geocoding |
| `OPENWEATHERMAP_API_KEY` | Yes | Weather |
| `GEMINI_API_KEY` | Optional | Star Reading AI |
| `ENVIRONMENT` | Yes | `production` |
| `FRONTEND_URL` | Recommended | Your public Railway URL, e.g. `https://….up.railway.app` |
| `PORT` | Auto | Railway injects this |

5. Generate a public domain (Settings → Networking).
6. Optional but recommended: add a **Volume** mounted at `/app/data` so SQLite and caches survive redeploys.

## Light pollution GeoTIFF (~11 GB)

The NASA VNL `.tif` is **not** in the Docker image (too large for git/build).

After deploy, upload it into the volume:

```text
/app/data/light_pollution/VNL_npp_2024_global_vcmslcfg_v2_c202502261200.average.dat.tif
```

Without it, other features still work; light-pollution falls back/errors gracefully.

## Local Docker smoke test

```bash
docker build -t celestialguide .
docker run --rm -p 8000:8000 --env-file backend/.env celestialguide
```

Open `http://localhost:8000` (UI) and `http://localhost:8000/health`.

## What the image includes

- Built frontend (`/app/static`)
- FastAPI backend
- Hipparcos + Bright Star catalogs (downloaded during image build)
- `messier_ngc_catalog.json`
- `de421.bsp` ephemeris
