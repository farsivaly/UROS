"""Analyse CSUC Si IGBT power-cycling data against the digital-twin Rth sweep.

Does not touch the frozen Raman-DTS XGBoost classifier.
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import scipy.io as sio
from scipy.stats import pearsonr, spearmanr

from . import config

REPO = config.REPO_ROOT
RAW_DIR = REPO / "ml" / "data" / "external" / "csuc_igbt"
OUT_DIR = REPO / "ml" / "results" / "experimental_validation"
CYCLE_S = 8.0
MA_WARMUP_S = 1600.0  # Rth moving-average window in the provided files (~200 cycles)
SIM_ALPHAS = (1.00, 1.25, 1.50, 2.00)
DUT_NOTES = {
    "DUT1": "Aged to failure (unmodified bond wires).",
    "DUT2": "One of six emitter bond wires cut before the test (pre-conditioned).",
    "DUT3": "Aged to failure (unmodified bond wires).",
}
COLOURS = {"DUT1": "#1f4e79", "DUT2": "#c47b2b", "DUT3": "#2a7a62"}


def _as_1d(x) -> np.ndarray:
    return np.asarray(x, dtype=float).ravel()


def load_dut(path: Path) -> dict:
    name = path.stem
    root = sio.loadmat(path, squeeze_me=True, struct_as_record=False)[name]
    el, th = root.Electric, root.Thermal
    return {
        "device_id": name,
        "Ic": _as_1d(el.Ic),
        "Vce": _as_1d(el.Vce),
        "Pce": _as_1d(el.Pce),
        "E_time": _as_1d(el.E_time),
        "Tj": _as_1d(th.Tj),
        "Tc": _as_1d(th.Tc),
        "Tamb": _as_1d(th.Tamb),
        "Rth_jc": _as_1d(th.Rth_jc),
        "T_time": _as_1d(th.T_time),
    }


def on_state_vce(dut: dict, t_grid: np.ndarray) -> np.ndarray:
    """Approximate ON-state Vce by sampling electrical records with Ic > 20 A."""
    step = 400  # 50 Hz × 8 s cycle
    ic = dut["Ic"][::step]
    vce = dut["Vce"][::step]
    t = dut["E_time"][::step]
    mask = (ic > 20.0) & np.isfinite(vce) & np.isfinite(t)
    if mask.sum() < 10:
        return np.full_like(t_grid, np.nan)
    order = np.argsort(t[mask])
    return np.interp(t_grid, t[mask][order], vce[mask][order])


def downsample_cycle(dut: dict) -> pd.DataFrame:
    t = dut["T_time"]
    # One row per 8 s power cycle, after the published moving-average warmup.
    keep = t >= MA_WARMUP_S
    idx = np.where(keep)[0]
    # 2 Hz thermal → 16 samples/cycle
    idx = idx[::16]
    t_ds = t[idx]
    pce = np.interp(t_ds, dut["E_time"], dut["Pce"])
    # Raw Ic includes the 2 s OFF window; a long moving average matches the published Pce filter (~100 cycles).
    ic_ma = (
        pd.Series(dut["Ic"]).rolling(40_000, min_periods=1, center=True).mean().to_numpy()
    )
    ic = np.interp(t_ds, dut["E_time"], ic_ma)
    rth = dut["Rth_jc"][idx]
    tj, tc, tamb = dut["Tj"][idx], dut["Tc"][idx], dut["Tamb"][idx]
    dT_jc = tj - tc
    frame = pd.DataFrame(
        {
            "device_id": dut["device_id"],
            "time_s": t_ds,
            "cycle": t_ds / CYCLE_S,
            "Tj_C": tj,
            "Tc_C": tc,
            "Tamb_C": tamb,
            "Rth_jc_K_per_W": rth,
            "Pce_W": pce,
            "Ic_A": ic,
            "Vce_on_V": on_state_vce(dut, t_ds),
            "DeltaT_jc_K": dT_jc,
            "DeltaT_ja_K": tj - tamb,
            "DeltaT_ca_K": tc - tamb,
            "DeltaT_jc_predicted_K": pce * rth,
        }
    )
    valid = (
        np.isfinite(frame["Rth_jc_K_per_W"])
        & (frame["Rth_jc_K_per_W"] > 0.05)
        & (frame["Pce_W"] > 1.0)
        & (frame["Tj_C"].between(0.0, 300.0))
        & (frame["Tc_C"].between(0.0, 300.0))
        & (frame["Tamb_C"].between(-20.0, 80.0))
    )
    frame["valid"] = valid
    return frame


def attach_alpha(frame: pd.DataFrame) -> tuple[pd.DataFrame, float]:
    work = frame.loc[frame["valid"]].copy()
    baseline_n = max(20, int(0.05 * len(work)))
    rth0 = float(work["Rth_jc_K_per_W"].iloc[:baseline_n].median())
    frame = frame.copy()
    frame["Rth0_K_per_W"] = rth0
    frame["alpha_exp"] = frame["Rth_jc_K_per_W"] / rth0
    return frame, rth0


def first_crossing(frame: pd.DataFrame, threshold: float) -> float | None:
    hit = frame.loc[frame["valid"] & (frame["alpha_exp"] >= threshold), "cycle"]
    if hit.empty:
        return None
    return float(hit.iloc[0])


def summarise(frame: pd.DataFrame, rth0: float) -> dict:
    valid = frame.loc[frame["valid"]]
    rth = valid["Rth_jc_K_per_W"]
    alpha = valid["alpha_exp"]
    dT = valid["DeltaT_jc_K"]
    pred = valid["DeltaT_jc_predicted_K"]
    resid = dT - pred
    mae = float(np.mean(np.abs(resid)))
    rmse = float(np.sqrt(np.mean(resid**2)))
    mbe = float(np.mean(resid))
    ss_res = float(np.sum(resid**2))
    ss_tot = float(np.sum((dT - dT.mean()) ** 2))
    r2 = float(1.0 - ss_res / ss_tot) if ss_tot > 0 else float("nan")
    pear_jc = pearsonr(alpha, dT)
    spear_jc = spearmanr(alpha, dT)
    pear_ja = pearsonr(alpha, valid["DeltaT_ja_K"])
    return {
        "device_id": valid["device_id"].iloc[0],
        "n_cycles": int(len(valid)),
        "duration_s": float(valid["time_s"].iloc[-1] - valid["time_s"].iloc[0]),
        "initial_Rth_jc": rth0,
        "final_Rth_jc": float(rth.iloc[-1]),
        "max_Rth_jc": float(rth.max()),
        "percent_Rth_increase": 100.0 * (float(rth.iloc[-1]) / rth0 - 1.0),
        "max_alpha_exp": float(alpha.max()),
        "median_alpha_exp": float(alpha.median()),
        "final_alpha_exp": float(alpha.iloc[-1]),
        "reaches_1p25": bool(alpha.max() >= 1.25),
        "reaches_1p50": bool(alpha.max() >= 1.50),
        "reaches_2p00": bool(alpha.max() >= 2.00),
        "cycle_at_1p25": first_crossing(frame, 1.25),
        "cycle_at_1p50": first_crossing(frame, 1.50),
        "cycle_at_2p00": first_crossing(frame, 2.00),
        "median_Pce_W": float(valid["Pce_W"].median()),
        "pce_cv": float(valid["Pce_W"].std() / valid["Pce_W"].mean()),
        "median_Ic_A": float(valid["Ic_A"].median()),
        "tamb_range_C": float(valid["Tamb_C"].max() - valid["Tamb_C"].min()),
        "pearson_alpha_dTjc": float(pear_jc.statistic),
        "spearman_alpha_dTjc": float(spear_jc.statistic),
        "pearson_alpha_dTja": float(pear_ja.statistic),
        "dTjc_mae_K": mae,
        "dTjc_rmse_K": rmse,
        "dTjc_mbe_K": mbe,
        "dTjc_r2": r2,
        "note": DUT_NOTES[valid["device_id"].iloc[0]],
    }


def style_ax(ax, xlabel, ylabel, title):
    ax.set_xlabel(xlabel)
    ax.set_ylabel(ylabel)
    ax.set_title(title)
    ax.grid(True, alpha=0.3)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)


def save(fig, name: str) -> None:
    fig.tight_layout()
    fig.savefig(OUT_DIR / name, dpi=220)
    plt.close(fig)


def plot_all(frames: dict[str, pd.DataFrame], summaries: pd.DataFrame) -> None:
    # 1–3 Rth / alpha
    fig, ax = plt.subplots(figsize=(8.2, 4.6))
    for dev, fr in frames.items():
        v = fr.loc[fr["valid"]]
        ax.plot(v["cycle"], v["Rth_jc_K_per_W"], color=COLOURS[dev], lw=1.4, label=dev)
    style_ax(ax, "Ageing cycle (8 s period)", "Rth,j–c (K/W)", "Junction-to-case thermal resistance")
    ax.legend()
    save(fig, "01_Rth_jc_vs_cycle.png")

    fig, ax = plt.subplots(figsize=(8.2, 4.6))
    for dev, fr in frames.items():
        v = fr.loc[fr["valid"]]
        ax.plot(v["cycle"], v["alpha_exp"], color=COLOURS[dev], lw=1.4, label=dev)
    for a, ls in zip(SIM_ALPHAS, ("-", "--", "-.", ":")):
        ax.axhline(a, color="#666666", ls=ls, lw=1.0, label=f"sim α={a:.2f}")
    style_ax(
        ax,
        "Ageing cycle (8 s period)",
        "α_exp = Rth(t) / Rth0",
        "Experimental thermal-resistance growth vs simulation sweep",
    )
    ax.legend(ncols=2, fontsize=8)
    save(fig, "02_alpha_exp_vs_cycle.png")

    fig, ax = plt.subplots(figsize=(8.2, 4.6))
    for dev, fr in frames.items():
        v = fr.loc[fr["valid"]]
        ax.plot(v["cycle"], v["alpha_exp"], color=COLOURS[dev], lw=1.4, label=dev)
    for a, ls, lab in zip(
        SIM_ALPHAS,
        ("-", "--", "-.", ":"),
        ("Healthy 1.00", "Mild 1.25", "Moderate 1.50", "Severe 2.00"),
    ):
        ax.axhline(a, color="#666666", ls=ls, lw=1.0, label=lab)
    style_ax(
        ax,
        "Ageing cycle (8 s period)",
        "α_exp = Rth(t) / Rth0",
        "Simulation reference levels (not experimental class labels)",
    )
    ax.legend(ncols=2, fontsize=8)
    save(fig, "03_alpha_exp_with_sim_levels.png")

    fig, ax = plt.subplots(figsize=(8.2, 4.6))
    for dev, fr in frames.items():
        v = fr.loc[fr["valid"]]
        ax.scatter(v["alpha_exp"], v["DeltaT_jc_K"], s=4, alpha=0.25, color=COLOURS[dev], label=dev)
    style_ax(ax, "α_exp", "ΔT_jc = Tj − Tc (K)", "Junction-to-case temperature rise vs thermal-resistance growth")
    ax.legend(markerscale=4)
    save(fig, "04_DeltaT_jc_vs_alpha.png")

    fig, ax = plt.subplots(figsize=(8.2, 4.6))
    for dev, fr in frames.items():
        v = fr.loc[fr["valid"] & np.isfinite(fr["Vce_on_V"])]
        ax.scatter(v["alpha_exp"], v["Vce_on_V"], s=4, alpha=0.25, color=COLOURS[dev], label=dev)
    style_ax(ax, "α_exp", "ON-state Vce (V)", "Collector–emitter voltage vs thermal-resistance growth")
    ax.legend(markerscale=4)
    save(fig, "05_Vce_vs_alpha.png")

    fig, ax = plt.subplots(figsize=(5.6, 5.2))
    lo, hi = 40, 80
    for dev, fr in frames.items():
        v = fr.loc[fr["valid"]]
        ax.scatter(
            v["DeltaT_jc_predicted_K"],
            v["DeltaT_jc_K"],
            s=4,
            alpha=0.2,
            color=COLOURS[dev],
            label=dev,
        )
        lo = min(lo, float(v["DeltaT_jc_predicted_K"].min()), float(v["DeltaT_jc_K"].min()))
        hi = max(hi, float(v["DeltaT_jc_predicted_K"].max()), float(v["DeltaT_jc_K"].max()))
    ax.plot([lo, hi], [lo, hi], color="#333333", lw=1.0, label="1:1")
    style_ax(
        ax,
        "Predicted ΔT_jc = Pce × Rth,j–c (K)",
        "Measured ΔT_jc (K)",
        "Identity check (Rth,j–c is derived from ΔT/P, so this is nearly tautological)",
    )
    ax.legend(markerscale=4)
    save(fig, "06_DeltaT_jc_measured_vs_predicted.png")

    fig, axes = plt.subplots(3, 1, figsize=(8.2, 8.0), sharex=True)
    for ax, col, ylab in zip(
        axes,
        ("Pce_W", "Ic_A", "Tamb_C"),
        ("Pce (W)", "Collector current (A)", "Tamb (°C)"),
    ):
        for dev, fr in frames.items():
            v = fr.loc[fr["valid"]]
            ax.plot(v["cycle"], v[col], color=COLOURS[dev], lw=1.1, label=dev)
        style_ax(ax, "Ageing cycle (8 s period)", ylab, "")
    axes[0].set_title("Operating-condition control (should stay near-constant)")
    axes[0].legend()
    save(fig, "07_operating_conditions_vs_cycle.png")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    frames = {}
    rows = []
    processed = []
    for name in ("DUT1", "DUT2", "DUT3"):
        dut = load_dut(RAW_DIR / f"{name}.mat")
        frame, rth0 = attach_alpha(downsample_cycle(dut))
        frames[name] = frame
        rows.append(summarise(frame, rth0))
        processed.append(frame.loc[frame["valid"]])
        print(name, rows[-1])

    summary = pd.DataFrame(rows)
    proc = pd.concat(processed, ignore_index=True)
    summary_path = OUT_DIR / "experimental_igbt_summary.csv"
    proc_path = OUT_DIR / "experimental_igbt_processed.csv"
    summary.to_csv(summary_path, index=False)
    proc.to_csv(proc_path, index=False)
    plot_all(frames, summary)
    print("Wrote", summary_path)
    print("Wrote", proc_path)
    print(summary.to_string(index=False))


if __name__ == "__main__":
    main()
