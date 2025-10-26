import sqlite3

conn = sqlite3.connect('backend/data/celestial.db')
cursor = conn.cursor()

cursor.execute('SELECT COUNT(*) FROM bright_stars')
bsc = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(*) FROM hipparcos')
hip = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(*) FROM constellation_lines')
const = cursor.fetchone()[0]

conn.close()

print("=" * 50)
print("Database Status:")
print("=" * 50)
print(f"BSC stars:          {bsc:,}")
print(f"Hipparcos stars:    {hip:,}")
print(f"Constellation lines: {const}")
print("=" * 50)

if bsc > 5000:
    print("[OK] BSC catalog loaded successfully!")
elif bsc > 0:
    print("[WARNING] BSC partially loaded, may need reload")
else:
    print("[ERROR] BSC is empty! Still loading or failed")

print("=" * 50)

