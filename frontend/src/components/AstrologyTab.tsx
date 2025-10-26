import { useState, useEffect } from 'react';
import { Stars, Loader2, Calendar, MapPin, Sparkles } from 'lucide-react';
import { calculateNatalChart, getHouseSystems, geocodeLocation, getDeepCommentary } from '../services/api';
import type { Location, NatalChart, AICommentaryResponse } from '../types';
import BirthChartVisualization from './BirthChartVisualization';
import ReactMarkdown from 'react-markdown';

interface AstrologyTabProps {
  location: Location | null;
}

export default function AstrologyTab({ location }: AstrologyTabProps) {
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('12:00');
  const [birthCity, setBirthCity] = useState('');
  const [birthLat, setBirthLat] = useState('');
  const [birthLon, setBirthLon] = useState('');
  const [timezone, setTimezone] = useState('Europe/Istanbul');
  const [houseSystem, setHouseSystem] = useState('Placidus');
  const [houseSystems, setHouseSystems] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingCommentary, setLoadingCommentary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [commentary, setCommentary] = useState<AICommentaryResponse | null>(null);

  useEffect(() => {
    // Load house systems
    const loadSystems = async () => {
      try {
        const data = await getHouseSystems();
        setHouseSystems(data.house_systems || []);
        setHouseSystem(data.default || 'Placidus');
      } catch (err) {
        console.error('Failed to load house systems:', err);
      }
    };
    loadSystems();
  }, []);

  const handleGeocodeBirthPlace = async () => {
    if (!birthCity) {
      setError('Please enter a birth city');
      return;
    }

    setLoadingLocation(true);
    setError(null);

    try {
      const locationData = await geocodeLocation(birthCity, '');
      setBirthLat(locationData.latitude.toFixed(6));
      setBirthLon(locationData.longitude.toFixed(6));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to geocode birth place');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleCalculate = async () => {
    if (!birthDate || !birthTime) {
      setError('Please enter birth date and time');
      return;
    }

    setLoading(true);
    setError(null);
    setCommentary(null); // Clear previous commentary

    try {
      let lat = birthLat;
      let lon = birthLon;

      // If coordinates are missing but city is provided, geocode automatically
      if ((!lat || !lon) && birthCity) {
        try {
          const locationData = await geocodeLocation(birthCity, '');
          lat = locationData.latitude.toFixed(6);
          lon = locationData.longitude.toFixed(6);
          setBirthLat(lat);
          setBirthLon(lon);
        } catch (geocodeErr: any) {
          setError(geocodeErr.response?.data?.detail || `Failed to find location: ${birthCity}`);
          setLoading(false);
          return;
        }
      }

      if (!lat || !lon) {
        setError('Please provide birth location (city name or coordinates)');
        setLoading(false);
        return;
      }

      const datetime = `${birthDate} ${birthTime}:00`;
      
      const chartData = await calculateNatalChart({
        datetime,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        tz_name: timezone,
        house_system: houseSystem,
      });

      setChart(chartData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to calculate chart');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCommentary = async () => {
    if (!birthDate || !birthTime) {
      setError('Please enter birth date and time');
      return;
    }

    setLoadingCommentary(true);
    setError(null);

    try {
      let lat = birthLat;
      let lon = birthLon;

      // If coordinates are missing but city is provided, geocode automatically
      if ((!lat || !lon) && birthCity) {
        try {
          const locationData = await geocodeLocation(birthCity, '');
          lat = locationData.latitude.toFixed(6);
          lon = locationData.longitude.toFixed(6);
          setBirthLat(lat);
          setBirthLon(lon);
        } catch (geocodeErr: any) {
          setError(geocodeErr.response?.data?.detail || `Failed to find location: ${birthCity}`);
          setLoadingCommentary(false);
          return;
        }
      }

      if (!lat || !lon) {
        setError('Please provide birth location (city name or coordinates)');
        setLoadingCommentary(false);
        return;
      }

      const datetime = `${birthDate} ${birthTime}:00`;
      
      const commentaryData = await getDeepCommentary({
        datetime,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        tz_name: timezone,
        house_system: houseSystem,
      });

      setCommentary(commentaryData);
      setChart(commentaryData.chart_data); // Also update chart
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate commentary. Please check if GEMINI_API_KEY is configured.');
    } finally {
      setLoadingCommentary(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <Stars className="text-nebula-500" />
          <span>Birth Chart Calculator</span>
        </h2>

        {/* Birth Information Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Date and Time */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Birth Date
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Birth Time
            </label>
            <input
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className="input w-full"
            />
          </div>

          {/* Birth Place */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              <MapPin className="inline w-4 h-4 mr-1" />
              Birth Place (City) *
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={birthCity}
                onChange={(e) => setBirthCity(e.target.value)}
                placeholder="e.g., Istanbul, Paris, New York"
                className="input flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleGeocodeBirthPlace()}
              />
              <button
                onClick={handleGeocodeBirthPlace}
                disabled={loadingLocation}
                className="btn-secondary flex items-center space-x-2"
                title="Find coordinates for this city"
              >
                {loadingLocation ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <MapPin size={20} />
                )}
                <span>Find</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Will be automatically geocoded when calculating (or click Find to see coordinates)
            </p>
          </div>

          {/* Coordinates */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Latitude (Optional)
            </label>
            <input
              type="number"
              value={birthLat}
              onChange={(e) => setBirthLat(e.target.value)}
              step="0.000001"
              placeholder="Auto-filled from city"
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Longitude (Optional)
            </label>
            <input
              type="number"
              value={birthLon}
              onChange={(e) => setBirthLon(e.target.value)}
              step="0.000001"
              placeholder="Auto-filled from city"
              className="input w-full"
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Timezone (IANA)
            </label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g., Europe/Istanbul, America/New_York"
              className="input w-full"
            />
          </div>

          {/* House System */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              House System
            </label>
            <select
              value={houseSystem}
              onChange={(e) => setHouseSystem(e.target.value)}
              className="input w-full"
            >
              {houseSystems.map((system) => (
                <option key={system} value={system}>
                  {system}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Calculate Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleCalculate}
            disabled={loading || loadingCommentary}
            className="btn-primary flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Stars size={20} />
            )}
            <span>Calculate Birth Chart</span>
          </button>
          
          <button
            onClick={handleGenerateCommentary}
            disabled={loading || loadingCommentary}
            className="btn-secondary flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-nebula-600 hover:from-purple-700 hover:to-nebula-700"
          >
            {loadingCommentary ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Sparkles size={20} />
            )}
            <span>AI Deep Analysis (Gemini)</span>
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* AI Commentary Display */}
        {commentary && (
          <div className="mb-6">
            <div className="bg-gradient-to-br from-purple-900/30 to-nebula-900/30 border-2 border-purple-700 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="text-purple-400" size={24} />
                <h3 className="text-xl font-bold text-purple-300">
                  Derin Astrolojik Yorum (Gemini AI)
                </h3>
              </div>
              <div className="prose prose-invert prose-purple max-w-none">
                <div className="text-gray-300 leading-relaxed space-y-4">
                  <ReactMarkdown>{commentary.commentary_text}</ReactMarkdown>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-purple-800 text-sm text-gray-400 flex items-center justify-between">
                <span>Model: {commentary.model}</span>
                <span>{commentary.sections.length} bölüm</span>
              </div>
            </div>
          </div>
        )}

        {/* Chart Display */}
        {chart && (
          <div className="space-y-6">
            {/* Birth Chart Visualization */}
            <BirthChartVisualization chart={chart} />

            {/* Key Points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-nebula-900/20 border border-nebula-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2 text-nebula-400">
                  Rising Sign (Ascendant)
                </h3>
                <p className="text-2xl font-bold text-white">
                  {chart.ascendant_formatted}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Your outer personality and how others see you
                </p>
              </div>

              <div className="bg-space-900/20 border border-space-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2 text-space-400">
                  Midheaven (MC)
                </h3>
                <p className="text-2xl font-bold text-white">
                  {chart.midheaven_formatted}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Your career path and public image
                </p>
              </div>
            </div>

            {/* Planet Positions Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <h3 className="text-lg font-semibold p-4 bg-gray-900 text-gray-300">
                Planet Positions
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900 text-gray-400 text-sm">
                    <tr>
                      <th className="px-4 py-2 text-left">Planet</th>
                      <th className="px-4 py-2 text-left">Position</th>
                      <th className="px-4 py-2 text-left">House</th>
                    </tr>
                  </thead>
                  <tbody className="text-white">
                    {chart.planet_positions.map((planet, idx) => (
                      <tr
                        key={planet.name}
                        className={idx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-850'}
                      >
                        <td className="px-4 py-2 font-medium">{planet.name}</td>
                        <td className="px-4 py-2">{planet.formatted}</td>
                        <td className="px-4 py-2">House {planet.house}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Aspects */}
            {chart.aspects.length > 0 && (
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <h3 className="text-lg font-semibold p-4 bg-gray-900 text-gray-300">
                  Major Aspects
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900 text-gray-400 text-sm">
                      <tr>
                        <th className="px-4 py-2 text-left">Planets</th>
                        <th className="px-4 py-2 text-left">Aspect</th>
                        <th className="px-4 py-2 text-left">Orb</th>
                      </tr>
                    </thead>
                    <tbody className="text-white">
                      {chart.aspects.map((aspect, idx) => (
                        <tr
                          key={idx}
                          className={idx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-850'}
                        >
                          <td className="px-4 py-2">
                            {aspect.planet1} - {aspect.planet2}
                          </td>
                          <td className="px-4 py-2 font-medium text-nebula-400">
                            {aspect.type}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-400">
                            {aspect.orb}°
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

