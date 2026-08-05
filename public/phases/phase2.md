# Cursor Prompt — Phase 2: Interactive String-Inverter Environment

You are an expert Blender Python developer and Blender MCP assistant.

## Objective

Extend the existing Phase 1 Blender solar farm into an **interactive digital twin inspection environment** based on multiple string inverters.

Use the existing Blender scene and models.

Do not rebuild the solar farm unless a small correction is required for interaction.

This phase should add:

* clickable assets
* component metadata
* inverter navigation
* inspection controls
* exploded view
* X-ray mode
* a Digital Twin sidebar

Do not connect MATLAB or live data yet.

Do not implement thermal physics, machine learning, or real-time simulation.

---

# Existing Scene

The current Blender project contains:

```text
Solar Farm
│
├── Solar Panel Arrays
├── Mounting Structures
├── DC Cable Trenches
├── String Inverter Row
│     ├── String Inverter 01
│     ├── String Inverter 02
│     ├── String Inverter 03
│     └── String Inverter 04
├── AC Combiner / Switchgear
├── Step-up Transformer
├── Site Control Building
├── Internal Access Roads
└── Weather & Lighting
```

Each string inverter contains:

```text
String Inverter
│
├── Cabinet
├── Door
├── DC Disconnect
├── MPPT Section
├── IGBT Modules
├── Heat Sink
├── DC Link Capacitors
├── Busbars
├── Cooling Fans
├── Air Ducts
├── AC Output Section
├── Control PCB
└── Raman Fibre
```

Preserve the existing object names, collections, materials, hierarchy, and transforms.

---

# Main Interaction Flow

The user should be able to inspect the solar farm at two levels.

## Level 1 — Inverter Selection

The user clicks a string inverter in the solar farm.

The Digital Twin panel displays:

* inverter name
* inverter ID
* operational status
* health percentage
* AC power
* DC voltage
* AC voltage
* total temperature
* fault state
* short description

Use placeholder values only.

Example:

```text
Asset

String Inverter 02

Status

Healthy

Health

96%

AC Power

245 kW

DC Voltage

1,050 V

AC Voltage

800 V

Temperature

44.8 °C

Fault State

None
```

When an inverter is selected, provide an operator named:

```text
Inspect Inverter
```

This should move the view or active camera to the selected inverter.

---

## Level 2 — Internal Component Inspection

After entering inspection mode, the user should be able to click individual inverter components.

Important interactive components:

* Cabinet
* Door
* DC Disconnect
* MPPT Section
* IGBT Modules
* Heat Sink
* DC Link Capacitors
* Busbars
* Cooling Fans
* Air Ducts
* AC Output Section
* Control PCB
* Raman Fibre

The Digital Twin panel should update according to the selected component.

---

# Object Metadata System

Create reusable metadata for all interactive assets.

Use Blender custom properties or a registered `PropertyGroup`.

Recommended properties:

```text
asset_type
asset_id
display_name
parent_inverter
status
health
temperature
description
interactive
```

Optional electrical and thermal properties may be added depending on component type.

Do not store all information only in object names.

---

# Example Component Information

## IGBT Module

When an IGBT object is selected, show:

```text
Component

IGBT Module 02

Parent Asset

String Inverter 02

Temperature

62.4 °C

Status

Healthy

Health

94%

Switching State

Normal

Description

Power semiconductor module used in DC-to-AC conversion.
```

Use separate metadata for each IGBT module.

---

## Heat Sink

When the heat sink is selected, show:

```text
Component

Heat Sink

Parent Asset

String Inverter 02

Temperature

48.2 °C

Thermal Interface

Healthy

Thermal Resistance

0.10 K/W

Status

Healthy

Health

97%
```

---

## DC Link Capacitor

When a capacitor is selected, show:

```text
Component

DC Link Capacitor 01

Temperature

46.8 °C

Capacitance

Placeholder value

Voltage

Placeholder value

Status

Healthy

Health

95%
```

---

## Cooling Fan

When a cooling fan is selected, show:

