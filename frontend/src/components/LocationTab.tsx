import { useState } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { geocodeLocation, getCompleteEnvironmentalData } from '../services/api';
import type { Location, EnvironmentalData } from '../types';

interface LocationTabProps {
  location: Location | null;
  setLocation: (location: Location) => void;
  setEnvironmentalData: (data: EnvironmentalData) => void;
}

export default function LocationTab({
  location,
  setLocation,
  setEnvironmentalData,
}: LocationTabProps) {
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [elevation, setElevation] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeocode = async () => {
    if (!city) {
      setError('Please enter a city name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const locationData = await geocodeLocation(city, country);
      const newLocation = { ...locationData, elevation: parseFloat(elevation) || 0 };
      setLocation(newLocation);
      
      console.log('[LOCATION] Set new location:', newLocation);
      
      // Fetch environmental data
      const envData = await getCompleteEnvironmentalData(
        locationData.latitude,
        locationData.longitude,
        city
      );
      setEnvironmentalData(envData);
      
      // Update coordinate inputs
      setLatitude(locationData.latitude.toFixed(6));
      setLongitude(locationData.longitude.toFixed(6));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to geocode location');
    } finally {
      setLoading(false);
    }
  };

  const handleManualCoordinates = async () => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const elev = parseFloat(elevation) || 0;

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setError('Invalid coordinates. Lat: -90 to 90, Lon: -180 to 180');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const manualLocation: Location = {
        city: 'Custom Location',
        country: '',
        latitude: lat,
        longitude: lon,
        formatted_address: `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`,
        elevation: elev,
      };
      setLocation(manualLocation);

      // Fetch environmental data
      const envData = await getCompleteEnvironmentalData(lat, lon);
      setEnvironmentalData(envData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch environmental data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <MapPin className="text-space-500" />
          <span>Set Observation Location</span>
        </h2>

        {/* City Search */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">Search by City</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                City *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Paris"
                className="input w-full"
                onKeyPress={(e) => e.key === 'Enter' && handleGeocode()}
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Country (optional)
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g., France"
                className="input w-full"
                onKeyPress={(e) => e.key === 'Enter' && handleGeocode()}
              />
            </div>
            <div className="md:col-span-1 flex items-end">
              <button
                onClick={handleGeocode}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center space-x-2"
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
        </div>

        {/* Manual Coordinates */}
        <div className="border-t border-gray-800 pt-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-300">
            Or Enter Coordinates Manually
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Latitude (°)
              </label>
              <input
                type="number"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="e.g., 48.8566"
                step="0.000001"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Longitude (°)
              </label>
              <input
                type="number"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="e.g., 2.3522"
                step="0.000001"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Elevation (m)
              </label>
              <input
                type="number"
                value={elevation}
                onChange={(e) => setElevation(e.target.value)}
                placeholder="0"
                className="input w-full"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleManualCoordinates}
                disabled={loading}
                className="btn-secondary w-full"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Set Location'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 bg-red-900/20 border border-red-800 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Current Location Display */}
        {location && (
          <div className="mt-8 bg-space-900/20 border border-space-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-space-400">Current Location</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Address:</p>
                <p className="font-medium">{location.formatted_address}</p>
              </div>
              <div>
                <p className="text-gray-400">Coordinates:</p>
                <p className="font-medium">
                  {location.latitude.toFixed(6)}°, {location.longitude.toFixed(6)}°
                </p>
              </div>
              {location.elevation !== undefined && (
                <div>
                  <p className="text-gray-400">Elevation:</p>
                  <p className="font-medium">{location.elevation.toFixed(0)} m</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

