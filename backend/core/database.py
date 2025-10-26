"""
Database initialization and connection management
"""
import sqlite3
import os
from pathlib import Path
from typing import Optional

from core.config import get_settings


settings = get_settings()


def get_db_connection() -> sqlite3.Connection:
    """Get database connection with row factory"""
    conn = sqlite3.connect(settings.database_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_database():
    """Initialize database with required tables and indexes"""
    db_path = Path(settings.database_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Hipparcos Catalog Table (for search and calculations)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hipparcos (
            hip_id INTEGER PRIMARY KEY,
            ra REAL NOT NULL,
            dec REAL NOT NULL,
            vmag REAL,
            parallax REAL,
            proper_name TEXT,
            bayer_designation TEXT,
            constellation TEXT
        )
    """)
    
    # Bright Star Catalog Table (for map rendering)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS bright_stars (
            bsc_id INTEGER PRIMARY KEY,
            hip_id INTEGER,
            ra REAL NOT NULL,
            dec REAL NOT NULL,
            vmag REAL NOT NULL,
            name TEXT,
            FOREIGN KEY (hip_id) REFERENCES hipparcos(hip_id)
        )
    """)
    
    # Common Names Table (for easy search)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS star_names (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            common_name TEXT NOT NULL,
            hip_id INTEGER NOT NULL,
            FOREIGN KEY (hip_id) REFERENCES hipparcos(hip_id)
        )
    """)
    
    # Constellation Lines Table (from Stellarium)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS constellation_lines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            constellation TEXT NOT NULL,
            hip_id_1 INTEGER NOT NULL,
            hip_id_2 INTEGER NOT NULL,
            FOREIGN KEY (hip_id_1) REFERENCES hipparcos(hip_id),
            FOREIGN KEY (hip_id_2) REFERENCES hipparcos(hip_id)
        )
    """)
    
    # Create indexes for fast lookups
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_hip_vmag ON hipparcos(vmag)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_hip_name ON hipparcos(proper_name)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_bsc_vmag ON bright_stars(vmag)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_star_names ON star_names(common_name)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_const_lines ON constellation_lines(constellation)")
    
    conn.commit()
    conn.close()
    
    print(f"Database initialized at: {settings.database_path}")


def check_catalog_loaded() -> bool:
    """Check if catalogs are loaded in database"""
    if not os.path.exists(settings.database_path):
        return False
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM hipparcos")
    hip_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM bright_stars")
    bsc_count = cursor.fetchone()[0]
    
    conn.close()
    
    return hip_count > 0 and bsc_count > 0

