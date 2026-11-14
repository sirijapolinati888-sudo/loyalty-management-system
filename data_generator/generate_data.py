import os
import sys
import random
from datetime import datetime, timezone, timedelta
from faker import Faker
import pandas as pd
from sqlalchemy.orm import Session

# Add backend path to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from app.db.session import SessionLocal, engine, Base
from app.models.entities import (
    Customer, Tier, Rule, LoyaltyAccount, Reward, Order, OrderLine,
    OrderReturn, OrderReturnLine, Redemption, PointsTransaction,
    PointsLot, ExpiryBatch, TierHistory, RuleHistory
)
from app.models.enums import (
    CustomerStatus, AccountStatus, OrderStatus, TransactionType,
    TransactionStatus, RedemptionStatus, ExpiryBatchStatus
)
from app.services.business_logic import (
    AccrualService, RedemptionService, ExpirationService,
    ReversalService, TierService
)

RANDOM_SEED = 20261022

class SyntheticDataGenerator:
    def __init__(self, seed: int = RANDOM_SEED):
        self.seed = seed
        self.fake = Faker()
        Faker.seed(seed)
        random.seed(seed)
        self.base_date = datetime(2025, 1, 1, 0, 0, 0, tzinfo=timezone.utc)

    def seed_initial_tiers_and_rules(self, db: Session):
        """Seed mandatory baseline tiers and rules."""
        tiers_data = [
            ("TIER-BRONZE", "Bronze", 0.0, 9999.0, 1.0, "Entry level tier"),
            ("TIER-SILVER", "Silver", 10000.0, 49999.0, 1.25, "Mid level tier"),
            ("TIER-GOLD", "Gold", 50000.0, 99999.0, 1.5, "Premium tier"),
            ("TIER-PLATINUM", "Platinum", 100000.0, None, 2.0, "Top tier VIP"),
        ]
        for tid, name, min_s, max_s, mult, desc in tiers_data:
            existing = db.query(Tier).filter(Tier.id == tid).first()
            if not existing:
                t = Tier(id=tid, name=name, min_spend=min_s, max_spend=max_s, multiplier=mult, description=desc, created_at=self.base_date, updated_at=self.base_date)
                db.add(t)

        rule = db.query(Rule).filter(Rule.id == "RULE-ACCRUAL-01").first()
        if not rule:
            rule = Rule(
                id="RULE-ACCRUAL-01",
                name="Standard ₹100 = 1 Point",
                rule_type="ACCRUAL",
                spend_threshold=100.0,
                points_awarded=1,
                expiry_days=365,
                is_active=True,
                description="Earn 1 point per ₹100 of eligible net spend",
                created_at=self.base_date,
                updated_at=self.base_date
            )
            db.add(rule)
            rh = RuleHistory(
                id="RH-000001",
                rule_id=rule.id,
                spend_threshold=100.0,
                points_awarded=1,
                expiry_days=365,
                effective_from=self.base_date
            )
            db.add(rh)

        rewards_data = [
            ("RWD-001", "₹100 Discount Voucher", "Get ₹100 off on next purchase", 100, 100.0),
            ("RWD-002", "₹250 Shopping Coupon", "Applicable on all items", 250, 250.0),
            ("RWD-003", "₹500 Gift Card", "Valid for 6 months", 500, 500.0),
            ("RWD-004", "₹1000 Premium Hamper", "Exclusive merchandise pack", 1000, 1000.0),
            ("RWD-005", "₹2000 Luxury Experience", "Access to VIP lounge & goodies", 2000, 2000.0),
        ]
        for rid, name, desc, pts, val in rewards_data:
            r = db.query(Reward).filter(Reward.id == rid).first()
            if not r:
                r = Reward(id=rid, name=name, description=desc, points_required=pts, monetary_value=val, is_active=True, created_at=self.base_date, updated_at=self.base_date)
                db.add(r)

        db.commit()

    def generate(self, mode: str = "starter", target_dir: str = "data"):
        """
        Generates full synthetic datasets following the 12-step generation order.
        Starter mode: 100 customers, 500 orders, ~1500 points txns
        Full mode: 20000 customers, 100000 orders, 300000 points txns
        """
        num_customers = 100 if mode == "starter" else 20000
        num_orders = 500 if mode == "starter" else 100000

        print(f"=== Starting Synthetic Data Generation (Mode: {mode}, Seed: {self.seed}) ===")
        db = SessionLocal()
        try:
            # 1. Base Tiers, Rules, Rewards
            self.seed_initial_tiers_and_rules(db)
            rule = db.query(Rule).filter(Rule.id == "RULE-ACCRUAL-01").first()

            # 2. Customers & Loyalty Accounts
            print(f"1. Generating {num_customers} Customers and Loyalty Accounts...")
            customers = []
            accounts = []
            for i in range(1, num_customers + 1):
                cust_id = f"CUST-{i:06d}"
                loy_id = f"LOY-CUST-{i:06d}"
                created_dt = self.base_date + timedelta(days=random.randint(0, 60), hours=random.randint(0, 23))

                cust = Customer(
                    id=cust_id,
                    first_name=self.fake.first_name(),
                    last_name=self.fake.last_name(),
                    email=f"user_{i}_{self.fake.user_name()}@yottaflex-sample.com",
                    phone=f"+91{random.randint(7000000000, 9999999999)}",
                    status=CustomerStatus.ACTIVE,
                    created_at=created_dt,
                    updated_at=created_dt
                )
                db.add(cust)
                customers.append(cust)

                acc = LoyaltyAccount(
                    id=loy_id,
                    customer_id=cust_id,
                    current_tier_id="TIER-BRONZE",
                    cached_balance=0,
                    lifetime_points_earned=0,
                    lifetime_points_redeemed=0,
                    lifetime_points_expired=0,
                    lifetime_points_reversed=0,
                    qualifying_net_spend=0.0,
                    gross_spend=0.0,
                    status=AccountStatus.ACTIVE,
                    created_at=created_dt,
                    updated_at=created_dt
                )
                db.add(acc)
                accounts.append(acc)

                th = TierHistory(
                    id=f"TH-{i:06d}",
                    customer_id=cust_id,
                    tier_id="TIER-BRONZE",
                    qualifying_net_spend_at_transition=0.0,
                    transition_date=created_dt,
                    reason="Initial account creation"
                )
                db.add(th)

            db.commit()

            # 3. Orders & Order Lines & Accruals
            print(f"2. Generating {num_orders} Orders, Lines and Accrual Transactions...")
            categories = ["Electronics", "Fashion", "Groceries", "Books", "Home & Kitchen", "Fitness"]
            all_rewards = db.query(Reward).all()

            for i in range(1, num_orders + 1):
                ord_id = f"ORD-2026-{i:06d}"
                cust = random.choice(customers)
                ord_date = self.base_date + timedelta(days=random.randint(60, 400), hours=random.randint(0, 23))

                # Order Lines
                num_lines = random.randint(1, 4)
                gross = 0.0
                eligible = 0.0
                order_lines = []
                for l_idx in range(1, num_lines + 1):
                    unit_p = round(random.uniform(200.0, 5000.0), 2)
                    qty = random.randint(1, 3)
                    ltotal = round(unit_p * qty, 2)
                    is_elig = random.choice([True, True, True, False])  # 75% eligible
                    cat = random.choice(categories)

                    line = OrderLine(
                        id=f"ORDL-2026-{i:06d}-{l_idx:02d}",
                        order_id=ord_id,
                        product_sku=f"SKU-{random.randint(100, 999)}",
                        product_name=f"{cat} Item {l_idx}",
                        category=cat,
                        quantity=qty,
                        unit_price=unit_p,
                        line_total=ltotal,
                        is_eligible_for_points=is_elig
                    )
                    order_lines.append(line)
                    gross += ltotal
                    if is_elig:
                        eligible += ltotal

                discount = round(random.uniform(0, min(gross * 0.1, 500.0)), 2)
                net = max(0.0, round(gross - discount, 2))
                eligible_net = max(0.0, round(eligible - min(eligible, discount), 2))

                order = Order(
                    id=ord_id,
                    customer_id=cust.id,
                    total_gross_amount=gross,
                    discount_amount=discount,
                    net_amount=net,
                    eligible_net_spend=eligible_net,
                    points_earned=0,
                    status=OrderStatus.COMPLETED,
                    order_date=ord_date,
                    created_at=ord_date,
                    updated_at=ord_date
                )
                order.order_lines = order_lines
                db.add(order)
                db.flush()

                # Process Accrual
                AccrualService.process_order_accrual(db, order, rule)

                if i % 100 == 0:
                    db.commit()

            db.commit()

            # 4. Order Returns (5% return rate)
            print("3. Generating Order Returns and Reversals...")
            completed_orders = db.query(Order).all()
            num_returns = max(10, int(len(completed_orders) * 0.05))
            return_orders = random.sample(completed_orders, num_returns)

            for idx, r_ord in enumerate(return_orders, 1):
                ret_id = f"RET-2026-{idx:06d}"
                ret_date = r_ord.order_date + timedelta(days=random.randint(1, 14))

                is_full = random.choice([True, False])
                if is_full:
                    ret_gross = r_ord.total_gross_amount
                    ret_elig = r_ord.eligible_net_spend
                else:
                    ret_gross = round(r_ord.total_gross_amount * 0.5, 2)
                    ret_elig = round(r_ord.eligible_net_spend * 0.5, 2)

                order_return = OrderReturn(
                    id=ret_id,
                    order_id=r_ord.id,
                    return_amount=ret_gross,
                    eligible_return_amount=ret_elig,
                    points_reversed=0,
                    reason="Product sizing issue or customer return",
                    return_date=ret_date,
                    created_at=ret_date
                )
                db.add(order_return)
                db.flush()

                ReversalService.process_order_return(db, order_return)

            db.commit()

            # 5. Redemptions
            print("4. Generating Point Redemptions...")
            eligible_accounts = db.query(LoyaltyAccount).filter(LoyaltyAccount.cached_balance >= 100).all()
            for acc in eligible_accounts:
                if random.random() < 0.4:  # 40% chance of redeeming
                    # Pick an affordable reward
                    affordable = [r for r in all_rewards if r.points_required <= acc.cached_balance]
                    if affordable:
                        chosen_r = random.choice(affordable)
                        rdm_date = self.base_date + timedelta(days=random.randint(200, 450))
                        try:
                            RedemptionService.redeem_points(
                                db,
                                customer_id=acc.customer_id,
                                reward_id=chosen_r.id,
                                timestamp=rdm_date
                            )
                        except Exception:
                            pass

            db.commit()

            # 6. Expiration Batches
            print("5. Processing Point Expiry Batches...")
            cutoff_date = self.base_date + timedelta(days=366)
            ExpirationService.process_expired_points(db, cutoff_date=cutoff_date)
            db.commit()

            print("=== Baseline Data Generation Completed Successfully! ===")
            self.export_baseline_data(db, target_dir)

        finally:
            db.close()

    def export_baseline_data(self, db: Session, target_dir: str):
        """Export master tables to CSV and JSON."""
        os.makedirs(f"{target_dir}/master", exist_ok=True)
        os.makedirs(f"{target_dir}/transactions", exist_ok=True)
        os.makedirs(f"{target_dir}/exports", exist_ok=True)

        entities_to_export = [
            ("customers", Customer, "id", f"{target_dir}/master/customers.csv", f"{target_dir}/master/customers.json"),
            ("loyalty_accounts", LoyaltyAccount, "id", f"{target_dir}/master/loyalty_accounts.csv", f"{target_dir}/master/loyalty_accounts.json"),
            ("tiers", Tier, "id", f"{target_dir}/master/tiers.csv", f"{target_dir}/master/tiers.json"),
            ("rules", Rule, "id", f"{target_dir}/master/rules.csv", f"{target_dir}/master/rules.json"),
            ("rewards", Reward, "id", f"{target_dir}/master/rewards.csv", f"{target_dir}/master/rewards.json"),
            ("orders", Order, "id", f"{target_dir}/transactions/orders.csv", f"{target_dir}/transactions/orders.json"),
            ("points_transactions", PointsTransaction, "id", f"{target_dir}/transactions/points_transactions.csv", f"{target_dir}/transactions/points_transactions.json"),
            ("points_lots", PointsLot, "id", f"{target_dir}/transactions/points_lots.csv", f"{target_dir}/transactions/points_lots.json"),
            ("redemptions", Redemption, "id", f"{target_dir}/transactions/redemptions.csv", f"{target_dir}/transactions/redemptions.json"),
            ("expiry_batches", ExpiryBatch, "id", f"{target_dir}/transactions/expiry_batches.csv", f"{target_dir}/transactions/expiry_batches.json"),
        ]

        for name, model, sort_col, csv_path, json_path in entities_to_export:
            records = db.query(model).order_by(getattr(model, sort_col)).all()
            data = []
            for r in records:
                d = {k: v for k, v in r.__dict__.items() if not k.startswith("_")}
                # Drop updated_at from strict reproducibility comparison to protect against timestamp drift
                d.pop("updated_at", None)
                for k, v in d.items():
                    if isinstance(v, datetime):
                        d[k] = v.isoformat()
                    elif hasattr(v, "value"):
                        d[k] = v.value
                data.append(d)

            df = pd.DataFrame(data)
            df.to_csv(csv_path, index=False)
            df.to_json(json_path, orient="records", indent=2)
            print(f"Exported {name} ({len(data)} records) -> {csv_path}")

if __name__ == "__main__":
    gen = SyntheticDataGenerator(seed=RANDOM_SEED)
    gen.generate(mode="starter", target_dir="data")
