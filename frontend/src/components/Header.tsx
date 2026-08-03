import { Telescope, MapPin, Activity, ThermometerSun } from 'lucide-react';
import type { Location, EnvironmentalData } from '../types';

interface HeaderProps {
  location: Location | null;
  environmentalData: EnvironmentalData | null;
  observationTime: string;
}

const formatObservationTime = (timestamp: string, compact = false) => {
  try {
    const date = new Date(timestamp);
    if (compact) {
      return date.toLocaleString('en-US', {
        hour12: false,
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return date.toLocaleString('en-US', {
      hour12: false,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return 'Awaiting sync';
  }
};

const resolveBortleTone = (value: number) => {
  if (value <= 3) return 'badge badge--success';
  if (value <= 5) return 'badge badge--warning';
  if (value <= 7) return 'badge badge--warning';
  return 'badge badge--danger';
};

export default function Header({ location, environmentalData, observationTime }: HeaderProps) {
  return (
    <header className="command-header">
      <div className="command-header__inner">
        <div className="command-header__title">
          <div className="command-header__logo" aria-hidden="true">
            <Telescope className="command-header__logo-icon" size={28} />
          </div>
          <div className="command-header__primary">
            <h1 className="title-sun">
              CelestialGuide <span className="title-accent">Pro</span>
            </h1>
            <div className="command-header__sub">
              Deep-sky tools for precise observation
            </div>
          </div>
        </div>

        <div className="command-header__telemetry">
          <div className="telemetry-card">
            <div className="telemetry-label flex items-center gap-2">
              <MapPin size={14} className="text-soft-blue shrink-0" />
              <span>Coordinates</span>
            </div>
            <div className="telemetry-value">
              {location
                ? `${location.latitude.toFixed(3)}° / ${location.longitude.toFixed(3)}°`
                : 'Awaiting lock'}
            </div>
            <p className="telemetry-meta">
              {location ? location.formatted_address || location.city : 'No site selected'}
            </p>
          </div>

          <div className="telemetry-card">
            <div className="telemetry-label flex items-center gap-2">
              <Activity size={14} className="text-soft-blue shrink-0" />
              <span>Clock</span>
            </div>
            <div className="telemetry-value telemetry-value--full">
              {formatObservationTime(observationTime)}
            </div>
            <div className="telemetry-value telemetry-value--compact">
              {formatObservationTime(observationTime, true)}
            </div>
            <p className="telemetry-meta">UTC reference</p>
          </div>

          <div className="telemetry-card">
            <div className="telemetry-label flex items-center gap-2">
              <ThermometerSun size={14} className="text-soft-blue shrink-0" />
              <span>Conditions</span>
            </div>
            {environmentalData ? (
              <div className="space-y-2 text-sm text-ink-body mt-1">
                <div>
                  {environmentalData.weather.temperature_c.toFixed(1)}°C · Cloud{' '}
                  {environmentalData.weather.cloud_cover}%
                </div>
                <span className={resolveBortleTone(environmentalData.light_pollution.bortle_scale)}>
                  Bortle {environmentalData.light_pollution.bortle_scale.toFixed(1)}
                  <span className="telemetry-bortle-desc">
                    {' '}· {environmentalData.light_pollution.description}
                  </span>
                </span>
              </div>
            ) : (
              <div className="telemetry-value text-sm text-ink-faint">
                Awaiting telemetry
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
