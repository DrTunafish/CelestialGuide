import { useState, useEffect } from 'react';
import {
  Stars,
  Calendar,
  MapPin,
  Sparkles,
  Clock3,
  Navigation,
  Globe2,
  SatelliteDish,
} from 'lucide-react';
import {
  calculateNatalChart,
  getHouseSystems,
  geocodeLocation,
  getDeepCommentary,
} from '../services/api';
import type { Location, NatalChart, AICommentaryResponse } from '../types';
import BirthChartVisualization from './BirthChartVisualization';
import GeminiDataStream from './GeminiDataStream';

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
  const [activeField, setActiveField] = useState<string>('Idle');
  const [terminalStatus, setTerminalStatus] = useState<string>('Standby');

  useEffect(() => {
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

  const assignLocationDefaults = () => {
    if (!location) return;
    if (!birthCity) setBirthCity(`${location.city || ''}`);
    if (!birthLat) setBirthLat(location.latitude.toFixed(6));
    if (!birthLon) setBirthLon(location.longitude.toFixed(6));
  };

  useEffect(() => {
    assignLocationDefaults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleGeocodeBirthPlace = async () => {
    if (!birthCity) {
      setError('Please enter a birth city before scanning coordinates.');
      return;
    }

    setLoadingLocation(true);
    setError(null);
    setTerminalStatus('Triangulating coordinates...');

    try {
      const locationData = await geocodeLocation(birthCity, '');
      setBirthLat(locationData.latitude.toFixed(6));
      setBirthLon(locationData.longitude.toFixed(6));
      setTerminalStatus('Coordinates locked.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to geocode birth place.');
      setTerminalStatus('Coordinate acquisition failed.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleCalculate = async () => {
    if (!birthDate || !birthTime) {
      setError('Please enter both birth date and birth time.');
      return;
    }

    setLoading(true);
    setError(null);
    setCommentary(null);
    setTerminalStatus('Computing chart geometry...');

    try {
      let lat = birthLat;
      let lon = birthLon;

      if ((!lat || !lon) && birthCity) {
        try {
          const locationData = await geocodeLocation(birthCity, '');
          lat = locationData.latitude.toFixed(6);
          lon = locationData.longitude.toFixed(6);
          setBirthLat(lat);
          setBirthLon(lon);
        } catch (geocodeErr: any) {
          setError(geocodeErr.response?.data?.detail || `Failed to resolve coordinates for ${birthCity}.`);
          setLoading(false);
          setTerminalStatus('Coordinate acquisition failed.');
          return;
        }
      }

      if (!lat || !lon) {
        setError('Please provide birth coordinates or a valid city.');
        setLoading(false);
        setTerminalStatus('Awaiting complete parameters.');
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
      setTerminalStatus('Chart synchronized.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to calculate the natal chart.');
      setTerminalStatus('Chart computation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCommentary = async () => {
    if (!birthDate || !birthTime) {
      setError('Please enter both birth date and birth time.');
      return;
    }

    setLoadingCommentary(true);
    setError(null);
    setTerminalStatus('Engaging Gemini intelligence...');

    try {
      let lat = birthLat;
      let lon = birthLon;

      if ((!lat || !lon) && birthCity) {
        try {
          const locationData = await geocodeLocation(birthCity, '');
          lat = locationData.latitude.toFixed(6);
          lon = locationData.longitude.toFixed(6);
          setBirthLat(lat);
          setBirthLon(lon);
        } catch (geocodeErr: any) {
          setError(geocodeErr.response?.data?.detail || `Failed to resolve coordinates for ${birthCity}.`);
          setLoadingCommentary(false);
          setTerminalStatus('Gemini aborted: missing coordinates.');
          return;
        }
      }

      if (!lat || !lon) {
        setError('Please provide birth coordinates or a valid city.');
        setLoadingCommentary(false);
        setTerminalStatus('Gemini aborted: incomplete parameters.');
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
      setChart(commentaryData.chart_data);
      setTerminalStatus('Gemini analysis ready.');
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'Failed to generate Gemini commentary. Ensure GEMINI_API_KEY is configured.',
      );
      setTerminalStatus('Gemini analysis failed.');
    } finally {
      setLoadingCommentary(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="panel">
        <div className="panel__header">
          <div className="flex items-center gap-4">
            <div className="icon-orb">
              <Stars size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold title-sun">Natal Chart</h2>
              <p className="text-xs tracking-[0.08em] text-ink-muted mt-1">
                Enter birth details to calculate your chart
              </p>
            </div>
          </div>
          <div className="text-xs tracking-[0.08em] text-ink-faint">
            Active field: <span className="text-violet-soft">{activeField}</span>
            <span className="ml-6 text-ink-faint">Status: {terminalStatus}</span>
          </div>
        </div>

        <div className="panel__body relative overflow-hidden">
          <div className="space-y-8">
            <div className="terminal-grid">
              <div>
                <label className="hud-label">
                  <Calendar size={14} /> Birth date
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  onFocus={() => setActiveField('Birth date')}
                  className="holo-input"
                />
              </div>

              <div>
                <label className="hud-label">
                  <Clock3 size={14} /> Birth time
                </label>
                <input
                  type="time"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  onFocus={() => setActiveField('Birth time')}
                  className="holo-input"
                />
              </div>

              <div>
                <label className="hud-label">
                  <MapPin size={14} /> Birth city
                </label>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-3 md:flex-row">
                    <input
                      type="text"
                      value={birthCity}
                      onChange={(e) => setBirthCity(e.target.value)}
                      onFocus={() => setActiveField('Birth city')}
                      placeholder="Istanbul, Paris, New York"
                      className="holo-input flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && handleGeocodeBirthPlace()}
                    />
                    <button
                      type="button"
                      onClick={handleGeocodeBirthPlace}
                      disabled={loadingLocation}
                      className="btn-core btn-secondary min-w-[12rem]"
                    >
                      {loadingLocation ? (
                        <span className="flex items-center gap-3">
                          <span className="scan-loader"><span className="scan-loader__beam" /></span>
                          <span>Scanning...</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Navigation size={16} /> Acquire coordinates
                        </span>
                      )}
                    </button>
                  </div>
                  <p className="text-[0.7rem] tracking-[0.06em] text-ink-faint">
                    Coordinates auto-populate from your observation location when available.
                  </p>
                </div>
              </div>

              <div>
                <label className="hud-label">
                  <Navigation size={14} /> Latitude
                </label>
                <input
                  type="number"
                  value={birthLat}
                  onChange={(e) => setBirthLat(e.target.value)}
                  onFocus={() => setActiveField('Latitude')}
                  step="0.000001"
                  placeholder="Auto-filled from city"
                  className="holo-input"
                />
              </div>

              <div>
                <label className="hud-label">
                  <Navigation size={14} /> Longitude
                </label>
                <input
                  type="number"
                  value={birthLon}
                  onChange={(e) => setBirthLon(e.target.value)}
                  onFocus={() => setActiveField('Longitude')}
                  step="0.000001"
                  placeholder="Auto-filled from city"
                  className="holo-input"
                />
              </div>

              <div>
                <label className="hud-label">
                  <Globe2 size={14} /> Timezone (IANA)
                </label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  onFocus={() => setActiveField('Timezone')}
                  placeholder="Europe/Istanbul"
                  className="holo-input"
                />
              </div>

              <div>
                <label className="hud-label">
                  <SatelliteDish size={14} /> House system
                </label>
                <select
                  value={houseSystem}
                  onChange={(e) => setHouseSystem(e.target.value)}
                  onFocus={() => setActiveField('House system')}
                  className="holo-input"
                >
                  {houseSystems.map((system) => (
                    <option key={system} value={system} className="bg-slate-900">
                      {system}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="hud-divider" />

            <div className="terminal-actions">
              <button
                type="button"
                onClick={handleCalculate}
                disabled={loading || loadingCommentary}
                className="btn-core btn-primary"
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <span className="scan-loader"><span className="scan-loader__beam" /></span>
                    <span>Calculating chart</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Stars size={18} /> Calculate chart
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={handleGenerateCommentary}
                disabled={loading || loadingCommentary}
                className="btn-core btn-amber"
              >
                {loadingCommentary ? (
                  <span className="flex items-center gap-3">
                    <span className="scan-loader"><span className="scan-loader__beam" /></span>
                    <span>Gemini analyzing</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles size={18} /> Star Reading
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="alert-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-200">System alert</p>
          <p className="mt-2 text-sm text-red-100/90">{error}</p>
        </div>
      )}

      <GeminiDataStream commentary={commentary} isLoading={loadingCommentary} />

      {chart && (
        <section className="space-y-8">
          <div className="chart-shell">
            <div className="chart-shell__header">
              <h3 className="text-lg font-semibold tracking-[0.08em] title-sun">
                BIRTH CHART
              </h3>
            </div>
            <BirthChartVisualization chart={chart} />
          </div>

          <div className="chart-callout md:grid-cols-2">
            <article className="chart-callout__card">
              <h4 className="text-sm uppercase tracking-[0.12em] text-violet-soft">Ascendant</h4>
              <p className="mt-2 text-2xl font-semibold text-ink-title">{chart.ascendant_formatted}</p>
              <p className="mt-1 text-sm text-ink-muted">
                Primary interface with the external world and immediate response pattern.
              </p>
            </article>
            <article className="chart-callout__card">
              <h4 className="text-sm uppercase tracking-[0.12em] text-violet-soft">Midheaven</h4>
              <p className="mt-2 text-2xl font-semibold text-ink-title">{chart.midheaven_formatted}</p>
              <p className="mt-1 text-sm text-ink-muted">
                Professional trajectory, public presence, and legacy orientation.
              </p>
            </article>
          </div>

          <div className="table-scroll">
            <table className="chart-table">
              <thead>
                <tr>
                  <th>Planet</th>
                  <th>Position</th>
                  <th>House</th>
                </tr>
              </thead>
              <tbody>
                {chart.planet_positions.map((planet) => (
                  <tr key={planet.name}>
                    <td className="font-semibold uppercase tracking-[0.18em]">{planet.name}</td>
                    <td>{planet.formatted}</td>
                    <td>House {planet.house}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {chart.aspects.length > 0 && (
            <div className="table-scroll">
              <table className="chart-table">
                <thead>
                  <tr>
                    <th>Aspect pair</th>
                    <th>Aspect</th>
                    <th>Orb</th>
                  </tr>
                </thead>
                <tbody>
                  {chart.aspects.map((aspect, idx) => (
                    <tr key={`${aspect.planet1}-${aspect.planet2}-${idx}`}>
                      <td>
                        {aspect.planet1} · {aspect.planet2}
                      </td>
                      <td className="font-semibold text-violet-soft">{aspect.type}</td>
                      <td className="text-sm text-ink-muted">{aspect.orb}°</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

