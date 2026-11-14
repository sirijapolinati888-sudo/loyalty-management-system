# Database Schema Documentation

The system manages 19 normalized relational PostgreSQL tables.

### 10 Mandatory Core Entities
1. **`customers`**: Primary customer profile record.
   - `id`: `CUST-000001` format.
2. **`loyalty_accounts`**: Loyalty balance, lifetime statistics, and spend metrics.
   - `id`: `LOY-CUST-000001` format.
3. **`tiers`**: Configurable tier definition and spend boundaries.
4. **`rules`**: Configurable accrual logic.
5. **`orders`**: Customer purchasing orders.
   - `id`: `ORD-2026-000001` format.
6. **`order_lines`**: Itemized lines, SKUs, categories, and eligibility flags.
7. **`points_transactions`**: Append-only immutable signed ledger.
   - `id`: `PTS-2026-00000001` format.
8. **`rewards`**: Redemption catalogue items and points costs.
9. **`redemptions`**: Completed reward redemptions.
   - `id`: `RDM-2026-000001` format.
10. **`expiry_batches`**: Batch execution records for point expirations.
    - `id`: `EXP-2026-000001` format.

### 9 Supporting Entities
11. **`points_lots`**: FIFO point lot tracking with initial/remaining points.
12. **`order_returns`**: Full and partial return tracking.
13. **`order_return_lines`**: Itemized return line tracking.
14. **`tier_history`**: Audit trail of customer tier transitions and effective dates.
15. **`rule_history`**: Versioned history of rules.
16. **`redemption_attempts`**: Audit trail of valid and rejected redemption attempts.
17. **`audit_logs`**: General entity mutation audit logs.
18. **`idempotency_records`**: Idempotent API protection records.
19. **`anomaly_records`**: Detected business and ledger anomalies.

