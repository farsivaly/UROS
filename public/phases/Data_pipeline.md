I am building a machine-learning data pipeline for a research project on predictive maintenance of photovoltaic string inverters using simulated Raman Distributed Temperature Sensing (DTS).

I already have raw datasets generated from a MATLAB/Simulink physics-informed digital twin. Do NOT build the XGBoost model yet. First, I want a robust and modular Python feature-extraction pipeline that converts the raw simulation data into a clean ML-ready dataset.

PROJECT CONTEXT

The Simulink model represents:

Electrical inverter behaviour
→ IGBT losses
→ Cauer thermal model
→ thermal degradation
→ inverter surface temperature
→ fibre thermal response
→ Raman Stokes/anti-Stokes scattering
→ wavelength-dependent attenuation
→ Raman temperature reconstruction
→ spatial DTS temperature T_DTS(x,t)

For this first ML experiment:
- Raman attenuation is enabled.
- Raman measurement noise is disabled.
- Only ONE degradation mechanism is being investigated initially: thermal-path degradation.
- Four degradation states are currently used:

Healthy:  alpha_deg = 1.00
Mild:     alpha_deg = 1.25
Moderate: alpha_deg = 1.50
Severe:   alpha_deg = 2.00

The fibre model currently has:

L_fibre = 20 m
dx = 0.5 m
x_fibre = 0:0.5:20

Therefore there are 41 spatial measurement locations.

The inverter occupies:

x_inv_start = 5 m
x_inv_end = 7 m

IMPORTANT:
The raw Raman DTS output is spatial and temporal:

T_DTS(x,t)

Do not prematurely reduce the full 41-channel DTS dataset to one signal.

--------------------------------------------------
OBJECTIVE
--------------------------------------------------

Create a modular Python pipeline that:

1. Loads my existing raw simulation datasets.
2. Inspects and validates their structure.
3. Extracts temporal features from the inverter sensing region.
4. Extracts spatial features from the full DTS profile.
5. Adds run metadata and degradation labels.
6. Combines all simulation runs into one master feature dataframe.
7. Saves the result as a CSV ready for later XGBoost training.
8. Produces diagnostic plots so I can verify that feature extraction is physically sensible.

Do NOT train XGBoost yet.

--------------------------------------------------
PROJECT STRUCTURE
--------------------------------------------------

Create or use:

project/
│
├── data/
│   ├── raw/
│   └── processed/
│
├── src/
│   ├── data_loader.py
│   ├── feature_extraction.py
│   ├── build_dataset.py
│   └── validation.py
│
├── plots/
│
└── requirements.txt

Keep the code modular and readable rather than putting everything into one script.

--------------------------------------------------
STEP 1 — DATA INSPECTION
--------------------------------------------------

Before assuming column names or dimensions:

- Inspect every file in data/raw/
- Print file names
- Print shapes
- Print column names
- Print data types
- Print the first few rows
- Detect missing values
- Detect duplicated timestamps
- Identify likely time columns
- Identify likely DTS spatial channels

The raw files may be CSV or Excel.

Do not silently assume a particular schema.

If the data format cannot be confidently determined, stop with a clear diagnostic message rather than silently processing the wrong columns.

--------------------------------------------------
STEP 2 — SPATIAL COORDINATES
--------------------------------------------------

Define:

L_FIBRE = 20.0
DX = 0.5

x_fibre = np.arange(0, L_FIBRE + DX, DX)

Verify:

len(x_fibre) == 41

Define the inverter region:

X_INV_START = 5.0
X_INV_END = 7.0

Create:

inv_mask = (x_fibre >= X_INV_START) & (x_fibre <= X_INV_END)

The full DTS matrix should conceptually have shape:

n_time_samples × 41

If the imported data are transposed, detect this and convert them to this orientation.

Do not discard the full spatial matrix.

--------------------------------------------------
STEP 3 — INVERTER-REGION SIGNAL
--------------------------------------------------

Calculate an inverter-region DTS signal using:

T_DTS_inv(t) = mean of all DTS channels between 5 m and 7 m

Use this signal for temporal feature extraction.

Also retain the individual spatial channels for spatial feature extraction.

--------------------------------------------------
STEP 4 — TEMPORAL FEATURES
--------------------------------------------------

For each simulation run, calculate from T_DTS_inv(t):

1. baseline_T
2. Peak_T_DTS
3. Peak_T_time_s
4. Delta_T_DTS

Delta_T_DTS = Peak_T_DTS - baseline_T

5. AUC_DTS

AUC should represent integrated temperature rise above baseline:

AUC = integral [T(t) - T_baseline] dt

Use np.trapezoid().

6. AUC_positive_DTS

Integrate only positive temperature rise:

max(T(t) - T_baseline, 0)

7. Max_abs_dT_dt_DTS

Calculate:

dT/dt = np.gradient(T, time)

and return the maximum absolute value.

8. Steady_T_DTS

Use the mean of the final 5% of samples rather than simply taking the last point.

9. Rise_time_10_90_DTS

Calculate the time required to move from 10% to 90% of the final temperature rise.

Handle cases where this cannot be calculated cleanly by returning NaN rather than crashing.

--------------------------------------------------
STEP 5 — SPATIAL FEATURES
--------------------------------------------------

Use the full T_DTS(x,t) matrix.

At minimum calculate:

