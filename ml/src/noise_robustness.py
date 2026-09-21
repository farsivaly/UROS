"""Accuracy of the severity classifier versus measurement noise.

The held-out sweep scores 20/20 because the Simulink twin is noiseless: severity
scales the thermal-path resistance, so the two load-normalised features separate
the four classes by margins several times the within-class spread. This module
asks the follow-up question — how much temperature noise erases that margin.

White Gaussian noise of standard deviation sigma (kelvin) is added to every
T_surface and T_DTS sample of the held-out runs, features are re-extracted with
the unmodified pipeline, and the classifier is scored.

Both classifier inputs are ratios whose denominator is a derivative
(Max_abs_dT_dt_surface), and differentiation amplifies white noise, so the
unfiltered curve falls away at very small sigma. Real Raman DTS integrates over
time and over roughly a metre of fibre, so the sweep is repeated with boxcar
averaging.

Averaging also lowers the peak heating rate, which shifts the features away from
what an unfiltered model was trained on. Each averaging mode therefore gets its
own model, fitted on the clean training runs passed through the same filter, so
that only the noise differs between train and test.

    python -m src.noise_robustness
    python -m src.noise_robustness --seeds 5 --sigmas 0.01 0.1
"""

from __future__ import annotations

import argparse
from dataclasses import replace
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, f1_score
from sklearn.preprocessing import LabelEncoder

from . import config
from .data_loader import RunRecord, load_all_csv_runs
from .feature_extraction import extract_run_features
from .train_xgboost_baseline import (
    PREFERRED_FEATURES,
    SEVERITY_ORDER,
    make_classifier,
    unique_physical_table,
)

RESULTS_DIR = config.PIPELINE_ROOT / "results" / "noise_robustness"

# Sampling is 100 Hz over 60 s, so 1 s of averaging is 101 samples.
SAMPLE_RATE_HZ = 100.0

# Noise standard deviations in kelvin. Commercial Raman DTS quote roughly 0.1-1 K.
# Levels above ~0.02 K already sit at chance, so the grid is dense where the
# transition happens and sparse afterwards.
DEFAULT_SIGMAS = (
    0.0001, 0.0002, 0.0005, 0.001, 0.002, 0.003, 0.005,
    0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1.0,
)

# (label, temporal window in seconds, spatial window in samples at dx = 0.5 m)
AVERAGING_MODES = (
    ("No averaging", 0.0, 1),
    ("1 s + 1 m averaging", 1.0, 3),
    ("10 s + 1 m averaging", 10.0, 3),
)

MODE_COLOUR = {
    "No averaging": "#d4655a",
    "1 s + 1 m averaging": "#e2a34a",
    "10 s + 1 m averaging": "#3db8a0",
}

ACCURACY_FLOOR = 0.95


def boxcar(a: np.ndarray, window: int, axis: int) -> np.ndarray:
    """Edge-padded moving average, preserving length along axis.

    Cumulative-sum form so that a 6002-sample or 41-channel window costs one
    vectorised pass instead of a Python loop per row. The mean is removed before
    accumulating to keep the sums small relative to absolute kelvin values.
    """
    if window <= 1:
        return a
    a = np.moveaxis(a, axis, -1)
    offset = float(a.mean())
    pad_left = window // 2
    pad_right = window - 1 - pad_left
    padded = np.pad(
        a - offset,
        [(0, 0)] * (a.ndim - 1) + [(pad_left, pad_right)],
        mode="edge",
    )
    cumulative = np.cumsum(padded, axis=-1)
    zero = np.zeros(cumulative.shape[:-1] + (1,), dtype=cumulative.dtype)
    cumulative = np.concatenate([zero, cumulative], axis=-1)
    out = (cumulative[..., window:] - cumulative[..., :-window]) / window + offset
    return np.moveaxis(out, -1, axis)


def time_window_samples(seconds: float) -> int:
    n = int(round(seconds * SAMPLE_RATE_HZ))
    if n > 1 and n % 2 == 0:
        n += 1
    return n


def perturb(
    run: RunRecord,
    sigma: float,
    rng: np.random.Generator | None,
    time_window_s: float,
    space_window: int,
) -> RunRecord:
    """Copy of run with optional Gaussian noise, then optional boxcar averaging."""
    t_dts = run.t_dts
    t_surface = run.t_surface
    if sigma > 0:
        if rng is None:
            raise ValueError("rng required when sigma > 0")
        t_dts = t_dts + rng.normal(0.0, sigma, size=t_dts.shape)
        if t_surface is not None:
            t_surface = t_surface + rng.normal(0.0, sigma, size=t_surface.shape)

    n_time = time_window_samples(time_window_s)
    if n_time > 1:
        t_dts = boxcar(t_dts, n_time, axis=0)
        if t_surface is not None:
            t_surface = boxcar(t_surface, n_time, axis=0)
    if space_window > 1:
        t_dts = boxcar(t_dts, space_window, axis=1)

    if t_dts is run.t_dts and t_surface is run.t_surface:
        return run
    return replace(run, t_dts=t_dts, t_surface=t_surface)


