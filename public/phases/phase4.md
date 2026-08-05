Cursor Prompt — Phase 4: Full Digital Twin and Predictive SCADA Experience

You are an expert Blender Python developer, Blender MCP assistant, digital twin architect, and engineering visualisation specialist.

Objective

Extend the completed Phase 3 solar farm project into a full interactive digital twin platform for string inverters.

The system should combine:

live or simulated inverter data
thermal visualisation
Raman DTS fibre visualisation
fault progression
predictive maintenance
SCADA-style controls
time-series graphs
fleet-level monitoring
immersive inspection tools

Blender remains the visualisation and interaction layer.

Do not place thermal physics, Raman calculations, fault diagnosis algorithms, or machine-learning inference inside Blender.

All engineering outputs must come from MATLAB or Python.

Existing Project

The current Blender project already contains:

realistic solar farm environment
multiple string inverters
detailed inverter internals
selectable assets and components
metadata panel
inspection cameras
door controls
exploded view
X-ray mode
JSON data loading
temperature colour mapping
Raman fibre visualisation
hotspot visualisation
health indicators
fault metadata
modular Blender add-on architecture

Preserve all working functionality.

Do not rebuild the project from scratch.

Inspect the current add-on, object hierarchy, custom properties, materials, and data pipeline before making changes.

Core Architecture

Use this architecture:

MATLAB
│
├── Thermal Model
├── Raman DTS Model
├── Fault Progression Model
├── Degradation Model
└── Simulation Export
        │
        ▼
Python Analytics
│
├── Data Validation
├── ML Inference
├── Health Estimation
├── Remaining Useful Life
├── Prediction
└── Communication Layer
        │
        ▼
Blender Digital Twin
│
├── Solar Farm Overview
├── Inverter Inspection
├── Thermal Visualisation
├── Raman Fibre Visualisation
├── Fault Injection Controls
├── Timeline Playback
├── Graphs
├── Predictive Maintenance UI
└── SCADA Dashboard

Keep these layers separate.

Phase 4 Main Features

Implement:

fault progression slider
synchronized scene state
animated local hotspots
live Raman fibre temperature profile
SCADA-style dashboard
historical timeline playback
prediction mode
maintenance mode
ML confidence display
remaining useful life display
fleet overview
alarm system
Raman pulse demonstration
data recording and replay
live communication support
1. Central Digital Twin State

Create one reusable state model for the active inverter.

Recommended state fields:

timestamp
inverter_id
operating_mode
health
status
fault_type
severity
fault_progress
temperature
max_temperature
average_temperature
hotspot_position
hotspot_radius
thermal_resistance
fibre_temperature_profile
fibre_distance_profile
stokes_profile
anti_stokes_profile
raman_ratio_profile
ml_fault_class
ml_confidence
remaining_useful_life
maintenance_priority
recommended_action
prediction_horizon
connection_status

The UI, materials, graphs, labels, fibre, hotspot, alarms, and predictions must all read from this central state.

Do not create disconnected copies of the same values across multiple modules.

2. Fault Progression Slider

Add a slider to the Digital Twin sidebar.

Label:

Fault Progression

Range:

0% — Healthy
100% — Severe

The slider should control visual playback when the system is in simulated or replay mode.

Example progression:

0–20%     Healthy
21–40%    Early degradation
41–60%    Moderate degradation
61–80%    Serious fault
81–100%   Severe fault

Moving the slider should immediately update:

component temperature colours
hotspot intensity
hotspot radius
fibre colour profile
health percentage
status label
fault severity
graphs
maintenance priority
ML confidence
warning messages
remaining useful life

Do not calculate physical values inside Blender.

The slider should select or interpolate supplied external data states.

3. Time-Series Data Format

Support a time-series JSON structure.

Example:

{
  "simulation_id": "TIM_DEGRADATION_001",
  "inverter_id": "INV-002",
  "fault_type": "Thermal Interface Degradation",
  "frames": [
    {
      "progress": 0.0,
      "timestamp": "2026-08-05T10:00:00",
      "health": 100,
      "severity": 0,
      "T_surface": [42.1, 42.4, 42.8],
      "T_fibre": [40.2, 40.4, 40.8],
      "T_DTS": [40.4, 40.6, 41.0],
      "hotspot_position": 3.75,
      "hotspot_radius": 0.02,
      "ml_confidence": 0.12,
      "remaining_useful_life_hours": 4500
    },
    {
      "progress": 0.5,
      "timestamp": "2026-08-05T10:30:00",
      "health": 69,
      "severity": 0.5,
      "T_surface": [53.0, 61.4, 72.2],
      "T_fibre": [44.5, 53.2, 66.7],
      "T_DTS": [44.8, 54.0, 67.5],
      "hotspot_position": 3.82,
      "hotspot_radius": 0.12,
      "ml_confidence": 0.87,
      "remaining_useful_life_hours": 740
    }
  ]
}

