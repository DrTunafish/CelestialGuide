import { useState } from 'react';
import { Search, Star, Loader2, Eye, EyeOff } from 'lucide-react';
import { searchStar } from '../services/api';
import type { Location, StarSearchResult } from '../types';

interface SearchTabProps {
  location: Location | null;
  observationTime: string;
}

export default function SearchTab({ location, observationTime }: SearchTabProps) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<StarSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!location) {
      setError('Please set your location first in the Location tab');
      return;
    }

    if (!query.trim()) {
      setError('Please enter a star name or HIP ID');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await searchStar(
        query,
        location.latitude,
        location.longitude,
        observationTime,
        location.elevation || 0
      );
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Star not found');
    } finally {
      setLoading(false);
    }
  };

  const popularStars = [
    'Sirius', 'Vega', 'Arcturus', 'Rigel', 'Betelgeuse',
    'Altair', 'Aldebaran', 'Spica', 'Antares', 'Pollux',
    'Fomalhaut', 'Deneb', 'Regulus', 'Polaris'
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <Star className="text-space-500" />
          <span>Star Search</span>
        </h2>

        {/* Search Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Star Name or HIP ID
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Vega, Sirius, or 91262"
              className="input flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !location}
              className="btn-primary px-6 flex items-center space-x-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Search size={20} />
              )}
              <span>Search</span>
            </button>
          </div>
        </div>

        {/* Popular Stars Quick Select */}
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-3">Popular Stars:</p>
          <div className="flex flex-wrap gap-2">
            {popularStars.map((star) => (
              <button
                key={star}
                onClick={() => {
                  setQuery(star);
                  setError(null);
                }}
                className="px-3 py-1 bg-gray-800 hover:bg-space-700 rounded-lg text-sm transition-colors"
              >
                {star}
              </button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Search Result */}
        {result && (
          <div className="space-y-6">
            {/* Main Info Card */}
            <div className={`border-2 rounded-lg p-6 ${
              result.is_visible
                ? 'bg-green-900/10 border-green-700'
                : 'bg-red-900/10 border-red-700'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{result.name}</h3>
                  {result.hip_id && (
                    <p className="text-sm text-gray-400">HIP {result.hip_id}</p>
                  )}
                </div>
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                  result.is_visible
                    ? 'bg-green-700 text-white'
                    : 'bg-red-700 text-white'
                }`}>
                  {result.is_visible ? (
                    <><Eye size={20} /> <span>Visible</span></>
                  ) : (
                    <><EyeOff size={20} /> <span>Not Visible</span></>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-300 text-base leading-relaxed mb-4">
                {result.description}
              </p>
            </div>

            {/* Detailed Data Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Altitude</p>
                <p className="text-2xl font-bold text-space-400">
                  {result.altitude.toFixed(1)}°
                </p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Azimuth</p>
                <p className="text-2xl font-bold text-space-400">
                  {result.azimuth.toFixed(1)}°
                </p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Magnitude</p>
                <p className="text-2xl font-bold text-nebula-400">
                  {result.magnitude.toFixed(2)}
                </p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Right Ascension</p>
                <p className="text-xl font-semibold text-white">
                  {(result.ra / 15).toFixed(4)}h
                </p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Declination</p>
                <p className="text-xl font-semibold text-white">
                  {result.dec >= 0 ? '+' : ''}{result.dec.toFixed(4)}°
                </p>
              </div>
              
              {result.distance_pc && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-1">Distance</p>
                  <p className="text-xl font-semibold text-white">
                    {result.distance_pc.toFixed(1)} pc
                  </p>
                </div>
              )}
            </div>

            {/* Observation Tips */}
            {result.is_visible && (
              <div className="bg-space-900/20 border border-space-800 rounded-lg p-4">
                <h4 className="font-semibold text-space-400 mb-2">Observation Tips</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>
                    • Look towards {
                      result.azimuth < 45 ? 'North' :
                      result.azimuth < 135 ? 'East' :
                      result.azimuth < 225 ? 'South' :
                      result.azimuth < 315 ? 'West' : 'North'
                    } at {result.azimuth.toFixed(0)}°
                  </li>
                  <li>
                    • Altitude of {result.altitude.toFixed(0)}° means looking {
                      result.altitude > 60 ? 'almost straight up' :
                      result.altitude > 30 ? 'well above the horizon' :
                      result.altitude > 15 ? 'fairly low' : 'very close to horizon'
                    }
                  </li>
                  {result.magnitude < 3 && (
                    <li>• Bright enough to see even with some light pollution</li>
                  )}
                </ul>
              </div>
            )}
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

