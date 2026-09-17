"""Load and inspect raw Simulink Raman DTS simulation files.

Supports:
1. Wide CSV campaign (thermal_*.csv + simulation_manifest.csv) — primary.
2. Legacy Excel workbooks (T_DTS/Signal_* sheets + T_surface/).
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import pandas as pd

from . import config


@dataclass
class RunRecord:
    """One independent simulation run."""

    run_id: str
    source_file: str
    dts_path: Path
    surface_path: Path | None
    severity: str
    alpha_deg: float
    time_s: np.ndarray
    t_dts: np.ndarray  # shape (n_time, n_channels)
    t_surface: np.ndarray | None
    x_fibre: np.ndarray
    ambient_temperature: float = float("nan")
    load: float = float("nan")  # modulation index when available
    irradiance: float = float("nan")
    snr_db: float = float("nan")
    degradation_type: str = config.DEGRADATION_TYPE
    warnings: list[str] = field(default_factory=list)


def fibre_coordinates() -> np.ndarray:
    """Return x_fibre = 0:DX:L_FIBRE and verify 41 nodes."""
    x = np.arange(0.0, config.L_FIBRE + config.DX, config.DX)
    if len(x) != config.N_DTS_CHANNELS:
        raise RuntimeError(
            f"x_fibre length is {len(x)}, expected {config.N_DTS_CHANNELS}. "
            f"Check L_FIBRE={config.L_FIBRE} and DX={config.DX}."
        )
    return x


def inverter_mask(x_fibre: np.ndarray | None = None) -> np.ndarray:
    x = fibre_coordinates() if x_fibre is None else x_fibre
    return (x >= config.X_INV_START) & (x <= config.X_INV_END)


def detect_layout(raw_dir: Path) -> str:
    """Return 'csv' or 'excel' based on folder contents."""
    if (
        (raw_dir / config.MANIFEST_NAME).is_file()
        or any(raw_dir.glob("thermal_*.csv"))
        or any(raw_dir.glob("run_*.csv"))
        or any(raw_dir.glob("validation_*.csv"))
    ):
        return "csv"
    if (raw_dir / "T_DTS").is_dir():
        return "excel"
    raise FileNotFoundError(
        f"Unrecognised raw layout in {raw_dir}. "
        "Expected run_*.csv, thermal_*.csv, validation_*.csv "
        "(+ optional simulation_manifest.csv), or a T_DTS/ Excel folder."
    )


def infer_severity(filename: str) -> str | None:
    """Infer Healthy/Mild/Moderate/Severe from a filename token."""
    stem = Path(filename).stem.lower()
    matches = [sev for token, sev in config.FILENAME_SEVERITY.items() if token in stem]
    if len(matches) == 1:
        return matches[0]
    return None


def parse_operating_conditions(filename: str) -> tuple[float, float]:
    """Parse Ta / load from filenames.

    thermal_*_TaXX_mYYY.csv → (ambient_C, modulation)
    run_*_TaXX_VdcYYY_PZZZ.csv → (ambient_C, Vdc)  — Vdc is the load proxy
    """
    stem = Path(filename).stem
    ta = float("nan")
    load = float("nan")
    m_ta = re.search(r"_Ta(\d+(?:\.\d+)?)", stem, re.I)
    if m_ta:
        ta = float(m_ta.group(1))
    m_vdc = re.search(r"_Vdc(\d+(?:\.\d+)?)", stem, re.I)
    m_mod = re.search(r"_m(\d+)", stem, re.I)
    if m_vdc:
        load = float(m_vdc.group(1))
    elif m_mod:
        raw = float(m_mod.group(1))
        load = raw / 100.0 if raw > 1.0 else raw
    return ta, load


# ---------------------------------------------------------------------------
# CSV campaign loader
# ---------------------------------------------------------------------------


def _dts_column_sort_key(name: str) -> float:
    """Sort T_DTS_x5_5m before T_DTS_x6_0m by metres."""
    m = re.search(r"T_DTS_x(\d+)_(\d+)m$", name)
    if not m:
        return 1e9
    return float(m.group(1)) + float(m.group(2)) / 10.0


def _dts_channel_columns(columns: list[str]) -> list[str]:
    """Return DTS kelvin columns in spatial order (41 fibre locations)."""
    indexed: list[tuple[int, str]] = []
    for name in columns:
        m = re.match(r"^T_DTS_(\d+)_K$", str(name))
        if m:
            indexed.append((int(m.group(1)), str(name)))
    if indexed:
        indexed.sort(key=lambda t: t[0])
        return [n for _, n in indexed]
    # Legacy thermal_*.csv: T_DTS_x5_5m
    return sorted(
        [c for c in columns if str(c).startswith(config.CSV_DTS_PREFIX) and not str(c).endswith("_C")],
        key=_dts_column_sort_key,
    )


def load_csv_matrix(path: Path) -> tuple[np.ndarray, np.ndarray, np.ndarray | None, list[str]]:
    """Load one CSV run → (time_s, t_dts[n_time,41], t_surface|None, warnings)."""
    warnings: list[str] = []
    df = pd.read_csv(path)
    if config.CSV_TIME_COLUMN not in df.columns:
        raise ValueError(
            f"{path.name}: no {config.CSV_TIME_COLUMN!r} column. "
            f"Columns are {list(df.columns)[:12]}..."
        )
    dts_cols = _dts_channel_columns(list(df.columns))
    if len(dts_cols) != config.N_DTS_CHANNELS:
        warnings.append(
            f"{path.name}: found {len(dts_cols)} DTS columns, expected {config.N_DTS_CHANNELS}"
        )
    if not dts_cols:
        raise ValueError(
            f"{path.name}: no T_DTS_*_K or {config.CSV_DTS_PREFIX!r} columns."
        )

    time_s = pd.to_numeric(df[config.CSV_TIME_COLUMN], errors="coerce").to_numpy(dtype=float)
    t_dts = df[dts_cols].apply(pd.to_numeric, errors="coerce").to_numpy(dtype=float)
    t_surface = None
    if config.CSV_SURFACE_COLUMN in df.columns:
        t_surface = pd.to_numeric(df[config.CSV_SURFACE_COLUMN], errors="coerce").to_numpy(
            dtype=float
        )
    return time_s, t_dts, t_surface, warnings


def load_manifest(raw_dir: Path) -> pd.DataFrame | None:
    path = raw_dir / config.MANIFEST_NAME
    if not path.is_file():
        return None
    return pd.read_csv(path)


def discover_csv_files(raw_dir: Path) -> list[Path]:
    files = [
        p
        for p in raw_dir.glob("*.csv")
        if not p.name.startswith("~$")
        and p.name != config.MANIFEST_NAME
        and (
            p.name.startswith("thermal_")
            or p.name.startswith("run_")
            or p.name.startswith("validation_")
        )
    ]
    return sorted(files)


def load_csv_run(path: Path, manifest_row: pd.Series | None = None) -> RunRecord:
    time_s, t_dts, t_surface, warnings = load_csv_matrix(path)
    severity = None
    alpha = float("nan")
    ambient = float("nan")
    load = float("nan")
    deg_type = config.DEGRADATION_TYPE
    run_id = path.stem

    if manifest_row is not None:
        severity = str(manifest_row.get("severity", "")) or None
        alpha = float(manifest_row.get("alpha_deg", np.nan))
        ambient = float(manifest_row.get("ambient_temperature_C", np.nan))
        load = float(manifest_row.get("modulation_index", np.nan))
        deg_type = str(manifest_row.get("degradation_type", deg_type))
        if "run_id" in manifest_row and pd.notna(manifest_row["run_id"]):
            run_id = str(int(manifest_row["run_id"])) if float(manifest_row["run_id"]).is_integer() else str(manifest_row["run_id"])

    m_run = re.match(r"run_(\d+)_", path.name, re.I)
    if m_run and (manifest_row is None or "run_id" not in (manifest_row.index if manifest_row is not None else [])):
        run_id = m_run.group(1).lstrip("0") or "0"

    if severity is None:
        severity = infer_severity(path.name)
    if severity is None:
        raise ValueError(f"Cannot infer severity from {path.name}")
    if not np.isfinite(alpha):
        alpha = config.SEVERITY_ALPHA[severity]

    ta_file, mod_file = parse_operating_conditions(path.name)
    if not np.isfinite(ambient):
        ambient = ta_file
    if not np.isfinite(load):
        load = mod_file

    if t_surface is not None and len(t_surface) != len(time_s):
        warnings.append(
            f"{path.name}: T_surface length {len(t_surface)} != time {len(time_s)}"
        )

    return RunRecord(
        run_id=run_id,
        source_file=path.name,
        dts_path=path,
        surface_path=path if t_surface is not None else None,
        severity=severity,
        alpha_deg=alpha,
        time_s=time_s,
        t_dts=t_dts,
        t_surface=t_surface,
        x_fibre=fibre_coordinates(),
        ambient_temperature=ambient,
        load=load,
        degradation_type=deg_type,
        warnings=warnings,
    )


def load_all_csv_runs(raw_dir: Path) -> list[RunRecord]:
    files = discover_csv_files(raw_dir)
    if not files:
        raise FileNotFoundError(f"No run_*.csv or thermal_*.csv files in {raw_dir}")
    manifest = load_manifest(raw_dir)
    by_name: dict[str, pd.Series] = {}
    if manifest is not None and "source_file" in manifest.columns:
        for _, row in manifest.iterrows():
            by_name[str(row["source_file"])] = row

    runs: list[RunRecord] = []
    for path in files:
        runs.append(load_csv_run(path, by_name.get(path.name)))
    return runs


def inspect_csv_raw(raw_dir: Path, max_files: int = 3) -> None:
    files = discover_csv_files(raw_dir)
    manifest = load_manifest(raw_dir)
    print(f"Raw directory: {raw_dir}")
    print(f"Layout: CSV campaign")
    print(f"thermal_*.csv files: {len(files)}")
    if manifest is not None:
        print(f"Manifest: {config.MANIFEST_NAME}  rows={len(manifest)}  cols={list(manifest.columns)}")
        if "severity" in manifest.columns:
            print("Severity counts:")
            print(manifest["severity"].value_counts().to_string())
        if "status" in manifest.columns:
            print("Status counts:")
            print(manifest["status"].value_counts().to_string())
    print()
    for path in files[:max_files]:
        df = pd.read_csv(path)
        dts_cols = [c for c in df.columns if str(c).startswith(config.CSV_DTS_PREFIX)]
        print("=" * 72)
        print(f"FILE: {path.name}")
        print(f"  shape={df.shape}")
        print(f"  columns[:8]={list(df.columns[:8])}")
        print(f"  DTS columns={len(dts_cols)}")
        print(f"  missing={int(df.isna().sum().sum())}")
        print(df.head(2).iloc[:, :6].to_string(index=False))
        print()
    if len(files) > max_files:
        print(f"... ({len(files) - max_files} more files not printed)")


# ---------------------------------------------------------------------------
# Legacy Excel loader
# ---------------------------------------------------------------------------


def discover_excel_files(raw_dir: Path) -> tuple[list[Path], list[Path]]:
    dts_dir = raw_dir / "T_DTS"
    surf_dir = raw_dir / "T_surface"
    if not dts_dir.is_dir():
        raise FileNotFoundError(f"Expected DTS folder at {dts_dir}")
    dts_files = sorted(p for p in dts_dir.glob("*.xlsx") if not p.name.startswith("~$"))
    surf_files = (
        sorted(p for p in surf_dir.glob("*.xlsx") if not p.name.startswith("~$"))
        if surf_dir.is_dir()
        else []
    )
    return dts_files, surf_files


def _pair_surface(dts_path: Path, surf_files: list[Path]) -> Path | None:
    sev = infer_severity(dts_path.name)
    if sev is None:
        return None
    for s in surf_files:
        if infer_severity(s.name) == sev:
            return s
    return None


def _sheet_sort_key(name: str) -> tuple[int, str]:
    m = re.search(r"(\d+)$", name)
    return (int(m.group(1)), name) if m else (10**9, name)


def load_dts_matrix_excel(path: Path) -> tuple[np.ndarray, np.ndarray, list[str]]:
    warnings: list[str] = []
    xl = pd.ExcelFile(path)
    sheets = sorted(xl.sheet_names, key=_sheet_sort_key)
    if len(sheets) != config.N_DTS_CHANNELS:
        warnings.append(
            f"{path.name}: found {len(sheets)} sheets, expected {config.N_DTS_CHANNELS}"
        )

    time: np.ndarray | None = None
    columns: list[np.ndarray] = []
    for sheet in sheets:
        df = pd.read_excel(path, sheet_name=sheet)
        if config.DTS_TIME_COLUMN not in df.columns:
            raise ValueError(
                f"{path.name}/{sheet}: no {config.DTS_TIME_COLUMN!r} column. "
                f"Columns are {list(df.columns)}."
            )
        if config.DTS_TEMPERATURE_COLUMN not in df.columns:
            raise ValueError(
                f"{path.name}/{sheet}: no {config.DTS_TEMPERATURE_COLUMN!r} column. "
                f"Columns are {list(df.columns)}."
            )
        t = pd.to_numeric(df[config.DTS_TIME_COLUMN], errors="coerce").to_numpy(dtype=float)
        ch = pd.to_numeric(
            df[config.DTS_TEMPERATURE_COLUMN], errors="coerce"
        ).to_numpy(dtype=float)
        if time is None:
            time = t
        elif len(t) != len(time) or not np.allclose(t, time, equal_nan=True):
            warnings.append(f"{path.name}/{sheet}: time vector differs from Signal_1")
        columns.append(ch)

    t_dts = np.column_stack(columns)
    assert time is not None
    if t_dts.shape[0] == config.N_DTS_CHANNELS and t_dts.shape[1] != config.N_DTS_CHANNELS:
        warnings.append(f"{path.name}: transposing DTS matrix to n_time × n_channels")
        t_dts = t_dts.T
    return time, t_dts, warnings


def load_surface_excel(path: Path | None) -> np.ndarray | None:
    if path is None:
        return None
    df = pd.read_excel(path)
    if config.SURFACE_TEMPERATURE_COLUMN not in df.columns:
        raise ValueError(
            f"{path.name}: no {config.SURFACE_TEMPERATURE_COLUMN!r} column. "
            f"Columns are {list(df.columns)}."
        )
    return pd.to_numeric(df[config.SURFACE_TEMPERATURE_COLUMN], errors="coerce").to_numpy(
        dtype=float
    )


def load_excel_run(dts_path: Path, surface_path: Path | None) -> RunRecord:
    severity = infer_severity(dts_path.name)
    if severity is None:
        raise ValueError(f"Cannot infer severity from {dts_path.name}")
    time_s, t_dts, warnings = load_dts_matrix_excel(dts_path)
    t_surface = load_surface_excel(surface_path)
    if t_surface is not None and len(t_surface) != len(time_s):
        warnings.append(
            f"{dts_path.name}: T_surface length {len(t_surface)} != DTS time {len(time_s)}"
        )
    return RunRecord(
        run_id=dts_path.stem,
        source_file=dts_path.name,
        dts_path=dts_path,
        surface_path=surface_path,
        severity=severity,
        alpha_deg=config.SEVERITY_ALPHA[severity],
        time_s=time_s,
        t_dts=t_dts,
        t_surface=t_surface,
        x_fibre=fibre_coordinates(),
        warnings=warnings,
    )


def load_all_excel_runs(raw_dir: Path) -> list[RunRecord]:
    dts_files, surf_files = discover_excel_files(raw_dir)
    if not dts_files:
        raise FileNotFoundError(f"No DTS .xlsx files in {raw_dir / 'T_DTS'}")
    return [load_excel_run(dts, _pair_surface(dts, surf_files)) for dts in dts_files]


def inspect_excel_raw(raw_dir: Path) -> None:
    dts_files, surf_files = discover_excel_files(raw_dir)
    print(f"Raw directory: {raw_dir}")
    print(f"Layout: legacy Excel")
    print(f"DTS files ({len(dts_files)}):")
    for p in dts_files:
        print(f"  {p.name}")
    print(f"Surface files ({len(surf_files)}):")
    for p in surf_files:
        print(f"  {p.name}")
    print()
    for path in [*dts_files[:1], *surf_files[:1]]:
        xl = pd.ExcelFile(path)
        print("=" * 72)
        print(f"FILE: {path.name}  sheets={len(xl.sheet_names)}")
        df = pd.read_excel(path, sheet_name=xl.sheet_names[0])
        print(f"  first sheet={xl.sheet_names[0]!r} shape={df.shape} cols={list(df.columns)}")
        print(df.head(2).to_string(index=False))
        print()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def inspect_raw(raw_dir: Path) -> None:
    layout = detect_layout(raw_dir)
    if layout == "csv":
        inspect_csv_raw(raw_dir)
    else:
        inspect_excel_raw(raw_dir)


def load_all_runs(raw_dir: Path) -> list[RunRecord]:
    layout = detect_layout(raw_dir)
    if layout == "csv":
        return load_all_csv_runs(raw_dir)
    return load_all_excel_runs(raw_dir)
