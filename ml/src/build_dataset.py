"""Build the master feature CSV from raw Raman DTS simulation files.

Supports the 100-run CSV campaign (thermal_*.csv + simulation_manifest.csv)
and the legacy Excel T_DTS / T_surface layout.

Does not train XGBoost. Labels (severity, alpha_deg, run_id, source_file,
degradation_type) are stored for later use as targets/metadata only.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

from . import config
from .data_loader import inspect_raw, inverter_mask, load_all_runs
from .feature_extraction import extract_run_features
from .validation import save_diagnostic_plots, validate_features, validate_run

FEATURE_COLUMNS = [
    "run_id",
    "source_file",
    "severity",
    "alpha_deg",
    "degradation_type",
    "ambient_temperature",
    "irradiance",
    "load",
    "SNR_dB",
    "Peak_T_DTS",
    "Peak_T_time_s",
    "baseline_T_DTS",
    "Delta_T_DTS",
    "AUC_DTS",
    "AUC_positive_DTS",
    "Max_abs_dT_dt_DTS",
    "Steady_T_DTS",
    "Rise_time_10_90_DTS",
    "Hotspot_position_m",
    "Hotspot_index",
    "Peak_spatial_temperature",
    "Max_abs_dT_dx",
    "Mean_abs_dT_dx",
    "Inverter_region_mean_T",
    "Inverter_region_max_T",
    "Background_mean_T",
    "Peak_T_surface",
    "Delta_T_surface",
    "AUC_surface",
    "Max_abs_dT_dt_surface",
    "Steady_T_surface",
    "Rel_Delta_T_surface",
    "Rel_Max_abs_dT_dx",
]

# Not model inputs — kept in the CSV as labels / identifiers.
LEAKAGE_COLUMNS = {"severity", "alpha_deg", "run_id", "source_file", "degradation_type"}


def build_dataset(
    raw_dir: Path,
    inspect: bool = True,
    out_csv: Path | None = None,
    save_plots: bool = True,
) -> pd.DataFrame:
    if inspect:
        inspect_raw(raw_dir)
        print("-" * 72)

    runs = load_all_runs(raw_dir)
    failed = 0
    rows = []
    all_warnings: list[str] = []

    for i, run in enumerate(runs, start=1):
        warnings = validate_run(run)
        all_warnings.extend(warnings)
        try:
            rows.append(extract_run_features(run))
        except Exception as exc:  # keep other runs if one file is corrupt
            failed += 1
            print(f"FAILED {run.run_id}: {exc}", file=sys.stderr)
        if i % 20 == 0 or i == len(runs):
            print(f"  extracted {i}/{len(runs)} runs...")

    features = pd.DataFrame(rows)
    extra = [c for c in features.columns if c not in FEATURE_COLUMNS]
    features = features.reindex(columns=FEATURE_COLUMNS + extra)
    sort_cols = [c for c in ("ambient_temperature", "load", "alpha_deg") if c in features.columns]
    if sort_cols:
        features = features.sort_values(sort_cols).reset_index(drop=True)

    all_warnings.extend(validate_features(features))
    unique_warnings = list(dict.fromkeys(all_warnings))
    for w in unique_warnings[:40]:
        print(f"WARNING: {w}")
    if len(unique_warnings) > 40:
        print(f"... ({len(unique_warnings) - 40} more unique warnings)")

    config.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    if out_csv is None:
        out_csv = config.PROCESSED_DIR / "master_features.csv"
    else:
        out_csv = Path(out_csv)
        out_csv.parent.mkdir(parents=True, exist_ok=True)
    features.to_csv(out_csv, index=False)

    if save_plots:
        save_diagnostic_plots(runs, features, config.PLOTS_DIR)

    n_inv = int(inverter_mask().sum()) if len(runs) else 0
    n_ch = int(runs[0].t_dts.shape[1]) if runs else 0
    print()
    print(f"Files processed: {len(runs) + failed}")
    print(f"Successful runs: {len(features)}")
    print(f"Failed runs: {failed}")
    print(f"DTS channels: {n_ch}")
    print(f"Inverter channels: {n_inv}")
    print(f"Output: {out_csv}")
    print()
    print("Label/metadata columns (do not use as XGBoost inputs):")
    print(" ", ", ".join(sorted(LEAKAGE_COLUMNS)))
    print()
    print("Severity counts:")
    print(features["severity"].value_counts().to_string())
    if "ambient_temperature" in features.columns:
        print(
            "\nAmbient temperatures (°C):",
            sorted(features["ambient_temperature"].dropna().unique().tolist()),
        )
    if "load" in features.columns:
        print(
            "Modulation / load values:",
            sorted(features["load"].dropna().unique().tolist()),
        )
    print()
    print(features.head(12).to_string(index=False))
    if len(features) > 12:
        print(f"... ({len(features) - 12} more rows in {out_csv})")
    return features


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--raw-dir",
        type=Path,
        default=config.DEFAULT_RAW_DIR,
        help="Folder with thermal_*.csv (+ manifest) or legacy T_DTS/ Excel layout",
    )
    parser.add_argument(
        "--no-inspect",
        action="store_true",
        help="Skip the verbose raw-file inspection dump",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Output CSV (default: data/processed/master_features.csv)",
    )
    parser.add_argument(
        "--no-plots",
        action="store_true",
        help="Skip diagnostic plots (use for held-out test extraction)",
    )
    args = parser.parse_args()
    raw_dir = args.raw_dir.expanduser().resolve()
    if not raw_dir.is_dir():
        raise SystemExit(f"Raw directory not found: {raw_dir}")
    build_dataset(
        raw_dir,
        inspect=not args.no_inspect,
        out_csv=args.out.expanduser().resolve() if args.out else None,
        save_plots=not args.no_plots,
    )


if __name__ == "__main__":
    main()