Support:

exact frame selection
interpolation between frames
playback
pause
reset
loop
playback speed
4. Thermal Colour Mapping

Create a consistent temperature colour system.

Suggested scale:

Cool        Blue
Normal      Cyan / Green
Warm        Yellow
Hot         Orange
Critical    Red

Requirements:

configurable temperature minimum and maximum
consistent scale across components and fibre
visible legend in the UI
optional automatic range
optional fixed engineering range
no material recreation every update
reusable node groups or reusable material instances
original component material recoverable

Add buttons:

Enable Thermal Overlay
Disable Thermal Overlay
Use Fixed Range
Use Auto Range

Thermal colours should affect only supported digital twin objects.

5. Localised Animated Hotspot

Improve the existing hotspot system.

Requirements:

hotspot placed using supplied local or world coordinates
hotspot attached to the affected component
radius driven by incoming data
intensity driven by severity
colour driven by temperature
smooth change between data frames
optional pulsing when critical
no simulated heat diffusion

The hotspot should remain local.

Do not colour the entire inverter when only one region is affected.

Possible implementation:

emissive decal
projected gradient mesh
transparent overlay shell
vertex colour mask
Geometry Nodes-generated hotspot patch

Keep the method reusable for different components.

6. Live Raman Fibre

Make the Raman fibre one of the main visual elements.

The fibre colour should represent:

T_DTS(x,t)

Requirements:

map fibre distance to curve position
map temperature values to fibre colour
support distributed colour changes along the curve
preserve the fibre route
support profiles of different lengths
interpolate profiles where necessary
show a fibre temperature legend
highlight the maximum-temperature location
show current hotspot distance in metres

Use either:

Geometry Nodes with named attributes
curve point attributes
vertex colours
shader attribute sampling

Avoid splitting the fibre into hundreds of manually managed objects.

7. Raman Signal Graphs

Add a graph area for:

DTS temperature profile
Raman ratio
Stokes signal
Anti-Stokes signal

The user should be able to select which graph is visible.

Graph requirements:

X-axis: fibre distance
Y-axis: selected signal
hotspot marker
maximum-value marker
updated from active data state
readable engineering labels
no excessive visual clutter

Possible implementations:

Blender UI drawing
generated texture
curve objects
image panel produced by Python

Use a modular graph-rendering system.

8. Raman Pulse Demonstration

Add an optional educational mode:

Raman Pulse Demo

When enabled:

a light pulse travels through the fibre
the pulse follows the fibre path
when it reaches a section, small backscatter indicators travel toward the source
Stokes and anti-Stokes return signals use visually distinct markers
the hotspot location produces a stronger anti-Stokes response
the animation can be started, paused, and reset

This is an explanatory visualisation only.

Do not represent it as a physically exact optical simulation.

Buttons:

Play Raman Pulse
Pause
Reset Pulse

Keep this mode separate from live data mode.

9. SCADA-Style Dashboard

Transform the Digital Twin sidebar into a structured SCADA-style interface.

Use clear sections.

Fleet Overview

Display:

total inverters
healthy
warning
critical
offline
site average health
site maximum temperature
active alarms
Selected Inverter

Display:

inverter ID
operating status
AC power
DC voltage
AC voltage
current
temperature
health
fault type
severity
last update
Selected Component

Display:

component name
component ID
temperature
health
thermal resistance
fault state
parent inverter
Raman DTS

Display:

fibre length
maximum temperature
average temperature
hotspot position
Raman ratio
Stokes peak
anti-Stokes peak
Predictive Maintenance

Display:

predicted fault
ML confidence
remaining useful life
maintenance priority
recommended action
next inspection date
Connection

Display:

data source
connection state
last packet time
update rate
replay/live mode

Use placeholder values only when external data is absent.

10. Health and Maintenance Mode

Add a maintenance-focused mode.

Display health using:

90–100%   Healthy
75–89%    Monitor
55–74%    Maintenance Required
0–54%     Critical

Use clear visual indicators:

Healthy                Green
Monitor                Yellow
Maintenance Required   Orange
Critical               Red

Add:

Maintenance Mode

When enabled:

reduce decorative visual effects
emphasize health and maintenance information
show component priority
show recommended action
show affected component
show predicted remaining life
optionally isolate the faulty component

Do not show only the word “Fault.”

Use operator-friendly messages such as:

Health: 63%
Priority: High
Affected component: IGBT Module 02
Recommended action: Inspect thermal interface
Estimated remaining life: 31 days
11. Prediction Mode

Add a button:

Predict Future

Prediction mode should use externally supplied forecast data.

Support a future prediction sequence containing:

