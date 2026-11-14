# Field-Level Data Dictionary

## 1. Mandatory Core Entities

### 1.1 `customers`
Stores primary customer identity records.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | Deterministic Customer ID, format: `CUST-000001` |
| `first_name` | VARCHAR(100) | NOT NULL | Customer first name |
| `last_name` | VARCHAR(100) | NOT NULL | Customer last name |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, INDEX | Customer email address |
| `phone` | VARCHAR(50) | NULLABLE | Customer mobile telephone number |
| `status` | ENUM | NOT NULL, DEFAULT 'ACTIVE' | Lifecycle status (`ACTIVE`, `INACTIVE`, `SUSPENDED`) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT UTC | Timestamp when record was created |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT UTC | Timestamp when record was last updated |

---

### 1.2 `loyalty_accounts`
Maintains customer points balances, spend totals, and tier linkages.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | Loyalty Account ID, format: `LOY-CUST-000001` |
| `customer_id` | VARCHAR(50) | FOREIGN KEY (`customers.id`), UNIQUE, NOT NULL, INDEX | Associated customer reference |
| `current_tier_id` | VARCHAR(50) | FOREIGN KEY (`tiers.id`), NOT NULL, INDEX | Current membership tier |
| `cached_balance` | INTEGER | NOT NULL, DEFAULT 0 | Real-time cached points balance |
| `lifetime_points_earned` | INTEGER | NOT NULL, DEFAULT 0 | Cumulative points earned since inception |
| `lifetime_points_redeemed`| INTEGER | NOT NULL, DEFAULT 0 | Cumulative points spent across redemptions |
| `lifetime_points_expired` | INTEGER | NOT NULL, DEFAULT 0 | Cumulative points expired |
| `lifetime_points_reversed`| INTEGER | NOT NULL, DEFAULT 0 | Cumulative points reversed via returns |
| `qualifying_net_spend` | FLOAT | NOT NULL, DEFAULT 0.0 | Net eligible spend used for tier progression |
| `gross_spend` | FLOAT | NOT NULL, DEFAULT 0.0 | Total gross order spend |
| `status` | ENUM | NOT NULL, DEFAULT 'ACTIVE' | Account state (`ACTIVE`, `FROZEN`, `CLOSED`) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT UTC | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT UTC | Last update timestamp |

---

### 1.3 `tiers`
Configurable membership tier definitions and qualification thresholds.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | Tier ID (`TIER-BRONZE`, `TIER-SILVER`, etc.) |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL | Tier display name (`Bronze`, `Silver`, `Gold`, `Platinum`) |
| `min_spend` | FLOAT | NOT NULL | Minimum qualifying net spend in INR |
| `max_spend` | FLOAT | NULLABLE | Upper spend limit in INR (NULL for top tier) |
| `multiplier` | FLOAT | NOT NULL, DEFAULT 1.0 | Points earning multiplier |
| `description` | VARCHAR(255) | NULLABLE | Tier benefits description |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT UTC | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT UTC | Last update timestamp |

---

### 1.4 `rules`
Configurable point accrual rules and validity periods.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | Rule ID, format: `RULE-ACCRUAL-01` |
| `name` | VARCHAR(100) | NOT NULL | Rule display name |
| `rule_type` | VARCHAR(50) | NOT NULL, DEFAULT 'ACCRUAL' | Category of business rule |
| `spend_threshold` | FLOAT | NOT NULL, DEFAULT 100.0 | Net spend required to earn points in INR |
| `points_awarded` | INTEGER | NOT NULL, DEFAULT 1 | Points awarded per threshold unit |
| `expiry_days` | INTEGER | NOT NULL, DEFAULT 365 | Point validity lifespan in days |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Active toggle |
| `description` | TEXT | NULLABLE | Detailed rule explanation |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT UTC | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT UTC | Last update timestamp |

---

