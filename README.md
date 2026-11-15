# YottaFlex.ai – Loyalty Points Management & Auditable Ledger System
### Problem Statement & Architecture

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Reproducibility](https://img.shields.io/badge/Seed-20261022-blueviolet?logo=git)](https://github.com)

A complete, production-grade **Enterprise Loyalty Points Management System & Auditable Transaction Ledger** designed to manage the entire customer loyalty lifecycle: earning, redeeming, expiring via FIFO lots, reversing points upon product returns, recalculating tier progression from qualifying net spend, and providing independent mathematical reconciliation and anomaly detection.

---

## Table of Contents

- [1. Business Context & Problem Statement](#1-business-context--problem-statement)
- [2. Primary Actors & System Roles](#2-primary-actors--system-roles)
- [3. Key Architectural Features](#3-key-architectural-features)
- [4. Domain Entities & Relational Data Model](#4-domain-entities--relational-data-model)
- [5. ID & Nomenclature Conventions](#5-id--nomenclature-conventions)
- [6. Synthetic Data Generation Engine](#6-synthetic-data-generation-engine)
- [7. Injected Edge Cases & Negative Scenarios](#7-injected-edge-cases--negative-scenarios)
- [8. Independent Mathematical Validation & Reconciliation](#8-independent-mathematical-validation--reconciliation)
- [9. Cryptographic Bit-for-Bit Reproducibility](#9-cryptographic-bit-for-bit-reproducibility)
- [10. User Roles, Security & Authentication](#10-user-roles-security--authentication)
- [11. Technology Stack](#11-technology-stack)
- [12. Project Structure](#12-project-structure)
- [13. Installation & Local Setup](#13-installation--local-setup)
- [14. Database Setup & Seeding (PostgreSQL & pgAdmin)](#14-database-setup--seeding-postgresql--pgadmin)
- [15. Environment Configuration](#15-environment-configuration)
- [16. Running the Application](#16-running-the-application)
- [17. REST API Reference](#17-rest-api-reference)
- [18. Docker Deployment](#18-docker-deployment)
- [19. Verification & Quality Assurance](#19-verification--quality-assurance)
- [20. Technical Documentation References](#20-technical-documentation-references)
- [21. Prompts Used for Building the Project](#21-prompts-used-for-building-the-project)

---

## 1. Business Context & Problem Statement

Retail and e-commerce enterprises frequently struggle with audit non-compliance, financial balance drift, and customer disputes resulting from:
- **Balance Divergence**: In-memory or cached account balances drifting from historical transaction logs.
- **Double-Spending Vulnerabilities**: Concurrent checkout and redemption requests exploiting uncoordinated reads.
- **Unreversed Loyalty Liabilities**: Full or partial item returns failing to proportionally claw back points awarded during original purchases.
- **Duplicate Point Expirations**: Automated expiration batch jobs erroneously deducting points repeatedly.
- **Distorted Customer Tiers**: Membership tier progression evaluated against gross spend rather than qualifying net spend after returns and excluded categories (gift cards, taxes, shipping).

**Objective & Scope**: Build a fully auditable loyalty ledger that exposes key decisions, handles exception paths, preserves complete audit traceability, and produces measurable reconciliation outputs.

---

## 2. Primary Actors & System Roles

The platform provides dedicated workflows, navigation routes, and security boundaries for four enterprise personas:

| Actor / System Role | Key Capabilities & Business Responsibilities | Access Boundary & Scope | Default Landing |
| :--- | :--- | :--- | :--- |
| **Operations Manager** (`ops@yottaflex.ai`) | Oversees entire loyalty program, runs batch expirations, monitors detected anomalies, triggers data generation pipelines, inspects financial reconciliation. | Full administrative visibility across all customers, orders, transactions, and audit reports. | `/` (Dashboard) |
| **Store / Warehouse Operator** (`operator@yottaflex.ai`) | Manages orders, inspects line-item return eligibility, processes customer refunds/returns, triggers proportional points reversals. | Scoped to order processing and itemized returns. No admin or tier configuration access. | `/orders` |
| **Merchandising Analyst** (`analyst@yottaflex.ai`) | Configures membership tier thresholds (Bronze, Silver, Gold, Platinum), defines earning multipliers, and inspects reward redemption statistics. | Read-only analytics access to spend progression, tier distribution, rules engine, and reports. | `/validation` |
| **Customer Experience** (`customer@yottaflex.ai` or any synthetic customer email) | Views available points balance, FIFO expiring tranches, order history, and directly redeems catalogue rewards. | Strictly isolated to own customer account, orders, and points ledger (`customer_id` scoped). | `/ledger` |

---

## 3. Key Architectural Features

- **Append-Only Immutable Ledger (`points_transactions`)**: Every points movement (Accrual, Redemption, Reversal, Expiration) is stored as a signed, sequence-tracked ledger record. History is never overwritten.
- **Deterministic FIFO Point Lot Consumption (`points_lots`)**: Earliest-expiring points are consumed first for transparent redemption and deterministic expiration.
- **Concurrency-Safe Pessimistic Locking**: `SELECT ... FOR UPDATE` row-level locks prevent race conditions and double-spending during simultaneous redemption requests.
- **Proportional Reversals Engine**: Return processing calculates the exact proportional points earned on returned eligible items, adjusting qualifying net spend and tier qualification.
- **Independent Validation Engine**: Reconciles cached balances against raw ledger event sums and benchmarks detection algorithms against isolated ground-truth labels.
- **Responsive 3D Bulged UI**: Enterprise glassmorphism interface featuring 3D embossed cards, cylindrical gradients, custom select controls, and responsive layouts across mobile, tablet, and desktop viewports.

---

## 4. Domain Entities & Relational Data Model

All 10 core entities are defined with primary and foreign keys, check constraints, and relational cardinality:

```
  [Customer] 1 ──────── 1 [LoyaltyAccount]
      │                        │
      │ 1:N                    │ 1:N
      ▼                        ▼
   [Order] 1 ─────────── 1 [PointsTransaction] 1 ──── N [PointsLot]
      │ (with OrderLines)      │ (Immutable Ledger)         │
      │                        │                            │
      │                        ▼                            ▼
      └──────────────── [Redemption] 1 ────────── 1 [Reward]
                               ▲
                               │
                        [ExpiryBatch]
                               ▲
                               │
              [Tier] ──────────┴────────── [Rule]
```

1. **`Customer`**: Unique customer profile with contact information and lifecycle timestamps.
2. **`LoyaltyAccount`**: Account balance, lifetime statistics, and current membership tier.
3. **`Tier`**: Membership tiers (`Bronze`, `Silver`, `Gold`, `Platinum`) with qualifying net spend thresholds and accrual multipliers.
4. **`Rule`**: Accrual rules specifying baseline earn rates (e.g., ₹100 = 1 pt) and SKU exclusions (e.g., gift cards, taxes, shipping).
5. **`Order`**: Order header tracking gross spend, discounts, and qualifying net spend.
6. **`OrderLine`**: Itemized product lines with unit pricing, quantity, and points eligibility flags.
7. **`PointsTransaction`**: Append-only immutable financial ledger records with signed amounts.
8. **`PointsLot`**: FIFO expiration tranches tracking remaining points, earned dates, and scheduled expiry dates.
9. **`Reward`**: Reward catalogue vouchers with point requirements and monetary values.
10. **`Redemption`**: Real-time redemption event records linking customer accounts, rewards, and consumed lots.
11. **`ExpiryBatch`**: Batch execution records tracking points forfeited past cutoff dates.
12. **`User` & `RefreshToken`**: Cryptographic JWT authentication models supporting secure token rotation and multi-role RBAC.

---

## 5. ID & Nomenclature Conventions

Deterministic, zero-padded identifier schemes are enforced across the entire system:
- **Loyalty Account**: `LOY-<customer-id>` (e.g., `LOY-CUST-000001`)
- **Orders**: `ORD-2026-000001` (zero-padded 6 digits)
- **Points Transactions**: `PTS-2026-00000001` (zero-padded 8 digits)
- **Redemptions**: `RDM-2026-000001` (zero-padded 6 digits)
- **Expiry Batches**: `EXP-2026-000001` (zero-padded 6 digits)

---

## 6. Synthetic Data Generation Engine

Implemented in `data_generator/generate_data.py` and `scripts/generate_full_dataset.py`:
- **Fixed Deterministic Seed**: `20261022`.
- **Dual Scale Parameterization**:
  - **Starter Mode**: 100 customers, 500 orders, and ~1,500 points transactions (used for instant development, UI testing, and verification).
  - **Full Scale Mode**: 20,000 customers, 100,000 orders, and 300,000+ points transactions (implemented via streaming batch chunks).
- **Derived Value Calculations**: Net spend, FIFO lot consumption, reversals, and tier progression are strictly computed from source transaction records rather than independently generated.

---

## 7. Injected Edge Cases & Negative Scenarios

Implemented in `data_generator/inject_anomalies.py`. To rigorously benchmark the audit engine, 5 mandatory anomalies are injected into the dataset and recorded in an isolated `data/ground_truth/ground_truth.json` file without leaking into input features:

1. **`BALANCE_MISMATCH`**: Cached account balance deliberately altered to diverge from the transactional sum of all ledger events.
2. **`OVER_REDEMPTION`**: Transaction deducting more points than available in the customer's balance.
3. **`MISSING_REVERSAL`**: Returned order created without recording an offsetting reversal ledger entry.
4. **`DOUBLE_EXPIRY`**: Points lot expired twice across multiple batches, causing duplicate deductions.
5. **`INCORRECT_TIER`**: Customer tier calculated from gross spend rather than qualifying net spend after returns.

---

## 8. Independent Mathematical Validation & Reconciliation

Implemented in `backend/app/services/validation_engine.py`:
- **Balance Reconciliation**: Verifies that every `LoyaltyAccount.cached_balance` exactly matches $\sum \text{PointsTransaction.points\_amount}$.
- **Reversal Referential Integrity**: Ensures every return transaction references its original accrual ID.
- **Idempotent Expiration**: Verifies that no point lot has expired deductions exceeding its original allocation.
- **Statistical Benchmarking**: Evaluates anomaly detection accuracy against isolated ground-truth labels, computing **Accuracy, Precision, Recall, and F1 Score** (typically achieving $\ge 0.80$ to $1.00$).

---

## 9. Cryptographic Bit-for-Bit Reproducibility

Verified via `scripts/verify_reproducibility.py`:
- Executes two independent generation runs from scratch using fixed seed `20261022`.
- Computes SHA-256 cryptographic hashes for all 20 output CSV and JSON files.
- **Result**: **100% Bit-for-Bit Match** across all files.

---

## 10. User Roles, Security & Authentication

- **Direct Bcrypt Hashing**: Passwords hashed with salted 12-round `bcrypt`.
- **Cryptographic JWT Tokens**: Access tokens expire in 60 minutes; refresh tokens are stored in the database for instant revocation on logout.
- **Universal Customer Login**: Any customer generated in the database (e.g., `user_1_brandoncolon@yottaflex-sample.com`, `user_4_hsmith@yottaflex-sample.com`) can log in with `Password123!`. The authentication engine automatically links their profile and restricts access to their own data.

### Quick Demo Accounts
| Role | Email | Password | Default Route |
| :--- | :--- | :--- | :--- |
| **Operations Manager** | `ops@yottaflex.ai` | `Password123!` | `/` (Dashboard) |
| **Store Operator** | `operator@yottaflex.ai` | `Password123!` | `/orders` |
| **Merchandising Analyst** | `analyst@yottaflex.ai` | `Password123!` | `/validation` |
| **Customer** | `customer@yottaflex.ai` *(or any customer email)* | `Password123!` | `/ledger` |

---

## 11. Technology Stack

### Backend
- **Language**: Python 3.11+
- **Framework**: FastAPI (high-performance ASGI)
- **Database ORM**: SQLAlchemy 2.0 (with Psycopg 3 PostgreSQL driver)
- **Database Engine**: PostgreSQL 16 (fallback SQLite supported for testing)
- **Data Engineering**: Pandas, NumPy, Faker
- **Security**: PyJWT, Passlib (Bcrypt)

### Frontend
- **Framework**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Lucide React icons
- **Visual Analytics**: Recharts
- **Routing & Networking**: React Router v7, Axios with Bearer token interceptor

---

## 12. Project Structure

```
loyalty-management-system/
├── backend/
│   ├── alembic/                # Database migrations
│   ├── app/
│   │   ├── api/v1/             # REST endpoints (auth, customers, orders, ledger, etc.)
│   │   ├── core/               # Security, JWT tokens, RBAC dependencies
│   │   ├── db/                 # SQLAlchemy session and engine management
│   │   ├── models/             # Relational entities and enum definitions
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   └── services/           # Business logic, ledger transactions, validation engine
│   ├── init_db.py              # Database table initialization script
│   └── requirements.txt        # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components (Layout, CustomSelect, etc.)
│   │   ├── context/            # React AuthContext and JWT state management
│   │   ├── pages/              # Application pages (Dashboard, Orders, Ledger, Tiers, etc.)
│   │   └── services/           # Axios API client
│   ├── package.json            # Frontend npm configuration
│   └── vite.config.ts          # Vite build configuration
├── data_generator/
│   ├── generate_data.py        # Deterministic synthetic data generator (Seed: 20261022)
│   └── inject_anomalies.py     # Deliberate business anomaly injector
├── data/
│   ├── master/                 # Master entity CSV/JSON files
│   ├── transactions/           # Transactional CSV/JSON files
│   ├── ground_truth/           # Isolated ground truth for anomaly benchmarking
│   └── exports/                # SQL seeds and provenance manifests
├── docs/                       # Technical documentation and audit reports
├── scripts/
│   ├── export_sql_and_manifest.py # SQL seed export and SHA-256 manifest generator
│   ├── generate_full_dataset.py   # Full-scale dataset pipeline runner
│   ├── seed_users.py              # Demo user provisioning script
│   └── verify_reproducibility.py  # Two-run cryptographic reproducibility checker
├── docker-compose.yml          # Multi-container deployment configuration
└── README.md
```

---

## 13. Installation & Local Setup

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd loyalty-management-system
```

### Step 2: Backend Setup
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

### Step 3: Frontend Setup
```bash
cd ../frontend
npm install
```

---

## 14. Database Setup & Seeding (PostgreSQL & pgAdmin)

### Option A: Setup & Seed via pgAdmin 4 GUI

1. **Launch pgAdmin 4** and connect to your local PostgreSQL server.
2. **Create Database**:
   - Right-click on **Databases** -> **Create** -> **Database...**
   - Database name: `yottaflex`
   - Owner: `postgres` (or your preferred user)
   - Click **Save**.
3. **Initialize Schema & Tables**:
   - Open terminal in `backend/` and run `python init_db.py` (creates all necessary tables via SQLAlchemy metadata), OR start the backend once.
4. **Seed Data via pgAdmin Query Tool**:
   - In pgAdmin's Object Explorer, expand **Databases** -> **yottaflex**.
   - Right-click on `yottaflex` and select **Query Tool** (or press `Alt + Shift + Q`).
   - Open the SQL file: Click the folder/open icon in the query toolbar, navigate to:
     ```
     loyalty-management-system/data/exports/seed_data.sql
     ```
   - Click the **Execute / Run** button (or press `F5`).
   - All baseline tiers, rules, rewards, customers, and accounts will be imported directly.
5. **Seed Demo System Users**:
   - Run the user provisioning script to populate the demo login personas:
     ```bash
     python ../scripts/seed_users.py
     ```

### Option B: Setup & Seed via Terminal / psql

1. **Create Database**:
   ```sql
   CREATE DATABASE yottaflex;
   ```
2. **Initialize Schema & Seed Demo Users**:
   ```bash
   cd backend
   python init_db.py
   python ../scripts/seed_users.py
   ```
3. **Import SQL Seed Data**:
   ```bash
   # Windows PowerShell / CMD
   psql -U postgres -d yottaflex -f ../data/exports/seed_data.sql

   # macOS / Linux
   psql -U postgres -d yottaflex -f ../data/exports/seed_data.sql
   ```

---

## 15. Environment Configuration

Copy the example environment configuration in `backend/`:
```bash
cd backend
cp .env.example .env
```

Ensure `backend/.env` is configured with your PostgreSQL credentials:
```dotenv
DATABASE_URL=postgresql+psycopg://postgres:your_password@localhost:5432/yottaflex
SYNC_DATABASE_URL=postgresql+psycopg://postgres:your_password@localhost:5432/yottaflex
APP_NAME=YottaFlex.ai Loyalty Points Management System
API_V1_PREFIX=/api/v1
ENVIRONMENT=development
RANDOM_SEED=20261022
JWT_SECRET_KEY=yottaflex-enterprise-secret-key-32-chars-min
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

---

## 16. Running the Application

### 1. Initialize Database & Seed Demo Accounts (If not done above)
Run from the `backend/` directory with the virtual environment activated:
```bash
python init_db.py
python ../scripts/seed_users.py
```

### 2. Start the Backend API Server
You can launch directly from the project root:
```bash
python main.py
```
Or from the `backend/` directory:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Endpoint: `http://localhost:8000/api/v1`
- Swagger UI Documentation: `http://localhost:8000/api/v1/docs`

### 3. Start the Frontend Web Application
In a separate terminal:
```bash
cd frontend
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 17. REST API Reference

Interactive API documentation is generated automatically by FastAPI:
- **Swagger UI**: `http://localhost:8000/api/v1/docs`
- **ReDoc**: `http://localhost:8000/api/v1/redoc`

Key API routes:
- `POST /api/v1/auth/login`: Issue cryptographic JWT token pair.
- `GET /api/v1/analytics/summary`: Aggregate ledger metrics, reconciliation rates, and anomaly counts.
- `GET /api/v1/customers`: List and search customer profiles and account balances.
- `GET /api/v1/orders`: Filter itemized orders and eligible net spend.
- `POST /api/v1/orders/returns`: Process itemized returns and trigger proportional points reversals.
- `GET /api/v1/transactions`: Query immutable double-entry points ledger journal.
- `POST /api/v1/redemptions`: Concurrency-safe reward redemptions with row-level locking.
- `POST /api/v1/expiration/run`: Execute batch lot expiration.
- `GET /api/v1/anomalies`: Real-time anomaly detection telemetry.
- `GET /api/v1/validation/report`: Independent balance reconciliation and benchmark scores.
- `GET /api/v1/exports/download/{folder}/{filename}`: Download audit CSV/JSON datasets and manifest.

---

## 17. Docker Deployment

Deploy the complete stack (PostgreSQL 16, FastAPI backend, React frontend) with a single command:

```bash
docker-compose up --build -d
```

Services:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- PostgreSQL Database: `localhost:5432`

To tear down containers:
```bash
docker-compose down -v
```

---

## 18. Verification & Quality Assurance

- **TypeScript Build & Lint Verification**:
  ```bash
  cd frontend
  npm run build
  ```
  Passes with zero errors (`tsc -b && vite build`).
- **Cryptographic Reproducibility Test**:
  ```bash
  python scripts/verify_reproducibility.py
  ```
  Generates two separate runs with seed `20261022` and verifies 100% bit-for-bit SHA-256 match across all 20 output datasets.
- **Mathematical Audit & Anomaly Detection Benchmark**:
  ```bash
  python backend/app/services/validation_engine.py
  ```
  Audits raw database records against isolated ground-truth labels and reports reconciliation accuracy.

---

## 19. Technical Documentation References

Detailed technical guides and compliance evidence are maintained in the `docs/` folder:
- [Requirement-Gap Analysis & Compliance Matrix](docs/requirement_gap_analysis.md)
- [Field-Level Data Dictionary](docs/data_dictionary.md)
- [Database Schema & Entity-Relationship Architecture](docs/database_schema.md)
- [System Architecture & Concurrency Model](docs/architecture.md)
- [Business Rules & Earning Logic](docs/business_rules.md)
- [Anomaly Detection Benchmark & Ground Truth Evaluation](docs/anomaly_detection.md)
- [Validation Engine & Financial Reconciliation Summary](docs/validation_summary.md)
- [Cryptographic Reproducibility Evidence Report](docs/reproducibility.md)

---

## 21. Prompts Used for Building the Project

The entire solution was built step-by-step using precise, role-focused engineering prompts designed directly to satisfy each instruction of the **YottaFlex.ai Associate AI Forward Deployed Engineer Code Challenge**. 

Below are the exact structured prompts utilized across all phases of the project lifecycle:

---

### Step 1: Comprehensive Data Dictionary & Schema Specification
```text
"Act as a Principal Forward Deployed Engineer. Write a comprehensive, production-grade Data Dictionary covering all 10 mandatory entities for the YottaFlex.ai Loyalty Points Management & Auditable Transaction Ledger System:
1. Customer, 2. LoyaltyAccount, 3. Tier, 4. Rule, 5. Order, 6. OrderLine, 7. PointsTransaction, 8. Reward, 9. Redemption, 10. ExpiryBatch.
For every field, document: Field Name, Data Type, Required/Optional, Allowed Values / Enum ranges, Units, Uniqueness constraints, Foreign Key References, and Business Validation Rules. Enforce deterministic zero-padded nomenclature: LOY-<customer-id>, ORD-2026-000001, PTS-2026-00000001, RDM-2026-000001, and EXP-2026-000001."
```

---

### Step 2: Database Schema & Entity Relationships Architecture
```text
"Create a PostgreSQL relational schema using SQLAlchemy 2.0 and Alembic migrations implementing all 10 core entities plus audit supporting tables: PointsLot, OrderReturn, OrderReturnLine, TierHistory, RuleHistory, RedemptionAttempt, AuditLog, and IdempotencyRecord.
Requirements:
- Strict 1:1, 1:N, and N:M cardinality with foreign key constraints and compound indexes on lookup columns.
- Effective date intervals (effective_from, effective_to) and lifecycle state tracking.
- Immutable append-only PointsTransaction journal with signed point movements (positive accruals, negative redemptions, reversals, expirations).
- Support for FIFO points lots (PointsLot) tracking initial_points, remaining_points, earned_at, and expires_at."
```

---

### Step 3: Core Business Logic, Concurrency & Ledger Engine
```text
"Develop the business logic services in FastAPI/Python ensuring strict financial ledger invariants:
1. Points Accrual: Calculate points from eligible net spend using floor rounding: floor(eligible_net_spend / threshold) * points_awarded. Exclude non-qualifying items (gift cards, warranties) and cancelled orders.
2. Returns & Proportional Reversals: Upon full or partial order return, calculate proportional earned points to claw back. Post negative REVERSAL transactions referencing the original transaction_id, deduct from lots, and allow negative balances if policy dictates. Never delete or overwrite ledger history.
3. Concurrency-Safe FIFO Redemption: Implement pessimistic row-level locking (with_for_update()) on points accounts and active FIFO lots to prevent double-spending and race conditions. Deduct earliest expiring points first.
4. Idempotent Expiration: Batch expire points lots where expires_at <= cutoff and remaining_points > 0. Deduct balance, post EXPIRATION ledger entries, and ensure safe, idempotent re-runs.
5. Tier Progression: Evaluate membership tiers (Bronze, Silver, Gold, Platinum) strictly on qualifying net spend (net of returns and exclusions), not gross spend."
```

---

### Step 4: Deterministic Synthetic Data Generator (Seed: 20261022)
```text
"Build a standalone synthetic data generation pipeline (`data_generator/generate_data.py`) parameterized for starter scale (100 customers, 500 orders, 1,000 txns) and full enterprise scale (20,000 customers, 100,000 orders, 300,000 transactions).
Key constraints:
- Seed: Fix random seed to 20261022 across random, numpy, and faker for cryptographic bit-for-bit reproducibility.
- Top-Down Cascade: Generate parent master tables first (tiers, rules, rewards, customers, accounts), then orders, order lines, accruals, FIFO redemptions, returns, and expirations.
- Derived Values: All point balances, spend totals, and tier states must be derived mathematically from raw transaction logs, not randomly assigned.
- Export formats: Export fully populated relational datasets to CSV, JSON, and raw SQL seed data."
```

---

### Step 5: Labelled Anomaly Injection & Benchmark Ground Truth
```text
"Implement a deliberate anomaly injection module that injects the 5 required challenge edge cases into the generated dataset without corrupting unrelated rows:
1. Balance Mismatch: Drift between cached loyalty balance and raw ledger sum (Issue: BALANCE_MISMATCH).
2. Unreversed Return: Return processed without proportional clawback (Issue: UNREVERSED_RETURN).
3. Expiration Anomaly: Points remain unexpired past their lot expiration timestamp (Issue: UNEXPIRED_LOT).
4. Duplicate Expiration: Points deducted repeatedly for the same expiry batch (Issue: DUPLICATE_EXPIRY).
5. Tier Miscalculation: Tier qualified on gross spend instead of qualifying net spend (Issue: TIER_MISCALCULATION).
Generate an isolated `ground_truth.csv` and `ground_truth.json` containing anomaly_id, entity_name, entity_id, issue_type, expected_result, actual_result, and severity. Never leak ground-truth labels into input features."
```

---

### Step 6: Independent Mathematical Validation & Reconciliation Engine
```text
"Write an independent mathematical reconciliation engine (`backend/app/services/validation_engine.py`) that audits live database state and benchmarks anomaly detection:
1. Arithmetic Invariant Verification:
   - Account balance == SUM(posted points_amount)
   - Account balance == SUM(remaining_points across active lots)
   - Tier state matches configured qualifying net spend threshold
2. Anomaly Detection & Scoring:
   - Run rules-based algorithmic detection against all customers, transactions, lots, and orders.
   - Benchmark detected anomalies against the isolated `ground_truth.json` dataset.
   - Calculate and export confusion matrix metrics: Precision (1.0), Recall (1.0), and F1 Score (1.0)."
```

---

### Step 7: REST API Endpoints & Role-Based Access Control (4 Personas)
```text
"Build a production FastAPI REST API with JWT bearer tokens and Role-Based Access Control (RBAC) supporting the 4 primary actors:
1. Operations Manager (`ops@yottaflex.ai`): Full system audit, batch expiration triggers, anomaly monitoring, data generation, and reconciliation reports.
2. Store / Warehouse Operator (`operator@yottaflex.ai`): Scoped to orders and itemized return processing with proportional clawbacks.
3. Merchandising / E-commerce Analyst (`analyst@yottaflex.ai`): Read/write rule thresholds, tier definitions, redemption analytics, and validation benchmarks.
4. Customer Experience (`customer@yottaflex.ai`): Isolated self-service access to account balance, FIFO tranche expiry preview, order history, and catalogue redemption.
Provide automated Swagger UI at `/api/v1/docs`, health checks, and secure error boundaries."
```

---

### Step 8: Enterprise Frontend Dashboard & UI/UX Experience
```text
"Design an enterprise-grade web application in React 19, TypeScript, and Tailwind CSS:
- Visual Identity: Dark executive navigation sidebar with luminous ambient glow, 3D bulged embossed cards, cylindrical gradients, and responsive layout.
- Quick-Login Bar: One-click demo persona switcher for Operations Manager, Store Operator, Analyst, and Customer.
- Live Features:
  - Analytics Dashboard with KPI stat tiles and spend-to-points velocity charts.
  - Interactive Orders Ledger with item-level return eligibility badges.
  - Double-Entry Points Ledger with mutation badges (Accrual, Redemption, Reversal, Expiration).
  - Anomaly Telemetry Monitor with side-by-side Expected vs. Actual comparisons.
  - Validation & Reports panel with one-click audit CSV/JSON downloads."
```

---

### Step 9: UI Polish, Modal Architecture & Viewport Positioning
```text
"Refactor the inspection dialogs in `CustomersPage`, `LedgerPage`, and `AnomaliesPage`:
1. Use `createPortal` to mount modal backdrops directly to `document.body`, escaping CSS transform containing blocks.
2. Center the modal within the viewport to the right of the persistent 264px sidebar (`lg:left-[264px]`) without obstructing navigation.
3. Freeze background page scrolling (`overflow: hidden` on body and main container) while a modal is active.
4. Remove nested table scrollbars, wrap full entity IDs with `break-all` to eliminate truncated text (`...`), and remove unnecessary decorative arrows."
```

---

### Step 10: Cryptographic Bit-for-Bit Reproducibility & Verification Script
```text
"Create an automated reproducibility verification script (`scripts/verify_reproducibility.py`):
1. Execute two independent generation runs from scratch using fixed seed `20261022`.
2. Compute SHA-256 cryptographic hashes for every generated master and transaction CSV/JSON export.
3. Assert that all 20 checksums match bit-for-bit with 0.00% delta.
4. Print a pass/fail compliance matrix certifying strict deterministic reproducibility for the challenge submission."
```

---

### Step 11: End-to-End Automated Testing & Quality Assurance Suite
```text
"Act as a Principal QA & Systems Test Engineer. Build a comprehensive automated test suite and verification prompt covering all functional, edge-case, concurrency, and security invariants required by the YottaFlex.ai Challenge:
1. Business Invariant Test Cases:
   - TC-INV-01 (Points Accrual): Assert floor(net_spend / threshold) * points. Assert items in non-qualifying categories (gift cards, warranties) and CANCELLED orders award 0 points.
   - TC-INV-02 (Proportional Reversals): Given an order with ₹10,000 eligible spend awarding 100 points, returning an item worth ₹4,000 must reverse exactly 40 points referencing the original transaction ID.
   - TC-INV-03 (Idempotent Expiration): Re-running batch expiration on already expired lots must produce 0 duplicate transactions and deduct 0 additional points.
   - TC-INV-04 (Net Spend Tier Qualification): Verify customer tier changes evaluate strictly on net qualifying spend after returns and excluded categories are deducted.
2. Concurrency & Double-Spending Test Cases:
   - TC-CONC-01 (Simultaneous Redemptions): Simulate 10 concurrent redemption requests on an account with exactly 100 points. Assert row-level pessimistic locking (SELECT ... FOR UPDATE) permits exactly one 100-point redemption and safely rejects the remaining 9 attempts with 400 Bad Request.
3. Anomaly Detection & Mathematical Audit Test Cases:
   - TC-ANOM-01 (Benchmark Scoring): Verify validation engine detection yields Precision = 1.0, Recall = 1.0, and F1 Score = 1.0 against ground_truth.json.
   - TC-ANOM-02 (Ledger Invariant): Assert account.cached_balance == SUM(points_transactions.points_amount) across all valid accounts.
4. Role-Based Security Test Cases:
   - TC-SEC-01 (Access Isolation): Assert Store Operator cannot access admin tier configurations (/tiers), Analyst cannot trigger batch expirations, and Customers can only read their own customer_id ledger."
```
