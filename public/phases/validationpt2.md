I want to use this experimental IGBT ageing dataset to test whether the
physical degradation mechanism used in my inverter digital twin is
consistent with real measured semiconductor ageing.

IMPORTANT:
This is NOT a direct validation of my frozen Raman-DTS XGBoost classifier.
Do not try to force the experimental data into my existing features:

    Rel_Delta_T_surface
    Rel_Max_abs_dT_dx

The experimental dataset should instead be used to validate the
underlying thermal-degradation physics.

DATASET
=======

Experimental Si IGBT accelerated power-cycling ageing dataset:

https://dataverse.csuc.cat/dataset.xhtml?persistentId=doi:10.34810/DATA3204

The dataset contains experimental measurements from Si IGBTs undergoing
accelerated ageing / power cycling.

Potentially relevant variables include:

    junction temperature, Tj
    case temperature, Tc
    ambient temperature, Tamb
    collector current, Ic
    VCE(sat)
    conduction loss / Pce
    junction-to-case thermal resistance, Rth_jc

First inspect the actual downloaded files and column names.
Do not assume the names above are exact.


MY DIGITAL-TWIN DEGRADATION MODEL
=================================

My Simulink electrothermal model represents degradation by increasing an
internal thermal resistance:

    Rth_degraded = alpha_deg * Rth_healthy

The degradation sweep is:

    Healthy   alpha_deg = 1.00
    Mild      alpha_deg = 1.25
    Moderate  alpha_deg = 1.50
    Severe    alpha_deg = 2.00

These four values are synthetic simulation sweep levels.
They are NOT universal physical thresholds.

My goal is to determine whether the experimental IGBT data show the same
general physical behaviour:

    thermal resistance increases with ageing

and whether this increase produces corresponding changes in measured
temperature behaviour.


PRIMARY TASK
============

1. Inspect all files in the experimental dataset.

2. Report:
   - file names
   - device IDs
   - number of samples
   - available columns
   - units
   - sampling / cycle information
   - whether measurements are raw or processed
   - whether Rth_jc is directly supplied or must be calculated

3. Identify the quantity that best represents thermal degradation.

Priority:

    Rth_jc

If Rth_jc is directly provided, use it.

If it is not directly provided but the required quantities exist,
investigate whether it can physically be estimated using:

    Rth_jc = (Tj - Tc) / P_loss

Only calculate this if:
   - Tj and Tc are measured appropriately
   - P_loss is physically compatible
   - the operating state is suitable for this relationship

Do not calculate it blindly.


NORMALISED EXPERIMENTAL DEGRADATION
===================================

For each IGBT device, define an initial healthy thermal-resistance
reference.

Prefer a robust baseline rather than a single potentially noisy point.

For example:

    Rth0 = median(Rth_jc over an initial healthy window)

Then calculate:

    alpha_exp(t) = Rth_jc(t) / Rth0

This quantity should represent relative thermal-resistance growth.

Do this separately for each device.

Do not combine the devices before baseline normalisation.


DATA CLEANING
=============

Before analysis:

1. Check for:
   - NaNs
   - infinities
   - impossible temperatures
   - zero or negative loss values
   - duplicate timestamps / cycles
   - obvious sensor dropouts
   - extreme outliers

2. Do not aggressively remove legitimate degradation behaviour.

3. Keep both:
   - raw data
   - cleaned analysis data

4. Document every filtering rule.


ANALYSIS 1 — THERMAL RESISTANCE DEGRADATION
===========================================

For each device, plot:

    Rth_jc vs ageing cycle / time

and:

    alpha_exp vs ageing cycle / time

Determine:

    initial Rth_jc
    final Rth_jc
    percentage increase
    maximum alpha_exp
    median alpha_exp
    trend with ageing

Also determine whether alpha_exp evolves monotonically or whether
substantial fluctuations exist.


ANALYSIS 2 — COMPARE WITH MY SIMULATION LEVELS
==============================================

Overlay horizontal reference lines at:

    alpha = 1.00
    alpha = 1.25
    alpha = 1.50
    alpha = 2.00

These are SIMULATION REFERENCE LEVELS ONLY.

Do not label experimental data as Mild / Moderate / Severe unless the
experimental alpha_exp actually reaches those regions.

For each device, report whether the experimental ageing trajectory reaches:

    alpha_exp >= 1.25
    alpha_exp >= 1.50
    alpha_exp >= 2.00

If it crosses a threshold, report the approximate cycle / time.

Important:
Do not claim that 1.25, 1.50 and 2.00 are experimentally validated
severity thresholds.

The purpose is only to compare the scale of experimentally observed
thermal-resistance growth with the parameter sweep used in my digital
twin.


ANALYSIS 3 — TEMPERATURE RESPONSE
=================================

Investigate whether increasing alpha_exp is associated with increasing
temperature stress.

Where available, calculate and analyse:

    DeltaT_jc = Tj - Tc

    DeltaT_ja = Tj - Tamb

    DeltaT_ca = Tc - Tamb

Plot these quantities against:

    ageing cycle / time

and against:

    alpha_exp

Calculate suitable correlations such as:

    corr(alpha_exp, DeltaT_jc)
    corr(alpha_exp, DeltaT_ja)

Use Pearson and Spearman correlation where appropriate.

Do not claim causality based only on correlation.


ANALYSIS 4 — ELECTRICAL AGEING INDICATORS
=========================================

If VCE(sat), collector current, or loss data are available, analyse their
relationship with alpha_exp.

