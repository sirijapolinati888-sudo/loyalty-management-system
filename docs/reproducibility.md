# Reproducibility Evidence

- **Deterministic Seed**: `20261022`
- **Verification Script**: `scripts/verify_reproducibility.py`

## Methodology
The synthetic data generator was executed twice in two separate isolated environments using the exact same random seed. All master entities and transaction ledger files were exported to CSV and JSON formats and compared using cryptographic SHA-256 hashes.

## Verification Log
```text
Comparing SHA-256 Checksums across both runs:
 - customers.csv: MATCH (100% Deterministic)
 - customers.json: MATCH (100% Deterministic)
 - expiry_batches.csv: MATCH (100% Deterministic)
 - expiry_batches.json: MATCH (100% Deterministic)
 - loyalty_accounts.csv: MATCH (100% Deterministic)
 - loyalty_accounts.json: MATCH (100% Deterministic)
 - orders.csv: MATCH (100% Deterministic)
 - orders.json: MATCH (100% Deterministic)
 - points_lots.csv: MATCH (100% Deterministic)
 - points_lots.json: MATCH (100% Deterministic)
 - points_transactions.csv: MATCH (100% Deterministic)
 - points_transactions.json: MATCH (100% Deterministic)
 - redemptions.csv: MATCH (100% Deterministic)
 - redemptions.json: MATCH (100% Deterministic)
 - rewards.csv: MATCH (100% Deterministic)
 - rewards.json: MATCH (100% Deterministic)
 - rules.csv: MATCH (100% Deterministic)
 - rules.json: MATCH (100% Deterministic)
 - tiers.csv: MATCH (100% Deterministic)
 - tiers.json: MATCH (100% Deterministic)

Reproducibility Verification: PASSED (100% Deterministic Bit-For-Bit Match)
```

