#!/usr/bin/env python3
"""
Reload constellation lines only
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.catalog_loader import load_constellation_lines

if __name__ == "__main__":
    print("=" * 60)
    print("Reloading Constellation Lines")
    print("=" * 60)
    
    try:
        load_constellation_lines()
        print("=" * 60)
        print("[OK] Constellation lines loaded!")
        print("=" * 60)
    except Exception as e:
        print(f"[ERROR] Failed: {e}")
        import traceback
        traceback.print_exc()

