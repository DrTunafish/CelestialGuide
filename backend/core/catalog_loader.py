"""
Catalog parsing and loading utilities
Converts astronomical catalogs (BSC, HIP) to SQLite database
"""
import os
import sqlite3
from pathlib import Path
from typing import Optional, Dict, List
import requests
import gzip
import pandas as pd

from astroquery.vizier import Vizier
from astropy import units as u
from astropy.coordinates import SkyCoord

from core.database import get_db_connection
from core.config import get_settings


settings = get_settings()


def download_hipparcos_catalog(output_dir: str = "./data/raw") -> str:
    """
    Download Hipparcos catalog from VizieR
    
    Returns:
        Path to downloaded catalog file
    """
    print("Downloading Hipparcos catalog from VizieR...")
    
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # Query Hipparcos catalog (I/239/hip_main)
    vizier = Vizier(columns=["HIP", "RAhms", "DEdms", "Vmag", "Plx", "RAICRS", "DEICRS"],
                    row_limit=-1)  # Get all rows
    
    catalog = vizier.get_catalogs("I/239/hip_main")[0]
    
    output_path = os.path.join(output_dir, "hipparcos.csv")
    catalog.write(output_path, format='csv', overwrite=True)
    
    print(f"Downloaded Hipparcos catalog: {len(catalog)} stars")
    return output_path


def download_bright_star_catalog(output_dir: str = "./data/raw") -> str:
    """
    Download Bright Star Catalog (Yale BSC5)
    
    Returns:
        Path to downloaded catalog file
    """
    print("Downloading Bright Star Catalog from VizieR...")
    
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # Query BSC (V/50/catalog)
    vizier = Vizier(columns=["HR", "HIP", "RAJ2000", "DEJ2000", "Vmag", "Name"],
                    row_limit=-1)
    
    catalog = vizier.get_catalogs("V/50/catalog")[0]
    
    output_path = os.path.join(output_dir, "bright_stars.csv")
    catalog.write(output_path, format='csv', overwrite=True)
    
    print(f"Downloaded Bright Star Catalog: {len(catalog)} stars")
    return output_path


def load_hipparcos_to_db(csv_path: str):
    """Load Hipparcos catalog into SQLite database"""
    print(f"Loading Hipparcos catalog from {csv_path}...")
    
    df = pd.read_csv(csv_path)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Clear existing data
    cursor.execute("DELETE FROM hipparcos")
    
    count = 0
    for _, row in df.iterrows():
        try:
            hip_id = int(row['HIP'])
            ra = float(row.get('RAICRS', row.get('RAJ2000', 0)))
            dec = float(row.get('DEICRS', row.get('DEJ2000', 0)))
            vmag = float(row['Vmag']) if pd.notna(row['Vmag']) else 99.0
            parallax = float(row['Plx']) if pd.notna(row.get('Plx')) else None
            
            # Convert RA from degrees to hours for storage
            ra_hours = ra / 15.0
            
            cursor.execute("""
                INSERT OR REPLACE INTO hipparcos 
                (hip_id, ra, dec, vmag, parallax)
                VALUES (?, ?, ?, ?, ?)
            """, (hip_id, ra_hours, dec, vmag, parallax))
            
            count += 1
            
        except Exception as e:
            continue
    
    conn.commit()
    conn.close()
    
    print(f"Loaded {count} Hipparcos stars into database")