For example:

    VCE(sat) vs cycle
    VCE(sat) vs alpha_exp
    P_loss vs alpha_exp

Determine whether electrical ageing indicators change alongside thermal
resistance.

This is relevant because my digital twin may eventually include both:

    semiconductor electrical degradation
    thermal-path degradation


ANALYSIS 5 — OPERATING-CONDITION CONTROL
========================================

Before attributing temperature changes to degradation, inspect whether
the operating conditions change substantially over the experiment.

Check variables such as:

    collector current
    power loss
    ambient temperature
    switching / duty conditions
    cooling conditions

If these vary, separate operating-condition effects from degradation as
far as possible.

For example, compare temperature rise at similar:

    current
    loss
    ambient temperature

Do not conclude that higher temperature automatically means greater
degradation if the device was simply operated at a higher load.


ANALYSIS 6 — PHYSICS CONSISTENCY TEST
=====================================

Test the following hypothesis:

    Increased experimentally measured Rth_jc is associated with a larger
    temperature difference for comparable power dissipation.

For comparable operating points, assess whether:

    DeltaT_jc ≈ P_loss * Rth_jc

holds approximately.

Where possible, compare:

    DeltaT_jc_measured

with:

    DeltaT_jc_predicted = P_loss * Rth_jc

Calculate:

    MAE
    RMSE
    mean bias error
    R^2

Only do this where the relationship is physically valid and the required
quantities are available.


OPTIONAL DEGRADATION-STATE BINNING
==================================

Only after completing the continuous alpha_exp analysis, create an
OPTIONAL demonstration mapping based on my simulation sweep:

    Healthy-like:
        alpha_exp < 1.125

    Mild-like:
        1.125 <= alpha_exp < 1.375

    Moderate-like:
        1.375 <= alpha_exp < 1.75

    Severe-like:
        alpha_exp >= 1.75

These boundaries are merely midpoints between my simulation alpha values.

They must be clearly described as:

    "simulation-aligned comparison bins"

NOT experimentally established degradation classes.

If these bins are scientifically misleading for this dataset, do not use
them.


MACHINE-LEARNING OPTION
=======================

Do NOT run my existing frozen Raman-DTS XGBoost model on this dataset.

If enough experimental samples are available, create a separate optional
experimental ML analysis.

Possible predictors may include:

    Tj
    Tc
    Tamb
    DeltaT_jc
    DeltaT_ja
    VCE(sat)
    Ic
    P_loss

Possible targets:

A. continuous:
       alpha_exp

   using XGBoost regression

or

B. experimental degradation stage derived from ageing progression

   using XGBoost classification

If doing ML:

1. Split data by chronological ageing progression or by entire device.
2. Do NOT randomly mix neighbouring measurements from the same ageing
   trajectory between train and test because this can cause severe data
   leakage.
3. Prefer:
       train on some devices
       test on a completely unseen device
   if the number of devices allows it.
4. Report clearly that this is a NEW experimental model, separate from
   the Raman-DTS classifier.


PUBLICATION-QUALITY FIGURES
===========================

Create publication-quality figures for:

1. Rth_jc vs ageing cycle for each device
2. alpha_exp vs ageing cycle
3. alpha_exp with horizontal lines at 1.00, 1.25, 1.50 and 2.00
4. DeltaT_jc vs alpha_exp
5. VCE(sat) vs alpha_exp, if available
6. measured vs predicted DeltaT_jc, if valid

Use clear units and legends.
Do not use misleading smoothing.
If smoothing is useful, show raw data as well.


OUTPUT FILES
============

Create:

    experimental_igbt_summary.csv

with one row per device containing:

    device_id
    initial_Rth_jc
    final_Rth_jc
    percent_Rth_increase
    max_alpha_exp
    reaches_1p25
    reaches_1p50
    reaches_2p00

Also create:

    experimental_igbt_processed.csv

containing the processed time-series data and alpha_exp.

Save all figures into:

    results/experimental_validation/


FINAL REPORT
============

At the end, produce a concise technical summary answering:

1. Does real IGBT ageing produce measurable growth in thermal resistance?

2. What range of alpha_exp occurs experimentally?

3. Are my simulation values:
       1.00, 1.25, 1.50, 2.00
   within or outside the experimentally observed range?

4. Does greater thermal resistance correspond to increased temperature
   rise under comparable operating conditions?

5. Are the simulation degradation levels physically plausible as a
   sensitivity sweep?

6. Which claims are supported?

Use one of these levels:

A.
"The exact digital-twin degradation parameters were experimentally
validated."

B.
"The thermal-degradation mechanism used by the digital twin was
supported by independent experimental IGBT ageing data."

C.
"The experimental data showed qualitatively consistent ageing trends,
but direct quantitative validation was not possible."

D.
"The dataset was not sufficiently comparable to support the thermal
degradation model."

Be conservative.

The preferred outcome, if the evidence supports it, is B or C.
Do NOT upgrade the conclusion to A unless the experiment genuinely
matches the model parameters and conditions.


IMPORTANT WRITING RULE
======================

Never write:

    "The XGBoost classifier was validated using this experimental
    dataset."

unless the actual frozen model and exact trained features have been
tested, which is not the purpose of this experiment.

Instead, if supported, write:

    "Independent experimental IGBT ageing data were used to assess the
    physical plausibility of the thermal-resistance degradation mechanism
    represented in the digital twin."

I need results that are defensible in an undergraduate research paper,
not merely code that executes successfully.