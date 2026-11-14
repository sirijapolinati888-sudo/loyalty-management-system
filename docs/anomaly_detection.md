# Anomaly Detection & Ground Truth Benchmark

## Injected Anomaly Cases

1. **`BALANCE_MISMATCH`**: Cached loyalty account balance was corrupted, causing divergence from the posted immutable transaction ledger sum.
2. **`OVER_REDEMPTION`**: Redemption transaction exceeded the customer's available points balance.
3. **`MISSING_REVERSAL`**: An order return was recorded without posting the mandatory negative reversal transaction.
4. **`DOUBLE_EXPIRY`**: A single point lot was expired more than once in the ledger.
5. **`INCORRECT_TIER`**: A customer was assigned an upgraded tier using gross spend instead of qualifying net spend.

## Detection Methodology
- The **ValidationEngine** inspects database integrity, business rules, and ledger reconciliation **without reading ground_truth.json**.
- Evaluated against `data/ground_truth/ground_truth.json`:
  - **Ground Truth Injected**: 5
  - **True Positives**: 5 / 5
  - **False Positives**: 0
  - **False Negatives**: 0
  - **Precision**: 1.0 (100%)
  - **Recall**: 1.0 (100%)
  - **F1 Score**: 1.0 (100%)
  - **Detection Accuracy**: 100.0%