### 1.5 `orders`
Customer purchasing transactions with points eligibility metrics.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | Order ID, format: `ORD-2026-000001` |
| `customer_id` | VARCHAR(50) | FOREIGN KEY (`customers.id`), NOT NULL, INDEX | Purchasing customer |
| `total_gross_amount` | FLOAT | NOT NULL | Total gross order value in INR |
| `discount_amount` | FLOAT | NOT NULL, DEFAULT 0.0 | Total order discounts in INR |
| `net_amount` | FLOAT | NOT NULL | Final net amount paid in INR |
| `eligible_net_spend` | FLOAT | NOT NULL | Portion of net spend eligible for loyalty points |
| `points_earned` | INTEGER | NOT NULL, DEFAULT 0 | Loyalty points calculated and posted |
| `status` | ENUM | NOT NULL, DEFAULT 'COMPLETED' | Status (`COMPLETED`, `CANCELLED`, `RETURNED`, `PARTIALLY_RETURNED`) |
| `order_date` | TIMESTAMPTZ | NOT NULL | Date and time order occurred |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT UTC | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT UTC | Record update timestamp |

---

### 1.6 `order_lines`
Individual itemized products purchased within an order.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | Order Line ID, format: `ORDL-2026-000001-01` |
| `order_id` | VARCHAR(50) | FOREIGN KEY (`orders.id`), NOT NULL, INDEX | Parent order reference |
| `product_sku` | VARCHAR(100) | NOT NULL | Product SKU code |
| `product_name` | VARCHAR(200) | NOT NULL | Product item name |
| `category` | VARCHAR(100) | NOT NULL | Product merchandise category |
| `quantity` | INTEGER | NOT NULL, DEFAULT 1 | Item quantity |
| `unit_price` | FLOAT | NOT NULL | Price per unit in INR |
| `line_total` | FLOAT | NOT NULL | Item subtotal in INR (`quantity * unit_price`) |
| `is_eligible_for_points`| BOOLEAN | NOT NULL, DEFAULT TRUE | Earning eligibility toggle |

---

### 1.7 `points_transactions`
The append-only immutable financial ledger of all loyalty points movements.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | Transaction ID, format: `PTS-2026-00000001` |
| `loyalty_account_id` | VARCHAR(50) | FOREIGN KEY (`loyalty_accounts.id`), NOT NULL, INDEX | Affected loyalty account |
| `customer_id` | VARCHAR(50) | FOREIGN KEY (`customers.id`), NOT NULL, INDEX | Affected customer |
| `transaction_type` | ENUM | NOT NULL | Type (`ACCRUAL`, `REDEMPTION`, `REVERSAL`, `EXPIRATION`, `ADJUSTMENT`) |
| `points_amount` | INTEGER | NOT NULL | Signed integer amount (+ for earned, - for spent/reversed) |
| `reference_entity` | VARCHAR(50) | NULLABLE | Origin entity name (`ORDER`, `REDEMPTION`, `RETURN`, `EXPIRY_BATCH`) |
| `reference_entity_id` | VARCHAR(50) | NULLABLE, INDEX | Origin entity primary key |
| `original_transaction_id`| VARCHAR(50)| FOREIGN KEY (`points_transactions.id`), NULLABLE, INDEX | Reference to original accrual for reversals and expirations |
| `rule_id` | VARCHAR(50) | FOREIGN KEY (`rules.id`), NULLABLE | Rule governing this transaction |
| `expiry_date` | TIMESTAMPTZ | NULLABLE | Expiry timestamp for earned points |
| `status` | ENUM | NOT NULL, DEFAULT 'POSTED' | Status (`POSTED`, `PENDING`, `REVERSED`, `FAILED`) |
| `reason` | VARCHAR(255) | NULLABLE | Business description/audit memo |
| `idempotency_key` | VARCHAR(100)| UNIQUE, NULLABLE, INDEX | Deduplication key |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT UTC, INDEX | Immutable transaction timestamp |

---