1. Hotspot_position_m
2. Hotspot_index
3. Peak_spatial_temperature
4. Max_abs_dT_dx
5. Mean_abs_dT_dx
6. Inverter_region_mean_T
7. Inverter_region_max_T
8. Background_mean_T

For spatial gradient:

dT/dx = np.gradient(T_profile, x_fibre)

Initially calculate spatial features from the final/steady-state profile.

Also structure the functions so that later I can calculate them at arbitrary time points.

IMPORTANT:
The current simulated inverter occupies the whole 5–7 m region, so do not overinterpret one exact point such as x = 5 m as a physically unique hotspot if several inverter-region channels have essentially equal temperatures.

If multiple positions are within a small numerical tolerance of the maximum, identify the hotspot as belonging to the inverter region rather than claiming unrealistic sub-grid localisation.

--------------------------------------------------
STEP 6 — OPTIONAL SURFACE-TEMPERATURE FEATURES
--------------------------------------------------

If the raw files contain inverter surface temperature T_surface(t), extract:

Peak_T_surface
Delta_T_surface
AUC_surface
Max_abs_dT_dt_surface
Steady_T_surface

Keep these separate from DTS features.

If T_surface is not available in a file, return NaN for these fields rather than failing.

--------------------------------------------------
STEP 7 — METADATA
--------------------------------------------------

Every row in the final dataset should contain:

run_id
source_file
severity
alpha_deg

Map the four current degradation conditions:

Healthy  -> 1.00
Mild     -> 1.25
Moderate -> 1.50
Severe   -> 2.00

If severity can be inferred from filenames, implement that carefully.

If it cannot be inferred confidently, provide a configuration dictionary where I can manually map filenames to severity.

Also make the pipeline ready for future metadata fields:

ambient_temperature
irradiance
load
SNR_dB
degradation_type

For now, missing values can be NaN.

--------------------------------------------------
STEP 8 — MASTER DATASET
--------------------------------------------------

Combine all processed simulation runs into:

data/processed/master_features.csv

Each independent simulation run should correspond to one row.

Expected columns should include approximately:

run_id
source_file
severity
alpha_deg
degradation_type
ambient_temperature
irradiance
load
SNR_dB

Peak_T_DTS
Peak_T_time_s
baseline_T_DTS
Delta_T_DTS
AUC_DTS
AUC_positive_DTS
Max_abs_dT_dt_DTS
Steady_T_DTS
Rise_time_10_90_DTS

Hotspot_position_m
Hotspot_index
Peak_spatial_temperature
Max_abs_dT_dx
Mean_abs_dT_dx
Inverter_region_mean_T
Inverter_region_max_T
Background_mean_T

Peak_T_surface
Delta_T_surface
AUC_surface
Max_abs_dT_dt_surface
Steady_T_surface

--------------------------------------------------
STEP 9 — DATA VALIDATION
--------------------------------------------------

Add automated checks for:

- NaN/infinite temperatures
- non-monotonic time
- duplicated timestamps
- incorrect number of DTS channels
- temperatures outside plausible model ranges
- missing degradation labels
- inconsistent spatial dimensions
- zero-duration simulations
- division-by-zero or gradient problems

Do not automatically delete suspicious data.

Instead print warnings identifying the affected run.

--------------------------------------------------
STEP 10 — DIAGNOSTIC PLOTS
--------------------------------------------------

Create plots for validation only.

Use matplotlib.

Generate:

1. T_DTS_inv(t) for Healthy/Mild/Moderate/Severe on the same plot.

2. Final spatial DTS profile:
   T_DTS(x, t_final)
   for each degradation severity.

Clearly mark the inverter region from 5–7 m.

3. Delta_T_DTS versus degradation severity.

4. AUC_DTS versus degradation severity.

5. Max_abs_dT_dt_DTS versus degradation severity.

Save plots in:

plots/

Do not use seaborn.

--------------------------------------------------
IMPORTANT ML REQUIREMENTS
--------------------------------------------------

Do NOT train XGBoost yet.

Do NOT include these as future model input features:

severity
alpha_deg
run_id
source_file
degradation_type

These are labels/metadata and using them as predictors would create data leakage.

Later, the actual XGBoost feature matrix will use physical/sensing features such as:

Delta_T_DTS
AUC_DTS
Max_abs_dT_dt_DTS
Steady_T_DTS
Max_abs_dT_dx
etc.

Environmental variables such as ambient temperature, irradiance and load will also be introduced later.

Do not create artificial train/test samples by randomly splitting highly overlapping windows from the same simulation run.

Eventually train/test splitting must occur by independent simulation run or operating condition to avoid leakage.

--------------------------------------------------
CODE QUALITY
--------------------------------------------------

Use:

numpy
pandas
matplotlib
pathlib
scipy if genuinely necessary

Write docstrings and type hints.

Use small reusable functions.

Avoid hard-coded absolute paths.

Use pathlib.Path.

Print a concise summary after processing, for example:

Files processed: 4
Successful runs: 4
Failed runs: 0
DTS channels: 41
Inverter channels: 5
Output: data/processed/master_features.csv

Then print the resulting feature dataframe.

--------------------------------------------------
FIRST ACTION
--------------------------------------------------

Before writing assumptions about my files, inspect the contents of data/raw/.

Based on the actual files found there, determine their structure and adapt the loader accordingly.

Then explain briefly what structure you found before implementing the extraction pipeline.