Think of it as a virtual laboratory

Instead of:

"This is the inverter."

Start with:

"A solar farm has suddenly reported a fault. Your job is to investigate why."

Now the student has a purpose.

Lesson 1 — How does electricity flow?

Start at the solar panels.

Highlight them.

Explain:

Sunlight produces DC electricity in the photovoltaic modules.

Animate DC cables.

Then:

The electricity travels to the string inverter.

Highlight one inverter.

Only then let the student enter it.

Lesson 2 — What's inside an inverter?

Open the cabinet automatically.

Don't show every component.

Instead tell a story.

Electricity enters here...

Highlight the DC disconnect.

Then:

The MPPT continuously adjusts the operating point of the solar panels to maximise power.

Highlight the MPPT.

Next:

The IGBT modules rapidly switch the DC power to generate AC.

Animate the power path.

Then:

Switching generates heat.

Highlight the IGBT.

Only now introduce the heat sink.

The heat sink removes this heat before temperatures become dangerous.

Then:

Cooling fan.

Then:

Busbars.

Then:

Capacitors.

The user understands why each component exists.

Lesson 3 — Why do faults happen?

Now ask:

What happens if the heat sink becomes less effective?

Introduce thermal interface degradation.

Move the slider.

Show:

hotspot appears
temperature increases

Ask:

How would we detect this before failure?

Now Raman fibre makes sense.

Lesson 4 — Raman DTS

Instead of opening with equations...

Animate:

Laser pulse

↓

Travels through fibre

↓

Returns

↓

Temperature profile appears

Then explain:

The anti-Stokes signal changes with temperature.

Show the graph.

Now the graph has context.

Lesson 5 — Digital Twin

Now reveal the dashboard.

Explain:

The dashboard isn't measuring anything directly.

It visualises processed information coming from MATLAB and Raman DTS.

Now:

Temperature

↓

Health

↓

Prediction

↓

Maintenance

Lesson 6 — Prediction

Move slider.

Hotspot grows.

Health decreases.

ML confidence increases.

Ask:

Would you continue operating this inverter?

Show recommendation.

The interface should guide them

Instead of one huge sidebar:

Lesson Progress

✓ Solar Farm

► Inside the Inverter

□ Heat Generation

□ Raman Sensing

□ Digital Twin

□ Predictive Maintenance

Each lesson unlocks the next.

Then Expert Mode

Professor clicks

Skip Tutorial

Immediately gets

dashboard
controls
graphs
fault injection

No explanations.

I would completely change the philosophy

Don't build:

"an interface with educational text"

Build:

"an interactive engineering investigation."

The student becomes the engineer.

They don't memorize:

"IGBT = Insulated Gate Bipolar Transistor."

They discover:

"The IGBT is getting hot... why? Oh, because it's switching high power. The heat sink removes that heat. If the thermal interface degrades, a hotspot forms. The Raman fibre detects that hotspot. The digital twin visualizes it. The prediction module recommends maintenance."

That is a coherent learning journey, and it's much more likely to stick.

For a UCL research showcase, this narrative approach will also be far more engaging than a component-by-component walkthrough because visitors leave understanding the whole system, not just isolated parts.