```text
Component

Cooling Fan 01

Speed

2,400 RPM

Status

Running

Health

92%

Airflow

Normal
```

---

## Raman Fibre

When the Raman fibre is selected, show:

```text
Component

Raman Fibre

Fibre Length

Placeholder value

Average Temperature

41.7 °C

Maximum Temperature

53.2 °C

DTS Profile

Available

Raman Ratio

Placeholder value

Stokes Signal

Placeholder value

Anti-Stokes Signal

Placeholder value

Status

Healthy
```

Use placeholder values only.

Do not calculate Raman temperature or DTS values.

---

# Digital Twin Sidebar

Create a Blender Sidebar panel in the 3D Viewport.

Location:

```text
3D Viewport > Sidebar > Digital Twin
```

The panel should include the following sections.

## Selection

Display:

* selected asset name
* asset type
* parent inverter
* status
* health
* temperature

If no interactive object is selected, display:

```text
No digital twin asset selected.
```

---

## Asset Information

Display relevant component-specific properties.

Only show fields that apply to the selected object.

For example:

* electrical values for electrical components
* thermal values for heat sink and IGBT modules
* signal values for Raman fibre
* RPM and airflow for cooling fans

---

## Navigation

Add buttons:

```text
Solar Farm Overview

Inverter Row

Inspect Selected Inverter

Inverter Front

Inverter Interior

Top View

Return to Solar Farm
```

The controls should operate on the selected inverter where applicable.

---

## Inspection Tools

Add:

```text
Open Door

Close Door

Explode Inverter

Reset Inverter

Enable X-Ray

Disable X-Ray
```

These operators should affect only the currently selected or active inverter.

Do not explode every inverter simultaneously.

---

# Object Selection

Use Blender's normal object selection.

When the user clicks an interactive object:

* make it the active selection
* detect its metadata
* identify its parent inverter
* update the Digital Twin panel
* visually highlight the selected object

Non-interactive environment objects should not populate the engineering panel.

Examples of non-interactive objects:

* roads
* ground
* sky
* generic mounting structures

---

# Selection Highlight

Create a clear but lightweight selection highlight.

Preferred approaches:

* temporary outline
* duplicated outline shell
* emission overlay
* viewport-compatible highlight material

Requirements:

* only the selected object is highlighted
* the object's original material must be preserved
* removing selection restores the original appearance
* highlight logic must not permanently overwrite materials
* the Raman fibre must remain easy to identify

Do not use thermal colours yet.

---

# Inverter Parent Detection

Every internal component must be associated with its parent string inverter.

For example:

```text
IGBT_02
└── Parent Inverter: StringInverter_02
```

Implement a robust parent lookup using one or more of:

* Blender parenting
* collection membership
* custom property
* asset ID

Avoid relying only on partial object-name matching.

---

# Inspect Inverter Mode

Create an operator:

```text
Inspect Selected Inverter
```

When executed:

1. identify the selected string inverter
2. frame the inverter in the viewport
3. optionally isolate or locally focus the inverter collection
4. switch to the inverter inspection camera
5. make internal components easy to select
6. keep the rest of the solar farm available when returning

Create another operator:

```text
Return to Solar Farm
```

This should restore the overview view and normal scene visibility.

---

# Door Controls

Create two operators:

```text
Open Door

Close Door
```

Requirements:

* rotate the selected inverter door around the hinge
* store the closed transform
* prevent repeated execution from accumulating rotation errors
* affect only the active inverter
* allow the door to return exactly to its original position

A short animation is optional, but not required.

The system must also work without animation.

---

# Exploded View

Create an operator:

```text
Explode Inverter
```

Requirements:

* operate on the selected inverter
* move internal components apart in a clean engineering exploded view
* keep the fibre associated with the component layout
* preserve the original transforms
* avoid moving the entire solar farm
* avoid components overlapping after explosion

Suggested movement directions:

* door moves outward
* control PCB moves forward
* capacitor section shifts sideways
* IGBT modules and heat sink separate slightly
* cooling fans move backward
* MPPT section moves upward
* AC output section moves downward

