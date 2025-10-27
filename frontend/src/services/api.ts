// API service for backend communication

import axios from 'axios';
import type {
  Location,
  EnvironmentalData,
  StarSearchResult,
  StarMapResponse,
  NatalChart,
  TransitEvent,
  AICommentaryResponse,
  AstrophotographyRequest,
  AstrophotographyResponse,
  DeepSkyTarget,
  SolarEventsRequest,
  SolarEventsResponse,
} from '../types';

// API Base URL - Using Cloudflare tunnel for backend connection
const API_BASE_URL = 'https://portal-richard-tribunal-accomplish.trycloudflare.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000, // 90 seconds for sky map generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Location & Environmental Data
export const geocodeLocation = async (city: string, country?: string): Promise<Location> => {
  const response = await api.post('/environment/geocode', { city, country });
  return response.data;
};

export const getWeather = async (latitude: number, longitude: number) => {
  const response = await api.get('/environment/weather', {
    params: { latitude, longitude },
  });
  return response.data;
};

export const getLightPollution = async (latitude: number, longitude: number) => {
  const response = await api.get('/environment/light-pollution', {
    params: { latitude, longitude },
  });
  return response.data;
};

export const getCompleteEnvironmentalData = async (
  latitude: number,
  longitude: number,
  city?: string
): Promise<EnvironmentalData> => {
  const response = await api.get('/environment/complete', {
    params: { latitude, longitude, city },
  });
  return response.data;
};

// Star Search
export const searchStar = async (
  query: string,
  latitude: number,
  longitude: number,
  datetime_utc?: string,
  elevation: number = 0
): Promise<StarSearchResult> => {
  const response = await api.post('/star/search', {
    query,
    latitude,
    longitude,
    datetime_utc,
    elevation,
  });
  return response.data;
};

export const searchCatalog = async (query: string, limit: number = 10) => {
  const response = await api.get('/star/catalog/search', {
    params: { query, limit },
  });
  return response.data;
};

// Star Map
export const generateStarMap = async (
  latitude: number,
  longitude: number,
  datetime_utc?: string,
  elevation: number = 0,
  show_constellations: boolean = true,
  show_labels: boolean = true,
  fov_center_ra?: number,
  fov_center_dec?: number,
  fov_radius?: number
): Promise<StarMapResponse> => {
  const response = await api.post('/map/generate', {
    latitude,
    longitude,
    datetime_utc,
    elevation,
    show_constellations,
    show_labels,
    fov_center_ra,
    fov_center_dec,
    fov_radius,
  });
  return response.data;
};

export const downloadStarMap = async (
  latitude: number,
  longitude: number,
  datetime_utc?: string
): Promise<Blob> => {
  const response = await api.post(
    '/map/download',
    {
      latitude,
      longitude,
      datetime_utc,
      show_constellations: true,
      show_labels: true,
    },
    { responseType: 'blob' }
  );
  return response.data;
};

// PDF Export
export const generateObservationPDF = async (data: {
  location_data: any;
  weather_data: any;
  light_pollution_data: any;
  target_stars: any[];
  star_map_base64?: string;
  observation_notes?: string;
}): Promise<Blob> => {
  const response = await api.post('/pdf/generate', data, {
    responseType: 'blob',
  });
  return response.data;
};

// Astrology
export const calculateNatalChart = async (data: {
  datetime: string;
  lat: number;
  lon: number;
  tz_name: string;
  house_system?: string;
}): Promise<NatalChart> => {
  const response = await api.post('/astrology/natal-chart', data);
  return response.data;
};

export const getTransitDates = async (
  start_date: string,
  end_date: string
): Promise<TransitEvent[]> => {
  const response = await api.get('/astrology/transit-dates', {
    params: { start_date, end_date },
  });
  return response.data;
};

export const getHouseSystems = async () => {
  const response = await api.get('/astrology/house-systems');
  return response.data;
};

export const getDeepCommentary = async (data: {
  datetime: string;
  lat: number;
  lon: number;
  tz_name: string;
  house_system?: string;
}): Promise<AICommentaryResponse> => {
  const response = await api.post('/astrology/commentary/deep', data);
  return response.data;
};

// Astrophotography
export const calculateAstrophotography = async (
  data: AstrophotographyRequest
): Promise<AstrophotographyResponse> => {
  const response = await api.post('/astrophotography/calculate', data);
  return response.data;
};

export const getAstrophotographyTargets = async (): Promise<{ targets: DeepSkyTarget[] }> => {
  const response = await api.get('/astrophotography/targets');
  return response.data;
};

// Solar & Lunar Events
export const calculateSolarEvents = async (
  data: SolarEventsRequest
): Promise<SolarEventsResponse> => {
  const response = await api.post('/solar-events/calculate', data);
  return response.data;
};

export default api;