future timestamps
health forecast
temperature forecast
hotspot growth
predicted severity
predicted fault probability
remaining useful life

When prediction mode starts:

show a future-time label
animate hotspot growth
update fibre profile
reduce health
update graphs
update ML confidence
show a maintenance warning when thresholds are crossed

Clearly label forecast values as:

Predicted

Do not present predictions as current measured values.

Controls:

Start Prediction
Pause Prediction
Reset Prediction
Prediction Horizon
12. ML Confidence Display

Support incoming machine-learning results.

Example fields:

{
  "predicted_fault": "Thermal Interface Degradation",
  "confidence": 0.93,
  "model_version": "TIM-CNN-v2.1",
  "remaining_useful_life_hours": 520
}

Display:

predicted fault
confidence percentage
model version
inference timestamp
remaining useful life

Add a simple confidence bar.

Do not run machine-learning inference inside Blender.

13. Alarm System

Create reusable alarm states:

Information
Warning
High
Critical

Each alarm should contain:

alarm_id
timestamp
inverter_id
component_id
severity
message
acknowledged
recommended_action

Add an alarm panel showing:

active alarms
alarm severity
affected inverter
affected component
timestamp
acknowledge button

Alarm behaviour:

no disruptive popups for low-level events
clear visual warning for critical alarms
acknowledged alarms remain recorded
active critical assets remain highlighted

Support threshold values supplied externally.

14. Fleet-Level Visualisation

In solar farm overview mode, show each inverter with:

health colour
health percentage
fault icon
connection state
short ID

Possible status label:

INV-003
Health 62%
High Priority

Add fleet filters:

Show All
Healthy Only
Warnings
Critical
Offline

Selecting a fleet item should:

select the inverter
update the dashboard
move to the inverter if requested
allow inspection of its components

The system should scale beyond four inverters.

15. Digital Twin Modes

Add an explicit mode selector.

Supported modes:

Inspection
Live
Replay
Fault Injection
Prediction
Maintenance
Raman Demo

Expected behaviour:

Inspection

Static manual component inspection.

Live

Receive external data continuously.

Replay

Play recorded data.

Fault Injection

Use supplied simulated fault scenarios.

Prediction

Visualise forecast data.

Maintenance

Emphasise maintenance decisions.

Raman Demo

Show the educational pulse and backscatter animation.

Prevent conflicting modes from running simultaneously.

16. Fault Injection Interface

Add fault scenario selection.

Example fault scenarios:

Healthy
Thermal Interface Degradation
Cooling Fan Failure
Blocked Air Duct
IGBT Overtemperature
Capacitor Ageing
Busbar Hotspot
Sensor Fault
Communication Loss

Controls:

Fault Type
Severity
Progression
Apply Scenario
Reset Scenario

The controls should load scenario data supplied in JSON or generated externally.

Do not invent thermal behaviour inside Blender.

Fault injection changes the selected data sequence, not the physics model.

17. Live Communication

Keep JSON loading and add a non-blocking live communication layer.

Preferred initial options:

WebSocket
local TCP socket

Design adapters for future:

MQTT
OPC UA
REST
MATLAB Engine

Requirements:

do not block Blender's main thread
queue incoming data
apply scene updates using Blender timers
handle reconnection
handle malformed packets
show connection state
provide start and stop controls
avoid duplicate background threads
stop cleanly when the add-on unloads

Suggested controls:

Connect
Disconnect
Refresh
Data Source
Update Rate
18. Data Validation

Validate all incoming data before applying it.

Check:

inverter ID exists
component ID exists
numeric values are valid
array lengths are supported
temperature values are within configured bounds
timestamps are valid
profile arrays are not empty
health is between 0 and 100
confidence is between 0 and 1

Invalid data should:

not crash Blender
produce a readable warning
preserve the previous valid state
be logged
19. Recording and Replay

Add data recording support.

The user should be able to:

Start Recording
Stop Recording
Save Recording
Load Recording
Replay
Pause
Seek

Record:

timestamp
inverter state
component states
fibre profiles
hotspot data
alarms
predictions

Use a clear JSON or JSON Lines format.

Replay should use the same scene update pipeline as live data.

Do not create a second visualisation system for replay.

20. Graph Timeline

Add a timeline for historical and predicted data.

The timeline should support:

current position
historical data
future prediction region
fault events
maintenance events
alarm markers

Use different labelling for:

Measured
Simulated
Predicted

Allow scrubbing through the available data.

Synchronize the timeline with:

graphs
hotspot
fibre
colours
labels
health
alarms
21. Exploded View and X-Ray Integration

Ensure all Phase 4 visualisations work in:

normal view
exploded view
X-ray mode

Requirements:

fibre remains attached or visually aligned
hotspot remains on the correct component
temperature overlays remain visible
labels do not overlap excessively
resetting the exploded view restores exact transforms
X-ray material restoration remains reliable
22. Operator Control-Room Presentation

