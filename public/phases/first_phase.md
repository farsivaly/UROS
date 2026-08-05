# Cursor Prompt — Phase 1: Static Blender Environment (String Inverter Version)

You are an expert Blender Python developer and Blender MCP assistant.

## Objective

Build the first version of a **3D digital twin environment** for a utility-scale solar farm using **string inverters**.

**This phase is modelling only.**

Do **not** create animations, UI, simulations, physics, or external data connections.

The goal is to produce a clean, modular Blender scene that can be extended into an interactive digital twin in later phases.

---

# Scene Layout

Create a realistic solar farm consisting of:

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

The environment should resemble a modern utility-scale photovoltaic installation.

Use realistic spacing and proportions, but keep geometry lightweight.

---

# String Inverter

Create one detailed string inverter cabinet.

Duplicate this model to create the remaining inverter units using linked data where appropriate.

The cabinet hierarchy should be:

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

The internal layout should be logical and based on a modern air-cooled string inverter.

---

# Raman Fibre

Route a fibre optic cable realistically through the inverter.

The fibre should pass close to:

* IGBT modules
* Heat sink
* DC capacitors
* Busbars

Keep it as a separate object.

No glow or temperature colouring in this phase.

---

# Object Naming

Use meaningful object names.

Example:

```text
SolarFarm

PanelArray_01

PanelArray_02

StringInverter_01

StringInverter_02

Cabinet

Door

IGBT_01

IGBT_02

HeatSink

Capacitor_01

Busbar_Positive

Busbar_Negative

CoolingFan_01

AirDuct

ControlPCB

RamanFibre

Transformer

ControlBuilding
```

Avoid Blender default names such as Cube.001.

---

# Blender Collections

Organise the scene into collections.

```text
Environment

SolarArrays

Electrical

Mechanical

Fibre

Buildings

Lighting

Cameras
```

Each inverter should also have its own sub-collection.

---

# Materials

Assign simple engineering materials.

Examples:

* Painted steel
* Aluminium
* Copper
* Plastic
* Glass
* Rubber
* Fibre optic cable

Use placeholder materials only.

No procedural shaders or temperature visualisation.

---

# Lighting

Create a daytime outdoor environment.

Include:

* Sun light
* Sky lighting or HDRI
* Realistic shadows

Keep lighting simple and suitable for technical demonstrations.

---

# Cameras

Create at least four cameras:

* Overall Solar Farm
* Inverter Row
* Close-up of a String Inverter
* Interior of the Inverter Cabinet

Name each camera clearly.

---

# Modelling Standards

Ensure:

* Correct object origins
* Applied transforms
* Clean topology
* Logical hierarchy
* Moderate polygon count
* Reusable components through linked instances where appropriate

---

# Future Compatibility

Structure the scene so that every inverter and component can later support:

* Object selection
* Metadata
* Health indicators
* Colour updates
* Hotspot visualisation
* Raman DTS visualisation
* External Python control
* MATLAB-generated data
* Predictive maintenance dashboards

Do **not** implement any of these features yet.

Only prepare the scene for future integration.

---

# Deliverable

Produce a complete Blender scene containing:

* Utility-scale solar farm environment
* Multiple string inverter units
* One detailed string inverter with organised internal components
* Realistic Raman fibre routing
* Clean object naming
* Organised collections
* Placeholder materials
* Daylight lighting
* Camera views

The Blender project should be modular, realistic, and ready for Phase 2, where interactive inspection and component metadata will be added.
