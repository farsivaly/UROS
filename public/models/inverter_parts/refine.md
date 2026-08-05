You are an expert Blender hard-surface modeller, Blender MCP assistant, and industrial product designer.

Refine the existing string inverter interior into a polished "hero inverter" suitable for an interactive digital twin.

Do NOT rebuild the inverter.

Do NOT change the existing digital twin architecture.

Preserve:

- all object names
- custom properties
- component IDs
- interaction logic
- exploded view
- X-ray mode
- Raman fibre
- thermal overlays
- hotspot system
- Python operators
- Learning Mode
- Expert Mode

The current layout is good but still feels like a prototype.

The objective is to make it look like a professionally engineered industrial inverter while keeping the layout clean and easy to understand.

--------------------------------------------------
PRIORITY 1 — CREATE A HERO POWER STAGE
--------------------------------------------------

The centre of the cabinet should immediately attract attention.

Create one refined power-stage assembly consisting of:

Heat Sink
↓

TIM Layer
↓

IGBT Modules

The heat sink should become the dominant visual object.

Requirements:

• extruded aluminium fins
• realistic mounting plate
• visible bolts
• mounting brackets
• industrial proportions
• clean aluminium material

Mount the IGBT modules directly onto the heat sink.

Each IGBT should include:

• realistic body
• screw terminals
• copper baseplate
• mounting bolts
• small manufacturer-style label (generic)
• cable connections to busbars

Between the IGBT and heat sink create a visible TIM layer.

The TIM should:

• be extremely thin
• be selectable
• have its own material
• remain visible in exploded view

This assembly is the centrepiece of the digital twin.

--------------------------------------------------
PRIORITY 2 — IMPROVE THE COOLING SYSTEM
--------------------------------------------------

Redesign the cooling section.

The fans should no longer appear attached directly to the wall.

Create:

Cabinet
↓

Fan Grille

↓

Fan

↓

Air Duct

↓

Heat Sink

Use a simple duct to show airflow direction.

Keep it realistic.

Do not animate airflow yet.

--------------------------------------------------
PRIORITY 3 — REBUILD THE CAPACITOR BANK
--------------------------------------------------

Replace isolated capacitors with a proper capacitor bank.

Arrange capacitors in a neat row.

Add:

• mounting brackets
• terminal connections
• busbar connections

Keep spacing even.

--------------------------------------------------
PRIORITY 4 — IMPROVE BUSBARS
--------------------------------------------------

Current busbars are too subtle.

Create proper copper busbars.

Requirements:

• thicker copper
• rounded edges
• bolts
• insulating supports
• logical routing

Busbars should visually connect:

Capacitors

↓

IGBT Modules

↓

AC Output

--------------------------------------------------
PRIORITY 5 — IMPROVE PCB
--------------------------------------------------

Populate the control PCB.

Add:

• ICs
• connectors
• LEDs
• headers
• ribbon connectors
• mounting standoffs
• silkscreen markings

Avoid excessive detail.

Only enough to make it believable.

--------------------------------------------------
PRIORITY 6 — IMPROVE FIBRE ROUTING
--------------------------------------------------

Keep the Raman fibre.

Improve installation quality.

Requirements:

• smooth routing
• fibre clips every 150–250 mm
• entry gland
• exit gland
• avoid floating cable
• avoid sharp bends

Route it directly across:

IGBT

↓

TIM

↓

Heat Sink

↓

Capacitor region

--------------------------------------------------
PRIORITY 7 — CABINET DETAILS
--------------------------------------------------

Add subtle industrial details:

• DIN rail
• cable duct
• grounding strap
• warning labels
• QR equipment label
• cabinet nameplate
• mounting brackets
• cable glands
• terminal strip

Do not clutter the cabinet.

--------------------------------------------------
PRIORITY 8 — MATERIALS
--------------------------------------------------

Use realistic PBR materials.

Cabinet
Powder-coated steel

Heat sink
Brushed aluminium

Busbars
Copper

PCB
Dark green

IGBT
Dark plastic

TIM
Graphite grey

Capacitors
Dark grey

Cable insulation
Black

Fibre
Cyan

Use subtle roughness.

Avoid shiny plastic.

--------------------------------------------------
PRIORITY 9 — VISUAL HIERARCHY
--------------------------------------------------

The user's eye should naturally focus on:

1. Heat sink
2. IGBT modules
3. Raman fibre
4. Capacitor bank
5. PCB

Everything else supports these components.

Avoid giving every object equal visual importance.

--------------------------------------------------
PRIORITY 10 — COMPONENT LABEL SYSTEM
--------------------------------------------------

Create a professional interactive label system.

Every major component should have a floating engineering label.

Examples:

IGBT Module

Thermal Interface Material

Heat Sink

Cooling Fan

Control PCB

DC-Link Capacitor

Busbar

Raman DTS Fibre

DC Disconnect

AC Output

Labels should:

• always face the active camera
• use clean white text
• have a semi-transparent dark background
• use a small leader line pointing to the component
• remain readable
• never intersect geometry
• scale slightly with camera distance

--------------------------------------------------
LABEL TOGGLE
--------------------------------------------------

Add a new UI option:

Component Labels

☐ Off
☑ On

When OFF:

• hide all floating labels
• keep metadata intact

When ON:

display labels for all major components.

Also add:

Label Mode

• None
• Names Only
• Names + Temperature
• Names + Health

Examples:

IGBT Module

or

IGBT Module
61.2°C

or

IGBT Module
61.2°C
Health: 84%

This will be used in Learning Mode and demonstrations.

Expert Mode should default to:

Names Only

Learning Mode should default to:

Names + Temperature

--------------------------------------------------
IMPLEMENTATION
--------------------------------------------------

Do not duplicate objects.

Do not break object references.

Reuse current custom properties.

Create one reusable Label Manager responsible for:

• showing labels
• hiding labels
• updating positions
• billboard behaviour
• temperature updates
• health updates

Labels should automatically follow the component when:

• exploded view is enabled
• the cabinet opens
• X-ray mode is enabled
• components move

--------------------------------------------------
FINAL RESULT
--------------------------------------------------

The inverter should immediately communicate:

Electrical Path

PV
→ DC Input
→ Capacitors
→ IGBT
→ AC Output

Thermal Path

IGBT
→ TIM
→ Heat Sink
→ Cooling Air

Sensing Path

Heat Sink
→ Raman Fibre
→ DTS
→ Digital Twin

The finished inverter should feel like a professionally engineered inspection model rather than a collection of primitive shapes.

Prioritise clarity, realism, and educational value over adding more components.