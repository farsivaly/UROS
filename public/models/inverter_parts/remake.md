You are an expert Blender hard-surface modeller, industrial layout designer, and Blender MCP assistant.

Clean up and reorganise the existing string inverter interior.

Do not rebuild the inverter from scratch.

Preserve:

- cabinet dimensions
- door and hinge
- existing component IDs
- object custom properties
- Raman fibre
- digital-twin links
- interaction logic
- exploded view
- X-ray mode
- thermal overlays
- Learning Mode and Expert Mode

The current interior looks visually messy because components overlap, several large blocks compete for attention, the centre is overcrowded, and temporary thermal or hotspot geometry obscures the actual equipment.

The goal is to create a clean, believable, readable industrial layout.

==================================================
1. INSPECT FIRST
==================================================

Use Blender MCP to inspect:

- all inverter interior objects
- current object names
- parent-child relationships
- bounding boxes
- object origins
- current transforms
- current interactive metadata
- hotspot objects
- thermal overlay objects
- Raman fibre route
- exploded-view transform storage
- X-ray material references

Create a temporary report identifying:

- overlapping objects
- objects intersecting the cabinet
- objects floating without mounts
- objects blocking other components
- oversized hotspot geometry
- duplicated objects
- objects facing the wrong direction
- inconsistent spacing
- objects not aligned to the mounting backplate

Do not rename referenced assets unless necessary.

==================================================
2. REMOVE VISUAL CLUTTER
==================================================

Reduce clutter before adding more detail.

Temporarily hide or disable:

- hotspot overlays
- thermal glow objects
- learning arrows
- large translucent spheres
- Raman pulse effects
- temporary debug geometry
- duplicate labels

These effects must remain available through the existing digital-twin controls, but they should not be visible in the default static inspection state.

Default state:

- thermal overlay off
- hotspot off
- Raman pulse off
- debug objects hidden
- educational arrows hidden

The inverter should look clean before any data visualisation is enabled.

==================================================
3. CREATE CLEAR FUNCTIONAL ZONES
==================================================

Reorganise the cabinet into five readable zones.

TOP LEFT:
Cooling and air intake

TOP RIGHT:
Control electronics and auxiliary electronics

CENTRE:
IGBT power stage, TIM and heat sink

LOWER CENTRE:
DC-link capacitors and copper busbars

BOTTOM:
DC input, AC output and terminal section

Use this layout:

String Inverter Interior
├── Top Left — Cooling
│   ├── Intake Fan
│   ├── Air Duct
│   └── Exhaust Path
├── Top Right — Control
│   ├── Main PCB
│   ├── Driver Board
│   └── Communication Module
├── Centre — Power Stage
│   ├── IGBT Modules
│   ├── TIM Layers
│   └── Heat Sink
├── Lower Centre — Energy Storage
│   ├── DC-Link Capacitor Bank
│   └── Busbars
└── Bottom — Connections
    ├── DC Input Terminals
    ├── DC Disconnect
    ├── AC Output Terminals
    ├── Ground Bar
    └── Cable Glands

Do not place unrelated objects in the middle of the power stage.

==================================================
4. USE A CLEAN BACKPLATE GRID
==================================================

Treat the cabinet backplate like an industrial mounting panel.

Align components to a clear grid.

Requirements:

- consistent horizontal spacing
- consistent vertical spacing
- components aligned to shared centre lines
- equal margins from cabinet walls
- no random offsets
- no floating components
- major components mounted on rails, brackets, or the backplate

Use approximately:

- 40–70 mm spacing between major assemblies
- 15–30 mm spacing between related subcomponents
- 50 mm minimum clearance from cabinet edges
- clear service space around fans and terminals

Keep the exact values proportional to the current cabinet scale.

==================================================
5. CENTRE THE MAIN THERMAL STORY
==================================================

Make the main research chain the visual focus:

IGBT
→ TIM
→ Heat Sink
→ Cooling Air
→ Raman Fibre

Place this assembly centrally and make it easy to understand.

Recommended arrangement:

- heat sink mounted against the rear backplate
- IGBT modules mounted directly onto the heat-sink base
- TIM layers visibly sandwiched between them
- fan and duct aligned with heat-sink fins
- Raman fibre routed across or beside the IGBT/TIM/heat-sink interface

Do not place unrelated PCB or capacitor geometry over this assembly.

==================================================
6. SCALE COMPONENTS CONSISTENTLY
==================================================

Review the size of every component.

The current scene contains objects that appear oversized relative to the cabinet.

Correct proportions so that:

- fans fit logically within the cabinet
- PCB assemblies do not dominate the entire upper section
- capacitors form a compact bank
- busbars remain thin and plate-like
- cable glands remain small
- terminal blocks remain compact
- Raman fibre remains thin
- hotspot objects remain local when enabled

Avoid huge circular or spherical hotspot meshes.

A hotspot should usually cover only a small region of the IGBT, TIM or heat sink.

==================================================
7. CLEAN THE POWER STAGE
==================================================

Create one organised central power-stage assembly.

Suggested structure:

PowerStage
├── HeatSink
├── IGBT_01
├── IGBT_02
├── TIM_IGBT_01
├── TIM_IGBT_02
├── DriverPCB
└── MountingHardware

Requirements:

- no intersecting components
- IGBTs evenly spaced
- TIM layers directly behind IGBTs
- terminals facing the busbar side
- driver PCB placed close but not overlapping
- heat-sink fins visible
- all parts mounted to one logical support structure

