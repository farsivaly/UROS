# Phase 4 — Full Digital Twin / Predictive SCADA (web)

Adapted from `public/phases/phase4.md` for the Vite / React / Three.js viewer.

## Available now

- Collapsible (dropdown) SCADA panel on the right + topbar **Dashboard** toggle
- Modes: Inspection, Live, Replay, Fault Injection, Prediction, Maintenance, Raman Demo
- Fault progression slider with frame interpolation from scenario JSON
- Demo scenarios A–D under `/data/scenarios/`
- Thermal / fibre overlays, hotspot growth, Raman DTS graphs
- Predictive maintenance (RUL, ML confidence bar) — display only
- Alarms with acknowledge
- Fleet filters + overview labels
- Optional Raman pulse demo along the fibre

## Not calculated in the viewer

Thermal physics, Raman inversion, ML inference, RUL estimation — external JSON / MATLAB only.
