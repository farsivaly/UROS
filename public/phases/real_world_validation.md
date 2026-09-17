I am validating an XGBoost degradation classifier developed for a
physics-informed digital twin of a PV string inverter.

I want you to investigate three independent real-world/experimental
datasets and determine whether they can be used for external validation
of my existing model.

DATASETS
========

1. Solar-powered inverter / submersible pump dataset:
https://data.mendeley.com/datasets/wgfhmx37ng/3

2. GPVS-Faults experimental PV fault dataset:
https://data.mendeley.com/datasets/n76t439f65/1

3. NREL/NLR PV Inverter Experimental Dataset Version 2:
https://data.nlr.gov/submissions/217


MY EXISTING MODEL
=================

My XGBoost classifier has already been trained using a 100-run
MATLAB/Simulink electrothermal degradation dataset.

Do NOT retrain the model using the external datasets unless I explicitly
ask you to later.

The classifier uses exactly TWO input features:

    Rel_Delta_T_surface
    Rel_Max_abs_dT_dx

The target classes are:

    Healthy
    Mild
    Moderate
    Severe

The Simulink degradation classes represent controlled increases in
internal inverter thermal resistance:

    Healthy  -> alpha_deg = 1.00
    Mild     -> alpha_deg = 1.25
    Moderate -> alpha_deg = 1.50
    Severe   -> alpha_deg = 2.00

These are synthetic degradation levels used in the digital twin. They
must NOT automatically be assumed equivalent to fault labels in an
external experimental dataset.


FEATURE DEFINITIONS
===================

Rel_Delta_T_surface represents a load/operating-condition-normalised
surface temperature-rise feature derived from the inverter thermal
response.

The underlying temperature-rise quantity is approximately:

    Delta_T_surface =
        max(T_surface) - T_surface_initial

or, where appropriate for experimental data,

    Delta_T_surface =
        T_surface/heatsink - T_ambient

depending on how the original feature-generation code defines the
normalisation.

Rel_Max_abs_dT_dx represents a normalised spatial thermal-gradient
feature obtained from the distributed temperature profile:

    Max_abs_dT_dx =
        max(abs(dT/dx))

In my simulation this comes from a 41-channel Raman DTS spatial
temperature profile.

IMPORTANT:
A dataset containing only one temperature sensor CANNOT legitimately
produce dT/dx.

Do not invent, estimate, interpolate, or fabricate this feature from
non-spatial measurements.


PRIMARY TASK
============

For EACH of the three datasets:

1. Download and inspect the actual files.

2. Report:
   - dataset name
   - whether measurements are experimental, field, or simulated
   - number of files/records
   - sampling rate or timestamps if available
   - inverter/PV system type
   - available electrical variables
   - available temperature variables
   - available spatial temperature measurements
   - available fault/degradation labels

3. Determine whether Rel_Delta_T_surface can be calculated legitimately.

4. Determine whether Rel_Max_abs_dT_dx can be calculated legitimately.

5. Determine whether the dataset's ground-truth labels can legitimately
   be mapped to:
       Healthy
       Mild
       Moderate
       Severe

Do NOT create an arbitrary mapping just to make classification possible.

6. Classify each dataset into one of these categories:

   A. DIRECT XGBOOST TEST
      Both required features and compatible ground-truth degradation
      labels are available.

   B. PARTIAL THERMAL VALIDATION
      Real thermal measurements are available, but one or more XGBoost
      features or compatible labels are missing.

   C. ELECTRICAL / DIGITAL-TWIN VALIDATION
      Useful inverter measurements exist, but the dataset cannot
      legitimately test the thermal classifier.

   D. NOT USEFUL FOR THIS PROJECT

7. Explain your reasoning for the category.


FROZEN MODEL TEST
=================

If, and ONLY if, a dataset genuinely provides both required features:

1. Load my existing saved XGBoost model.
2. Use exactly the same feature order:

       Rel_Delta_T_surface
       Rel_Max_abs_dT_dx

3. Apply exactly the same preprocessing and normalisation used during
   training.

4. Do NOT fit:
   - a new scaler
   - new thresholds
   - a new classifier
   - new feature transformations

   using the test data.

5. Do NOT use any external test samples for:
   - feature selection
   - hyperparameter optimisation
   - threshold selection
   - retraining

6. Run inference using the frozen model.

7. If compatible ground-truth labels exist, calculate:

   - number of independent test samples
   - number correctly classified
   - overall accuracy
   - per-class precision
   - per-class recall
   - per-class F1-score
   - macro F1-score
   - confusion matrix

8. Plot a publication-quality confusion matrix.

9. Save predictions to CSV with columns similar to:

       source_dataset
       sample_id
       ground_truth
       predicted_class
       Rel_Delta_T_surface
       Rel_Max_abs_dT_dx
       correct


VERY IMPORTANT SCIENTIFIC CONSTRAINT
====================================

Do not force these external datasets into my XGBoost model.

If a dataset does not contain the measurements necessary to construct
both input features, STOP the direct-classification attempt for that
dataset.

For example, if a dataset contains heatsink temperature but no spatial
temperature measurements, report:

    Rel_Delta_T_surface: potentially available
    Rel_Max_abs_dT_dx: unavailable
    Direct frozen-XGBoost testing: not valid

Then determine how the dataset can instead be used for independent
validation of the electrothermal digital twin.


THERMAL MODEL VALIDATION
========================

For datasets containing real heatsink, inverter, cabinet, or component
temperature measurements, investigate whether they can validate the
thermal model independently of XGBoost.

Where possible, compare quantities such as:

    measured temperature rise
    predicted temperature rise
    temperature above ambient
    thermal transient shape
    steady-state temperature
    temperature versus load/power
    maximum temperature

Where corresponding model predictions are available, calculate:

    MAE
    RMSE
    maximum absolute error
    mean bias error
    R^2

Do not claim experimental validation unless the measured and simulated
quantities are physically comparable.


OUTPUT
======

Create a concise comparison table:

Dataset | Real/Experimental? | Temperature data? |
Spatial temperature? | Fault labels? |
Rel_Delta_T_surface? | Rel_Max_abs_dT_dx? |
Direct XGBoost test valid? | Best use

Then give a recommendation ranked:

    1. Most useful
    2. Second most useful
    3. Third most useful

Finally, state explicitly which of the following claims the evidence
would support:

A. "The XGBoost classifier was independently tested using experimental
   data."

B. "The thermal digital twin was validated against experimental data."

C. "External experimental data were used to assess the physical
   consistency of the simulated thermal behaviour."

D. None of the above.

Be conservative. I need conclusions that are defensible in an
undergraduate research paper and presentation.

Do not report a successful XGBoost external validation simply because
the code executes. The physical meaning and provenance of the features
must match first.