==================================================
8. ORGANISE CAPACITORS AND BUSBARS
==================================================

Group the capacitors into one deliberate bank.

Requirements:

- use a horizontal or vertical row
- align capacitor terminals
- add one mounting bracket
- place busbars directly above or below the capacitor terminals
- keep positive and negative busbars parallel
- attach busbars using visible bolts and insulating supports
- avoid long floating copper strips

The capacitor bank should connect visually to the IGBT power stage.

==================================================
9. ORGANISE CONTROL ELECTRONICS
==================================================

Move the main PCB and auxiliary boards to one side of the cabinet.

Preferred position:

- upper right
- away from the hottest zone
- mounted on standoffs
- connected using short ribbon cables or wiring ducts

Do not scatter separate PCB blocks across the cabinet.

Use:

ControlElectronics
├── MainPCB
├── DriverPCB
├── CommunicationModule
└── TerminalConnectorBlock

==================================================
10. ORGANISE THE COOLING SYSTEM
==================================================

Place cooling fans in a consistent airflow arrangement.

Avoid placing one fan randomly above each large block.

Use either:

Option A:
Two intake fans aligned along the upper or lower wall

or

Option B:
One intake fan and one exhaust fan aligned with the heat sink

Add a simple duct or shroud so the airflow path is obvious.

Do not let fans intersect PCB or cabinet walls.

==================================================
11. CLEAN RAMAN FIBRE ROUTING
==================================================

Reroute the Raman fibre cleanly.

Requirements:

- enter through one cable gland
- follow cabinet edges or cable ducts
- pass close to the capacitor bank
- pass directly across the IGBT/TIM/heat-sink region
- exit or terminate at a clear sensing interface
- use smooth bend radii
- avoid diagonal lines cutting through open space
- add fibre clips at regular intervals
- prevent intersections with cabinet walls and components

The fibre should look installed, not drawn across the cabinet.

==================================================
12. ADD VISUAL HIERARCHY
==================================================

Use materials and colour restraint.

Suggested default palette:

- cabinet: light grey
- heat sink: aluminium
- IGBT body: black or dark grey
- PCB: dark green
- capacitors: dark grey or blue
- busbars: copper
- fibre: cyan or orange
- terminals: grey with small red, black, and yellow markers
- safety elements: restrained orange or yellow

Do not use bright colours on large surfaces unless they represent an active digital-twin state.

The default static model should remain neutral.

==================================================
13. FIX HOTSPOT VISUALISATION
==================================================

Replace the current large overlapping hotspot spheres with a localised system.

Requirements:

- one hotspot per affected region
- small default radius
- attached to a specific component
- no large opaque sphere
- use a surface decal, gradient patch, transparent overlay, or emission mask
- hidden when thermal visualisation is disabled
- scaled according to severity
- no overlap with unrelated parts

Suggested default radius:

- 3–8% of the affected component width

Suggested severe radius:

- maximum 20–30% of the affected component width

Do not allow the hotspot to cover the entire cabinet interior.

==================================================
14. ADD MOUNTING STRUCTURE
==================================================

Add lightweight industrial structure where needed:

- DIN rails
- horizontal mounting rails
- cable ducts
- PCB standoffs
- capacitor bracket
- fan brackets
- busbar insulators
- terminal rail
- cable glands

These details should support the layout rather than create more clutter.

==================================================
15. CHECK FRONT-VIEW READABILITY
==================================================

The cabinet must read clearly from a straight front view.

From the front camera, the user should immediately identify:

1. cooling system
2. control electronics
3. IGBT and heat-sink assembly
4. capacitor bank
5. busbars
6. input/output terminals
7. Raman fibre route

Avoid deep overlap along the viewing direction.

If two objects overlap visually, offset them slightly in X or Z while keeping the layout plausible.

==================================================
16. PRESERVE INTERACTION
==================================================

After reorganising:

- preserve selection metadata
- preserve parent inverter association
- update stored original transforms
- update exploded-view positions
- verify X-ray mode
- verify object focus buttons
- verify Learning Mode labels
- verify Expert Mode asset data
- verify thermal overlay targeting
- verify hotspot attachment
- verify Raman fibre profile mapping

Do not leave any operator referencing old transforms or removed objects.

==================================================
17. FINAL VALIDATION
==================================================

Perform these checks:

- no major object intersections
- no components floating
- no objects outside cabinet bounds
- no hotspot visible by default
- no duplicated large blocks
- fibre does not cut through components
- fans have clear airflow space
- busbars connect logically
- capacitors form one bank
- IGBTs contact TIM and heat sink
- PCB is mounted away from the power stage
- terminals are accessible
- door closes without collision
- exploded view still works
- reset restores exact positions
- X-ray mode still works
- thermal overlays still target correct assets

==================================================
DELIVERABLE
==================================================

Return a cleaned and reorganised inverter interior with:

- clear functional zoning
- central IGBT/TIM/heat-sink assembly
- compact capacitor bank
- organised busbars
- grouped control electronics
- believable cooling layout
- clean Raman fibre routing
- hidden default hotspot effects
- consistent scale
- no major overlaps
- preserved digital-twin behaviour

The finished cabinet should look like a deliberate industrial assembly rather than overlapping placeholder components.

Prioritise clarity first, realism second, and extra detail third.