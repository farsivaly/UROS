Audit my entire XGBoost evaluation pipeline for data leakage, invalid train/test overlap, and misleading F1 scores.

Context:
- I am classifying 4 thermal degradation severity classes for a solar inverter digital twin.
- Each simulation run should correspond to ONE independent ML sample after feature extraction.
- Features include physically meaningful Raman DTS / thermal features such as:
  - DeltaT
  - AUC
  - max dT/dt
  - steady-state temperature
  - max/mean dT/dx
  - spatial standard deviation / spatial hotspot features
- Metadata / labels that must NEVER be used as model input include:
  - severity
  - alpha_deg
  - Rth2 or degradation resistance values
  - degradation_type if it encodes the label
  - run_id
  - source filename/path
  - any feature directly calculated from the target label
- I recently asked the model/code to “improve” performance, and I am concerned it may have accidentally introduced leakage or selected an easier test set.
- Current reported result is F1 = 1.00 on 6 supposedly unseen test cases, with DeltaT the most influential feature.

I want a strict forensic audit. Do NOT modify the model initially. First inspect and report what the current code is actually doing.

Please check all of the following:

1. TRAIN/TEST UNSEENNESS
- Identify exactly how the train, validation, and test sets are constructed.
- Print the run IDs / source files / operating conditions / class labels contained in each split.
- Check whether any exact simulation run appears in more than one split.
- Check whether duplicate feature rows appear across train and test.
- Check whether near-duplicate rows appear across train and test.
- Check whether simulations with identical or essentially identical operating conditions and degradation settings are split across train and test.
- Specifically compare Ta, Vdc, Pload, modulation index, degradation class, alpha_deg, and any other sweep variables.
- Tell me whether the 6 test cases are genuinely unseen operating conditions or merely unseen rows.

2. DATA LEAKAGE
- Print the exact feature columns passed into XGBoost.
- Flag any target-derived or metadata-derived columns.
- Search the full preprocessing pipeline for use of:
  severity, label, class, alpha_deg, Rth, Rth2, degradation, run_id, filename, file path, test label, or target encoding.
- Check whether feature scaling, imputation, feature selection, PCA, threshold selection, or any preprocessing was fit using the full dataset before the train/test split.
- Check whether test data influences hyperparameter tuning, early stopping, feature selection, threshold optimisation, or model selection.
- Check whether the code repeatedly evaluates on the same test set while changing the model, which would effectively turn the test set into a validation set.

3. FEATURE EXTRACTION LEAKAGE
- Confirm that each simulation produces only one independent ML row.
- Ensure the 6002 time samples from one simulation are not treated as 6002 independent training examples.
- Verify that feature extraction for test cases is performed independently without accessing training labels or global statistics calculated from all runs.
- Check whether DeltaT is calculated purely from measured/simulated temperature data and not from alpha_deg, severity, or another degradation parameter.

4. F1 CALCULATION
- Show exactly how F1 = 1.00 is calculated.
- Print:
  - y_true
  - y_pred
  - confusion matrix
  - accuracy
  - macro F1
  - weighted F1
  - per-class precision
  - per-class recall
  - per-class F1
  - support for each class
- Confirm whether the reported F1 is binary, micro, macro, weighted, or another averaging method.
- Because this is a 4-class problem, make sure the headline F1 is clearly defined.
- Check whether any classes are absent from the 6-case test set.

5. TEST-SET QUALITY
- State how many examples from each degradation class are present in the 6 test cases.
- Flag if the test set is class-imbalanced or does not include all 4 classes.
- Check whether the 6 selected cases are unusually easy compared with the training distribution.
- Compare DeltaT distributions between train and test by class.
- Tell me whether simple thresholds on DeltaT alone could classify the six test cases perfectly.
- Train/evaluate a very simple baseline using DeltaT only, without changing the main XGBoost result, so I can see whether XGBoost is actually adding value.

6. FEATURE IMPORTANCE
- Report the exact feature-importance method currently being used:
  gain, weight, cover, permutation importance, SHAP, etc.
- Do not claim DeltaT is the “most influential” feature unless the method supports that interpretation.
- Show the ranking and values for all features.
- If possible, compute permutation importance on the held-out data as a secondary check.
- Flag instability due to the test set containing only 6 samples.

7. EFFECT OF THE PREVIOUS “IMPROVE THE MODEL” REQUEST
- Inspect version history / recent code changes if available.
- Identify anything changed specifically to increase accuracy/F1.
- Flag:
  - removal of difficult samples
  - selective test-case choice
  - feature engineering using labels
  - test-set reuse
  - hyperparameter tuning on the test set
  - class filtering
  - altered random seeds until a better score appeared
  - data duplication
  - oversampling before splitting
  - leakage through filenames or sorted dataset construction

8. PRODUCE AN AUDIT REPORT
At the end, give me a concise report with:

A. Is the F1 = 1.00 result valid?
   - VALID
   - PROVISIONALLY VALID
   - INVALID / LEAKAGE DETECTED

B. Are the 6 cases genuinely unseen?
   Explain precisely in what sense they are unseen.

C. Is there any train/test contamination?

D. Are all four degradation classes represented?

E. Is DeltaT physically derived and leakage-free?

F. What is the biggest weakness of the current evaluation?

G. What result can I safely state in an academic presentation?

H. What should I fix before rerunning the model?

Important:
- Do not optimise or retrain anything until the audit is complete.
- Do not hide warnings just because the model currently gets F1 = 1.00.
- Be conservative and assume perfect performance may indicate leakage until disproven.
- Show me file names, line numbers, functions, and code snippets responsible for every important finding.
- If you find leakage, explain exactly why it is leakage and how it affects the reported F1.