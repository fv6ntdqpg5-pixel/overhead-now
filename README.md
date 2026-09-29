# Overhead Now

Every tracked, active satellite (about 16,000 objects) plotted live on a globe you can spin, plus what is above your horizon right now, a geostationary dish-angle test, and upcoming ISS passes for any point on Earth.

Built as a public rebuttal tool: same orbital data and same math as every satellite tracking site, so any number here can be checked against N2YO, Heavens-Above, or NASA's Spot the Station.

## How it works

- **Data:** two-line element sets (TLEs) for the `active` group from [CelesTrak](https://celestrak.org), which republishes the U.S. Space Force catalog. Bundled as `tle.js` with the snapshot timestamp in `window.TLE_UPDATED`.
- **Propagation:** SGP4 via [satellite.js](https://github.com/shashwatak/satellite-js) 7.1.0 (MIT), compiled to a single script in `satellite.js`.
- **Coastlines:** simplified from [johan/world.geo.json](https://github.com/johan/world.geo.json) into `coast.js`.
- **Rendering:** plain canvas 2D, no frameworks. Orthographic globe with drag-to-rotate, zoom, and pole/edge-on views; polar sky chart. 

## Run it

Open `index.html` in a browser. No server, no build step, no network needed.

## Refresh the catalog

Positions drift a few km per day after the snapshot. To refresh:

```
curl -o active.tle "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"
python3 build_tle.py active.tle
```

`build_tle.py` rewrites `tle.js`. Commit and redeploy.

## Deploy

Static files; drop the folder on Vercel, Netlify, or GitHub Pages.

## Credits

Randy Barnhill, Barnhill Industrial Group. Built with Claude. Orbital elements courtesy of T.S. Kelso / CelesTrak.
