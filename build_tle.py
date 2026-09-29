#!/usr/bin/env python3
"""Rebuild tle.js from a CelesTrak TLE file. Usage: python3 build_tle.py active.tle"""
import json, sys, datetime
src = sys.argv[1] if len(sys.argv) > 1 else 'active.tle'
lines = [l.rstrip('\n') for l in open(src)]
out = []
for i in range(0, len(lines) - 2, 3):
    n, l1, l2 = lines[i].strip(), lines[i+1], lines[i+2]
    if l1.startswith('1 ') and l2.startswith('2 '):
        out.append([n, l1, l2])
stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
with open('tle.js', 'w') as f:
    f.write('window.TLE_DATA=' + json.dumps(out, separators=(',', ':')) + ';window.TLE_UPDATED="' + stamp + '";')
print(f'{len(out)} satellites written to tle.js, stamped {stamp}')
