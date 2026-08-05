Cursor Prompt — Phase 3: Live Data Integration and Digital Twin Visualization

You are an expert Blender Python developer, Blender MCP assistant, and software engineer specializing in digital twins.

Objective

Transform the existing interactive Blender inspection environment into a data-driven digital twin.

Do not implement any thermal physics, Raman calculations, or machine learning inside Blender.

Blender's responsibility is to receive processed data from external applications and visualize it.

The architecture should support future integration with MATLAB, Python analytics, and real Raman DTS measurements.

Existing Project

The project already contains:

realistic solar farm
multiple string inverters
interactive inspection system
metadata panel
exploded view
X-ray mode
camera system
reusable Blender add-on

Do not modify these systems unnecessarily.

Extend the existing architecture.

Digital Twin Architecture

Design Blender as the visualization layer.

MATLAB
│
├── Thermal Simulation
├── Raman DTS Processing
├── Fault Detection
└── Temperature Models
        │
        ▼
Python Middleware
│
├── JSON
├── WebSocket
├── TCP/IP
└── REST API (future)
        │
        ▼
Blender Digital Twin
│
├── Scene Updates
├── Object Colours
├── Health Status
├── Metadata
├── Graphs
└── UI

Blender should never calculate engineering values.

Data Interface

Create a reusable data interface.

Initially support loading from JSON files.

Design the interface so it can later be replaced with:

WebSocket
TCP socket
MQTT
REST API
MATLAB Engine
OPC UA

without changing the visualization logic.

Separate:

data loading
data parsing
scene updates
Example JSON Structure
{
  "timestamp": "2026-08-05T12:30:00",
  "inverters": [
    {
      "id": "INV-001",
      "status": "Healthy",
      "health": 96,
      "temperature": 44.8,
      "fault": "None",
      "components": {
        "IGBT_01": {
          "temperature": 62.4,
          "health": 94,
          "status": "Healthy"
        },
        "HeatSink": {
          "temperature": 48.2,
          "thermal_resistance": 0.10
        },
        "RamanFibre": {
          "max_temperature": 63.1,
          "average_temperature": 41.5,
          "hotspot_position": 3.82
        }
      }
    }
  ]
}

Do not hard-code values.

Automatic Scene Update

Create an operator:

Update Digital Twin

When executed:

load latest JSON
update metadata
update object properties
update UI
update colours
update hotspot
refresh viewport
Temperature Visualisation

Replace placeholder colours with dynamic colours.

Use:

Blue

↓

Green

↓

Yellow

↓

Orange

↓

Red

based on temperature.

Only update the affected components.

Do not colour the entire inverter.

Localised Hotspot

Create a hotspot visualization.

The hotspot should appear only on the affected component.

Requirements:

emissive overlay
local colour gradient
scalable hotspot radius
hotspot position from incoming data

Example:

Healthy

□□□□□□

Fault

□□🟥□□

Severe

□🟥🟥□

Do not simulate heat diffusion.

Only visualize incoming hotspot data.

Raman Fibre Visualisation

The Raman fibre should become a live temperature indicator.

Colour the fibre according to distributed temperature.

Example:

Blue

↓

Green

↓

Yellow

↓

Orange

↓

Red

The colour should follow the supplied temperature profile.

Initially use placeholder profile data.

Later this will come directly from MATLAB.

Health Indicator

Each inverter should display a health percentage.

Example:

100%

Blue

↓

96%

Green

↓

82%

Yellow

↓

65%

Orange

↓

42%

Red

Health affects:

UI
labels
inverter status
overview display

Do not calculate health.

Read it from the incoming data.

Fault Status

Support placeholder fault types.

Examples:

Healthy
Thermal Interface Degradation
Cooling Failure
Capacitor Ageing
Overtemperature
Fan Failure

Display:

fault name
severity
recommended action

Use placeholder text.

Digital Twin Dashboard

Extend the existing sidebar.

Create sections:

System
Timestamp
Connection Status
Data Source
Selected Asset

Display:

Health
Status
Temperature
Fault
Last Update
Raman DTS

Display:

Maximum Temperature
Average Temperature
Hotspot Position
Fibre Length
Live Controls

Buttons:

Load JSON

Refresh

Reset View

Toggle Temperature Overlay

Toggle Fibre Overlay
Scene Overlay

Above each inverter display:

INV-001

Health

96%

🟢 Healthy

Use Blender text objects or viewport overlays.

These labels should update automatically.

Overview Mode

When viewing the entire solar farm:

Each inverter should immediately show:

Health colour
Health percentage
Status

Allow quick identification of unhealthy assets.

Data Refresh

Support manual refresh now.

Design so automatic refresh can later be enabled.

Avoid blocking Blender while waiting for data.

Software Architecture

Separate code into modules.

Suggested structure:

digital_twin/

data_loader.py

json_parser.py

scene_updater.py

temperature.py

hotspot.py

dashboard.py

communication.py

utilities.py

Keep visualization independent from communication.

Future Compatibility

Design the system so future MATLAB outputs can replace placeholder JSON without changing Blender logic.

Expected future fields include:

T_surface
T_fibre
T_DTS
Fault Type
Severity
Health
Hotspot Position
Confidence
Predicted Remaining Life

The visualization layer should already support these fields.

Performance

Only update objects whose data has changed.

Avoid recreating materials every refresh.

Reuse existing materials and overlays.

Support scaling to dozens of string inverters.

Deliverables

Implement:

JSON data loader
scene update system
live metadata updates
temperature colour mapping
Raman fibre temperature visualization
localized hotspot visualization
inverter health indicators
fault display
extended Digital Twin dashboard
reusable communication architecture

Do not implement:

thermal simulation
Raman calculations
machine learning
predictive models
MATLAB algorithms
DTS inversion
fault diagnosis

These remain external systems.

The completed Phase 3 should behave like a real digital twin: loading external engineering data and instantly updating the 3D solar farm to reflect the current state of each inverter, while remaining modular and ready for live MATLAB integration in Phase 4.