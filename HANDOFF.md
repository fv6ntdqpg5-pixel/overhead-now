# Overhead Now: handoff notes

© 2026 Randy Barnhill. All rights reserved. Built with Claude.

## Nov 11, 2026: 3D globe (preview branch globe-3d)
- Randy: bring the desks up to current 3D/graphics capability, Overhead Now first, with 3D as the default as people upgrade phones.
- `globe3d.js` (WebGL2, no libraries): shaded Earth with a land/ocean tint from the coastline polygons, crisp coastlines, 30° grid, dashed equator, day/night line from the sun's real position (satellite.js sunPos), atmosphere rim, satellites as points at true altitude in a perspective view, red rings on the ones above the observer's horizon, the ISS orbit as a dashed line. No starfield and no terrain: nothing is drawn that is not computed from real data.
- Satellites glide between the 2-second SGP4 calculations: each point carries its Earth-fixed velocity (orbital velocity rotated into the Earth-fixed frame minus the ground's motion) and the shader adds velocity x seconds-since. Error over 2 s is tens of meters.
- `index.html`: Graphics menu (3D / Classic 2D, remembered in localStorage `gfx`; `?2d=1` forces classic). 3D is the default; the classic canvas shows when WebGL2 is missing, shader setup fails, or the context is lost. One touch handler serves both canvases; pinch zoom added for both. Drawing pauses when the globe is scrolled off-screen or the tab is hidden. A device averaging under about 25 frames a second gets the drawing resolution lowered once. Auto-spin starts paused when the device asks for reduced motion.
- Dots and rings scale with the canvas width (as on the classic globe), so a phone is not swamped by rings.
- Site check: "globe drawn" now reads `data-gfx` / `data-gfx-drawn` on <html> (set after frame 8 from a 25-pixel sample) for 3D, and the old pixel test for classic.
- Tested in headless Chromium (software WebGL) on phone and desktop sizes, dark and light themes: tap-to-set-location, drag direction, wheel and pinch zoom, switching modes, reload remembering the choice. NOT tested on a real iPhone: real-device speed is Randy's to judge on the preview.
- Open: the claude.ai artifact copy (D3bcSL4V9tMnJvrqjs5yyC) and the weekly refresh task publish this page; they must include `globe3d.js` or the artifact silently stays on the classic globe.