def features_for(
    runs: list[RunRecord],
    sigma: float,
    rng: np.random.Generator | None,
    time_window_s: float,
    space_window: int,
) -> pd.DataFrame:
    rows = [
        extract_run_features(perturb(r, sigma, rng, time_window_s, space_window))
        for r in runs
    ]
    return pd.DataFrame(rows)


def fit_mode_model(
    train_runs: list[RunRecord], time_window_s: float, space_window: int
) -> tuple[object, LabelEncoder, list[str]]:
    """Fit on clean training runs passed through this mode's filter."""
    df = features_for(train_runs, 0.0, None, time_window_s, space_window)
    feat_cols = [c for c in PREFERRED_FEATURES if c in df.columns]
    unique, _, _ = unique_physical_table(df, feat_cols)
    encoder = LabelEncoder()
    encoder.fit([s for s in SEVERITY_ORDER if s in set(unique["severity"])])
    y = encoder.transform(unique["severity"])
    X = unique[feat_cols].to_numpy(dtype=float)
    model = make_classifier(len(encoder.classes_), len(unique))
    model.fit(X, y)
    return model, encoder, feat_cols


def score(
    model,
    encoder: LabelEncoder,
    feat_cols: list[str],
    runs: list[RunRecord],
    sigma: float,
    rng: np.random.Generator | None,
    time_window_s: float,
    space_window: int,
) -> tuple[float, float, dict[str, float]]:
    features = features_for(runs, sigma, rng, time_window_s, space_window)
    X = features[feat_cols].to_numpy(dtype=float)
    # A noisy denominator can produce a non-finite ratio; count those as wrong.
    finite = np.isfinite(X).all(axis=1)
    y_true = encoder.transform(features["severity"])
    y_pred = np.full(len(features), -1, dtype=int)
    if finite.any():
        y_pred[finite] = model.predict(X[finite])
    means = {f"mean_{c}": float(np.nanmean(features[c])) for c in feat_cols}
    return (
        float(accuracy_score(y_true, y_pred)),
        float(f1_score(y_true, y_pred, average="weighted", zero_division=0)),
        means,
    )


def sweep(
    train_runs: list[RunRecord],
    test_runs: list[RunRecord],
    sigmas: tuple[float, ...],
    seeds: int,
) -> pd.DataFrame:
    records = []
    for mode_index, (label, t_win, s_win) in enumerate(AVERAGING_MODES):
        print("=" * 72)
        print(f"{label}  (temporal {time_window_samples(t_win)} samples, spatial {s_win})")
        model, encoder, feat_cols = fit_mode_model(train_runs, t_win, s_win)

        acc0, f10, means0 = score(
            model, encoder, feat_cols, test_runs, 0.0, None, t_win, s_win
        )
        print(f"  noiseless: accuracy={acc0:.3f}  F1={f10:.3f}")
        records.append(
            {"mode": label, "sigma_K": 0.0, "accuracy_mean": acc0, "accuracy_std": 0.0,
             "f1_mean": f10, "f1_std": 0.0, "n_seeds": 1, **means0}
        )

        for sigma in sigmas:
            accs, f1s, mean_rows = [], [], []
            for seed in range(seeds):
                # Integer seed sequence, not hash(): string hashing is salted
                # per process, which would make the sweep unreproducible.
                rng = np.random.default_rng([mode_index, int(round(sigma * 1e7)), seed])
                a, f, m = score(
                    model, encoder, feat_cols, test_runs, sigma, rng, t_win, s_win
                )
                accs.append(a)
                f1s.append(f)
                mean_rows.append(m)
            avg_means = {
                k: float(np.mean([r[k] for r in mean_rows])) for k in mean_rows[0]
            }
            records.append(
                {
                    "mode": label,
                    "sigma_K": sigma,
                    "accuracy_mean": float(np.mean(accs)),
                    "accuracy_std": float(np.std(accs)),
                    "f1_mean": float(np.mean(f1s)),
                    "f1_std": float(np.std(f1s)),
                    "n_seeds": seeds,
                    **avg_means,
                }
            )
            print(
                f"  sigma={sigma:7.4f} K  accuracy={np.mean(accs):.3f} +/- {np.std(accs):.3f}"
                f"  F1={np.mean(f1s):.3f}"
            )
        print()
    return pd.DataFrame(records)


