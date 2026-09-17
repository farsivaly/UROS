# XGBoost test cases (12 unseen)

Drop held-out Raman DTS CSVs here. They are **not** used for training.

## Current set

| Files | Source |
|---|---|
| `validation_001`–`004` cond1 Ta17.5 Vdc525 | Real Simulink |
| `validation_005`–`006` cond2 Ta27.5 Vdc625 Healthy/Mild | Real Simulink |
| `validation_007`–`008` cond2 Moderate/Severe | **Simulated** placeholder |
| `validation_009`–`012` cond3 Ta22.5 Vdc575 | **Simulated** placeholder |

Cond3 (22.5 °C / 575 V) is an off-grid stand-in until the real third validation condition is exported. Overwrite any simulated file with the matching Simulink CSV (keep the same name pattern).

Regenerate simulated placeholders from the current training grid (keeps real Simulink files 001–006):

```bash
cd ml
python -m src.simulate_unseen_validation --overwrite-simulated
```

## Commands

```bash
cd ml
python -m src.build_dataset --no-inspect
python -m src.train_xgboost_baseline
```
