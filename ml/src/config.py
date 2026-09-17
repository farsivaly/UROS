"""Fibre geometry, degradation labels, and default data locations."""

from __future__ import annotations

from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
PIPELINE_ROOT = Path(__file__).resolve().parents[1]

# Current campaign (run_*.csv with Vdc / P sweep). Falls back via --raw-dir.
DEFAULT_RAW_DIR = REPO_ROOT / "assets" / "datasets" / "thermal_degradation_100run copy"

# Previous 100-run campaign (manifest + thermal_*.csv).
LEGACY_CSV_RAW_DIR = REPO_ROOT / "assets" / "datasets" / "thermal_degradation"

# Legacy Excel layout (T_DTS/ + T_surface/) kept for backwards compatibility.
LEGACY_EXCEL_RAW_DIR = (
    REPO_ROOT / "assets" / "datasets" / "Without Noise" / "thermal_degradation"
)

PROCESSED_DIR = PIPELINE_ROOT / "data" / "processed"
PLOTS_DIR = PIPELINE_ROOT / "plots"

# Drop up to 10 held-out run_*.csv files here. Extracted separately from training.
DEFAULT_TEST_DIR = PIPELINE_ROOT / "data" / "raw" / "test_cases"
TEST_FEATURES_CSV = PROCESSED_DIR / "test_features.csv"

L_FIBRE = 20.0
DX = 0.5
N_DTS_CHANNELS = 41
X_INV_START = 5.0
X_INV_END = 7.0

# Excel workbook columns (legacy).
DTS_TEMPERATURE_COLUMN = "Channel_1"
DTS_TIME_COLUMN = "Time"
SURFACE_TIME_COLUMN = "Time"
SURFACE_TEMPERATURE_COLUMN = "T_surface"

# Wide CSV columns (100-run campaign).
CSV_TIME_COLUMN = "time_s"
CSV_SURFACE_COLUMN = "T_surface_K"
CSV_DTS_PREFIX = "T_DTS_x"
MANIFEST_NAME = "simulation_manifest.csv"

# Positions within this many kelvin of the spatial peak are treated as tied.
HOTSPOT_TIE_TOLERANCE_K = 1e-4

# Plausible reconstructed-temperature bounds (kelvin) for this Simulink twin.
T_MIN_PLAUSIBLE = 250.0
T_MAX_PLAUSIBLE = 450.0

SEVERITY_ALPHA = {
    "Healthy": 1.00,
    "Mild": 1.25,
    "Moderate": 1.50,
    "Severe": 2.00,
}

# Filename-token map. TDS_Moderate is a typo for TDTS_Moderate.
FILENAME_SEVERITY: dict[str, str] = {
    "healthy": "Healthy",
    "mild": "Mild",
    "moderate": "Moderate",
    "severe": "Severe",
}

DEGRADATION_TYPE = "thermal_path"

# Future operating-condition fields (NaN until present in metadata).
OPTIONAL_METADATA_FIELDS = (
    "ambient_temperature",
    "irradiance",
    "load",
    "SNR_dB",
)