Improve the scene presentation so it feels like an engineering control-room application.

Add an optional startup layout:

solar farm visible through the main viewport
fleet status panel visible
alarm summary visible
selected inverter data visible
clear navigation controls
minimal visual clutter

Keep it professional.

Avoid a game-like HUD.

The experience should resemble:

SCADA
asset management software
condition monitoring software
industrial engineering visualisation
23. Suggested Add-on Architecture

Extend the existing add-on using a modular structure.

string_inverter_digital_twin/
│
├── __init__.py
├── core/
│   ├── state.py
│   ├── modes.py
│   ├── events.py
│   └── validation.py
├── data/
│   ├── json_loader.py
│   ├── live_client.py
│   ├── recorder.py
│   ├── replay.py
│   └── adapters.py
├── visualisation/
│   ├── temperature.py
│   ├── hotspot.py
│   ├── fibre.py
│   ├── labels.py
│   ├── alarms.py
│   └── legends.py
├── prediction/
│   ├── forecast_state.py
│   └── prediction_player.py
├── graphs/
│   ├── graph_renderer.py
│   ├── fibre_graphs.py
│   └── timeline.py
├── operators/
│   ├── live.py
│   ├── replay.py
│   ├── faults.py
│   ├── prediction.py
│   ├── maintenance.py
│   └── raman_demo.py
├── ui/
│   ├── dashboard.py
│   ├── fleet_panel.py
│   ├── alarm_panel.py
│   ├── graph_panel.py
│   └── settings_panel.py
└── utilities/
    ├── logging.py
    ├── object_lookup.py
    ├── interpolation.py
    └── performance.py

Avoid a single large script.

24. Performance Requirements

The system must remain responsive.

Requirements:

update only changed assets
reuse materials
reuse graph objects
reuse hotspot objects
avoid rebuilding Geometry Nodes every frame
avoid searching the full scene every update
cache asset lookups
throttle high-frequency data
use interpolation for smooth display
support dozens of inverters
keep live communication off Blender's main thread
perform scene changes on the main thread through timers

Provide an adjustable visual update rate.

Example:

Data input: 10 Hz
Blender visual update: 2–5 Hz
25. Logging and Diagnostics

Add a diagnostics section.

Display:

current mode
data source
packets received
packets rejected
last valid update
visual update rate
active inverter
number of active alarms

Log:

connection errors
missing object IDs
invalid profiles
failed material updates
unsupported data fields
add-on registration errors

Do not spam the console every frame.

26. Demo Scenarios

Include sample data for at least four demonstration scenarios.

Scenario A — Healthy Operation
all components normal
blue/green fibre
no hotspot
high health
no alarms
Scenario B — Thermal Interface Degradation
IGBT or heat-sink hotspot
increasing thermal resistance
hotspot grows
fibre becomes yellow/orange
health decreases
Scenario C — Cooling Fan Failure
fan status failed
air temperature rises
multiple components warm
warning becomes critical
Scenario D — Capacitor Ageing
capacitor temperature rises
health gradually falls
maintenance warning appears
predicted remaining life decreases

Each scenario should include:

multiple timeline frames
temperature profiles
health
severity
hotspot data
fault type
ML confidence
remaining useful life
27. Do Not Implement Inside Blender

Do not implement:

heat transfer equations
thermal resistance calculations
Raman temperature inversion
Stokes or anti-Stokes physics
ML training
ML inference
degradation modelling
remaining-life estimation
fault classification
electrical power-flow simulation

Blender only receives, displays, interpolates, and replays supplied values.

28. Deliverables

Produce:

central digital twin state model
full mode system
fault progression slider
synchronized timeline playback
improved hotspot visualisation
distributed Raman fibre visualisation
Raman signal graphs
optional Raman pulse demonstration
SCADA-style dashboard
health and maintenance mode
prediction mode
ML confidence display
remaining useful life display
alarm system
fleet-level overview
fault injection controls
non-blocking live data interface
recording and replay
historical and prediction timeline
diagnostics and logging
sample demonstration scenarios
modular, documented add-on code
Final User Experience

The completed application should allow a user to:

open the solar farm digital twin
see the condition of every string inverter
select a degraded inverter
enter inspection mode
open or explode the inverter
enable X-ray mode
inspect the IGBT, heat sink, capacitor, fans, and Raman fibre
move through fault progression
watch the hotspot grow
see the fibre colour change along its route
inspect DTS, Stokes, anti-Stokes, and Raman-ratio graphs
review health, alarms, ML confidence, and remaining life
run a future prediction
view a recommended maintenance action
return to the fleet overview

The finished result should feel like a professional SCADA and predictive-maintenance platform built around an immersive Blender digital twin.