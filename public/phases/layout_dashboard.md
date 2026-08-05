You are an expert Blender UI/UX developer and Blender MCP assistant.

Refactor the existing Phase 4 SCADA Digital Twin sidebar so it is cleaner, faster to use, and less visually crowded.

Do not remove existing functionality.

Do not rebuild the add-on.

Preserve all current operators, properties, data connections, object links, and digital-twin behaviour.

The goal is to reduce the current large number of dropdown sections into a smaller, more logical interface.

CURRENT PROBLEM

The sidebar currently contains too many separate collapsible sections:

- Operating Mode
- System
- Live Controls
- Fault Progression
- Fleet Overview
- Selected Inverter
- Selected Component
- Raman DTS
- Predictive Maintenance
- Alarms
- Navigation
- Inspection Tools
- Quick Focus
- Diagnostics

This creates excessive scrolling and makes the dashboard feel fragmented.

NEW UI STRUCTURE

Replace the current structure with only five main collapsible sections:

1. OVERVIEW
2. ASSET INSPECTION
3. ANALYSIS
4. CONTROLS
5. SYSTEM

Use nested boxes, compact rows, tabs, or subheadings inside each main section instead of creating more top-level dropdowns.

--------------------------------------------------
1. OVERVIEW
--------------------------------------------------

Merge:

- Fleet Overview
- Selected Inverter
- Alarms summary
- current operating mode
- connection state

Show the most important information immediately.

Suggested layout:

OVERVIEW

Mode: Fault Injection
Connection: Connected

Fleet
Healthy: 3
Warning: 1
Critical: 0
Offline: 0

Selected Inverter
INV-001
Health: 68%
Status: Warning
Temperature: 59 °C
Fault: Thermal Interface Degradation

Active Alarms: 1

Add compact buttons:

- Focus Selected
- Inspect
- Acknowledge Alarm

Do not show detailed alarm history here.

Only show the active alarm count and highest current severity.

--------------------------------------------------
2. ASSET INSPECTION
--------------------------------------------------

Merge:

- Selected Component
- Navigation
- Inspection Tools
- Quick Focus

Suggested layout:

ASSET INSPECTION

Selected Asset
Name
ID
Type
Parent Inverter
Status
Health
Temperature

Navigation row:

- Site
- Inverter
- Interior
- Top

Inspection row:

- Open Door
- Explode
- X-Ray
- Reset

Quick Component Focus:

Use a dropdown or compact button grid for:

- IGBT
- Heat Sink
- Capacitor
- Fan
- Busbar
- Raman Fibre

Do not create a separate dropdown for Quick Focus.

Place it inside Asset Inspection.

Only display component-specific values when a component is selected.

--------------------------------------------------
3. ANALYSIS
--------------------------------------------------

Merge:

- Raman DTS
- Predictive Maintenance
- fault and health analysis
- graphs
- hotspot information

Use internal tabs or an enum selector:

Analysis View:

- Thermal
- Raman DTS
- Prediction

THERMAL VIEW

Show:

- Current temperature
- Maximum temperature
- Hotspot position
- Hotspot radius
- Severity
- Thermal resistance
- Temperature overlay toggle

RAMAN DTS VIEW

Show:

- Fibre length
- Maximum DTS temperature
- Average DTS temperature
- Hotspot distance
- Raman ratio
- Stokes peak
- Anti-Stokes peak
- Fibre overlay toggle
- Graph selector

PREDICTION VIEW

Show:

- Predicted fault
- ML confidence
- Remaining useful life
- Maintenance priority
- Recommended action
- Prediction horizon
- Start / Pause / Reset Prediction

Do not create separate top-level sections for Raman DTS and Predictive Maintenance.

--------------------------------------------------
4. CONTROLS
--------------------------------------------------

Merge:

- Live Controls
- Fault Progression
- fault injection
- timeline playback
- recording and replay

Suggested layout:

CONTROLS

Mode selector:

- Inspection
- Live
- Replay
- Fault Injection
- Prediction
- Maintenance
- Raman Demo

