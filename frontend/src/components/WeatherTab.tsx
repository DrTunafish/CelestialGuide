import { CloudSun, Droplets, Eye, Wind, Award } from 'lucide-react';
import type { Location, EnvironmentalData } from '../types';

interface WeatherTabProps {
  location: Location | null;
  environmentalData: EnvironmentalData | null;
}

export default function WeatherTab({ location, environmentalData }: WeatherTabProps) {
  if (!location) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="bg-yellow-900/20 border border-yellow-800 text-yellow-400 px-4 py-3 rounded-lg">
            Please set your observation location in the Location tab first.
          </div>
        </div>
      </div>
    );
  }

  if (!environmentalData) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <CloudSun size={48} className="mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400">Loading environmental data...</p>
          </div>
        </div>
      </div>
    );
  }

  const { weather, light_pollution, observation_quality } = environmentalData;

  // Quality score color
  const getQualityColor = (quality: string) => {
    if (quality.includes('Excellent')) return 'text-green-400 border-green-700 bg-green-900/20';
    if (quality.includes('Good')) return 'text-blue-400 border-blue-700 bg-blue-900/20';
    if (quality.includes('Fair')) return 'text-yellow-400 border-yellow-700 bg-yellow-900/20';
    if (quality.includes('Poor')) return 'text-orange-400 border-orange-700 bg-orange-900/20';
    return 'text-red-400 border-red-700 bg-red-900/20';
  };

  // Bortle scale color
  const getBortleColor = (bortle: number) => {
    if (bortle <= 3) return 'text-green-400';
    if (bortle <= 5) return 'text-yellow-400';
    if (bortle <= 7) return 'text-orange-400';
    return 'text-red-400';
  };

  // Cloud cover color
  const getCloudColor = (cloudCover: number) => {
    if (cloudCover < 10) return 'text-green-400';
    if (cloudCover < 30) return 'text-blue-400';
    if (cloudCover < 60) return 'text-yellow-400';
    if (cloudCover < 80) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Overall Quality */}
      <div className={`card border-2 ${getQualityColor(observation_quality)}`}>
        <div className="flex items-center space-x-4">
          <Award size={48} />
          <div>
            <h2 className="text-2xl font-bold mb-1">Observation Quality</h2>
            <p className="text-lg">{observation_quality}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weather Conditions */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
            <CloudSun className="text-space-500" />
            <span>Weather Conditions</span>
          </h3>

          <div className="space-y-4">
            {/* Temperature */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Temperature</span>
                <Wind size={18} className="text-gray-500" />
              </div>
              <p className="text-3xl font-bold text-white">
                {weather.temperature_c.toFixed(1)}°C
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {weather.description}
              </p>
            </div>

            {/* Cloud Cover */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Cloud Cover</span>
                <CloudSun size={18} className="text-gray-500" />
              </div>
              <p className={`text-3xl font-bold ${getCloudColor(weather.cloud_cover)}`}>
                {weather.cloud_cover}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {weather.conditions}
              </p>
            </div>

            {/* Humidity */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Humidity</span>
                <Droplets size={18} className="text-gray-500" />
              </div>
              <p className="text-3xl font-bold text-white">
                {weather.humidity}%
              </p>
            </div>
          </div>
        </div>

        {/* Light Pollution */}
        <div className="card">
          <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
            <Eye className="text-space-500" />
            <span>Light Pollution</span>
          </h3>

          <div className="space-y-4">
            {/* Bortle Scale */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Bortle Scale</span>
              </div>
              <p className={`text-5xl font-bold ${getBortleColor(light_pollution.bortle_scale)}`}>
                {light_pollution.bortle_scale.toFixed(1)}
              </p>
              <p className="text-sm text-gray-300 mt-2">
                {light_pollution.description}
              </p>
            </div>

            {/* Sky Brightness */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Sky Brightness</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {light_pollution.brightness.toFixed(2)}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                mag/arcsec²
              </p>
            </div>

            {/* Bortle Scale Guide */}
            <div className="bg-gray-900 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-400 mb-2">Bortle Scale Guide:</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p><span className="text-green-400">1-3:</span> Excellent dark sky</p>
                <p><span className="text-yellow-400">4-5:</span> Rural/suburban</p>
                <p><span className="text-orange-400">6-7:</span> Suburban/city</p>
                <p><span className="text-red-400">8-9:</span> Urban/inner city</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Observation Recommendations */}
      <div className="card">
        <h3 className="text-xl font-bold mb-4 text-space-400">
          Observation Recommendations
        </h3>
        <div className="space-y-3 text-sm">
          {/* Based on cloud cover */}
          {weather.cloud_cover < 30 && (
            <div className="flex items-start space-x-2 text-green-400">
              <span>✓</span>
              <p>Clear skies - excellent conditions for observation</p>
            </div>
          )}
          {weather.cloud_cover >= 30 && weather.cloud_cover < 60 && (
            <div className="flex items-start space-x-2 text-yellow-400">
              <span>⚠</span>
              <p>Partly cloudy - observation possible but may be interrupted</p>
            </div>
          )}
          {weather.cloud_cover >= 60 && (
            <div className="flex items-start space-x-2 text-red-400">
              <span>✗</span>
              <p>Heavy cloud cover - not recommended for observation</p>
            </div>
          )}

          {/* Based on Bortle */}
          {light_pollution.bortle_scale <= 3 && (
            <div className="flex items-start space-x-2 text-green-400">
              <span>✓</span>
              <p>Excellent dark sky - ideal for deep sky objects and faint targets</p>
            </div>
          )}
          {light_pollution.bortle_scale > 3 && light_pollution.bortle_scale <= 5 && (
            <div className="flex items-start space-x-2 text-yellow-400">
              <span>⚠</span>
              <p>Moderate light pollution - bright stars and planets visible, deep sky objects challenging</p>
            </div>
          )}
          {light_pollution.bortle_scale > 5 && (
            <div className="flex items-start space-x-2 text-orange-400">
              <span>⚠</span>
              <p>Significant light pollution - focus on bright objects (Moon, planets, bright stars)</p>
            </div>
          )}

          {/* Temperature comfort */}
          {weather.temperature_c < 0 && (
            <div className="flex items-start space-x-2 text-blue-400">
              <span>❄</span>
              <p>Cold conditions - dress warmly and protect equipment from condensation</p>
            </div>
          )}
          {weather.temperature_c > 30 && (
            <div className="flex items-start space-x-2 text-orange-400">
              <span>☀</span>
              <p>Hot conditions - stay hydrated and watch for heat shimmer</p>
            </div>
          )}

          {/* Humidity */}
          {weather.humidity > 80 && (
            <div className="flex items-start space-x-2 text-blue-400">
              <span>💧</span>
              <p>High humidity - use dew shields and watch for lens fogging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

