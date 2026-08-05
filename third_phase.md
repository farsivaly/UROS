# Phase 3 — Live Data Integration (web digital twin)

Adapted from `public/phases/phase3.md` for the Vite / React / Three.js viewer (same approach as Phase 2).

## Available now

- JSON twin loader (`/data/twin_snapshot.json`) with Load JSON / Refresh
- Modular `src/digitalTwin/` — loader, parser, transport façade, temperature, hotspot, fibre
- Temperature overlay on inverter components (blue→red)
- Localized hotspot markers from incoming data
- Raman fibre vertex-coloured from DTS profile
- Health badges above inverters in Overview
- Extended sidebar: System, Fault, Raman DTS, Live Controls, Fleet Overview

## Not in this phase

Thermal physics, Raman calculations, ML, MATLAB algorithms, live WebSocket — Phase 4.
