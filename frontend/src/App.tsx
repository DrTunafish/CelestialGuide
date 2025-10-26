import { useState, useEffect } from 'react';
import { MapPin, Search, Map, CloudSun, FileDown, Stars, Camera, Sunrise } from 'lucide-react';
import Header from './components/Header';
import LocationTab from './components/LocationTab';
import SearchTab from './components/SearchTab';
import SkyMapTab from './components/SkyMapTab';
import WeatherTab from './components/WeatherTab';
import AstrologyTab from './components/AstrologyTab';
import AstrophotographyTab from './components/AstrophotographyTab';
import SolarEventsTab from './components/SolarEventsTab';
import type { Location, EnvironmentalData } from './types';

type Tab = 'location' | 'search' | 'skymap' | 'weather' | 'astrology' | 'astrophotography' | 'solar-events';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('location');
  const [location, setLocation] = useState<Location | null>(null);
  const [environmentalData, setEnvironmentalData] = useState<EnvironmentalData | null>(null);
  const [observationTime, setObservationTime] = useState<string>(new Date().toISOString());

  useEffect(() => {
    // Update observation time every minute
    const interval = setInterval(() => {
      setObservationTime(new Date().toISOString());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'location' as Tab, label: 'Location', icon: MapPin },
    { id: 'search' as Tab, label: 'Search', icon: Search },
    { id: 'skymap' as Tab, label: 'Sky Map', icon: Map },
    { id: 'astrophotography' as Tab, label: 'Astrophotography', icon: Camera },
    { id: 'solar-events' as Tab, label: 'Solar & Lunar', icon: Sunrise },
    { id: 'weather' as Tab, label: 'Weather', icon: CloudSun },
    { id: 'astrology' as Tab, label: 'Astrology', icon: Stars },
  ];

  return (
    <div className="min-h-screen bg-cosmic-950 bg-galaxy">
      <Header location={location} environmentalData={environmentalData} />

      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-cosmic-500/20">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-3 px-6 py-4 transition-all duration-300 font-medium ${
                  activeTab === tab.id
                    ? 'tab-active'
                    : 'tab-inactive'
                }`}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'location' && (
            <LocationTab
              location={location}
              setLocation={setLocation}
              setEnvironmentalData={setEnvironmentalData}
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
            />
          )}
          {activeTab === 'astrology' && (
            <AstrologyTab
              location={location}
            />
          )}
          {activeTab === 'astrophotography' && (
            <AstrophotographyTab
              location={location}
            />
          )}
          {activeTab === 'solar-events' && (
            <SolarEventsTab
              location={location}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