### 1.8 `rewards`
Catalogue of rewards redeemable using points.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | Reward ID, format: `RWD-001` |
| `name` | VARCHAR(150) | NOT NULL | Reward title |
| `description` | TEXT | NULLABLE | Reward description |
| `points_required` | INTEGER | NOT NULL | Points required to claim reward |
| `monetary_value` | FLOAT | NOT NULL, DEFAULT 0.0 | Equivalent rupee value in INR |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Active catalogue toggle |
| `stock_count` | INTEGER | NOT NULL, DEFAULT -1 | Inventory count (-1 for unlimited) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT UTC | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT UTC | Update timestamp |

---

### 1.9 `redemptions`
Records of completed points redemptions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | Redemption ID, format: `RDM-2026-000001` |
| `loyalty_account_id` | VARCHAR(50) | FOREIGN KEY (`loyalty_accounts.id`), NOT NULL, INDEX | Account debited |
| `customer_id` | VARCHAR(50) | FOREIGN KEY (`customers.id`), NOT NULL, INDEX | Customer redeeming |
| `reward_id` | VARCHAR(50) | FOREIGN KEY (`rewards.id`), NOT NULL, INDEX | Reward claimed |
| `points_redeemed` | INTEGER | NOT NULL | Points deducted |
| `status` | ENUM | NOT NULL, DEFAULT 'SUCCESSFUL' | Status (`SUCCESSFUL`, `FAILED`, `REVERSED`) |
| `failure_reason` | VARCHAR(255) | NULLABLE | Explanation if redemption failed |
| `idempotency_key` | VARCHAR(100)| UNIQUE, NULLABLE, INDEX | Deduplication key |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT UTC, INDEX | Timestamp of redemption |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT UTC | Timestamp of last modification |

---

### 1.10 `expiry_batches`
Audit batch log of automated points expiration executions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(50) | PRIMARY KEY | Batch ID, format: `EXP-2026-000001` |
| `execution_date` | TIMESTAMPTZ | NOT NULL, DEFAULT UTC | Time batch ran |
| `cutoff_date` | TIMESTAMPTZ | NOT NULL | Point lot cutoff threshold |
| `total_accounts_processed`| INTEGER | NOT NULL, DEFAULT 0 | Count of affected loyalty accounts |
| `total_points_expired` | INTEGER | NOT NULL, DEFAULT 0 | Total sum of points expired |
| `status` | ENUM | NOT NULL, DEFAULT 'COMPLETED' | Batch status (`COMPLETED`, `FAILED`) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT UTC | Creation timestamp |

---

## 2. Supporting Entities

| Table | Primary Key | Key Foreign Keys | Purpose |
| :--- | :--- | :--- | :--- |
| `points_lots` | `id` (`LOT-2026-000001`) | `loyalty_account_id`, `original_transaction_id` | Tracks individual FIFO point lots with remaining balances and expiration dates. |
| `order_returns` | `id` (`RET-2026-000001`) | `order_id` | Full and partial return tracking with proportional points reversed. |
| `order_return_lines`| `id` (`RETL-2026-000001-01`)| `return_id`, `order_line_id` | Itemized line return tracking. |
| `tier_history` | `id` (`TH-000001`) | `customer_id`, `tier_id` | Audit trail of customer tier upgrades and downgrades with qualifying spend. |
| `rule_history` | `id` (`RH-000001`) | `rule_id` | Versioned history of rule threshold changes and effective date intervals. |
| `redemption_attempts`| `id` (`RA-000001`) | `customer_id`, `reward_id` | Complete log of all redemption requests, including balance validation rejections. |
| `audit_logs` | `id` (`AUD-000001`) | `entity_id` | General audit trail capturing previous and updated values for business events. |
| `idempotency_records`| `id` (Key String) | None | Caches API responses against unique client keys to prevent double-spending. |
| `anomaly_records` | `id` (`ANOM-REC-000001`) | `anomaly_id` | Persisted detected anomalies with severity, category, entity, and expected vs actual values. |

