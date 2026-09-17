I have an existing XGBoost classification algorithm in my project. Please add a model evaluation section without changing the core training logic.

Create clear, publication-quality visualizations and metric outputs for the XGBoost model:

1. **Confusion Matrix**

   * Generate predictions on the test set.
   * Calculate the confusion matrix using `sklearn.metrics.confusion_matrix`.
   * Visualize it using `ConfusionMatrixDisplay` or a clean Matplotlib heatmap.
   * Show the actual class labels on both axes.
   * Add a descriptive title: **"XGBoost Confusion Matrix"**.
   * Display the values inside each matrix cell.

2. **Feature Importance**

   * Extract feature importance values from the trained XGBoost model.
   * Match each importance value to the correct feature name.
   * Sort the features from most important to least important.
   * Create a horizontal bar chart showing the **Top 15 Most Important Features**.
   * Label the x-axis **"Feature Importance"** and y-axis **"Feature"**.
   * Title the chart **"XGBoost Feature Importance"**.
   * Make sure long feature names remain readable.

3. **Accuracy**

   * Calculate test-set accuracy using:
     `accuracy_score(y_test, y_pred)`
   * Print the result clearly, for example:
     `Accuracy: 0.9234`
   * Also show it as a percentage.

4. **F1 Score**

   * Calculate the F1 score using `sklearn.metrics.f1_score`.
   * For binary classification, use the appropriate binary F1 score.
   * For multiclass classification, use `average="weighted"`.
   * Print the result clearly, for example:
     `F1 Score: 0.9187`

5. **Classification Report**

   * Generate and print a full classification report using:
     `classification_report(y_test, y_pred)`
   * Include precision, recall, F1-score, and support.

6. **Summary Output**

   * Create a small results DataFrame containing:

     * Model: XGBoost
     * Accuracy
     * F1 Score
   * Print the DataFrame in a clean format.

Please organize the code into a reusable function such as:

```python
evaluate_xgboost_model(model, X_test, y_test, feature_names=None)
```

The function should:

* work with my already-trained XGBoost model,
* automatically generate predictions,
* calculate all metrics,
* generate both plots,
* handle pandas DataFrames and NumPy arrays,
* use `X_test.columns` automatically when `X_test` is a DataFrame,
* contain comments explaining each major step,
* avoid retraining the model,
* and return the calculated metrics in a dictionary.

Use Python libraries already common in machine-learning projects:
`numpy`, `pandas`, `matplotlib`, `scikit-learn`, and `xgboost`.

After implementing it, show me exactly where I should call the function in my existing XGBoost workflow.
