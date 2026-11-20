#!/usr/bin/env python3
"""Refresh tle.js (the orbit data behind Overhead Now) from public sources. Run by .github/workflows/orbit-refresh.yml.

Sources, in order:
  1. CelesTrak itself: the "active" element set and the satellite catalog (owner codes).
  2. If CelesTrak does not answer: the public GitHub mirror caelo-works/tle-mirror, which copies CelesTrak every 8
     hours. Its files are checked against its own SHA256SUMS and refused if its snapshot is more than 3 days old.
The data is never edited or filled in. If neither source gives a sound catalog, tle.js is left as it was and this
exits with an error (the job fails and GitHub emails the owner).

A catalog is sound when it has 14,000 to 20,000 satellites, the ISS (NORAD 25544) is present with owner "ISS", and
the ISS elements are less than 5 days old.

window.TLE_UPDATED is the time the elements were fetched from CelesTrak: now for source 1, the mirror's own
timestamp for source 2.
(c) 2026 Randy Barnhill. All rights reserved.
"""
import datetime, hashlib, json, os, re, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {'User-Agent': 'OverheadNow-refresh/1.0 (+https://overhead-now.vercel.app)'}
CELESTRAK = {'active.tle': 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
             'satcat.csv': 'https://celestrak.org/pub/satcat.csv'}
MIRROR = 'https://raw.githubusercontent.com/caelo-works/tle-mirror/main/tle/'
MIN_SATS, MAX_SATS, MAX_ISS_AGE_DAYS, MAX_MIRROR_AGE_DAYS = 14000, 20000, 5, 3
UTC = datetime.timezone.utc


def get(url, limit=120):
    """Fetch a URL with a hard limit on the whole download. curl is used because Python's own timeout only covers each
    read, and on the first run from GitHub (Nov 20, 2026) CelesTrak held the connection open for over six minutes."""
    r = subprocess.run(['curl', '-sS', '--fail', '--location', '--connect-timeout', '20', '--max-time', str(limit),
                        '-A', UA['User-Agent'], url], capture_output=True)
    if r.returncode:
        raise IOError('no answer within %ds (%s)' % (limit, r.stderr.decode('utf-8', 'replace').strip()[:120] or 'curl exit %d' % r.returncode))
    return r.stdout


def from_celestrak(d):
    for name, url in CELESTRAK.items():
        body = get(url)
        if name == 'active.tle' and not body.lstrip().split(b'\n')[1].startswith(b'1 '):
            raise ValueError('CelesTrak did not return element sets: ' + body[:80].decode('utf-8', 'replace'))
        open(os.path.join(d, name), 'wb').write(body)
    return datetime.datetime.now(UTC).strftime('%Y-%m-%dT%H:%M:%SZ')


def from_mirror(d):
    sums = dict(reversed(l.split()) for l in get(MIRROR + 'SHA256SUMS').decode().splitlines() if l.strip())
    for name in CELESTRAK:
        body = get(MIRROR + name)
        want = sums.get(name) or sums.get('*' + name)
        if hashlib.sha256(body).hexdigest() != want:
            raise ValueError('mirror file %s does not match its checksum' % name)
        open(os.path.join(d, name), 'wb').write(body)
    stamp = get(MIRROR + 'updated.txt').decode().strip()
    when = datetime.datetime.fromisoformat(stamp.replace('Z', '+00:00'))
    age = (datetime.datetime.now(UTC) - when).total_seconds() / 86400
    if age > MAX_MIRROR_AGE_DAYS:
        raise ValueError('mirror snapshot is %.1f days old' % age)
    return when.strftime('%Y-%m-%dT%H:%M:%SZ')


def epoch(line1):
    """The date a set of elements describes (columns 19-32 of line 1: two-digit year, day of year with fraction)."""
    yy, doy = int(line1[18:20]), float(line1[20:32])
    return datetime.datetime((2000 if yy < 57 else 1900) + yy, 1, 1, tzinfo=UTC) + datetime.timedelta(days=doy - 1)


def check(text):
    m = re.match(r'window\.TLE_DATA=(\[.*\]);window\.TLE_UPDATED="([^"]+)";$', text, re.S)
    if not m:
        raise ValueError('tle.js is not in the expected shape')
    sats = json.loads(m.group(1))
    if not MIN_SATS <= len(sats) <= MAX_SATS:
        raise ValueError('%d satellites (expected %d to %d)' % (len(sats), MIN_SATS, MAX_SATS))
    iss = [s for s in sats if s[1][2:7] == '25544']
    if not iss or not iss[0][0].startswith('ISS (ZARYA)') or iss[0][3] != 'ISS':
        raise ValueError('the ISS entry is missing or mislabeled')
    age = (datetime.datetime.now(UTC) - epoch(iss[0][1])).total_seconds() / 86400
    if not -1 <= age <= MAX_ISS_AGE_DAYS:
        raise ValueError('the ISS elements are %.1f days old' % age)
    return len(sats), age


def main():
    target = os.path.join(ROOT, 'tle.js')
    old = open(target).read()
    errors = []
    for label, fetch in (('CelesTrak', from_celestrak), ('the GitHub mirror of CelesTrak', from_mirror)):
        with tempfile.TemporaryDirectory() as d:
            try:
                stamp = fetch(d)
                subprocess.run([sys.executable, os.path.join(ROOT, 'build_tle.py'), os.path.join(d, 'active.tle'),
                                os.path.join(d, 'satcat.csv')], cwd=ROOT, check=True, stdout=subprocess.DEVNULL)
                new = re.sub(r'window\.TLE_UPDATED="[^"]*"', 'window.TLE_UPDATED="%s"' % stamp, open(target).read())
                count, age = check(new)
                open(target, 'w').write(new)
                print('Orbit data refreshed from %s: %d satellites, fetched %s, ISS elements %.1f days old.' % (label, count, stamp, age))
                return 0
            except Exception as e:  # any failure: put the old file back and try the next source
                open(target, 'w').write(old)
                errors.append('%s: %s' % (label, e))
                print('Could not use %s (%s).' % (label, e), file=sys.stderr)
    print('Orbit data NOT refreshed; tle.js left as it was. ' + ' | '.join(errors), file=sys.stderr)
    return 1


if __name__ == '__main__':
    sys.exit(main())