def plot_sweep(df: pd.DataFrame, path: Path, n_runs: int) -> None:
    fig, ax = plt.subplots(figsize=(8.2, 5.3))

    ax.axvspan(0.1, 1.0, color="#6aa4d8", alpha=0.12, zorder=0)
    ax.text(
        0.31, 0.30, "typical Raman DTS\nresolution", fontsize=8.5,
        color="#37536f", ha="center", va="bottom",
    )

    for label, _, _ in AVERAGING_MODES:
        grp = df[df["mode"] == label]
        g = grp[grp.sigma_K > 0].sort_values("sigma_K")
        if g.empty:
            continue
        colour = MODE_COLOUR.get(label, "#666666")
        ax.plot(g.sigma_K, g.accuracy_mean, "o-", color=colour, label=label, lw=1.8, ms=4.5)
        ax.fill_between(
            g.sigma_K,
            np.clip(g.accuracy_mean - g.accuracy_std, 0, 1),
            np.clip(g.accuracy_mean + g.accuracy_std, 0, 1),
            color=colour,
            alpha=0.18,
            lw=0,
        )

    sig = df[df.sigma_K > 0].sigma_K
    ax.axhline(1.0, color="#3a3a3a", ls="--", lw=1.0)
    ax.text(sig.max(), 1.012, f"noiseless ({n_runs}/{n_runs})", fontsize=8.5, ha="right", color="#3a3a3a")
    ax.axhline(0.25, color="#8a8a8a", ls=":", lw=1.0)
    ax.text(sig.min(), 0.265, "chance (4 classes)", fontsize=8.5, color="#6a6a6a")

    ax.set_xscale("log")
    ax.set_xlabel("Added temperature noise per sample, $\\sigma$ (K)")
    ax.set_ylabel("Accuracy on held-out runs")
    ax.set_title(
        f"Severity classifier versus measurement noise ({n_runs} held-out runs)",
        fontsize=12.5,
    )
    ax.set_ylim(0.0, 1.09)
    ax.grid(True, which="both", alpha=0.25)
    ax.legend(loc="lower left", fontsize=9, framealpha=0.95)
    fig.tight_layout()
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=200)
    plt.close(fig)


def report_limits(df: pd.DataFrame, floor: float = ACCURACY_FLOOR) -> pd.DataFrame:
    """Largest sigma whose mean accuracy, and every smaller sigma, stays above floor."""
    rows = []
    for label, _, _ in AVERAGING_MODES:
        grp = df[df["mode"] == label]
        g = grp[grp.sigma_K > 0].sort_values("sigma_K").reset_index(drop=True)
        if g.empty:
            continue
        limit = np.nan
        for _, r in g.iterrows():
            if r.accuracy_mean >= floor:
                limit = float(r.sigma_K)
            else:
                break
        entry = {
            "mode": label,
            f"max_sigma_K_at_{int(floor * 100)}pc": limit,
            "noiseless_accuracy": float(grp.loc[grp.sigma_K == 0, "accuracy_mean"].iloc[0]),
        }
        for probe in (0.01, 0.1, 0.5):
            hit = g[np.isclose(g.sigma_K, probe)]
            entry[f"accuracy_at_{probe}K"] = float(hit.accuracy_mean.iloc[0]) if len(hit) else np.nan
        rows.append(entry)
    return pd.DataFrame(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--test-dir", type=Path, default=config.DEFAULT_TEST_DIR)
    parser.add_argument("--train-dir", type=Path, default=config.DEFAULT_RAW_DIR)
    parser.add_argument("--seeds", type=int, default=20, help="noise realisations per level")
    parser.add_argument(
        "--sigmas", type=float, nargs="+", default=list(DEFAULT_SIGMAS),
        help="noise standard deviations in kelvin",
    )
    args = parser.parse_args()

    test_dir = args.test_dir.expanduser().resolve()
    train_dir = args.train_dir.expanduser().resolve()
    for d in (test_dir, train_dir):
        if not d.is_dir():
            raise SystemExit(f"Folder not found: {d}")

    print(f"Loading training runs from {train_dir}")
    train_runs = load_all_csv_runs(train_dir)
    print(f"  {len(train_runs)} runs")
    print(f"Loading held-out runs from {test_dir}")
    test_runs = load_all_csv_runs(test_dir)
    print(f"  {len(test_runs)} runs")
    print(f"Noise levels (K): {list(args.sigmas)}")
    print(f"Repeats per level: {args.seeds}")
    print()

    df = sweep(train_runs, test_runs, tuple(args.sigmas), args.seeds)

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = RESULTS_DIR / "noise_robustness.csv"
    df.to_csv(csv_path, index=False)

    fig_path = RESULTS_DIR / "01_accuracy_vs_noise.png"
    plot_sweep(df, fig_path, len(test_runs))

    limits = report_limits(df)
    limits_path = RESULTS_DIR / "noise_limits.csv"
    limits.to_csv(limits_path, index=False)

    print(f"Noise tolerance (mean accuracy >= {ACCURACY_FLOOR:.2f}):")
    print(limits.to_string(index=False))
    print()
    print(f"Sweep table: {csv_path}")
    print(f"Figure:      {fig_path}")
    print(f"Limits:      {limits_path}")


if __name__ == "__main__":
    main()
