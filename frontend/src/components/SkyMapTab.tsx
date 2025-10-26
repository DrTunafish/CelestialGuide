import { useState, useEffect } from 'react';
import { Map, Download, Loader2, RefreshCw } from 'lucide-react';
import { generateStarMap, downloadStarMap } from '../services/api';
import type { Location, StarMapResponse } from '../types';

interface SkyMapTabProps {
  location: Location | null;
  observationTime: string;
}

export default function SkyMapTab({ location, observationTime }: SkyMapTabProps) {
  const [mapData, setMapData] = useState<StarMapResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConstellations, setShowConstellations] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [customDateTime, setCustomDateTime] = useState<string>('');
  const [useCustomTime, setUseCustomTime] = useState(false);
  
  // Format current time for datetime-local input
  useEffect(() => {
    const now = new Date();
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setCustomDateTime(localDateTime);
  }, []);

  const handleGenerateMap = async () => {
    if (!location) {
      setError('Please set your location first in the Location tab');
      return;
    }

    setLoading(true);
    setError(null);

    // Use custom datetime if selected, otherwise use current time
    const selectedTime = useCustomTime && customDateTime 
      ? new Date(customDateTime).toISOString()
      : observationTime;

    console.log('[SKY MAP] Generating map with location:', {
      lat: location.latitude,
      lon: location.longitude,
      time: selectedTime,
      useCustomTime
    });

    try {
      const data = await generateStarMap(
        location.latitude,
        location.longitude,
        selectedTime,
        location.elevation || 0,
        showConstellations,
        showLabels
      );
      setMapData(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate map');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!location) return;

    try {
      const blob = await downloadStarMap(
        location.latitude,
        location.longitude,
        observationTime
      );
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `star_map_${new Date().toISOString()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to download map');
    }
  };

  // Auto-refresh every 5 minutes if enabled
  useEffect(() => {
    if (!autoRefresh || !location) return;

    const interval = setInterval(() => {
      handleGenerateMap();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, location, observationTime, showConstellations, showLabels]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Map className="text-space-500" />
            <span>Sky Map Generator</span>
          </h2>
          
          {mapData && (
            <button
              onClick={handleDownload}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download size={18} />
              <span>Download PNG</span>
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4 mb-6">
          {/* Date/Time Selector */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <input
                type="checkbox"
                id="useCustomTime"
                checked={useCustomTime}
                onChange={(e) => setUseCustomTime(e.target.checked)}
                className="w-4 h-4 text-space-600 bg-gray-700 border-gray-600 rounded focus:ring-space-500"
              />
              <label htmlFor="useCustomTime" className="text-sm font-medium cursor-pointer">
                Use Custom Date & Time
              </label>
            </div>
            
            {useCustomTime && (
              <div className="mt-3">
                <label className="block text-xs text-gray-400 mb-2">
                  Select Date and Time (Local Time)
                </label>
                <input
                  type="datetime-local"
                  value={customDateTime}
                  onChange={(e) => setCustomDateTime(e.target.value)}
                  className="input w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Will be converted to UTC for calculations
                </p>
              </div>
            )}
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 bg-gray-800 rounded-lg p-3">
              <input
                type="checkbox"
                id="constellations"
                checked={showConstellations}
                onChange={(e) => setShowConstellations(e.target.checked)}
                className="w-4 h-4 text-space-600 bg-gray-700 border-gray-600 rounded focus:ring-space-500"
              />
              <label htmlFor="constellations" className="text-sm cursor-pointer">
                Show Constellation Lines
              </label>
            </div>
            
            <div className="flex items-center space-x-3 bg-gray-800 rounded-lg p-3">
              <input
                type="checkbox"
                id="labels"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="w-4 h-4 text-space-600 bg-gray-700 border-gray-600 rounded focus:ring-space-500"
              />
              <label htmlFor="labels" className="text-sm cursor-pointer">
                Show Star Labels & Planets
              </label>
            </div>
            
            <div className="flex items-center space-x-3 bg-gray-800 rounded-lg p-3">
              <input
                type="checkbox"
                id="autorefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-space-600 bg-gray-700 border-gray-600 rounded focus:ring-space-500"
              />
              <label htmlFor="autorefresh" className="text-sm cursor-pointer">
                Auto-refresh (5 min)
              </label>
            </div>
            
            <button
              onClick={handleGenerateMap}
              disabled={loading || !location}
              className="btn-primary flex items-center justify-center space-x-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <RefreshCw size={20} />
              )}
              <span>Generate Map</span>
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Map Display */}
        {mapData && (
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Stars Visible</p>
                <p className="text-xl font-bold text-space-400">{mapData.stars_visible}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Sun Altitude</p>
                <p className={`text-xl font-bold ${
                  mapData.sun_altitude < -18 ? 'text-green-400' :
                  mapData.sun_altitude < -6 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {mapData.sun_altitude.toFixed(1)}°
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Moon Altitude</p>
                <p className="text-xl font-bold text-gray-300">
                  {mapData.moon_altitude.toFixed(1)}°
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-1">Moon Phase</p>
                <p className="text-xl font-bold text-gray-300">
                  {(mapData.moon_illumination * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Map Image */}
            <div className="bg-black rounded-lg p-4 border-2 border-gray-800">
              <img
                src={`data:image/png;base64,${mapData.image_base64}`}
                alt="Star Map"
                className="w-full h-auto rounded"
              />
            </div>

            {/* Legend */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-gray-300">Map Legend</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-400">
                <div>• Center: Zenith (directly overhead)</div>
                <div>• Edge: Horizon (0° altitude)</div>
                <div>• Larger dots: Brighter stars</div>
                <div>• Yellow labels: Major stars</div>
              </div>
            </div>
          </div>
        )}

        {/* No Location Warning */}
        {!location && (
          <div className="bg-yellow-900/20 border border-yellow-800 text-yellow-400 px-4 py-3 rounded-lg">
            Please set your observation location in the Location tab first.
          </div>
        )}
      </div>
    </div>
  );
}

