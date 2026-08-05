# Phase 2 — Web Digital Twin (implemented)

The Phase 2 interactive inspection environment runs in the Vite / React / Three.js viewer (`npm run dev`), adapted from `public/phases/phase2.md` (originally framed as a Blender add-on).

## Available now

- Digital Twin sidebar: selection, asset info, parent inverter, placeholder telemetry
- Navigation: Overview, Inverter Row, Inspect, Front, Interior, Top, Return
- Inspection tools (active inverter only): Open/Close Door, Explode, Reset, X-Ray
- Clickable string inverters + internals with metadata (`src/digitalTwinData.ts`)
- Multiple inverter support (01–04)

## Not in this phase

MATLAB / live data, thermal physics, DTS calculation, SCADA charts — see phase2.md “Do Not Implement Yet”.
