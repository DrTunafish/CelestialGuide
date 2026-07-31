# CelestialGuide Pro — production image for Railway (frontend + backend + catalogs)
FROM node:20-bookworm-slim AS frontend-build

WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build


FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ENVIRONMENT=production \
    PORT=8000 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
    libproj-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

COPY backend/ ./
COPY --from=frontend-build /frontend/dist ./static

RUN mkdir -p data/raw data/light_pollution \
    && sed -i 's/\r$//' docker-entrypoint.sh \
    && chmod +x docker-entrypoint.sh

# Prefetch JPL DE421 ephemeris into /app
RUN python - <<'PY'
from skyfield.api import Loader
load = Loader('.')
load('de421.bsp')
print('de421.bsp ready')
PY

# Build SQLite catalogs into the image (Hipparcos + BSC via network)
RUN python setup_script.py

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT:-8000}/health" || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