Display only the controls relevant to the selected mode.

Examples:

LIVE MODE

- Connect
- Disconnect
- Refresh
- Update Rate

FAULT INJECTION MODE

- Fault Type
- Severity
- Progression Slider
- Apply Scenario
- Reset Scenario

REPLAY MODE

- Load Recording
- Play
- Pause
- Stop
- Timeline Slider
- Playback Speed

PREDICTION MODE

- Prediction Horizon
- Start
- Pause
- Reset

RAMAN DEMO MODE

- Play Pulse
- Pause Pulse
- Reset Pulse

Use conditional UI drawing.

Do not display controls for inactive modes.

--------------------------------------------------
5. SYSTEM
--------------------------------------------------

Merge:

- System
- Diagnostics
- detailed connection information
- logging information
- advanced settings

This section should be collapsed by default.

Show:

Data Source
Connection State
Last Update
Packets Received
Packets Rejected
Visual Update Rate
Active Inverter
Add-on Version
Current Data File
Temperature Range Mode
Debug Logging Toggle

Add buttons:

- Reload Data
- Clear Logs
- Reset Digital Twin
- Export Diagnostics

This section is for developers and advanced users, not daily operation.

--------------------------------------------------
DEFAULT EXPANSION STATE
--------------------------------------------------

When the panel first opens:

Expanded:

- Overview
- Asset Inspection

Collapsed:

- Analysis
- Controls
- System

Remember the user's open and closed section state during the Blender session.

--------------------------------------------------
COMPACT DESIGN RULES
--------------------------------------------------

Use compact rows wherever possible.

For example:

Health      68%
Temperature 59 °C
Status      Warning

Avoid placing every property on a separate large box.

Use:

- split layouts
- aligned labels
- compact button rows
- icons
- status badges
- conditional fields

Avoid excessive empty space.

Avoid nested boxes deeper than two levels.

Do not use more than five top-level collapsible sections.

--------------------------------------------------
STATUS COLOUR RULES
--------------------------------------------------

Use restrained status indicators:

Healthy:
green

Warning:
yellow or amber

High:
orange

Critical:
red

Offline:
grey

Do not colour entire large panels.

Use small badges, icons, or value labels.

--------------------------------------------------
CONTEXT-AWARE DISPLAY
--------------------------------------------------

The panel should respond to selection and operating mode.

Examples:

If no inverter is selected:

Show:
“No inverter selected.”

Disable inverter-specific inspection controls.

If an inverter is selected but no component is selected:

Show inverter summary only.

If a component is selected:

Show component data inside Asset Inspection.

If Live mode is active:

Hide fault injection controls.

If Fault Injection mode is active:

Show progression and scenario controls.

If Prediction mode is active:

Show prediction controls and results.

If Raman Demo is active:

Show pulse animation controls.

--------------------------------------------------
IMPLEMENTATION REQUIREMENTS
--------------------------------------------------

Refactor only the UI drawing and related panel-state properties.

Do not duplicate existing operators.

Reuse current operators and properties wherever possible.

Create helper functions for repeated UI blocks.

Suggested helpers:

draw_status_badge()
draw_asset_summary()
draw_navigation_controls()
draw_inspection_controls()
draw_thermal_analysis()
draw_raman_analysis()
draw_prediction_analysis()
draw_mode_controls()
draw_diagnostics()

Use Blender PropertyGroups for:

- main section expansion state
- analysis tab
- operating mode
- optional advanced display state

Ensure registration and unregistration remain reliable.

--------------------------------------------------
FINAL RESULT
--------------------------------------------------

The final sidebar should feel like a professional SCADA interface rather than a long list of unrelated dropdowns.

The user should be able to understand the system state immediately, inspect an inverter quickly, open detailed analysis only when needed, and access technical diagnostics without cluttering the main workflow.

The final top-level structure must be:

OVERVIEW
ASSET INSPECTION
ANALYSIS
CONTROLS
SYSTEM