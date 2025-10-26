import { useState, useEffect } from 'react';
import { Sun, Moon, CloudSun, Sunrise, Sunset, Loader2 } from 'lucide-react';
import { calculateSolarEvents } from '../services/api';
import type { Location, SolarEventsResponse, DayEvents } from '../types';

interface SolarEventsTabProps {
  location: Location | null;
}

export default function SolarEventsTab({ location }: SolarEventsTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<SolarEventsResponse | null>(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    if (location) {
      loadEvents();
    }
  }, [location]);

  const loadEvents = async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await calculateSolarEvents({
        latitude: location.latitude,
        longitude: location.longitude,
        start_date: today,
        days: days,
      });
      setEvents(response);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

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

  const formatDayName = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const convertUTCToLocal = (dateStr: string, timeStr: string | null): string | null => {
    if (!timeStr) return null;
    
    // Parse UTC time (format: "HH:MM")
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Create a Date object with the date and UTC time
    const utcDate = new Date(dateStr + 'T' + timeStr + ':00Z');
    
    // Format as local time
    return utcDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const TimeDisplay = ({ label, time, icon: Icon, color, dateStr }: { 
    label: string; 
    time: string | null; 
    icon: any; 
    color: string;
    dateStr: string;
  }) => {
    if (!time) return null;
    
    const localTime = convertUTCToLocal(dateStr, time);
    
    return (
      <div className="flex items-center space-x-2">
        <Icon size={16} className={color} />
        <div>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-sm font-semibold text-white">{localTime}</p>
        </div>
      </div>
    );
  };

  const DayCard = ({ day }: { day: DayEvents }) => (
    <div className="bg-space-900/30 border border-space-800 rounded-lg p-6 hover:border-space-600 transition-all">
      {/* Date Header */}
      <div className="mb-4 pb-3 border-b border-space-800">
        <h3 className="text-lg font-bold text-space-400">
          {formatDayName(day.date)}
        </h3>
        <p className="text-xs text-gray-400">{day.date}</p>
      </div>

      {/* Sun Events */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-3">
          <Sun className="text-yellow-400" size={20} />
          <h4 className="font-semibold text-gray-300">Solar Events</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-2">
          <TimeDisplay 
            label="Sunrise" 
            time={day.sunrise} 
            icon={Sunrise} 
            color="text-orange-400" 
            dateStr={day.date}
          />
          <TimeDisplay 
            label="Sunset" 
            time={day.sunset} 
            icon={Sunset} 
            color="text-orange-600" 
            dateStr={day.date}
          />
        </div>

        {day.day_length_hours && (
          <div className="text-xs text-gray-400 mt-2">
            Day length: {day.day_length_hours.toFixed(2)} hours
          </div>
        )}
      </div>

      {/* Golden & Blue Hours */}
      <div className="mb-4 bg-gray-800/50 rounded-lg p-3">
        <div className="grid grid-cols-1 gap-2 text-xs">
          {day.golden_hour_morning_start && day.golden_hour_morning_end && (
            <div className="flex items-center justify-between">
              <span className="text-amber-400">🌅 Golden Hour (AM):</span>
              <span className="text-gray-300">
                {convertUTCToLocal(day.date, day.golden_hour_morning_start)} - {convertUTCToLocal(day.date, day.golden_hour_morning_end)}
              </span>
            </div>
          )}
          {day.golden_hour_evening_start && day.golden_hour_evening_end && (
            <div className="flex items-center justify-between">
              <span className="text-amber-400">🌇 Golden Hour (PM):</span>
              <span className="text-gray-300">
                {convertUTCToLocal(day.date, day.golden_hour_evening_start)} - {convertUTCToLocal(day.date, day.golden_hour_evening_end)}
              </span>
            </div>
          )}
          {day.blue_hour_morning_start && day.blue_hour_morning_end && (
            <div className="flex items-center justify-between">
              <span className="text-blue-400">🌌 Blue Hour (AM):</span>
              <span className="text-gray-300">
                {convertUTCToLocal(day.date, day.blue_hour_morning_start)} - {convertUTCToLocal(day.date, day.blue_hour_morning_end)}
              </span>
            </div>
          )}
          {day.blue_hour_evening_start && day.blue_hour_evening_end && (
            <div className="flex items-center justify-between">
              <span className="text-blue-400">🌆 Blue Hour (PM):</span>
              <span className="text-gray-300">
                {convertUTCToLocal(day.date, day.blue_hour_evening_start)} - {convertUTCToLocal(day.date, day.blue_hour_evening_end)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Twilight Times */}
      <div className="mb-4 bg-gray-800/30 rounded-lg p-3">
        <p className="text-xs font-semibold text-gray-400 mb-2">Twilight Times</p>
        <div className="grid grid-cols-1 gap-1 text-xs">
          {day.civil_twilight_begin && (
            <div className="flex justify-between">
              <span className="text-gray-400">Civil:</span>
              <span className="text-gray-300">
                {convertUTCToLocal(day.date, day.civil_twilight_begin)} - {convertUTCToLocal(day.date, day.civil_twilight_end) || 'N/A'}
              </span>
            </div>
          )}
          {day.nautical_twilight_begin && (
            <div className="flex justify-between">
              <span className="text-gray-400">Nautical:</span>
              <span className="text-gray-300">
                {convertUTCToLocal(day.date, day.nautical_twilight_begin)} - {convertUTCToLocal(day.date, day.nautical_twilight_end) || 'N/A'}
              </span>
            </div>
          )}
          {day.astronomical_twilight_begin && (
            <div className="flex justify-between">
              <span className="text-gray-400">Astronomical:</span>
              <span className="text-gray-300">
                {convertUTCToLocal(day.date, day.astronomical_twilight_begin)} - {convertUTCToLocal(day.date, day.astronomical_twilight_end) || 'N/A'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Moon Events */}
      <div>
        <div className="flex items-center space-x-2 mb-3">
          <Moon className="text-blue-400" size={20} />
          <h4 className="font-semibold text-gray-300">Lunar Events</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-2">
          <TimeDisplay 
            label="Moonrise" 
            time={day.moonrise} 
            icon={Moon} 
            color="text-blue-300" 
            dateStr={day.date}
          />
          <TimeDisplay 
            label="Moonset" 
            time={day.moonset} 
            icon={Moon} 
            color="text-blue-500" 
            dateStr={day.date}
          />
        </div>

        <div className="flex items-center space-x-3 mt-3 p-2 bg-gray-800/50 rounded">
          <span className="text-2xl">{getMoonIcon(day.moon_phase)}</span>
          <div>
            <p className="text-sm font-medium text-gray-200">{day.moon_phase}</p>
            <p className="text-xs text-gray-400">
              {(day.moon_illumination * 100).toFixed(0)}% illuminated
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
          <CloudSun className="text-space-500" />
          <span>Solar & Lunar Events</span>
        </h2>

        <p className="text-gray-300 mb-6">
          Track sunrise, sunset, moonrise, moonset, twilight periods, and golden/blue hours 
          for photography and observation planning.
        </p>

        {/* Controls */}
        <div className="flex items-center space-x-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Number of Days
            </label>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="input"
            >
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
          </div>

          <button
            onClick={loadEvents}
            disabled={loading || !location}
            className="btn-primary mt-6 flex items-center space-x-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Sun size={20} />
            )}
            <span>Refresh Events</span>
          </button>
        </div>

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

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-space-500" size={48} />
          </div>
        )}

        {/* Events Grid */}
        {events && !loading && (
          <>
            <div className="mb-4 bg-space-900/20 border border-space-800 rounded-lg p-4">
              <h3 className="font-semibold text-space-400 mb-2">Legend</h3>
              <div className="mb-3 text-sm text-green-400">
                ✓ All times are displayed in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
                <div>• <strong>Golden Hour:</strong> Soft, warm light (sun 6° to -4°)</div>
                <div>• <strong>Blue Hour:</strong> Deep blue sky (sun -4° to -8°)</div>
                <div>• <strong>Civil Twilight:</strong> Sun 0° to -6°</div>
                <div>• <strong>Nautical Twilight:</strong> Sun -6° to -12°</div>
                <div>• <strong>Astronomical Twilight:</strong> Sun -12° to -18°</div>
                <div>• <strong>Astronomical Night:</strong> Sun below -18° (darkest skies)</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.events.map((day) => (
                <DayCard key={day.date} day={day} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

