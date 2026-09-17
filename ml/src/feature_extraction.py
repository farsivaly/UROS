"""Temporal, spatial, and optional surface-temperature features."""

from __future__ import annotations

from typing import Any

import numpy as np

from . import config
from .data_loader import RunRecord, inverter_mask


def inverter_region_signal(t_dts: np.ndarray, x_fibre: np.ndarray) -> np.ndarray:
    """T_DTS_inv(t) = mean of channels between 5 m and 7 m."""
    mask = inverter_mask(x_fibre)
    if not np.any(mask):
        raise ValueError("Inverter mask is empty; check X_INV_START / X_INV_END.")
    return t_dts[:, mask].mean(axis=1)


def _baseline(t: np.ndarray) -> float:
    """Mean of the first 1% of samples (at least one point)."""
    n = max(1, int(round(0.01 * len(t))))
    return float(np.mean(t[:n]))


def _steady(t: np.ndarray) -> float:
    """Mean of the final 5% of samples."""
    n = max(1, int(round(0.05 * len(t))))
    return float(np.mean(t[-n:]))


def rise_time_10_90(time_s: np.ndarray, t: np.ndarray, baseline: float, steady: float) -> float:
    """Time from 10% to 90% of (steady - baseline). NaN if not well-defined."""
    rise = steady - baseline
    if not np.isfinite(rise) or rise <= 0:
        return float("nan")
    t10 = baseline + 0.10 * rise
    t90 = baseline + 0.90 * rise
    above10 = np.where(t >= t10)[0]
    above90 = np.where(t >= t90)[0]
    if len(above10) == 0 or len(above90) == 0:
        return float("nan")
    i10 = int(above10[0])
    i90 = int(above90[0])
    if i90 < i10:
        return float("nan")
    return float(time_s[i90] - time_s[i10])


def temporal_features(time_s: np.ndarray, t: np.ndarray, prefix: str = "DTS") -> dict[str, float]:
    """Features of a 1-D temperature history T(t)."""
    baseline = _baseline(t)
    peak = float(np.max(t))
    peak_idx = int(np.argmax(t))
    rise = t - baseline
    auc = float(np.trapezoid(rise, time_s))
    auc_pos = float(np.trapezoid(np.maximum(rise, 0.0), time_s))
    dT_dt = np.gradient(t, time_s)
    max_abs_dT_dt = float(np.max(np.abs(dT_dt))) if t.size > 1 else float("nan")
    steady = _steady(t)
    if prefix == "DTS":
        return {
            "baseline_T_DTS": baseline,
            "Peak_T_DTS": peak,
            "Peak_T_time_s": float(time_s[peak_idx]),
            "Delta_T_DTS": peak - baseline,
            "AUC_DTS": auc,
            "AUC_positive_DTS": auc_pos,
            "Max_abs_dT_dt_DTS": max_abs_dT_dt,
            "Steady_T_DTS": steady,
            "Rise_time_10_90_DTS": rise_time_10_90(time_s, t, baseline, steady),
        }
    return {
        f"Peak_T_{prefix}": peak,
        f"Delta_T_{prefix}": peak - baseline,
        f"AUC_{prefix}": auc,
        f"Max_abs_dT_dt_{prefix}": max_abs_dT_dt,
        f"Steady_T_{prefix}": steady,
    }


def spatial_features(
    t_dts: np.ndarray,
    x_fibre: np.ndarray,
    time_index: int | None = None,
) -> dict[str, float]:
    """Spatial features of T_DTS(x) at one time (default: final sample)."""
    if time_index is None:
        time_index = t_dts.shape[0] - 1
    profile = t_dts[time_index, :]
    dT_dx = np.gradient(profile, x_fibre)
    inv = inverter_mask(x_fibre)
    bg = ~inv

    peak_T = float(np.max(profile))
    near_peak = np.abs(profile - peak_T) <= config.HOTSPOT_TIE_TOLERANCE_K
    if np.count_nonzero(near_peak) > 1 and np.any(near_peak & inv):
        # Several inverter channels share the peak: report the inverter-region centre.
        hotspot_x = float(np.mean(x_fibre[near_peak & inv]))
        hotspot_index = int(np.abs(x_fibre - hotspot_x).argmin())
    else:
        hotspot_index = int(np.argmax(profile))
        hotspot_x = float(x_fibre[hotspot_index])

    return {
        "Hotspot_position_m": hotspot_x,
        "Hotspot_index": float(hotspot_index),
        "Peak_spatial_temperature": peak_T,
        "Max_abs_dT_dx": float(np.max(np.abs(dT_dx))),
        "Mean_abs_dT_dx": float(np.mean(np.abs(dT_dx))),
        "Inverter_region_mean_T": float(profile[inv].mean()),
        "Inverter_region_max_T": float(profile[inv].max()),
        "Background_mean_T": float(profile[bg].mean()) if np.any(bg) else float("nan"),
    }


def surface_features(time_s: np.ndarray, t_surface: np.ndarray | None) -> dict[str, float]:
    nan = float("nan")
    empty = {
        "Peak_T_surface": nan,
        "Delta_T_surface": nan,
        "AUC_surface": nan,
        "Max_abs_dT_dt_surface": nan,
        "Steady_T_surface": nan,
    }
    if t_surface is None:
        return empty
    n = min(len(time_s), len(t_surface))
    feats = temporal_features(time_s[:n], t_surface[:n], prefix="surface")
    return feats


def extract_run_features(run: RunRecord) -> dict[str, Any]:
    t_inv = inverter_region_signal(run.t_dts, run.x_fibre)
    row: dict[str, Any] = {
        "run_id": run.run_id,
        "source_file": run.source_file,
        "severity": run.severity,
        "alpha_deg": run.alpha_deg,
        "degradation_type": run.degradation_type,
        "ambient_temperature": run.ambient_temperature,
        "irradiance": run.irradiance,
        "load": run.load,
        "SNR_dB": run.snr_db,
        "n_time_samples": int(run.t_dts.shape[0]),
        "n_dts_channels": int(run.t_dts.shape[1]),
        "n_inverter_channels": int(np.count_nonzero(inverter_mask(run.x_fibre))),
        "duration_s": float(run.time_s[-1] - run.time_s[0]) if len(run.time_s) else np.nan,
    }
    row.update(temporal_features(run.time_s, t_inv, prefix="DTS"))
    row.update(spatial_features(run.t_dts, run.x_fibre))
    row.update(surface_features(run.time_s, run.t_surface))
    # Peak surface heating rate tracks Vdc; ΔT and dT/dx also grow with Vdc.
    # Their ratio isolates thermal-path gain (alpha_deg) from the load sweep.
    dtdt = row.get("Max_abs_dT_dt_surface", float("nan"))
    if np.isfinite(dtdt) and dtdt != 0.0:
        row["Rel_Delta_T_surface"] = float(row["Delta_T_surface"] / dtdt)
        row["Rel_Max_abs_dT_dx"] = float(row["Max_abs_dT_dx"] / dtdt)
    else:
        row["Rel_Delta_T_surface"] = float("nan")
        row["Rel_Max_abs_dT_dx"] = float("nan")
    return row
