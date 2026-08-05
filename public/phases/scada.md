You are an expert Blender Python developer, UI/UX designer, and industrial SCADA interface designer.

Refactor the current Phase 4 Digital Twin interface.

Do not change any backend functionality.

Do not remove existing operators.

Do not modify the digital twin data model.

Only redesign the UI.

The goal is to replace the current large replay control panel at the bottom of the screen with a compact industrial-style status bar.

The replay timeline should only appear when Replay Mode is active.

----------------------------------------------------
OBJECTIVE
----------------------------------------------------

The current bottom panel resembles a media player.

Instead, make it behave like a professional SCADA or condition monitoring application.

Examples of inspiration:

• Siemens WinCC
• Ignition SCADA
• AVEVA System Platform
• GE iFIX
• National Instruments LabVIEW
• OSI PI Vision

The interface should always prioritize system state rather than playback controls.

----------------------------------------------------
DEFAULT LAYOUT
----------------------------------------------------

The application should consist of:

TOP

Application header

RIGHT

Digital Twin Dashboard

CENTER

3D Viewport

BOTTOM

Compact Status Bar

The status bar should remain visible at all times.

----------------------------------------------------
STATUS BAR
----------------------------------------------------

Height:

Approximately 36–44 pixels.

Dark background.

Minimal spacing.

Professional engineering appearance.

No large buttons.

----------------------------------------------------
STATUS BAR CONTENT
----------------------------------------------------

Display only the most important information.

Example layout:

Health

80%

|

Connection

Connected

|

Selected Inverter

INV-001

|

Selected Component

IGBT-02

|

Temperature

59°C

|

Fault

Thermal Interface Degradation

|

Mode

Fault Injection

|

Time

12:41:08

Use small coloured status badges.

Green

Healthy

Yellow

Warning

Orange

Maintenance

Red

Critical

Grey

Offline

Do not colour the entire status bar.

Only colour the badges.

----------------------------------------------------
MODE-DEPENDENT STATUS
----------------------------------------------------

The bottom bar should adapt to the selected operating mode.

----------------------------------------------------
INSPECT MODE
----------------------------------------------------

Display:

Selected inverter

Selected component

Temperature

Health

Status

----------------------------------------------------
LIVE MODE
----------------------------------------------------

Display:

Connection state

Last update

Update rate

Packets received

Current timestamp

Optional recording indicator

Example:

Connected

2 Hz

12:41:08

REC ●

----------------------------------------------------
FAULT INJECTION MODE
----------------------------------------------------

Display:

Scenario

Current severity

Health

Fault progression

Example:

TIM Degradation

35%

Health 80%

----------------------------------------------------
PREDICTION MODE
----------------------------------------------------

Display:

Prediction horizon

Predicted health

Predicted temperature

Remaining useful life

Example:

Prediction

24 h

Health

62%

RUL

31 Days

----------------------------------------------------
RAMAN MODE
----------------------------------------------------

Display:

Fibre temperature

Hotspot distance

Maximum temperature

Pulse state

----------------------------------------------------
REPLAY MODE
----------------------------------------------------

Replay Mode is the ONLY mode where the status bar expands.

When Replay Mode is selected:

Animate the bottom status bar upward.

Expand it into a timeline.

Example:

------------------------------------------------------------

Replay

▶

Pause

Stop

━━━━━━━━━━━━●━━━━━━━━━━━━

12:31

/

30:00

Playback Speed

1×

------------------------------------------------------------

The expanded panel should remain relatively compact.

Avoid taking up excessive vertical space.

----------------------------------------------------
COLLAPSE BEHAVIOUR
----------------------------------------------------

Leaving Replay Mode should:

hide the timeline

restore the compact status bar

keep replay state internally

The replay position should not reset automatically.

----------------------------------------------------
TRANSITIONS
----------------------------------------------------

Animate transitions.

Examples:

Status bar

↓

Replay panel

↓

Status bar

Use subtle easing.

Approximately

200–300 ms

No abrupt UI changes.

----------------------------------------------------
RIGHT DASHBOARD
----------------------------------------------------

Do not move the existing SCADA dashboard.

Keep:

Overview

Asset Inspection

Analysis

Controls

System

exactly as they are.

The dashboard remains the primary interaction area.

The bottom bar is only for quick situational awareness.

----------------------------------------------------
QUICK STATUS ICONS
----------------------------------------------------

Use compact icons.

Examples:

Connection

Wi-Fi / Plug icon

Temperature

Thermometer

Health

Heart / Shield

Fault

Warning triangle

Mode

Chip / Gear

Time

Clock

Do not overuse icons.

Keep the design clean.

----------------------------------------------------
STATUS PRIORITY
----------------------------------------------------

Always show the highest priority information first.

Critical alarms should replace less important information.

Example:

🚨 Critical Alarm

INV-001

IGBT Temperature

92°C

instead of

Connection

Connected

----------------------------------------------------
IMPLEMENTATION
----------------------------------------------------

Refactor only the UI.

Reuse existing:

operators

PropertyGroups

data model

state management

event system

mode switching

No duplicated code.

Create helper functions such as:

draw_status_badge()

draw_status_bar()

draw_live_status()

draw_fault_status()

draw_prediction_status()

draw_raman_status()

draw_replay_bar()

update_status_context()

----------------------------------------------------
DESIGN GOAL
----------------------------------------------------

The interface should feel like industrial monitoring software.

The user should always understand:

• what inverter is selected

• current health

• current fault

• current operating mode

• connection state

within one second.

Replay controls should only appear when the user is actively reviewing historical data.

The final interface should resemble a professional SCADA system rather than a multimedia player while preserving all existing functionality.