#!/usr/bin/env python3
"""Rebuild tle.js from a CelesTrak TLE file plus SATCAT for owner country.
Usage: python3 build_tle.py active.tle satcat.csv
satcat.csv: https://celestrak.org/pub/satcat.csv"""
import json, sys, datetime, csv
src = sys.argv[1] if len(sys.argv) > 1 else 'active.tle'
cat = sys.argv[2] if len(sys.argv) > 2 else 'satcat.csv'
owner = {}
try:
    for r in csv.DictReader(open(cat)):
        try: owner[int(r['NORAD_CAT_ID'])] = r['OWNER']
        except ValueError: pass
except FileNotFoundError:
    print('no satcat.csv; owner column will be blank')
lines = [l.rstrip('\n') for l in open(src)]
out = []
for i in range(0, len(lines) - 2, 3):
    n, l1, l2 = lines[i].strip(), lines[i+1], lines[i+2]
    if l1.startswith('1 ') and l2.startswith('2 '):
        out.append([n, l1, l2, owner.get(int(l1[2:7]), '')])
stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
with open('tle.js', 'w') as f:
    f.write('window.TLE_DATA=' + json.dumps(out, separators=(',', ':')) + ';window.TLE_UPDATED="' + stamp + '";')
print(f'{len(out)} satellites written to tle.js, stamped {stamp}')
