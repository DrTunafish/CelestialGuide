#!/usr/bin/env python3
"""
Load only BSC catalog
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.catalog_loader import download_bright_star_catalog, load_bright_stars_to_db

print("=" * 60)
print("Loading Bright Star Catalog ONLY")
print("=" * 60)

try:
    # Download if not exists
    csv_path = "./data/raw/bright_stars.csv"
    
    if not os.path.exists(csv_path):
        print("Downloading BSC from VizieR...")
        download_bright_star_catalog()
    else:
        print(f"Using existing: {csv_path}")
    
    # Load into database
    print("Loading BSC into database...")
    load_bright_stars_to_db(csv_path)
    
    print("=" * 60)
    print("[OK] BSC loaded successfully!")
    print("=" * 60)
    
except Exception as e:
    print(f"[ERROR] Failed: {e}")
    import traceback
    traceback.print_exc()

