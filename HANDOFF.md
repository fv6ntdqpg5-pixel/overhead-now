# Overhead Now: handoff notes

© 2026 Randy Barnhill. All rights reserved. Built with Claude.

## Nov 11, 2026 (late): mission-control redesign, all 7 items, with the 3D globe (LIVE Nov 11 on Randy's Go, merge cba96ff)
- Also done at Go: the claude.ai artifact copy (D3bcSL4V9tMnJvrqjs5yyC) republished with this page and `globe3d.js` (the copy drops the Vercel insights script); the weekly refresh task now checks `globe3d.js` is still among the artifact's files.
- Randy: make the rest of the page match the 3D globe ("pop", modern, high tech). He approved a plan of 7 items; 1 to 5 are built here, 6 (numbers that tick in place) and 7 (dish test drawn as dishes at their computed tilt) are still to do after he has seen this.
- One dark look for everyone: the light theme is removed from `index.html` (the globe is always drawn on dark space). The other desks are unchanged.
- Globe first: `#gwrap.stage` opens the page, edge to edge on a phone and 16:9 on a desktop, with the title, UTC clock, above-your-horizon count and total laid over its corners (`.hud`). Globe controls sit in `.bar` under it; location and filters moved to their own panel further down with the intro text.
- Satellite readout (`#readout`): tap a dot on the globe or sky chart, or a row in the list, or "Show the ISS". `select()`, `pickSat()`, `fillReadout()`, `selOrbit()`. Shows altitude, speed, sub-point, period, inclination, bearing, elevation, range and sunlit/shadow, all computed from the elements; refreshes every tick. The pick is marked with a square bracket and name (shape, not only color) and one orbit is drawn in the Earth-fixed frame on the globe (overlay canvas in 3D, same canvas in classic), plus its path across the sky chart for 15 minutes either side of now.
- Next ISS pass (`#nextPass`): a countdown from the same `passes` list as the table (`fillNext()`, every second; passes recomputed every 30 minutes). Rise and set are now narrowed to the second by bisection inside the 15-second scan.
- Sky chart restyled (dark dome, compass ticks, larger labels). No sweep line: it would be decoration, not data.
- Item 6 (built): the readout is recomputed for the picked satellite five times a second (`fillReadout`, 200 ms timer, text nodes updated only when they change), so its numbers move with the satellite; the UTC clock now ticks every second. Figures are kept to what the elements support (whole km, hundredths of a degree on the ground). Counts are not animated through in-between values.
- Item 7 (built): the dish test draws each dish as an SVG tilted to its computed elevation (`dishSvg`), with the line of sight, the angle arc and the horizon line; below the horizon the line is red, dotted and ends in a cross, and the card says how far under. Numbers stay beside each drawing.
- Not built on purpose: starfield, glow effects, fake scanning animation.
- Not tested on a real phone. Site check passes locally on phone and desktop.

## Nov 11, 2026: 3D globe (LIVE Nov 11)
- Randy: bring the desks up to current 3D/graphics capability, Overhead Now first, with 3D as the default as people upgrade phones.
- `globe3d.js` (WebGL2, no libraries): shaded Earth with a land/ocean tint from the coastline polygons, crisp coastlines, 30° grid, dashed equator, day/night line from the sun's real position (satellite.js sunPos), atmosphere rim, satellites as points at true altitude in a perspective view, red rings on the ones above the observer's horizon, the ISS orbit as a dashed line. No starfield and no terrain: nothing is drawn that is not computed from real data.
- Satellites glide between the 2-second SGP4 calculations: each point carries its Earth-fixed velocity (orbital velocity rotated into the Earth-fixed frame minus the ground's motion) and the shader adds velocity x seconds-since. Error over 2 s is tens of meters.
- `index.html`: Graphics menu (3D / Classic 2D, remembered in localStorage `gfx`; `?2d=1` forces classic). 3D is the default; the classic canvas shows when WebGL2 is missing, shader setup fails, or the context is lost. One touch handler serves both canvases; pinch zoom added for both. Drawing pauses when the globe is scrolled off-screen or the tab is hidden. A device averaging under about 25 frames a second gets the drawing resolution lowered once. Auto-spin starts paused when the device asks for reduced motion.
- Dots and rings scale with the canvas width (as on the classic globe), so a phone is not swamped by rings.
- Site check: "globe drawn" now reads `data-gfx` / `data-gfx-drawn` on <html> (set after frame 8 from a 25-pixel sample) for 3D, and the old pixel test for classic.
- Tested in headless Chromium (software WebGL) on phone and desktop sizes, dark and light themes: tap-to-set-location, drag direction, wheel and pinch zoom, switching modes, reload remembering the choice. NOT tested on a real iPhone: real-device speed is Randy's to judge on the preview.
- Closed Nov 11: the artifact copy and the weekly refresh task now include `globe3d.js` (see the entry above).

## Nov 12, 2026: the light or dark look carries between desks (PREVIEW on branch `theme-carry`, waiting for Randy's Go)
Randy: if someone picks dark (or light) on one desk, every other desk they open should match; each desk keeps its own switch.
- The sites are on different addresses, so a saved choice cannot be shared. Instead a small script (comment "Desk network: the
  light or dark look") adds `?theme=light|dark` to any link to another desk at the moment it is tapped, using the look the
  visitor is seeing now. Each desk reads `?theme=` from its own address, saves it as that desk's choice and applies it before
  the page paints.
- Per desk: Wire & Ledger key `theme` (front page and editions, builder, about); Weather Desk `haztheme`; Outbreak Desk `obtheme`;
  Earth Desk and Vaccine Desk `deskTheme` plus a new "Light look / Dark look" button beside the credit line (they had no
  switch); Overhead Now has one dark look only, so it just remembers an incoming choice and passes it on.
- Consequence: a visitor who never touched a switch on The Wire & Ledger (light by default) now gets the other desks in light
  too, including the Weather Desk, whose own default is dark when opened directly.
