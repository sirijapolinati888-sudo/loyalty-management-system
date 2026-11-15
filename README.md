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

Below is a structured log of the engineering, architectural, backend, data generation, and frontend prompts used throughout the iterative design, implementation, and refinement of the Loyalty Management System:

### Phase 1: Architecture, Data Modeling & Database Design
```text
Prompt 1.1: Database Schema & Entity Design
"Design an enterprise-grade PostgreSQL relational schema for an auditable Loyalty Points Management & Transaction Ledger System. Model all 10 core entities: Customer, LoyaltyAccount, Tier, Rule, Order, OrderLine, PointsTransaction, Reward, Redemption, and ExpiryBatch, along with supporting audit tables (PointsLot, OrderReturn, OrderReturnLine, TierHistory, RuleHistory, RedemptionAttempt, AuditLog, and IdempotencyRecord). Enforce deterministic ID formatting (CUST-000001, LOY-CUST-000001, ORD-2026-000001, PTS-2026-00000001, RDM-2026-000001, EXP-2026-000001), exact decimal precision, foreign key relationships, check constraints, and compound indexes."
```

```text
Prompt 1.2: Immutable Double-Entry Ledger & FIFO Points Lots
"Implement an append-only immutable double-entry points ledger with FIFO point lot consumption. Ensure points accruals generate positive ledger transactions and corresponding points lots with 365-day expiration dates. Redemptions and expirations must consume lots in deterministic FIFO order (earliest expiring first) using pessimistic row-level locking (SELECT ... FOR UPDATE) to prevent concurrency anomalies and double-spending."
```

---

### Phase 2: Core Business Logic & Rule Engine
```text
Prompt 2.1: Accrual & Return Reversals
"Develop the business logic engine in FastAPI/SQLAlchemy for:
1. Points Accrual: Calculate points earned using floor rounding (floor(eligible_net_spend / threshold) * points_awarded) based on active rules. Excluded items (gift cards, warranties) and cancelled orders earn zero.
2. Proportional Returns: When an order is fully or partially returned, claw back points proportionally based on the returned eligible spend relative to original spend. Create signed negative REVERSAL transactions referencing the original transaction, decrement lot balances, and allow negative customer balances when required by policy."
```

```text
Prompt 2.2: Tier Progression & Expiration Batches
"Implement tier progression evaluation where membership tiers (Bronze, Silver, Gold, Platinum) are evaluated strictly against qualifying net spend (excluding returns, taxes, gift cards) rather than gross spend. Write an automated batch expiration engine that finds all points lots with remaining balance past their expiration date, marks them expired, and generates auditable negative EXPIRATION ledger records idempotently."
```

---

### Phase 3: Synthetic Data Generation & Reproducibility
```text
Prompt 3.1: Deterministic Synthetic Data Generator
"Create a standalone synthetic data generation engine with cryptographic bit-for-bit reproducibility using a fixed random seed (20261022). Generate realistic customers, order lines with mixed eligible/excluded items, transactions, FIFO redemptions, returns, and tier progressions. Export the dataset to both normalized relational CSV and JSON formats, and compute SHA-256 checksums to verify identical output across multiple runs."
```

```text
Prompt 3.2: Edge Cases & Anomaly Injection
"Inject 5 realistic edge cases and negative scenarios into the generated loyalty dataset with ground-truth labels for auditing:
1. Balance Mismatch: A drift between cached loyalty balance and ledger transaction sum.
2. Unreversed Liability: An order return that failed to claw back points.
3. Expiration Anomaly: Points remaining active past their expiration cutoff date.
4. Duplicate Expiration: Points deducted more than once for the same expiration batch.
5. Tier Miscalculation: A customer tier assigned based on gross spend rather than qualifying net spend."
```

---

### Phase 4: Independent Validation Engine & Anomaly Detection
```text
Prompt 4.1: Independent Mathematical Validation & Reconciliation
"Build an independent validation engine that audits raw database records against mathematical invariants:
1. Reconcile account cached balances against the sum of all signed ledger events (SUM(points_amount)).
2. Validate active lot balances against remaining account points.
3. Verify qualifying net spend calculations across all order lines and returns.
4. Compute benchmark precision, recall, and F1 scores against the isolated ground-truth anomaly dataset."
```

---

### Phase 5: REST API & Role-Based Security
```text
Prompt 5.1: FastAPI Backend & JWT RBAC
"Develop production REST API endpoints in FastAPI with JWT bearer authentication and role-based access control (RBAC) across 4 personas:
- Operations Manager (ops@yottaflex.ai): Full audit, batch controls, anomaly inspection, and data generation.
- Store Operator (operator@yottaflex.ai): Order viewing and proportional return processing.
- Merchandising Analyst (analyst@yottaflex.ai): Tier thresholds, rules, analytics, and validation reports.
- Customer (customer@yottaflex.ai): Scoped view of own profile, points ledger, and catalog redemptions.
Add automatic OpenAPI/Swagger documentation, error handling, CORS, and database session dependency injection."
```

---

### Phase 6: Modern React UI & Interactive Experience
```text
Prompt 6.1: Enterprise Glassmorphism & Responsive Dashboard
"Build an enterprise React 19 + TypeScript frontend with Tailwind CSS 4. Implement a dark sidebar layout with illuminated ambient gradients, custom metric stat cards, tabular ledger inspection, order detail slide-outs, and quick-login demo accounts for all 4 roles."
```

```text
Prompt 6.2: Modal Centering, Scroll Lock & Polish
"Refactor the inspection modal component into a React Portal (createPortal) mounted to document.body so it centers cleanly in the content viewport to the right of the persistent sidebar without overflowing onto navigation. Lock background scroll while modals are open, eliminate nested table scrollbars, and display full entity IDs without truncation."
```
