import { useState, useEffect, type CSSProperties } from 'react';
import { MapPin, Search, Map, CloudSun, Stars, Camera, Sunrise, Gauge } from 'lucide-react';
import Header from './components/Header';
import StarfieldBackground from './components/StarfieldBackground';
import LocationTab from './components/LocationTab';
import SearchTab from './components/SearchTab';
import SkyMapTab from './components/SkyMapTab';
import WeatherTab from './components/WeatherTab';
import AstrologyTab from './components/AstrologyTab';
import AstrophotographyTab from './components/AstrophotographyTab';
import SolarEventsTab from './components/SolarEventsTab';
import { bindScrollReveal } from './hooks/useScrollReveal';
import type { Location, EnvironmentalData } from './types';

type Tab = 'location' | 'search' | 'skymap' | 'weather' | 'astrology' | 'astrophotography' | 'solar-events';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('location');
  const [location, setLocation] = useState<Location | null>(null);
  const [environmentalData, setEnvironmentalData] = useState<EnvironmentalData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [observationTime, setObservationTime] = useState<string>(new Date().toISOString());

  const getObservationTimeFromDate = (dateStr: string): string => {
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) {
      return new Date().toISOString();
    }
    const date = new Date(dateStr + 'T12:00:00Z');
    return date.toISOString();
  };

  useEffect(() => {
    setObservationTime(getObservationTimeFromDate(selectedDate));
  }, [selectedDate]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate === today) {
      const interval = setInterval(() => {
        setObservationTime(new Date().toISOString());
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [selectedDate]);

  useEffect(() => {
    const cleanup = bindScrollReveal(document);
    return cleanup;
  }, [activeTab]);

  const tabs = [
    { id: 'location' as Tab, label: 'Location & Date', shortLabel: 'Location', icon: MapPin, hint: 'Set coordinates and observation time' },
    { id: 'search' as Tab, label: 'Star Search', shortLabel: 'Search', icon: Search, hint: 'Query stellar catalogues' },
    { id: 'skymap' as Tab, label: 'Sky Map', shortLabel: 'Sky Map', icon: Map, hint: 'Render sky maps' },
    { id: 'astrophotography' as Tab, label: 'Astrophotography', shortLabel: 'Astro', icon: Camera, hint: 'Plan capture windows' },
    { id: 'solar-events' as Tab, label: 'Solar & Lunar', shortLabel: 'Solar', icon: Sunrise, hint: 'Sun and moon timelines' },
    { id: 'weather' as Tab, label: 'Weather Conditions', shortLabel: 'Weather', icon: CloudSun, hint: 'Atmospheric conditions' },
    { id: 'astrology' as Tab, label: 'Star Reading', shortLabel: 'Reading', icon: Stars, hint: 'Natal charts and readings' },
  ];

  return (
    <div className="app-shell">
      <div className="app-shell__background">
        <StarfieldBackground />
      </div>

      <Header
        location={location}
        environmentalData={environmentalData}
        observationTime={observationTime}
      />

      <main className="mission-layout">
        <nav className="mission-nav" data-reveal>
          <div className="mission-nav__panel glass">
            <div className="mission-nav__label mission-nav__label--desktop">Observation Deck</div>
            <div className="mission-nav__grid" role="tablist" aria-label="Main sections">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(tab.id)}
                    className={`mission-nav__button ${isActive ? 'mission-nav__button--active' : ''}`}
                    title={tab.hint}
                    style={{ '--reveal-delay': `${index * 40}ms` } as CSSProperties}
                  >
                    <span className="mission-nav__icon">
                      <Icon size={20} />
                    </span>
                    <span className="mission-nav__copy">
                      <span className="mission-nav__text-full">{tab.label}</span>
                      <span className="mission-nav__text-short">{tab.shortLabel}</span>
                      <span className="mission-nav__hint">{tab.hint}</span>
                    </span>
                  </button>
                );
              })}
              <div className="mission-nav__status">
                <Gauge size={16} className="text-aurora-teal" />
                <span className="text-aurora-soft">Ready</span>
              </div>
            </div>
          </div>
        </nav>

        <section className="mission-stage" data-reveal="slow" key={activeTab}>
          {activeTab === 'location' && (
            <LocationTab
              location={location}
              setLocation={setLocation}
              setEnvironmentalData={setEnvironmentalData}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          )}
          {activeTab === 'search' && (
            <SearchTab
              location={location}
              observationTime={observationTime}
            />
          )}
          {activeTab === 'skymap' && (
            <SkyMapTab
              location={location}
              observationTime={observationTime}
            />
          )}
          {activeTab === 'weather' && (
            <WeatherTab
              location={location}
              environmentalData={environmentalData}
              selectedDate={selectedDate}
            />
          )}
          {activeTab === 'astrology' && <AstrologyTab location={location} />}
          {activeTab === 'astrophotography' && (
            <AstrophotographyTab location={location} selectedDate={selectedDate} />
          )}
          {activeTab === 'solar-events' && (
            <SolarEventsTab location={location} selectedDate={selectedDate} />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
