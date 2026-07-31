import { CloudSun, Droplets, Eye, Wind, Award, Calendar } from 'lucide-react';
import CelestialLoader from './CelestialLoader';
import type { Location, EnvironmentalData } from '../types';

interface WeatherTabProps {
  location: Location | null;
  environmentalData: EnvironmentalData | null;
  selectedDate: string;
}

export default function WeatherTab({ location, environmentalData, selectedDate }: WeatherTabProps) {
  if (!location) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="badge badge--warning">
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
          <div className="rounded-[0.95rem] p-8 text-center bg-night-raised/60 border border-[rgba(147,164,186,0.14)]">
            <CelestialLoader variant="radar" label="Loading atmospheric data" />
          </div>
        </div>
      </div>
    );
  }

  const { weather, light_pollution, observation_quality } = environmentalData;

  const getQualityTone = (quality: string) => {
    if (quality.includes('Excellent') || quality.includes('Good')) return 'badge badge--success';
    if (quality.includes('Fair')) return 'badge badge--warning';
    return 'badge badge--danger';
  };

  const getBortleColor = (bortle: number) => {
    if (bortle <= 3) return 'text-aurora-soft';
    if (bortle <= 5) return 'text-gold-soft';
    if (bortle <= 7) return 'text-gold-celestial';
    return 'text-alert-dangerSoft';
  };

  const getCloudColor = (cloudCover: number) => {
    if (cloudCover < 10) return 'text-aurora-soft';
    if (cloudCover < 30) return 'text-violet-soft';
    if (cloudCover < 60) return 'text-gold-soft';
    if (cloudCover < 80) return 'text-gold-celestial';
    return 'text-alert-dangerSoft';
  };

  const displayDate = new Date(selectedDate).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="card">
        <div className="flex items-center space-x-3 text-ink-muted">
          <span className="icon-orb">
            <Calendar size={20} />
          </span>
          <div>
            <span className="hud-label mb-0">Weather forecast for</span>
            <p className="text-lg font-semibold text-ink-title">{displayDate}</p>
          </div>
        </div>
      </div>

      <div className="card is-selected">
        <div className="flex items-center space-x-4">
          <span className="icon-orb">
            <Award size={28} />
          </span>
          <div>
            <h2 className="text-2xl font-semibold title-sun mb-2">Observation Quality</h2>
            <span className={getQualityTone(observation_quality)}>{observation_quality}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2 title-sun">
            <CloudSun className="text-sun" />
            <span>Weather Conditions</span>
          </h3>

          <div className="space-y-4">
            <div className="data-block">
              <div className="flex items-center justify-between mb-2">
                <span className="text-ink-muted text-sm">Temperature</span>
                <Wind size={18} className="text-ink-faint" />
              </div>
              <p className="text-3xl font-semibold text-violet-soft">
                {weather.temperature_c.toFixed(1)}°C
              </p>
              <p className="text-xs text-ink-muted mt-1">{weather.description}</p>
            </div>

            <div className="data-block">
              <div className="flex items-center justify-between mb-2">
                <span className="text-ink-muted text-sm">Cloud Cover</span>
                <CloudSun size={18} className="text-ink-faint" />
              </div>
              <p className={`text-3xl font-semibold ${getCloudColor(weather.cloud_cover)}`}>
                {weather.cloud_cover}%
              </p>
              <p className="text-xs text-ink-muted mt-1">{weather.conditions}</p>
            </div>

            <div className="data-block">
              <div className="flex items-center justify-between mb-2">
                <span className="text-ink-muted text-sm">Humidity</span>
                <Droplets size={18} className="text-ink-faint" />
              </div>
              <p className="text-3xl font-semibold text-ink-title">{weather.humidity}%</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2 title-sun">
            <Eye className="text-sun" />
            <span>Light Pollution</span>
          </h3>

          <div className="space-y-4">
            <div className="data-block">
              <div className="flex items-center justify-between mb-2">
                <span className="text-ink-muted text-sm">Bortle Scale</span>
              </div>
              <p className={`text-5xl font-semibold ${getBortleColor(light_pollution.bortle_scale)}`}>
                {light_pollution.bortle_scale.toFixed(1)}
              </p>
              <p className="text-sm text-ink-body mt-2">{light_pollution.description}</p>
            </div>

            <div className="data-block">
              <div className="flex items-center justify-between mb-2">
                <span className="text-ink-muted text-sm">Sky Brightness</span>
              </div>
              <p className="text-3xl font-semibold text-violet-soft">
                {light_pollution.brightness.toFixed(2)}
              </p>
              <p className="text-xs text-ink-muted mt-1">mag/arcsec²</p>
            </div>

            <div className="rounded-[0.95rem] border border-[rgba(147,164,186,0.14)] bg-night/65 p-3">
              <p className="hud-label">Bortle scale guide</p>
              <div className="text-xs text-ink-muted space-y-1">
                <p><span className="text-aurora-soft">1–3:</span> Excellent dark sky</p>
                <p><span className="text-gold-soft">4–5:</span> Rural / suburban</p>
                <p><span className="text-gold-celestial">6–7:</span> Suburban / city</p>
                <p><span className="text-alert-dangerSoft">8–9:</span> Urban / inner city</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-xl font-semibold mb-4 text-ink-title">Observation Recommendations</h3>
        <div className="space-y-3 text-sm">
          {weather.cloud_cover < 30 && (
            <div className="flex items-start space-x-2 text-aurora-soft">
              <span>✓</span>
              <p>Clear skies — excellent conditions for observation</p>
            </div>
          )}
          {weather.cloud_cover >= 30 && weather.cloud_cover < 60 && (
            <div className="flex items-start space-x-2 text-gold-soft">
              <span>⚠</span>
              <p>Partly cloudy — observation possible but may be interrupted</p>
            </div>
          )}
          {weather.cloud_cover >= 60 && (
            <div className="flex items-start space-x-2 text-alert-dangerSoft">
              <span>✗</span>
              <p>Heavy cloud cover — not recommended for observation</p>
            </div>
          )}

          {light_pollution.bortle_scale <= 3 && (
            <div className="flex items-start space-x-2 text-aurora-soft">
              <span>✓</span>
              <p>Excellent dark sky — ideal for deep sky objects and faint targets</p>
            </div>
          )}
          {light_pollution.bortle_scale > 3 && light_pollution.bortle_scale <= 5 && (
            <div className="flex items-start space-x-2 text-gold-soft">
              <span>⚠</span>
              <p>Moderate light pollution — bright stars and planets visible, deep sky objects challenging</p>
            </div>
          )}
          {light_pollution.bortle_scale > 5 && (
            <div className="flex items-start space-x-2 text-gold-celestial">
              <span>⚠</span>
              <p>Significant light pollution — focus on bright objects (Moon, planets, bright stars)</p>
            </div>
          )}

          {weather.temperature_c < 0 && (
            <div className="flex items-start space-x-2 text-soft-blue">
              <span>❄</span>
              <p>Cold conditions — dress warmly and protect equipment from condensation</p>
            </div>
          )}
          {weather.temperature_c > 30 && (
            <div className="flex items-start space-x-2 text-gold-celestial">
              <span>☀</span>
              <p>Hot conditions — stay hydrated and watch for heat shimmer</p>
            </div>
          )}

          {weather.humidity > 80 && (
            <div className="flex items-start space-x-2 text-soft-blue">
              <span>💧</span>
              <p>High humidity — use dew shields and watch for lens fogging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
