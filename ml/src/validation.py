"""Sanity checks and diagnostic plots. Suspicious runs are flagged, not dropped."""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from . import config
from .data_loader import RunRecord
from .feature_extraction import inverter_region_signal


SEVERITY_ORDER = ("Healthy", "Mild", "Moderate", "Severe")
SEVERITY_COLOUR = {
    "Healthy": "#3db8a0",
    "Mild": "#6aa4d8",
    "Moderate": "#e2a34a",
    "Severe": "#d4655a",
}


def validate_run(run: RunRecord) -> list[str]:
    """Return warning strings. Never deletes data."""
    warnings = list(run.warnings)
    t = run.time_s
    mat = run.t_dts

    if mat.size == 0 or t.size == 0:
        warnings.append(f"{run.run_id}: empty temperature or time array")
        return warnings

    if not np.all(np.isfinite(mat)):
        n_bad = int(np.size(mat) - np.isfinite(mat).sum())
        warnings.append(f"{run.run_id}: {n_bad} NaN/Inf DTS samples")

    if np.any(np.diff(t) <= 0):
        warnings.append(f"{run.run_id}: time is not strictly increasing")
    if len(t) != len(np.unique(t)):
        warnings.append(f"{run.run_id}: duplicated timestamps")

    if mat.shape[1] != config.N_DTS_CHANNELS:
        warnings.append(
            f"{run.run_id}: {mat.shape[1]} DTS channels, expected {config.N_DTS_CHANNELS}"
        )
    if mat.shape[0] != len(t):
        warnings.append(
            f"{run.run_id}: time length {len(t)} != DTS rows {mat.shape[0]}"
        )
    if len(run.x_fibre) != mat.shape[1]:
        warnings.append(f"{run.run_id}: x_fibre length inconsistent with DTS columns")

    if np.nanmin(mat) < config.T_MIN_PLAUSIBLE or np.nanmax(mat) > config.T_MAX_PLAUSIBLE:
        warnings.append(
            f"{run.run_id}: temperatures outside "
            f"[{config.T_MIN_PLAUSIBLE}, {config.T_MAX_PLAUSIBLE}] K "
            f"(min={np.nanmin(mat):.3f}, max={np.nanmax(mat):.3f})"
        )

    if run.severity not in config.SEVERITY_ALPHA:
        warnings.append(f"{run.run_id}: missing/unknown degradation label {run.severity!r}")

    duration = float(t[-1] - t[0]) if len(t) else 0.0
    if duration <= 0:
        warnings.append(f"{run.run_id}: zero-duration simulation")

    if len(t) > 1:
        dt = np.diff(t)
        if np.any(dt == 0):
            warnings.append(f"{run.run_id}: zero dt would break gradients")

    return warnings


def validate_features(df: pd.DataFrame) -> list[str]:
    warnings: list[str] = []
    if df["severity"].isna().any():
        warnings.append("Feature table has missing severity labels")
    if df["alpha_deg"].isna().any():
        warnings.append("Feature table has missing alpha_deg")
    return warnings


def _severity_key(name: str) -> int:
    try:
        return SEVERITY_ORDER.index(name)
    except ValueError:
        return len(SEVERITY_ORDER)


def _representative_runs(runs: list[RunRecord]) -> list[RunRecord]:
    """Pick one run per severity for overlay plots (prefer Ta25 / m0.8)."""
    by_sev: dict[str, list[RunRecord]] = {s: [] for s in SEVERITY_ORDER}
    for r in runs:
        if r.severity in by_sev:
            by_sev[r.severity].append(r)

    chosen: list[RunRecord] = []
    for sev in SEVERITY_ORDER:
        candidates = by_sev[sev]
        if not candidates:
            continue
        preferred = [
            r
            for r in candidates
            if abs(r.ambient_temperature - 25.0) < 0.5 and abs(r.load - 0.8) < 0.05
        ]
        chosen.append(preferred[0] if preferred else candidates[0])
    return chosen


