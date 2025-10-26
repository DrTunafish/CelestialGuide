# 🚀 CelestialGuide Pro - Complete Setup Guide

This guide will walk you through setting up CelestialGuide Pro from scratch.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- ✅ **Python 3.10+** installed ([Download](https://www.python.org/downloads/))
- ✅ **Node.js 18+** and npm installed ([Download](https://nodejs.org/))
- ✅ **Git** installed ([Download](https://git-scm.com/))
- ✅ Stable internet connection (for catalog downloads)
- ✅ At least 2 GB free disk space

## 🔑 API Keys Setup

You'll need free API keys from these services:

### 1. OpenCage Geocoding API
1. Visit: https://opencagedata.com/
2. Click "Sign Up" (free tier: 2,500 requests/day)
3. Verify your email
4. Go to Dashboard → API Keys
5. Copy your API key

### 2. OpenWeatherMap API
1. Visit: https://openweathermap.org/api
2. Click "Sign Up" (free tier: 1,000 requests/day)
3. Verify your email
4. Go to API Keys section
5. Generate and copy your API key

### 3. Light Pollution Map API
1. Visit: https://www.lightpollutionmap.info/
2. Register for API access
3. Copy your API key

**Note**: Keep these keys safe - you'll need them in step 4.

---

## 📥 Installation Steps

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/celestialguide-pro.git
cd celestialguide-pro
```

### Step 2: Backend Setup

#### 2.1 Create Virtual Environment

**Windows:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
```

**Linux/Mac:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

#### 2.2 Install Python Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- FastAPI, Uvicorn
- Skyfield (astronomical calculations)
- Matplotlib (sky map generation)
- ReportLab (PDF export)
- And other dependencies

**Expected time**: 2-5 minutes

#### 2.3 Configure Environment Variables

**Windows:**
```bash
copy .env.example .env
notepad .env
```

**Linux/Mac:**
```bash
cp .env.example .env
nano .env  # or use your preferred editor
```

Add your API keys:
```env
OPENCAGE_API_KEY=your_opencage_key_here
OPENWEATHERMAP_API_KEY=your_openweathermap_key_here
LIGHT_POLLUTION_MAP_API_KEY=your_lpm_key_here

DATABASE_PATH=./data/celestial.db
CACHE_TTL_SECONDS=3600
```

**Important**: Replace `your_*_key_here` with actual keys from Step "API Keys Setup"

#### 2.4 Initialize Astronomical Catalogs

This is a **one-time setup** that downloads star catalogs from VizieR:

```bash
python setup_script.py
```

**What this does**:
- Creates SQLite database structure
- Downloads Hipparcos catalog (118,000+ stars)
- Downloads Bright Star Catalog (9,000+ stars)
- Loads constellation lines
- Creates indexes for fast queries

**Expected time**: 5-15 minutes (depends on internet speed)

**Expected output**:
```
======================================================================
CelestialGuide Pro - Complete Setup
======================================================================

Step 1: Initializing database...
✓ Database structure created successfully

Step 2: Downloading and loading astronomical catalogs...
This may take several minutes...

Downloading Hipparcos catalog from VizieR...
Downloaded Hipparcos catalog: 118218 stars
Downloading Bright Star Catalog from VizieR...
Downloaded Bright Star Catalog: 9110 stars
Loaded 118218 Hipparcos stars into database
Loaded 5612 bright stars into database
Loaded 30 common star names
Loaded 42 constellation lines
======================================================================
✓ All catalogs loaded successfully!
======================================================================
```

### Step 3: Start Backend Server

```bash
python main.py
```

**Expected output**:
```
Database initialized at: ./data/celestial.db
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

**Verify backend is running**:
- Open browser: http://localhost:8000
- You should see: `{"message": "CelestialGuide Pro API", "version": "1.0.0"}`
- API docs: http://localhost:8000/docs

**Keep this terminal open** - the backend must stay running.

---

### Step 4: Frontend Setup

**Open a NEW terminal** (keep backend running in the previous one).

#### 4.1 Navigate to Frontend

```bash
cd frontend  # If not already in frontend directory
```

#### 4.2 Install Node Dependencies

```bash
npm install
```

This installs:
- React, TypeScript
- Vite (build tool)
- TailwindCSS
- Axios, Lucide icons

**Expected time**: 1-3 minutes

#### 4.3 Start Frontend Development Server

```bash
npm run dev
```

**Expected output**:
```
  VITE v5.0.11  ready in 523 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

**Verify frontend is running**:
- Open browser: http://localhost:3000
- You should see the CelestialGuide Pro interface

---

## ✅ Verification Checklist

Test each feature to ensure everything works:

### 1. Location Tab
- [ ] Enter a city name (e.g., "Paris")
- [ ] Click "Search"
- [ ] Verify coordinates appear
- [ ] Check that Bortle scale shows in header

### 2. Search Tab
- [ ] Click "Vega" quick-select button
- [ ] Click "Search"
- [ ] Verify star details appear with Alt/Az coordinates

### 3. Sky Map Tab
- [ ] Click "Generate Map"
- [ ] Verify sky map image appears
- [ ] Check constellation lines are visible
- [ ] Try downloading PNG

### 4. Telescope Tab
- [ ] Click "8\" SCT (f/10)" preset
- [ ] Click "Canon APS-C" camera preset
- [ ] Click "Calculate Field of View"
- [ ] Verify FOV results appear

### 5. Weather Tab
- [ ] Verify weather data displays
- [ ] Check cloud cover percentage
- [ ] Confirm Bortle scale matches header

---

## 🐛 Troubleshooting

### Backend Issues

#### "ModuleNotFoundError: No module named 'fastapi'"
**Solution**: Virtual environment not activated or dependencies not installed
```bash
# Activate venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Reinstall dependencies
pip install -r requirements.txt
```

#### "ConnectionError" during catalog download
**Solution**: Check internet connection, try again
```bash
python setup_script.py
```

#### "API key not configured" errors
**Solution**: Verify `.env` file exists and has correct keys
```bash
# Check .env file exists
dir .env  # Windows
ls -la .env  # Linux/Mac

# Verify format (no quotes around keys)
OPENCAGE_API_KEY=abc123xyz
```

### Frontend Issues

#### "npm: command not found"
**Solution**: Install Node.js from https://nodejs.org/

#### Frontend can't connect to backend
**Solution**: 
1. Verify backend is running on port 8000
2. Check `vite.config.ts` proxy settings
3. Try restarting both servers

#### Blank page or "Loading..." stuck
**Solution**: Open browser console (F12) and check for errors

### Database Issues

#### Catalog not loading / "Table doesn't exist"
**Solution**: Re-run setup script
```bash
cd backend
python setup_script.py
```

#### Reset database completely
```bash
cd backend
rm -rf data/  # Linux/Mac
rmdir /s data  # Windows

# Re-run setup
python setup_script.py
```

---

## 🎯 Next Steps

Once everything is working:

1. **Explore Features**: Try all tabs and experiment with different locations
2. **Read API Docs**: http://localhost:8000/docs
3. **Customize Configuration**: Edit `backend/core/config.py`
4. **Plan Observations**: Use Weather tab to find optimal observing nights
5. **Calculate FOV**: Set up your telescope/camera equipment in Telescope tab

---

## 📚 Additional Resources

- **Main README**: `README.md` - Full project documentation
- **Backend README**: `backend/README.md` - API details
- **Frontend README**: `frontend/README.md` - Component documentation
- **API Documentation**: http://localhost:8000/docs (when running)

---

## 🆘 Getting Help

If you encounter issues:

1. Check this troubleshooting section
2. Review error messages carefully
3. Verify all prerequisites are installed
4. Check that API keys are valid
5. Open an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Operating system
   - Python/Node versions

---

## 🎉 Success!

If you've completed all steps and verification checks pass, congratulations! 

CelestialGuide Pro is now fully operational. 

**Happy observing! 🌌✨**

