# CelestialGuide Backend Starter (PowerShell)
Write-Host "Starting CelestialGuide Backend with venv..." -ForegroundColor Green

# Activate virtual environment
& .\venv\Scripts\Activate.ps1

# Check if rasterio is available
python -c "import rasterio; print('✅ Rasterio loaded')" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Rasterio not found. Installing..." -ForegroundColor Yellow
    pip install rasterio==1.3.11 pyproj==3.6.1
}

# Start backend
Write-Host "Starting FastAPI server..." -ForegroundColor Cyan
python main.py