def load_bright_stars_to_db(csv_path: str):
    """Load Bright Star Catalog into SQLite database"""
    print(f"Loading Bright Star Catalog from {csv_path}...")
    
    df = pd.read_csv(csv_path)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Clear existing data
    cursor.execute("DELETE FROM bright_stars")
    
    count = 0
    for _, row in df.iterrows():
        try:
            bsc_id = int(row['HR']) if pd.notna(row.get('HR')) else count
            hip_id = int(row['HIP']) if pd.notna(row.get('HIP')) else None
            
            # Parse RA/Dec from string format (e.g., "00 05 09.9", "+45 13 45")
            from astropy.coordinates import SkyCoord
            from astropy import units as u
            
            coord = SkyCoord(
                ra=row['RAJ2000'], 
                dec=row['DEJ2000'], 
                unit=(u.hourangle, u.deg)
            )
            
            ra_hours = coord.ra.hour  # RA in hours
            dec = coord.dec.degree     # Dec in degrees
            
            vmag = float(row['Vmag']) if pd.notna(row['Vmag']) else 99.0
            name = str(row['Name']) if pd.notna(row.get('Name')) else None
            
            # Include all stars from BSC (no magnitude filter during loading)
            # Filtering will be done at map generation time for flexibility
            
            cursor.execute("""
                INSERT OR REPLACE INTO bright_stars 
                (bsc_id, hip_id, ra, dec, vmag, name)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (bsc_id, hip_id, ra_hours, dec, vmag, name))
            
            count += 1
            
        except Exception as e:
            continue
    
    conn.commit()
    conn.close()
    
    print(f"Loaded {count} bright stars into database")


def load_common_star_names():
    """Load common star names mapping to HIP IDs"""
    print("Loading common star names...")
    
    # Common star names to HIP ID mapping
    # This is a curated subset - can be expanded
    common_names = {
        "Sirius": 32349,
        "Canopus": 30438,
        "Arcturus": 69673,
        "Vega": 91262,
        "Capella": 24608,
        "Rigel": 24436,
        "Procyon": 37279,
        "Betelgeuse": 27989,
        "Altair": 97649,
        "Aldebaran": 21421,
        "Spica": 65474,
        "Antares": 80763,
        "Pollux": 37826,
        "Fomalhaut": 113368,
        "Deneb": 102098,
        "Regulus": 49669,
        "Adhara": 33579,
        "Castor": 36850,
        "Bellatrix": 25336,
        "Alnilam": 26311,
        "Alnitak": 26727,
        "Mintaka": 25930,
        "Polaris": 11767,
        "Dubhe": 54061,
        "Alkaid": 67301,
        "Mizar": 65378,
        "Alioth": 62956,
        "Megrez": 59774,
        "Phecda": 58001,
        "Merak": 53910,
    }
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM star_names")
    
    for name, hip_id in common_names.items():
        cursor.execute("""
            INSERT INTO star_names (common_name, hip_id)
            VALUES (?, ?)
        """, (name, hip_id))
    
    conn.commit()
    conn.close()
    
    print(f"Loaded {len(common_names)} common star names")


def load_constellation_lines():
    """
    Load constellation lines from comprehensive dataset
    Based on Stellarium and IAU constellation patterns
    """
    print("Loading constellation lines...")
    
    # Comprehensive constellation lines with HIP IDs
    # Format: (constellation_abbr, hip_id_1, hip_id_2)
    constellation_lines = [
        # Ursa Major (Big Dipper + body)
        ("UMa", 54061, 53910),  # Dubhe - Merak
        ("UMa", 53910, 58001),  # Merak - Phecda
        ("UMa", 58001, 59774),  # Phecda - Megrez
        ("UMa", 59774, 62956),  # Megrez - Alioth
        ("UMa", 62956, 65378),  # Alioth - Mizar
        ("UMa", 65378, 67301),  # Mizar - Alkaid
        ("UMa", 59774, 54061),  # Megrez - Dubhe (bowl)
        ("UMa", 62956, 59774),  # Body connections
        ("UMa", 54061, 62956),
        
        # Ursa Minor (Little Dipper)
        ("UMi", 11767, 82080),  # Polaris - Kochab
        ("UMi", 82080, 85822),  # Kochab - Pherkad
        ("UMi", 85822, 77055),
        ("UMi", 77055, 79822),
        ("UMi", 79822, 75097),
        ("UMi", 75097, 72607),
        ("UMi", 72607, 11767),
        
        # Orion
        ("Ori", 25930, 26311),  # Belt: Mintaka - Alnilam
        ("Ori", 26311, 26727),  # Belt: Alnilam - Alnitak
        ("Ori", 27989, 25336),  # Shoulders: Betelgeuse - Bellatrix
        ("Ori", 25336, 25930),  # Bellatrix to belt
        ("Ori", 27989, 26311),  # Betelgeuse to belt
        ("Ori", 24436, 25930),  # Feet: Rigel - Mintaka
        ("Ori", 22449, 26727),  # Saiph - Alnitak
        ("Ori", 24436, 22449),  # Rigel - Saiph
        ("Ori", 26207, 27989),  # Head
        ("Ori", 26207, 25336),
        
        # Cassiopeia (W shape)
        ("Cas", 3179, 746),
        ("Cas", 746, 21421),
        ("Cas", 21421, 542),
        ("Cas", 542, 3179),
        
        # Leo
        ("Leo", 49669, 50583),  # Regulus - Algieba
        ("Leo", 50583, 49583),
        ("Leo", 49583, 54872),  # Denebola
        ("Leo", 54872, 57632),
        ("Leo", 57632, 54879),
        ("Leo", 54879, 49669),
        
        # Cygnus (Northern Cross)
        ("Cyg", 102098, 100453),  # Deneb - Sadr
        ("Cyg", 100453, 97165),   # Sadr - Albireo
        ("Cyg", 104732, 100453),
        ("Cyg", 95947, 100453),
        
        # Lyra
        ("Lyr", 91262, 92791),  # Vega - Sheliak
        ("Lyr", 92791, 93194),
        ("Lyr", 93194, 92791),
        ("Lyr", 91971, 91926),
        
        # Aquila
        ("Aql", 97649, 97804),  # Altair center
        ("Aql", 97649, 95501),
        ("Aql", 93747, 95501),
        ("Aql", 97804, 98036),
        
        # Bootes
        ("Boo", 69673, 71075),  # Arcturus
        ("Boo", 71075, 72105),
        ("Boo", 72105, 71053),
        ("Boo", 71053, 69673),
        
        # Gemini
        ("Gem", 37826, 36850),  # Pollux - Castor
        ("Gem", 36850, 35550),
        ("Gem", 37826, 37740),
        ("Gem", 35550, 34088),
        ("Gem", 37740, 36046),
        
        # Taurus
        ("Tau", 21421, 20889),  # Aldebaran
        ("Tau", 20889, 21589),
        ("Tau", 21589, 25428),
        ("Tau", 25428, 25490),
        ("Tau", 25490, 20205),
        
        # Scorpius
        ("Sco", 80763, 78820),  # Antares
        ("Sco", 78820, 78265),
        ("Sco", 78265, 77070),
        ("Sco", 80763, 81266),
        ("Sco", 81266, 82396),
        ("Sco", 82396, 82514),
        ("Sco", 82514, 84143),
        
        # Sagittarius (Teapot)
        ("Sgr", 88635, 89341),
        ("Sgr", 89341, 90185),
        ("Sgr", 90185, 92041),
        ("Sgr", 92041, 93506),
        ("Sgr", 93506, 95347),
        ("Sgr", 95347, 96757),
        ("Sgr", 96757, 88635),
        
        # Virgo
        ("Vir", 65474, 63608),  # Spica
        ("Vir", 63608, 61941),
        ("Vir", 61941, 57380),
        ("Vir", 57380, 65474),
        
        # Pegasus (Great Square)
        ("Peg", 113881, 113963),
        ("Peg", 113963, 1067),
        ("Peg", 1067, 112158),
        ("Peg", 112158, 113881),
        
        # Andromeda
        ("And", 677, 3881),
        ("And", 3881, 5447),
        ("And", 5447, 9640),
        ("And", 9640, 677),
        
        # Perseus
        ("Per", 15863, 14328),
        ("Per", 14328, 13847),
        ("Per", 13847, 15863),
        ("Per", 15863, 17448),
        
        # Auriga
        ("Aur", 24608, 23015),  # Capella
        ("Aur", 23015, 25428),
        ("Aur", 25428, 28360),
        ("Aur", 28360, 23015),
        
        # Canis Major
        ("CMa", 32349, 33579),  # Sirius - Adhara
        ("CMa", 33579, 34444),
        ("CMa", 34444, 32349),
        ("CMa", 30324, 32349),
        
        # Canis Minor
        ("CMi", 37279, 36284),  # Procyon
        
        # Draco
        ("Dra", 87833, 85670),
        ("Dra", 85670, 94376),
        ("Dra", 94376, 97433),
        ("Dra", 97433, 68756),
        ("Dra", 68756, 61281),
        
        # Hercules
        ("Her", 84380, 86974),
        ("Her", 86974, 84345),
        ("Her", 84345, 81833),
        ("Her", 81833, 84380),
        
        # Corona Borealis
        ("CrB", 76267, 77655),
        ("CrB", 77655, 78159),
        ("CrB", 78159, 78493),
        ("CrB", 78493, 76267),
        
        # Aquarius
        ("Aqr", 110960, 112961),
        ("Aqr", 112961, 109074),
        ("Aqr", 109074, 106278),
        
        # Capricornus
        ("Cap", 100345, 102978),
        ("Cap", 102978, 104139),
        ("Cap", 104139, 106985),
        
        # Pisces
        ("Psc", 5737, 6193),
        ("Psc", 6193, 8198),
        ("Psc", 8198, 9487),
        
        # Aries
        ("Ari", 8903, 9884),
        ("Ari", 9884, 13209),
        ("Ari", 13209, 8903),
        
        # Cancer
        ("Cnc", 40526, 42806),
        ("Cnc", 42806, 43103),
        ("Cnc", 43103, 42911),
        
        # Libra
        ("Lib", 74785, 76470),
        ("Lib", 76470, 72622),
        ("Lib", 72622, 74785),
        
        # Ophiuchus
        ("Oph", 86032, 84012),
        ("Oph", 84012, 80883),
        ("Oph", 80883, 86032),
        
        # Serpens
        ("Ser", 77070, 77233),
        ("Ser", 77233, 78072),
        
        # Centaurus
        ("Cen", 71683, 68002),
        ("Cen", 68002, 66657),
        
        # Crux (Southern Cross)
        ("Cru", 60718, 62434),
        ("Cru", 59747, 61084),
    ]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM constellation_lines")
    
    for const, hip1, hip2 in constellation_lines:
        cursor.execute("""
            INSERT INTO constellation_lines (constellation, hip_id_1, hip_id_2)
            VALUES (?, ?, ?)
        """, (const, hip1, hip2))
    
    conn.commit()
    conn.close()
    
    print(f"Loaded {len(constellation_lines)} constellation lines")


def initialize_all_catalogs():
    """
    Complete catalog initialization pipeline
    Downloads and loads all required astronomical catalogs
    """
    print("=" * 60)
    print("CelestialGuide Pro - Catalog Initialization")
    print("=" * 60)
    
    try:
        # Download catalogs
        hip_path = download_hipparcos_catalog()
        bsc_path = download_bright_star_catalog()
        
        # Load into database
        load_hipparcos_to_db(hip_path)
        load_bright_stars_to_db(bsc_path)
        load_common_star_names()
        load_constellation_lines()
        
        print("=" * 60)
        print("[OK] All catalogs loaded successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"[ERROR] Error during catalog initialization: {e}")
        raise


if __name__ == "__main__":
    initialize_all_catalogs()

