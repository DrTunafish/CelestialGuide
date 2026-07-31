import { Telescope, MapPin, Activity, ThermometerSun } from 'lucide-react';
import type { Location, EnvironmentalData } from '../types';

interface HeaderProps {
  location: Location | null;
  environmentalData: EnvironmentalData | null;
  observationTime: string;
}

const formatObservationTime = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
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
            <Telescope size={28} />
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
              <MapPin size={14} className="text-soft-blue" /> Active coordinates
            </div>
            <div className="telemetry-value">
              {location
                ? `${location.latitude.toFixed(3)}° / ${location.longitude.toFixed(3)}°`
                : 'Awaiting lock'}
            </div>
            <p className="text-[0.72rem] tracking-[0.08em] text-ink-faint mt-2">
              {location ? location.formatted_address || location.city : 'No primary site selected'}
            </p>
          </div>

          <div className="telemetry-card">
            <div className="telemetry-label flex items-center gap-2">
              <Activity size={14} className="text-soft-blue" /> Observation clock
            </div>
            <div className="telemetry-value">{formatObservationTime(observationTime)}</div>
            <p className="text-[0.72rem] tracking-[0.08em] text-ink-faint mt-2">
              Synchronized to UTC reference frame
            </p>
          </div>

          <div className="telemetry-card">
            <div className="telemetry-label flex items-center gap-2">
              <ThermometerSun size={14} className="text-soft-blue" /> Site conditions
            </div>
            {environmentalData ? (
              <div className="space-y-2 text-sm text-ink-body mt-1">
                <div>
                  Temp {environmentalData.weather.temperature_c.toFixed(1)}°C · Cloud{' '}
                  {environmentalData.weather.cloud_cover}%
                </div>
                <span className={resolveBortleTone(environmentalData.light_pollution.bortle_scale)}>
                  Bortle {environmentalData.light_pollution.bortle_scale.toFixed(1)} ·{' '}
                  {environmentalData.light_pollution.description}
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
