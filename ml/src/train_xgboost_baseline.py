"""XGBoost severity classifier for Raman DTS inverter features.

Follows the XGBoost setup in Marangis et al., Solar RRL 2024 (xgboost
Python library; learning_rate=0.01, max_depth=5, n_estimators=549,
subsample=0.6, min_child_weight=10, colsample_bylevel=1.0, gamma=0).
That paper used XGBoost as a PV performance regressor (GI, Tmod → DC
I/V/P). Here the same algorithm is used as a four-class classifier of
thermal-path severity from DTS / surface features.

Does not use severity, alpha_deg, run_id, source_file, or
degradation_type as inputs (label leakage).

If duplicate feature rows exist (e.g. load sweep that did not change
thermal response), trains on unique physical vectors and reports
effective n so accuracy is not inflated by identical copies.

Held-out test CSVs go in data/raw/test_cases/. After training, run
with --eval-only to extract those files and score the saved model
without retraining.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import (
    ConfusionMatrixDisplay,
    accuracy_score,
    classification_report,
    f1_score,
)
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

from . import config
from .build_dataset import LEAKAGE_COLUMNS, build_dataset
from .data_loader import discover_csv_files

AUX_COLUMNS = {
    "n_time_samples",
    "n_dts_channels",
    "n_inverter_channels",
    "duration_s",
}

# Unused, constant, or mostly-NaN columns — not XGBoost inputs.
DROP_FEATURES = {
    "irradiance",
    "SNR_dB",
    "Hotspot_position_m",
    "Hotspot_index",
    "Rise_time_10_90_DTS",
}

# Operating-condition columns. Raw ΔT and dT/dx rise with Vdc as well as
# alpha_deg; Rel_* already divides those by peak heating rate.
OPERATING_COLUMNS = {"ambient_temperature", "load"}

# Load-confounded raw amplitudes. Rel_* are the load-invariant substitutes.
LOAD_CONFOUNDED = {
    "Delta_T_surface",
    "Max_abs_dT_dt_surface",
    "Max_abs_dT_dx",
    "Mean_abs_dT_dx",
    "AUC_surface",
    "Peak_T_surface",
    "Steady_T_surface",
    "AUC_DTS",
    "AUC_positive_DTS",
    "Delta_T_DTS",
    "Peak_T_DTS",
    "Peak_T_time_s",
    "baseline_T_DTS",
    "Max_abs_dT_dt_DTS",
    "Steady_T_DTS",
    "Peak_spatial_temperature",
    "Inverter_region_mean_T",
    "Inverter_region_max_T",
    "Background_mean_T",
}

PREFERRED_FEATURES = ["Rel_Delta_T_surface", "Rel_Max_abs_dT_dx"]

# Marangis et al., Solar RRL 2024 algorithm, sized for the current thermal-path grid.
XGB_PARAMS = {
    "learning_rate": 0.05,
    "gamma": 0,
    "colsample_bytree": 1.0,
    "max_depth": 3,
    "n_estimators": 200,
    "subsample": 0.9,
    "min_child_weight": 1,
    "objective": "multi:softprob",
    "eval_metric": "mlogloss",
    "tree_method": "hist",
    "random_state": 42,
    "n_jobs": -1,
}

SEVERITY_ORDER = ["Healthy", "Mild", "Moderate", "Severe"]
SEVERITY_COLOUR = {
    "Healthy": "#3db8a0",
    "Mild": "#6aa4d8",
    "Moderate": "#e2a34a",
    "Severe": "#d4655a",
}

MODELS_DIR = config.PIPELINE_ROOT / "models"
MODEL_PATH = MODELS_DIR / "xgb_severity.json"
META_PATH = MODELS_DIR / "xgb_severity_meta.json"


def feature_columns(df: pd.DataFrame) -> list[str]:
    preferred = [c for c in PREFERRED_FEATURES if c in df.columns]
    if preferred:
        return preferred
    drop = LEAKAGE_COLUMNS | AUX_COLUMNS | DROP_FEATURES | OPERATING_COLUMNS | LOAD_CONFOUNDED
    return [c for c in df.columns if c not in drop]


def unique_physical_table(df: pd.DataFrame, feat_cols: list[str]) -> tuple[pd.DataFrame, int, int]:
    """Deduplicate on physical features; keep first metadata row of each vector."""
    n_raw = len(df)
    rounded = df[feat_cols].round(8)
    keep_idx = rounded.drop_duplicates().index
    unique = df.loc[keep_idx].reset_index(drop=True)
    return unique, n_raw, len(unique)


def make_classifier(n_classes: int, n_samples: int) -> XGBClassifier:
    params = dict(XGB_PARAMS)
    if n_samples < 16:
        params["n_estimators"] = min(params["n_estimators"], 80)
        params["max_depth"] = min(params["max_depth"], 2)
    return XGBClassifier(**params)


class _OOFPredictor:
    """Use precomputed out-of-fold labels inside evaluate_xgboost_model."""

    def __init__(self, oof: np.ndarray, importance_model: XGBClassifier):
        self._oof = np.asarray(oof)
        self.feature_importances_ = importance_model.feature_importances_
        self.classes_ = importance_model.classes_

    def predict(self, X):
        n = int(np.asarray(X).shape[0])
        if n != len(self._oof):
            raise ValueError("OOF predictor length does not match X")
        return self._oof


def _as_numpy(values) -> np.ndarray:
    if hasattr(values, "to_numpy"):
        return values.to_numpy()
    return np.asarray(values)


def evaluate_xgboost_model(
    model,
    X_test,
    y_test,
    feature_names=None,
    class_labels=None,
    plots_dir: Path | None = None,
    confusion_filename: str = "06_xgb_confusion.png",
    importance_filename: str = "07_xgb_importance.png",
) -> dict:
    """Score an already-trained XGBoost model. Does not retrain.

    Accepts pandas DataFrames or NumPy arrays. When X_test is a DataFrame
    and feature_names is omitted, column names are taken from X_test.
    """
    plots_dir = Path(plots_dir) if plots_dir is not None else config.PLOTS_DIR
    plots_dir.mkdir(parents=True, exist_ok=True)

    # Resolve feature names without assuming a NumPy layout.
    if feature_names is None:
        if hasattr(X_test, "columns"):
            feature_names = list(X_test.columns)
        else:
            n_cols = int(np.asarray(X_test).shape[1])
            feature_names = [f"f{i}" for i in range(n_cols)]
    feature_names = list(feature_names)

    X = _as_numpy(X_test)
    y_true = _as_numpy(y_test)

    # Generate predictions from the fitted model only.
    y_pred = model.predict(X)

    # Accuracy on the provided test set.
    acc = accuracy_score(y_true, y_pred)
    print(f"Accuracy: {acc:.4f}")
    print(f"Accuracy: {acc * 100:.2f}%")

    # Binary F1 when there are two classes; weighted F1 otherwise.
    n_labels = len(np.unique(np.concatenate([y_true, y_pred])))
    f1_average = "binary" if n_labels == 2 else "weighted"
    f1 = f1_score(y_true, y_pred, average=f1_average, zero_division=0)
    print(f"F1 Score: {f1:.4f}")
    print()

    # Per-class precision / recall / F1 / support (keep all trained classes even if absent in this test set).
    report_labels = class_labels
    if report_labels is None and hasattr(model, "classes_"):
        report_labels = [str(c) for c in model.classes_]
    report_ids = list(range(len(report_labels))) if report_labels is not None else None
    print(
        classification_report(
            y_true,
            y_pred,
            labels=report_ids,
            target_names=report_labels,
            zero_division=0,
        )
    )

    # One-row summary table.
    summary = pd.DataFrame(
        {"Model": ["XGBoost"], "Accuracy": [acc], "F1 Score": [f1]}
    )
    print(summary.to_string(index=False))
    print()

    # Confusion matrix with true labels on both axes.
    with plt.rc_context({"font.size": 11, "axes.titlesize": 13, "axes.labelsize": 12}):
        fig, ax = plt.subplots(figsize=(6.4, 5.6))
        label_ids = list(range(len(report_labels))) if report_labels is not None else None
        ConfusionMatrixDisplay.from_predictions(
            y_true,
            y_pred,
            labels=label_ids,
            display_labels=report_labels,
            cmap="Blues",
            ax=ax,
            colorbar=True,
        )
        n_ok = int((np.asarray(y_true) == np.asarray(y_pred)).sum())
        ax.set_title(f"XGBoost Confusion Matrix ({n_ok}/{len(y_true)})")
        fig.tight_layout()
        confusion_path = plots_dir / confusion_filename
        fig.savefig(confusion_path, dpi=200)
        plt.close(fig)

        # Top-5 gain importances (dashboard feature-importance figure).
        importances = np.asarray(model.feature_importances_, dtype=float)
        n_show = min(5, len(feature_names), len(importances))
        order = np.argsort(importances)[::-1][:n_show]
        names = [feature_names[i] for i in order][::-1]
        gains = importances[order][::-1]
        fig, ax = plt.subplots(figsize=(8.2, max(4.2, 0.38 * n_show + 1.6)))
        ax.barh(names, gains, color="#3db8a0")
        ax.set_xlabel("Feature Importance")
        ax.set_ylabel("Feature")
        ax.set_title("XGBoost Feature Importance")
        fig.tight_layout()
        importance_path = plots_dir / importance_filename
        fig.savefig(importance_path, dpi=200)
        plt.close(fig)

    print(f"Confusion matrix: {confusion_path}")
    print(f"Feature importance: {importance_path}")

    return {
        "accuracy": float(acc),
        "f1_score": float(f1),
        "f1_average": f1_average,
        "y_pred": y_pred,
        "summary": summary,
        "confusion_path": str(confusion_path),
        "importance_path": str(importance_path),
    }


def ranking_feature_columns(df: pd.DataFrame) -> list[str]:
    """Numeric predictors used only to rank importance (not the saved 2-feature model)."""
    drop = LEAKAGE_COLUMNS | AUX_COLUMNS | DROP_FEATURES
    cols: list[str] = []
    for c in df.columns:
        if c in drop or not pd.api.types.is_numeric_dtype(df[c]):
            continue
        if df[c].nunique(dropna=True) <= 1:
            continue
        if int(df[c].notna().sum()) < 8:
            continue
        cols.append(c)
    return cols


def plot_top5_importance_bar(names: list[str], gains: np.ndarray, path: Path) -> None:
    fig, ax = plt.subplots(figsize=(8.4, 4.8))
    ax.barh(names[::-1], gains[::-1], color="#3db8a0")
    ax.set_xlabel("Feature Importance")
    ax.set_ylabel("Feature")
    ax.set_title("XGBoost Feature Importance")
    fig.tight_layout()
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=200)
    plt.close(fig)


def plot_top5_vs_severity(df: pd.DataFrame, columns: list[str], path: Path) -> None:
    """Five boxplots: the ranked features versus Healthy / Mild / Moderate / Severe."""
    n = len(columns)
    fig, axes = plt.subplots(1, n, figsize=(3.15 * n, 4.6), sharex=True)
    if n == 1:
        axes = [axes]
    work = df.copy()
    work["severity"] = pd.Categorical(
        work["severity"], categories=list(SEVERITY_ORDER), ordered=True
    )
    for ax, col in zip(axes, columns):
        data = [work.loc[work["severity"] == s, col].dropna().to_numpy() for s in SEVERITY_ORDER]
        bp = ax.boxplot(
            data,
            tick_labels=["Healthy", "Mild", "Mod.", "Severe"],
            patch_artist=True,
            showfliers=True,
        )
        for patch, sev in zip(bp["boxes"], SEVERITY_ORDER):
            patch.set_facecolor(SEVERITY_COLOUR[sev])
            patch.set_alpha(0.6)
        ax.set_title(col, fontsize=10)
        ax.tick_params(axis="x", labelrotation=35)
        ax.grid(True, axis="y", alpha=0.3)
    axes[0].set_ylabel("Feature value")
    fig.suptitle("Top 5 XGBoost features versus degradation severity", fontsize=13, y=1.02)
    fig.tight_layout()
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=200, bbox_inches="tight")
    plt.close(fig)


def plot_top5_feature_figures(df: pd.DataFrame, encoder: LabelEncoder, plots_dir: Path) -> None:
    """Overwrite the feature-importance figure with the top 5 ranked predictors."""
    cols = ranking_feature_columns(df)
    if len(cols) < 2:
        return
    y = encoder.transform(df["severity"])
    X = df[cols].to_numpy(dtype=float)
    med = np.nanmedian(X, axis=0)
    X = np.where(np.isfinite(X), X, med)
    ranker = make_classifier(len(encoder.classes_), len(df))
    ranker.fit(X, y)
    gain = np.asarray(ranker.feature_importances_, dtype=float)
    n_show = min(5, len(cols))
    order = np.argsort(gain)[::-1][:n_show]
    names = [cols[i] for i in order]
    gains = gain[order]
    plots_dir.mkdir(parents=True, exist_ok=True)
    bar_path = plots_dir / "07_xgb_importance.png"
    panel_path = plots_dir / "10_top5_features_vs_severity.png"
    plot_top5_importance_bar(names, gains, bar_path)
    plot_top5_vs_severity(df, names, panel_path)
    print("Top 5 features by XGBoost gain:")
    for name, g in zip(names, gains):
        print(f"  {name}: {g:.4f}")
    print(f"Feature importance (top 5): {bar_path}")
    print(f"Top 5 versus severity:      {panel_path}")


def train(features_csv: Path, test_size: float = 0.3) -> tuple[XGBClassifier, LabelEncoder, list[str]]:
    df = pd.read_csv(features_csv)
    feat_cols = feature_columns(df)
    unique, n_raw, n_unique = unique_physical_table(df, feat_cols)

    print(f"Feature table: {features_csv}")
    print(f"Raw rows: {n_raw}")
    print(f"Unique physical feature rows: {n_unique}")
    print(f"Predictor columns ({len(feat_cols)}): {feat_cols}")
    print()
    if n_unique < n_raw:
        print(
            f"WARNING: {n_raw - n_unique} duplicate feature vectors. "
            f"Training on the {n_unique} unique rows so identical copies "
            "cannot leak from train into test."
        )
        print()

    work = unique
    if work["severity"].nunique() < 2:
        raise SystemExit("Need at least two severity classes to train.")

    encoder = LabelEncoder()
    present = [s for s in SEVERITY_ORDER if s in set(work["severity"])]
    encoder.fit(present)
    y = encoder.transform(work["severity"])
    X = work[feat_cols].to_numpy(dtype=float)

    counts = work["severity"].value_counts()
    print("Class counts (unique rows):")
    print(counts.to_string())
    print()

    min_class = int(counts.min())
    print("XGBoost params (adapted for the current thermal-path grid):")
    model = make_classifier(len(encoder.classes_), len(work))
    print(
        {
            k: getattr(model, k)
            for k in ("learning_rate", "max_depth", "n_estimators", "subsample", "min_child_weight")
        }
    )
    print()

    oof_acc = None
    oof_f1 = None
    oof = None
    n_cv_test = 0
    if min_class >= 2:
        n_splits = min(5, min_class)
        splitter = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
        oof = np.empty(len(y), dtype=int)
        print(f"Stratified {n_splits}-fold CV on the training table")
        for fold, (train_idx, test_idx) in enumerate(splitter.split(X, y), start=1):
            fold_model = make_classifier(len(encoder.classes_), len(train_idx))
            fold_model.fit(X[train_idx], y[train_idx])
            pred = fold_model.predict(X[test_idx])
            oof[test_idx] = pred
            acc_fold = accuracy_score(y[test_idx], pred)
            print(f"  fold {fold}: accuracy={acc_fold:.3f}  n_test={len(test_idx)}")
        oof_acc = accuracy_score(y, oof)
        oof_f1 = f1_score(y, oof, average="weighted", zero_division=0)
        n_cv_test = len(y)
        print(f"Out-of-fold accuracy: {oof_acc:.4f} ({oof_acc * 100:.2f}%)")
        print(f"Out-of-fold F1 Score: {oof_f1:.4f}")
        print()
    else:
        print("A class has only one unique row — skipping stratified CV.")
        print()

    # Blind validation folder is the test set; fit the saved model on every unique run.
    model.fit(X, y)
    print("Train accuracy (all unique rows):", accuracy_score(y, model.predict(X)))
    print()

    if oof is not None:
        print("Out-of-fold predictions (training table)")
        print("-" * 72)
        evaluate_xgboost_model(
            _OOFPredictor(oof, model),
            pd.DataFrame(X, columns=feat_cols),
            y,
            feature_names=feat_cols,
            class_labels=list(encoder.classes_),
            plots_dir=config.PLOTS_DIR,
            confusion_filename="06_xgb_confusion.png",
            importance_filename="07_xgb_importance.png",
        )
        print()

    _save_model(
        model,
        feat_cols,
        list(encoder.classes_),
        n_raw,
        n_unique,
        len(work),
        n_cv_test,
        oof_acc,
        oof_f1,
    )
    print(f"Saved model: {MODEL_PATH}")
    plot_top5_feature_figures(df, encoder, config.PLOTS_DIR)
    return model, encoder, feat_cols


def _save_model(
    model: XGBClassifier,
    feat_cols: list[str],
    labels: list[str],
    n_raw: int,
    n_unique: int,
    n_train: int,
    n_test: int,
    accuracy: float | None,
    f1: float | None,
) -> None:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    model.save_model(MODEL_PATH)
    meta = {
        "feature_columns": feat_cols,
        "classes": labels,
        "n_raw_rows": n_raw,
        "n_unique_rows": n_unique,
        "n_train": n_train,
        "n_test": n_test,
        "accuracy": accuracy,
        "f1_score": f1,
        "source": "XGBoost on Rel_Delta_T_surface / Rel_Max_abs_dT_dx (load-normalized)",
    }
    META_PATH.write_text(json.dumps(meta, indent=2))


def load_trained_model() -> tuple[XGBClassifier, list[str], list[str]]:
    if not MODEL_PATH.is_file() or not META_PATH.is_file():
        raise SystemExit(
            f"No saved model at {MODEL_PATH}. Train first:\n"
            "  python -m src.train_xgboost_baseline"
        )
    model = XGBClassifier()
    model.load_model(MODEL_PATH)
    meta = json.loads(META_PATH.read_text())
    return model, list(meta["feature_columns"]), list(meta["classes"])


def extract_test_cases(test_dir: Path) -> pd.DataFrame:
    """Run the same feature extractor on the 10-case drop folder."""
    print(f"Extracting test cases from {test_dir}")
    features = build_dataset(
        test_dir,
        inspect=False,
        out_csv=config.TEST_FEATURES_CSV,
        save_plots=False,
    )
    return features


def evaluate_test_folder(
    test_dir: Path,
    model: XGBClassifier | None = None,
    feat_cols: list[str] | None = None,
    class_labels: list[str] | None = None,
) -> dict | None:
    """Extract CSVs in test_dir and score the trained model. No retraining."""
    test_dir = test_dir.expanduser().resolve()
    if not test_dir.is_dir():
        print(f"Test folder does not exist yet: {test_dir}")
        print("Create it and drop ~10 run_*.csv files there, then rerun with --eval-only.")
        return None

    files = discover_csv_files(test_dir)
    if not files:
        print(
            f"No run_*.csv, thermal_*.csv, validation_*.csv, or test_*.csv files in {test_dir}"
        )
        print("Drop held-out CSVs there, then:")
        print("  python -m src.train_xgboost_baseline --eval-only")
        return None

    print(f"Note: {len(files)} held-out test files.")
    print(f"Test files ({len(files)}):")
    for path in files:
        print(f"  {path.name}")
    print()

    features = extract_test_cases(test_dir)
    if model is None or feat_cols is None or class_labels is None:
        model, feat_cols, class_labels = load_trained_model()

    missing = [c for c in feat_cols if c not in features.columns]
    if missing:
        raise SystemExit(f"Test features missing columns required by the model: {missing}")

    encoder = LabelEncoder()
    encoder.classes_ = np.array(class_labels)
    unknown = sorted(set(features["severity"]) - set(class_labels))
    if unknown:
        raise SystemExit(f"Test cases have severity labels not in the trained model: {unknown}")

    X_test = features[feat_cols]
    y_test = encoder.transform(features["severity"])

    print()
    print("External test folder (no retraining)")
    print("-" * 72)
    metrics = evaluate_xgboost_model(
        model,
        X_test,
        y_test,
        feature_names=feat_cols,
        class_labels=class_labels,
        plots_dir=config.PLOTS_DIR,
        confusion_filename="08_xgb_test_cases_confusion.png",
        importance_filename="09_xgb_test_cases_importance.png",
    )

    pred_labels = [class_labels[int(i)] for i in metrics["y_pred"]]
    preview = features[["source_file", "severity"]].copy()
    preview["predicted"] = pred_labels
    print("Per-file predictions:")
    print(preview.to_string(index=False))
    print(f"\nTest feature table: {config.TEST_FEATURES_CSV}")
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--features",
        type=Path,
        default=config.PROCESSED_DIR / "master_features.csv",
        help="master_features.csv from src.build_dataset",
    )
    parser.add_argument("--test-size", type=float, default=0.3)
    parser.add_argument(
        "--test-dir",
        type=Path,
        default=config.DEFAULT_TEST_DIR,
        help="Folder of held-out run_*.csv files (default: data/raw/test_cases)",
    )
    parser.add_argument(
        "--eval-only",
        action="store_true",
        help="Skip training. Extract --test-dir and evaluate the saved XGBoost model.",
    )
    args = parser.parse_args()

    if args.eval_only:
        evaluate_test_folder(args.test_dir)
        return

    path = args.features.expanduser().resolve()
    if not path.is_file():
        raise SystemExit(
            f"No feature table at {path}. Run: python -m src.build_dataset --raw-dir <folder>"
        )
    model, encoder, feat_cols = train(path, test_size=args.test_size)
    print()
    evaluate_test_folder(
        args.test_dir,
        model=model,
        feat_cols=feat_cols,
        class_labels=list(encoder.classes_),
    )


if __name__ == "__main__":
    main()
