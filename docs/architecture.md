# Architecture Specification: YottaFlex.ai Loyalty & Ledger

## System Architecture

```mermaid
flowchart TD
    Client["Enterprise React Frontend (Vite, TS, Tailwind, Recharts)"]
    API["FastAPI REST Services (/api/v1)"]
    DB[("PostgreSQL 16 (yottaflex)")]
    
    subgraph Core Business Services
        Accrual["Accrual Engine (₹100 = 1 pt)"]
        Redemption["Redemption Engine (FIFO & Row Lock)"]
        Reversal["Reversal Engine (Proportional Returns)"]
        Expiry["Expiration Engine (Lot Expiry)"]
        Tier["Tier Progression Engine (Qualifying Net Spend)"]
        Ledger["Append-Only Ledger Engine"]
    end
    
    subgraph AI & Data Pipeline
        Synth["Synthetic Data Generator (Seed: 20261022)"]
        Anomaly["Anomaly Injection Module (5 Core Scenarios)"]
        Validation["Independent Validation & Reconciliation Engine"]
    end

    Client -->|Axios REST| API
    API --> Accrual & Redemption & Reversal & Expiry & Tier & Ledger
    Accrual & Redemption & Reversal & Expiry & Tier & Ledger --> DB
    Synth --> DB
    Anomaly --> DB
    Validation --> DB
```

## Key Invariants
1. **Append-Only Immutable Ledger**: Transactions once committed are never altered or deleted. Compensating entries rectify adjustments.
2. **Strict FIFO Point Lot Consumption**: The oldest active point lot is always consumed first.
3. **Qualifying Net Spend Tier Assignment**: Excludes cancellations, taxes, excluded categories and subtracts proportional refunds.
4. **Concurrency Safety**: Employs database row-level locking (`FOR UPDATE`) for zero double-spending.

