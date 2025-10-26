#!/usr/bin/env python3
"""
Reload Bright Star Catalog with ALL stars (no magnitude filter)
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.catalog_loader import load_bright_stars_to_db

if __name__ == "__main__":
    print("=" * 60)
    print("Reloading Bright Star Catalog (Full)")
    print("=" * 60)
    
    csv_path = "./data/raw/bright_stars.csv"
    
    if not os.path.exists(csv_path):
        print(f"ERROR: {csv_path} not found!")
        print("Please run setup_script.py first to download catalogs.")
        sys.exit(1)
    
    load_bright_stars_to_db(csv_path)
    
    print("=" * 60)
    print("[OK] BSC reload complete!")
    print("=" * 60)

