#!/bin/sh
set -e

cd /app

mkdir -p data/raw data/light_pollution

# Re-init catalogs if the DB is missing or empty (e.g. fresh volume mount)
if [ ! -f "data/celestial.db" ]; then
  echo "[entrypoint] No database found — running setup_script.py"
  ENVIRONMENT=production python setup_script.py
else
  echo "[entrypoint] Database present — skipping full catalog reload"
fi

# Ensure ephemeris file exists in the working directory
if [ ! -f "de421.bsp" ]; then
  echo "[entrypoint] Downloading de421.bsp"
  python -c "from skyfield.api import load; load('de421.bsp')" || true
fi

echo "[entrypoint] Starting CelestialGuide on port ${PORT:-8000}"
exec python main.py
