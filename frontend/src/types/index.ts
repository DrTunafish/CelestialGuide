// Type definitions for CelestialGuide Pro

export interface Location {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  formatted_address: string;
  elevation?: number;
}

export interface WeatherData {
  temperature_c: number;
  humidity: number;
  cloud_cover: number;
  description: string;
  conditions: string;
}

export interface LightPollutionData {
  bortle_scale: number;
  brightness: number;
  description: string;
}

export interface EnvironmentalData {
  location: Location;
  weather: WeatherData;
  light_pollution: LightPollutionData;
  observation_quality: string;
}

export interface StarSearchResult {
  name: string;
  hip_id: number | null;
  ra: number;
  dec: number;
  altitude: number;
  azimuth: number;
  magnitude: number;
  is_visible: boolean;
  distance_pc: number | null;
  description: string;
}

export interface StarMapResponse {
  image_base64: string;
  stars_visible: number;
  sun_altitude: number;
  moon_altitude: number;
  moon_illumination: number;
}

export interface ObservationTarget {
  name: string;
  hip_id: number | null;
  altitude: number;
  azimuth: number;
  magnitude: number;
  is_visible: boolean;
}

// Astrology Types
export interface PlanetPosition {
  name: string;
  degree: number;
  sign: string;
  degree_in_sign: number;
  house: number;
  formatted: string;
}

export interface HouseCusp {
  house: number;
  degree: number;
  sign: string;
  degree_in_sign: number;
}

export interface Aspect {
  planet1: string;
  planet2: string;
  type: string;
  angle: number;
  orb: number;
  applying: boolean;
}

export interface NatalChart {
  ascendant_degree: number;
  ascendant_sign: string;
  ascendant_formatted: string;
  midheaven_degree: number;
  midheaven_sign: string;
  midheaven_formatted: string;
  house_system: string;
  house_cusps: HouseCusp[];
  planet_positions: PlanetPosition[];
  aspects: Aspect[];
  birth_info: {
    datetime: string;
    timezone: string;
    latitude: number;
    longitude: number;
  };
}

export interface TransitEvent {
  date: string;
  event: string;
  description?: string;
}

export interface AICommentaryResponse {
  commentary_text: string;
  chart_data: NatalChart;
  model: string;
  sections: string[];
}

// Astrophotography Types
export interface AstrophotographyRequest {
  target: string;
  latitude: number;
  longitude: number;
  date: string;
  min_altitude?: number;
  max_cloud_cover?: number;
}

export interface TimelinePoint {
  time_utc: string;
  altitude: number;
  azimuth: number;
  moon_separation: number;
  moon_altitude: number;
  sun_altitude: number;
  quality_score: number;
}

export interface AstrophotographyResponse {
  target_name: string;
  target_id: string;
  best_time_utc: string | null;
  best_time_local: string | null;
  altitude: number | null;
  azimuth: number | null;
  moon_phase: string;
  moon_illumination: number;
  moon_separation: number | null;
  sun_altitude: number | null;
  transit_time: string | null;
  astronomical_night_start: string | null;
  astronomical_night_end: string | null;
  recommendation: string;
  quality_score: number | null;
  timeline: TimelinePoint[];
}

export interface DeepSkyTarget {
  id: string;
  name: string;
  type: string;
  magnitude: number | null;
}

// Solar & Lunar Events Types
export interface SolarEventsRequest {
  latitude: number;
  longitude: number;
  start_date: string;
  days?: number;
}

export interface DayEvents {
  date: string;
  sunrise: string | null;
  sunset: string | null;
  solar_noon: string | null;
  golden_hour_morning_start: string | null;
  golden_hour_morning_end: string | null;
  golden_hour_evening_start: string | null;
  golden_hour_evening_end: string | null;
  blue_hour_morning_start: string | null;
  blue_hour_morning_end: string | null;
  blue_hour_evening_start: string | null;
  blue_hour_evening_end: string | null;
  astronomical_twilight_begin: string | null;
  astronomical_twilight_end: string | null;
  nautical_twilight_begin: string | null;
  nautical_twilight_end: string | null;
  civil_twilight_begin: string | null;
  civil_twilight_end: string | null;
  moonrise: string | null;
  moonset: string | null;
  moon_phase: string;
  moon_illumination: number;
  day_length_hours: number | null;
}

export interface SolarEventsResponse {
  events: DayEvents[];
  location: {
    latitude: number;
    longitude: number;
  };
}

