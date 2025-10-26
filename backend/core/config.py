"""
Configuration management using environment variables
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""
    
    # API Keys
    opencage_api_key: str = ""
    openweathermap_api_key: str = ""
    light_pollution_map_api_key: str = ""
    gemini_api_key: str = ""
    
    # Database
    database_path: str = "./data/celestial.db"
    
    # Cache
    cache_ttl_seconds: int = 3600
    
    # Astronomical Settings
    max_magnitude: float = 6.0
    min_altitude: float = 0.0
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