def save_diagnostic_plots(runs: list[RunRecord], features: pd.DataFrame, out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    reps = _representative_runs(runs)

    _plot_inverter_timeseries(reps, out_dir / "01_T_DTS_inv_timeseries.png")
    _plot_spatial_profiles(reps, out_dir / "02_T_DTS_spatial_final.png")
    _plot_feature_vs_severity(features, "Delta_T_DTS", out_dir / "03_Delta_T_DTS_vs_severity.png")
    _plot_feature_vs_severity(features, "AUC_DTS", out_dir / "04_AUC_DTS_vs_severity.png")
    _plot_feature_vs_severity(
        features, "Max_abs_dT_dt_DTS", out_dir / "05_Max_abs_dT_dt_DTS_vs_severity.png"
    )


def _plot_inverter_timeseries(runs: list[RunRecord], path: Path) -> None:
    fig, ax = plt.subplots(figsize=(8.5, 4.8))
    for run in runs:
        t_inv = inverter_region_signal(run.t_dts, run.x_fibre)
        label = run.severity
        if np.isfinite(run.ambient_temperature) and np.isfinite(run.load):
            label = f"{run.severity} (Ta={run.ambient_temperature:.0f}°C, m={run.load:.2f})"
        ax.plot(
            run.time_s,
            t_inv,
            color=SEVERITY_COLOUR.get(run.severity, "#888888"),
            label=label,
            linewidth=1.6,
        )
    ax.set_xlabel("Time (s)")
    ax.set_ylabel("T_DTS,inv (K)")
    ax.set_title("Inverter-region mean DTS temperature (representative runs)")
    ax.legend(frameon=False, fontsize=8)
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig(path, dpi=140)
    plt.close(fig)


def _plot_spatial_profiles(runs: list[RunRecord], path: Path) -> None:
    fig, ax = plt.subplots(figsize=(8.5, 4.8))
    for run in runs:
        profile = run.t_dts[-1, :]
        ax.plot(
            run.x_fibre,
            profile,
            color=SEVERITY_COLOUR.get(run.severity, "#888888"),
            label=run.severity,
            linewidth=1.6,
        )
    ax.axvspan(
        config.X_INV_START,
        config.X_INV_END,
        color="#d4655a",
        alpha=0.12,
        label="Inverter 5–7 m",
    )
    ax.set_xlabel("Fibre position x (m)")
    ax.set_ylabel("T_DTS(x, t_final) (K)")
    ax.set_title("Final spatial DTS profile (representative runs)")
    ax.legend(frameon=False)
    ax.grid(True, alpha=0.3)
    fig.tight_layout()
    fig.savefig(path, dpi=140)
    plt.close(fig)


def _plot_feature_vs_severity(features: pd.DataFrame, column: str, path: Path) -> None:
    fig, ax = plt.subplots(figsize=(6.8, 4.4))
    df = features.copy()
    df["severity"] = pd.Categorical(df["severity"], categories=list(SEVERITY_ORDER), ordered=True)
    df = df.sort_values("severity")

    if len(df) <= 8:
        colours = [SEVERITY_COLOUR.get(str(s), "#888888") for s in df["severity"]]
        ax.bar(df["severity"].astype(str), df[column], color=colours, width=0.6)
    else:
        data = [df.loc[df["severity"] == s, column].dropna().to_numpy() for s in SEVERITY_ORDER]
        bp = ax.boxplot(
            data,
            tick_labels=list(SEVERITY_ORDER),
            patch_artist=True,
            showfliers=True,
        )
        for patch, sev in zip(bp["boxes"], SEVERITY_ORDER):
            patch.set_facecolor(SEVERITY_COLOUR.get(sev, "#888888"))
            patch.set_alpha(0.55)

    ax.set_xlabel("Degradation severity")
    ax.set_ylabel(column)
    ax.set_title(f"{column} versus degradation severity (n={len(df)})")
    ax.grid(True, axis="y", alpha=0.3)
    fig.tight_layout()
    fig.savefig(path, dpi=140)
    plt.close(fig)
