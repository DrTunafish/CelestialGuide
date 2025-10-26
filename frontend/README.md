# CelestialGuide Pro - Frontend

Modern React + TypeScript frontend with dark astronomy theme.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Frontend runs on: http://localhost:3000

### 3. Build for Production
```bash
npm run build
```

Build output in `dist/` directory.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first styling
- **Axios** - HTTP client
- **Lucide React** - Icon library

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # App header with location/Bortle
│   ├── LocationTab.tsx # Location search and geocoding
│   ├── SearchTab.tsx   # Star search functionality
│   ├── SkyMapTab.tsx   # Sky map generation
│   ├── TelescopeTab.tsx# FOV calculator
│   └── WeatherTab.tsx  # Weather and conditions
├── services/
│   └── api.ts          # Backend API client
├── types/
│   └── index.ts        # TypeScript type definitions
├── App.tsx             # Main application
├── main.tsx            # Entry point
└── index.css           # Global styles + Tailwind
```

## Components

### Header
- Displays current location coordinates
- Shows Bortle scale in color-coded badge
- Responsive design

### LocationTab
- City search with geocoding (OpenCage API)
- Manual coordinate entry
- Elevation input
- Displays formatted address

### SearchTab
- Star name or HIP ID search
- Quick-select buttons for popular stars
- Detailed visibility information
- Alt/Az coordinates with visual indicators
- Observation tips based on position

### SkyMapTab
- Real-time sky map generation
- Toggle constellation lines and labels
- Auto-refresh option (5 min intervals)
- Sun/Moon position tracking
- Download as PNG
- Displays star count and conditions

### TelescopeTab
- FOV calculator with 2-of-3 parameter input
- Equipment presets (telescopes, cameras)
- Common FOV presets (Andromeda, Orion, etc.)
- Results in degrees and arcminutes

### WeatherTab
- Current weather conditions
- Cloud cover percentage with color coding
- Bortle scale visualization
- Sky brightness (mag/arcsec²)
- Observation quality recommendations
- Comprehensive condition analysis

## Styling

### Theme Colors
- **Space Blue**: `#4f46e5` to `#1e1b4b` (primary)
- **Nebula Purple**: `#8b5cf6` to `#7c3aed` (accent)
- **Dark Background**: `#0a0a0a` to `#1a1a1a`

### Custom CSS Classes
- `.card` - Standard content card
- `.btn-primary` - Primary action button
- `.btn-secondary` - Secondary button
- `.input` - Form input styling
- `.tab-active` / `.tab-inactive` - Tab navigation

### Responsive Design
- Mobile-first approach
- Breakpoints: `md` (768px), `lg` (1024px)
- Grid layouts adapt to screen size

## API Integration

All backend communication handled through `src/services/api.ts`:

```typescript
import { searchStar, generateStarMap, geocodeLocation } from './services/api';

// Search for a star
const result = await searchStar('Vega', 48.8566, 2.3522);

// Generate sky map
const mapData = await generateStarMap(48.8566, 2.3522);

// Geocode city
const location = await geocodeLocation('Paris', 'France');
```

## Development

### Hot Module Replacement
Vite provides instant HMR for rapid development.

### TypeScript
Full type safety with strict mode enabled.

### Linting
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

## Environment Variables

Frontend proxies `/api` requests to backend (configured in `vite.config.ts`).

To change backend URL:
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://your-backend-url:8000',
        changeOrigin: true,
      }
    }
  }
})
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Performance

- Code splitting per route
- Lazy loading of images
- Debounced search inputs
- Cached API responses (1 hour)
- Optimized bundle size (~200KB gzipped)

## Accessibility

- Semantic HTML5
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast meets WCAG AA standards