Create:

```text
Reset Inverter
```

This must restore the exact original transforms.

Store original transforms safely before changing them.

Do not repeatedly overwrite the stored original state.

---

# X-Ray Mode

Create an X-ray toggle for the selected inverter.

When enabled:

* cabinet material becomes transparent
* door material becomes transparent
* internal electrical and mechanical components remain visible
* Raman fibre remains clearly visible
* selection remains functional

When disabled:

* restore the original cabinet and door materials
* restore original alpha and blend settings

Do not permanently modify the original material configuration.

---

# Camera System

Create or use the following named cameras:

```text
Camera_SolarFarm_Overview

Camera_Inverter_Row

Camera_Inverter_Front

Camera_Inverter_Interior

Camera_Top_View
```

Camera operators should use the currently selected inverter as the target where applicable.

Avoid hard-coding all camera locations to String Inverter 01.

The inspection system should work for String Inverter 01, 02, 03, and 04.

---

# Multiple Inverter Support

The interaction architecture must support any number of string inverters.

Do not write four completely separate copies of the same logic.

Use reusable functions and asset IDs.

Example inverter IDs:

```text
INV-001

INV-002

INV-003

INV-004
```

Example component IDs:

```text
INV-002-IGBT-01

INV-002-HEATSINK-01

INV-002-FIBRE-01
```

Each component must know which inverter it belongs to.

---

# Add-on Structure

Implement Phase 2 as a modular Blender add-on.

Suggested structure:

```text
string_inverter_digital_twin/
│
├── __init__.py
├── properties.py
├── metadata.py
├── selection.py
├── operators_navigation.py
├── operators_inspection.py
├── operators_door.py
├── operators_explode.py
├── operators_xray.py
├── ui.py
└── utilities.py
```

Keep reusable helper functions in `utilities.py`.

Do not place the complete implementation in one large script.

---

# Blender MCP Workflow

Use Blender MCP to inspect the existing scene before modifying it.

Before writing interaction logic:

1. inspect current object names
2. inspect collection names
3. verify the string inverter hierarchy
4. identify duplicated or linked inverter objects
5. verify component origins and transforms
6. confirm which objects should be interactive

Do not assume object names exist without checking.

When a required object is missing or incorrectly named:

* make the smallest necessary correction
* preserve the existing model
* report the correction clearly

---

# Registration and Reliability

Ensure that:

* all classes register correctly
* all classes unregister correctly
* the add-on can be reloaded during development
* handlers are not registered more than once
* operators fail gracefully when no inverter is selected
* missing objects produce readable warnings
* original materials and transforms are recoverable
* the scene remains usable after saving and reopening

---

# Placeholder Data

Use static placeholder values during this phase.

Store values in a way that can later be replaced by external data.

For example:

```python
object["temperature"] = 62.4
object["health"] = 94.0
object["status"] = "Healthy"
```

Do not bury placeholder values inside UI labels.

The UI should read values from object properties or registered data structures.

This will allow Phase 3 to replace the values from MATLAB or Python.

---

# Do Not Implement Yet

Do not implement:

* MATLAB connection
* live Python analytics
* socket communication
* CSV monitoring
* JSON streaming
* Raman DTS calculations
* thermal simulation
* temperature-driven colour maps
* animated hotspots
* fault injection
* health slider
* predictive maintenance
* machine-learning confidence
* SCADA graphs
* real-time charts

These belong to later phases.

---

# Deliverables

Produce:

1. a reusable Blender add-on
2. clickable string inverter assets
3. clickable internal components
4. a Digital Twin sidebar
5. component metadata display
6. selected-object highlighting
7. parent-inverter detection
8. inverter inspection navigation
9. door open and close controls
10. inverter exploded view
11. reset functionality
12. X-ray mode
13. support for multiple string inverters
14. clean and modular Python code

The completed scene should function as an interactive engineering inspection tool.

A user should be able to select any string inverter, enter inspection mode, open its cabinet, inspect individual components, view engineering metadata, enable X-ray mode, create an exploded view, and return to the full solar farm.
