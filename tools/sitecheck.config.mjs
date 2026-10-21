// What a healthy Overhead Now looks like. Orbit data (tle.js) is refreshed weekly by the scheduled task.
export default {
  name: 'Overhead Now', url: 'https://overhead-now.vercel.app',
  checks: [
    { label: 'satellite total shown', test: () => { const n = +(document.getElementById('sTotal')?.textContent || '0').replace(/,/g, ''); return n >= 5000 ? true : 'total: ' + n; } },
    { label: 'satellites overhead listed', test: () => (document.getElementById('upList')?.children.length || 0) >= 10 },
    { label: 'upcoming passes listed', test: () => (document.getElementById('passList')?.children.length || 0) >= 1 },
    { label: 'globe drawn', test: () => { const c = document.querySelector('#globe canvas, canvas#globe, canvas'); if (!c || c.width < 100) return 'no canvas'; let g; try { g = c.getContext('2d'); } catch (e) { return true; } if (!g) return true; const d = g.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4000) if (d[i] > 0) n++; return n > 20 ? true : 'canvas is blank'; } }
  ],
  fresh: { label: 'orbit data snapshot', maxHours: 9 * 24, read: () => { const t = document.getElementById('dataAge')?.textContent || ''; const d = new Date(t.replace(' UTC', ' GMT')); return isFinite(d) ? d.toISOString() : null; } }
};
