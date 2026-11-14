# Business Rules Specification

## 1. Points Accrual
- **Rule**: Every ₹100 of eligible net spend yields 1 loyalty point (configurable).
- **Formula**: `points_earned = floor(eligible_net_spend / spend_threshold) * points_awarded`
- **Exclusions**: Ineligible order line items and cancelled orders yield 0 points.
- **Lot Tracking**: Each accrual creates a `PointsLot` with `remaining_points = initial_points` and an expiry timestamp (`created_at + 365 days`).

## 2. Points Redemption
- **Concurrency**: Guaranteed by row-level locking on `LoyaltyAccount` (`SELECT ... FOR UPDATE`).
- **Lot Consumption**: Strict First-In-First-Out (FIFO) consumption of active unexpired point lots.
- **Idempotency**: Duplicate requests using the same `idempotency_key` return existing records without double-deduction.

## 3. Order Returns & Reversals
- **Proportional Reversal**: When an order is partially or fully returned, points to reverse are calculated as `round(points_earned * (eligible_return_amount / eligible_net_spend))`.
- **Negative Balance Handling**: Accounts may temporarily reflect deficit balances if points were already redeemed, tracked until recovered by future orders.

## 4. Point Expiration
- Point lots with `expires_at <= cutoff_date` and `remaining_points > 0` are expired.
- An `ExpiryBatch` and negative `PointsTransaction` records are created. Duplicate runs are idempotent and ignore already-expired lots.

## 5. Tier Progression
- Qualifying thresholds:
  - **Bronze**: ₹0 – ₹9,999
  - **Silver**: ₹10,000 – ₹49,999
  - **Gold**: ₹50,000 – ₹99,999
  - **Platinum**: ₹100,000+
- Tier evaluation is strictly based on **qualifying net spend**, not gross spend.

