import { useState, useEffect } from 'react';
import { Camera, Calculator, Loader2, Moon, Sun, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { calculateAstrophotography, getAstrophotographyTargets } from '../services/api';
import type { Location, AstrophotographyResponse, DeepSkyTarget } from '../types';

interface AstrophotographyTabProps {
  location: Location | null;
  selectedDate: string;
}

export default function AstrophotographyTab({ location, selectedDate }: AstrophotographyTabProps) {
  const [target, setTarget] = useState('');
  const [minAltitude, setMinAltitude] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AstrophotographyResponse | null>(null);
  const [targets, setTargets] = useState<DeepSkyTarget[]>([]);
  const [showTargetList, setShowTargetList] = useState(false);

  useEffect(() => {
    // Load available targets
    loadTargets();
  }, []);

  const loadTargets = async () => {
    try {
      const data = await getAstrophotographyTargets();
      setTargets(data.targets);
    } catch (err) {
      console.error('Failed to load targets:', err);
    }
  };

  const handleCalculate = async () => {
    if (!location) {
      setError('Please set your location first in the Location tab');
      return;
    }

    if (!target.trim()) {
      setError('Please enter a target name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await calculateAstrophotography({
        target: target.trim(),
        latitude: location.latitude,
        longitude: location.longitude,
        date: selectedDate,
        min_altitude: minAltitude,
      });
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Calculation failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const selectTarget = (targetObj: DeepSkyTarget) => {
    setTarget(targetObj.name);
    setShowTargetList(false);
  };

  // Format chart data
  const chartData = result?.timeline.map((point) => ({
    time: new Date(point.time_utc).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }),
    altitude: point.altitude,
    quality: point.quality_score,
    moon_sep: point.moon_separation,
  })) || [];

  const getMoonIcon = (phase: string) => {
    const phases: { [key: string]: string } = {
      'New Moon': '🌑',
      'Waxing Crescent': '🌒',
      'First Quarter': '🌓',
      'Waxing Gibbous': '🌔',
      'Full Moon': '🌕',
      'Waning Gibbous': '🌖',
      'Last Quarter': '🌗',
      'Waning Crescent': '🌘',
    };
    return phases[phase] || '🌙';
  };

  const getQualityColor = (score: number | null) => {
    if (!score) return 'text-gray-400';
    if (score > 80) return 'text-green-400';
    if (score > 60) return 'text-blue-400';
    if (score > 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2 title-sun">
          <Camera className="text-sun" />
          <span>Astrophotography Assistant</span>
        </h2>

        <p className="text-gray-300 mb-6">
          Find the optimal time to photograph deep sky objects based on target altitude, 
          moon position, and astronomical darkness.
        </p>

        {/* Input Form */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Target Selection */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Target Object
            </label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onFocus={() => setShowTargetList(true)}
              placeholder="e.g., Andromeda Galaxy, M31"
              className="input w-full"
            />
            
            {showTargetList && targets.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-space-800 rounded-lg max-h-64 overflow-y-auto shadow-xl">
                {targets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectTarget(t)}
                    className="w-full text-left px-4 py-2 hover:bg-space-900/50 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium text-white">{t.name}</span>
                      <span className="text-xs text-gray-400 ml-2">({t.id})</span>
                    </div>
                    <span className="text-xs text-gray-500">{t.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Info */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Observation Date
            </label>
            <div className="input w-full bg-gray-700/50 text-gray-400 flex items-center">
              {selectedDate}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Date set in Location tab
            </p>
          </div>

          {/* Min Altitude */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Minimum Altitude: {minAltitude}°
            </label>
            <input
              type="range"
              min="0"
              max="60"
              value={minAltitude}
              onChange={(e) => setMinAltitude(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          disabled={loading}
          className="btn-core btn-primary w-full flex items-center justify-center space-x-2 mb-6"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Calculator size={20} />
          )}
          <span>Calculate Best Time</span>
        </button>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* No Location Warning */}
        {!location && (
          <div className="bg-yellow-900/20 border border-yellow-800 text-yellow-400 px-4 py-3 rounded-lg">
            Please set your observation location in the Location tab first.
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6 mt-6">
            {/* Header */}
            <div className="bg-space-900/30 border border-space-800 rounded-lg p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h3 className="text-2xl font-bold text-space-400 break-words">
                    {result.target_name}
                  </h3>
                  <p className="text-sm text-gray-400">{result.target_id}</p>
                </div>
                <div className={`text-4xl shrink-0 ${getQualityColor(result.quality_score)}`}>
                  <Target size={48} />
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 mb-4">
                <p className={`text-lg font-semibold ${getQualityColor(result.quality_score)}`}>
                  {result.recommendation}
                </p>
              </div>

              {/* Best Time */}
              {result.best_time_utc && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-1">Best Time (UTC)</p>
                    <p className="text-xl font-bold text-green-400">
                      {new Date(result.best_time_utc).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </p>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-1">Target Altitude</p>
                    <p className="text-xl font-bold text-blue-400">
                      {result.altitude?.toFixed(1)}°
                    </p>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-1">Quality Score</p>
                    <p className={`text-xl font-bold ${getQualityColor(result.quality_score)}`}>
                      {result.quality_score?.toFixed(0)}/100
                    </p>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-xs text-gray-400 mb-1">Moon Separation</p>
                    <p className="text-xl font-bold text-purple-400">
                      {result.moon_separation?.toFixed(0)}°
                    </p>
                  </div>
                </div>
              )}

              {/* Moon Info */}
              <div className="mt-4 flex items-center space-x-4 text-sm text-gray-300">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getMoonIcon(result.moon_phase)}</span>
                  <span>{result.moon_phase}</span>
                </div>
                <div>
                  Illumination: {(result.moon_illumination * 100).toFixed(0)}%
                </div>
              </div>

              {/* Astronomical Night Window */}
              {result.astronomical_night_start && result.astronomical_night_end && (
                <div className="mt-4 bg-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-2">Astronomical Night Window</p>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Sun size={16} className="text-orange-400" />
                      <span>
                        {new Date(result.astronomical_night_start).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </span>
                    </div>
                    <span className="text-gray-600">→</span>
                    <div className="flex items-center space-x-2">
                      <Moon size={16} className="text-blue-400" />
                      <span>
                        {new Date(result.astronomical_night_end).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline Chart */}
            {chartData.length > 0 && (
              <div className="bg-space-900/30 border border-space-800 rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-space-400">
                  Target Altitude & Quality Timeline
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      stroke="#94a3b8"
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="altitude" 
                      stroke="#3b82f6" 
                      name="Altitude (°)"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="quality" 
                      stroke="#10b981" 
                      name="Quality Score"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Tips */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-gray-300">Photography Tips</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Higher target altitude reduces atmospheric distortion</li>
                <li>• Greater moon separation improves contrast for faint objects</li>
                <li>• Astronomical night (sun &lt; -18°) provides darkest skies</li>
                <li>• Quality score considers all factors for optimal imaging</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

