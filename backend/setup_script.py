#!/usr/bin/env python3
"""
CelestialGuide Pro - Complete Setup Script
Initializes database and loads all astronomical catalogs
"""
import sys
import os
from pathlib import Path

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.database import init_database, check_catalog_loaded
from core.catalog_loader import initialize_all_catalogs


def main():
    """Run complete setup"""
    print("=" * 70)
    print("CelestialGuide Pro - Complete Setup")
    print("=" * 70)
    print()
    
    # Step 1: Initialize database structure
    print("Step 1: Initializing database...")
    try:
        init_database()
        print("[OK] Database structure created successfully")
    except Exception as e:
        print(f"[ERROR] Database initialization failed: {e}")
        sys.exit(1)
    
    print()
    
    # Step 2: Check if catalogs are already loaded
    if check_catalog_loaded():
        print("Catalogs are already loaded in the database.")
        response = input("Do you want to reload catalogs? (y/N): ").strip().lower()
        if response != 'y':
            print("Setup complete!")
            sys.exit(0)
    
    # Step 3: Download and load catalogs
    print("Step 2: Downloading and loading astronomical catalogs...")
    print("This may take several minutes...")
    print()
    
    try:
        initialize_all_catalogs()
    except Exception as e:
        print(f"[ERROR] Catalog loading failed: {e}")
        print("\nTroubleshooting:")
        print("1. Check your internet connection")
        print("2. Ensure you have write permissions in the data/ directory")
        print("3. Try running the script again")
        sys.exit(1)
    
    print()
    print("=" * 70)
    print("[OK] Setup Complete!")
    print("=" * 70)
    print()
    print("Next steps:")
    print("1. Configure your .env file with API keys")
    print("2. Run 'python main.py' to start the backend server")
    print("3. Access API documentation at http://localhost:8000/docs")
    print()


if __name__ == "__main__":
    main()

