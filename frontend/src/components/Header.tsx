import { Telescope } from 'lucide-react';
import type { Location, EnvironmentalData } from '../types';

interface HeaderProps {
  location: Location | null;
  environmentalData: EnvironmentalData | null;
}

export default function Header({ location, environmentalData }: HeaderProps) {
  return (
    <header className="bg-gray-900 border-b border-gray-800 shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-space-600 to-nebula-600 p-3 rounded-lg">
              <Telescope size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-space-400 to-nebula-500 bg-clip-text text-transparent">
                CelestialGuide Pro
              </h1>
              <p className="text-sm text-gray-400">
                Advanced Sky Visualization & Observation Planning
              </p>
            </div>
          </div>

          {/* Location and Bortle Info */}
          <div className="flex items-center space-x-6">
            {location && (
              <div className="text-right">
                <p className="text-sm text-gray-400">Location</p>
                <p className="font-medium text-white">
                  {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
                </p>
              </div>
            )}
            
            {environmentalData && (
              <div className="bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-400">Bortle Scale</p>
                <p className="text-xl font-bold text-center">
                  <span className={`${
                    environmentalData.light_pollution.bortle_scale <= 3
                      ? 'text-green-400'
                      : environmentalData.light_pollution.bortle_scale <= 5
                      ? 'text-yellow-400'
                      : environmentalData.light_pollution.bortle_scale <= 7
                      ? 'text-orange-400'
                      : 'text-red-400'
                  }`}>
                    {environmentalData.light_pollution.bortle_scale.toFixed(1)}
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

