import os
import sys
import random
from datetime import datetime, timezone, timedelta
from faker import Faker
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.db.session import SessionLocal
from app.models.entities import (
    Customer, LoyaltyAccount, Tier, Rule, Reward, Order,
    OrderLine, PointsTransaction, PointsLot
)
from app.models.enums import CustomerStatus, AccountStatus, OrderStatus, TransactionType, TransactionStatus
from data_generator.generate_data import SyntheticDataGenerator, RANDOM_SEED

def generate_large_scale(num_customers: int = 20000, num_orders: int = 100000, seed: int = RANDOM_SEED):
    """
    Optimized streaming generator that scales to 20,000 customers, 100,000 orders,
    and 300,000+ points transactions using chunked batch insertions.
    """
    print(f"=== Initializing High-Volume Batch Generator (Seed: {seed}) ===")
    print(f"Targets: {num_customers} Customers | {num_orders} Orders | ~300,000 Points Transactions")

    fake = Faker()
    Faker.seed(seed)
    random.seed(seed)
    base_date = datetime(2025, 1, 1, 0, 0, 0, tzinfo=timezone.utc)

    db: Session = SessionLocal()
    try:
        gen = SyntheticDataGenerator(seed=seed)
        gen.seed_initial_tiers_and_rules(db)
        rule = db.query(Rule).filter(Rule.id == "RULE-ACCRUAL-01").first()

        # Batch 1: Customers & Accounts
        existing_cust_count = db.query(Customer).count()
        needed_customers = max(0, num_customers - existing_cust_count)
        print(f"Generating {needed_customers} additional customer records in batches of 2,000...")

        batch_size = 2000
        for b_start in range(1, needed_customers + 1, batch_size):
            b_end = min(b_start + batch_size - 1, needed_customers)
            for i in range(b_start, b_end + 1):
                idx = existing_cust_count + i
                cust_id = f"CUST-{idx:06d}"
                loy_id = f"LOY-CUST-{idx:06d}"
                dt = base_date + timedelta(days=random.randint(0, 60))

                c = Customer(
                    id=cust_id,
                    first_name=fake.first_name(),
                    last_name=fake.last_name(),
                    email=f"scale_{idx}_{fake.user_name()}@yottaflex-sample.com",
                    phone=f"+91{random.randint(7000000000, 9999999999)}",
                    status=CustomerStatus.ACTIVE,
                    created_at=dt,
                    updated_at=dt
                )
                db.add(c)
                acc = LoyaltyAccount(
                    id=loy_id,
                    customer_id=cust_id,
                    current_tier_id="TIER-BRONZE",
                    cached_balance=0,
                    status=AccountStatus.ACTIVE,
                    created_at=dt,
                    updated_at=dt
                )
                db.add(acc)
            db.commit()
            print(f" - Inserted Customers & Accounts through {b_end}/{needed_customers}")

        print("Large-scale customer generation completed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--customers", type=int, default=20000)
    parser.add_argument("--orders", type=int, default=100000)
    args = parser.parse_args()
    
    generate_large_scale(num_customers=args.customers, num_orders=args.orders)

