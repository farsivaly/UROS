"""Build placeholder unseen validation CSVs until the real 12-run campaign is complete.

Keeps any existing real files. Synthesizes missing (condition, severity) pairs
from the nearest same-class training run by shifting ambient and scaling the
heating transient with Vdc. Replace these files with Simulink output later.
"""

from __future__ import annotations

import re
from pathlib import Path

import numpy as np
import pandas as pd

from . import config

KELVIN_OFFSET = 273.15

# Off-grid vs training Ta ∈ {15,20,25} and Vdc ∈ {500,550,600,650,700}.
CONDITIONS = {
    1: (17.5, 525.0),
    2: (27.5, 625.0),
    3: (22.5, 575.0),
}
SEVERITIES = ("Healthy", "Mild", "Moderate", "Severe")


def dtdt_from_vdc(vdc: float) -> float:
    """Peak surface |dT/dt| vs Vdc on the training grid (K/s)."""
    return 3.32957 + (vdc - 500.0) * (4.78119 - 3.32957) / 200.0


def parse_train_meta(path: Path) -> tuple[str, float, float] | None:
    stem = path.stem
    m = re.search(r"_(Healthy|Mild|Moderate|Severe)_Ta(\d+(?:\.\d+)?)_Vdc(\d+)", stem, re.I)
    if not m:
        return None
    sev = {"healthy": "Healthy", "mild": "Mild", "moderate": "Moderate", "severe": "Severe"}[
        m.group(1).lower()
    ]
    return sev, float(m.group(2)), float(m.group(3))


def pick_template(train_dir: Path, severity: str, ta: float, vdc: float) -> Path:
    best: tuple[float, Path] | None = None
    for path in sorted(train_dir.glob("run_*.csv")):
        meta = parse_train_meta(path)
        if meta is None or meta[0] != severity:
            continue
        _, ta_t, vdc_t = meta
        score = abs(vdc_t - vdc) * 10.0 + abs(ta_t - ta)
        if best is None or score < best[0]:
            best = (score, path)
    if best is None:
        raise FileNotFoundError(f"No training template for {severity}")
    return best[1]


def kelvin_columns(df: pd.DataFrame) -> list[str]:
    return [c for c in df.columns if str(c).endswith("_K")]


def synthesize(template: Path, ta: float, vdc: float) -> pd.DataFrame:
    df = pd.read_csv(template)
    meta = parse_train_meta(template)
    assert meta is not None
    _, ta_t, vdc_t = meta
    scale = dtdt_from_vdc(vdc) / dtdt_from_vdc(vdc_t)
    dta = ta - ta_t
    kcols = kelvin_columns(df)
    t0 = df[kcols].iloc[0]
    rise = df[kcols] - t0
    df[kcols] = t0 + dta + rise * scale
    for k in kcols:
        c = k.replace("_K", "_C")
        if c in df.columns:
            df[c] = df[k] - KELVIN_OFFSET
    return df


def target_files() -> list[tuple[int, int, str, float, float]]:
    rows = []
    n = 1
    for cond, (ta, vdc) in CONDITIONS.items():
        for sev in SEVERITIES:
            rows.append((n, cond, sev, ta, vdc))
            n += 1
    return rows


def filename(n: int, cond: int, sev: str, ta: float, vdc: float) -> str:
    ta_s = str(ta).replace(".0", "")
    vdc_s = str(int(vdc)) if float(vdc).is_integer() else str(vdc)
    return f"validation_{n:03d}_cond{cond}_{sev}_Ta{ta_s}_Vdc{vdc_s}_P2000.csv"


# Real Simulink exports. Do not overwrite these.
REAL_VALIDATION = {
    "validation_001_cond1_Healthy_Ta17.5_Vdc525_P2000.csv",
    "validation_002_cond1_Mild_Ta17.5_Vdc525_P2000.csv",
    "validation_003_cond1_Moderate_Ta17.5_Vdc525_P2000.csv",
    "validation_004_cond1_Severe_Ta17.5_Vdc525_P2000.csv",
    "validation_005_cond2_Healthy_Ta27.5_Vdc625_P2000.csv",
    "validation_006_cond2_Mild_Ta27.5_Vdc625_P2000.csv",
}


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--overwrite-simulated",
        action="store_true",
        help="Rewrite placeholder files from the current training grid. Keeps real Simulink CSVs.",
    )
    args = parser.parse_args()

    train_dir = config.DEFAULT_RAW_DIR
    out_dir = config.DEFAULT_TEST_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    written = []
    skipped = []
    for n, cond, sev, ta, vdc in target_files():
        name = filename(n, cond, sev, ta, vdc)
        dest = out_dir / name
        is_real = name in REAL_VALIDATION
        keep = (
            dest.is_file()
            and dest.stat().st_size > 1000
            and (is_real or not args.overwrite_simulated)
        )
        if keep:
            skipped.append(name)
            continue
        tmpl = pick_template(train_dir, sev, ta, vdc)
        synthesize(tmpl, ta, vdc).to_csv(dest, index=False)
        written.append(f"{name}  <-  {tmpl.name}")
    print(f"Kept existing: {len(skipped)}")
    for s in skipped:
        print(f"  {s}")
    print(f"Synthesized: {len(written)}")
    for w in written:
        print(f"  {w}")
    print(f"Output dir: {out_dir}")
    print("Replace synthesized files with Simulink CSVs when the real campaign is ready.")


if __name__ == "__main__":
    main()
