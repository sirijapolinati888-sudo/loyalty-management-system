import os
import sys
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from app.db.session import SessionLocal
from app.models.entities import User, Customer
from app.models.enums import UserRole
from app.core.security import hash_password

def seed_users():
    print("=== Seeding Demo Users for All 4 Roles ===")
    db: Session = SessionLocal()
    try:
        # Get first customer for customer role linkage
        first_cust = db.query(Customer).first()
        cust_id = first_cust.id if first_cust else "CUST-000001"

        demo_users = [
            {
                "id": "USR-000001",
                "email": "ops@yottaflex.ai",
                "password": "Password123!",
                "full_name": "Sarah Connor (Operations Manager)",
                "role": UserRole.OPERATIONS_MANAGER,
                "customer_id": None
            },
            {
                "id": "USR-000002",
                "email": "operator@yottaflex.ai",
                "password": "Password123!",
                "full_name": "Marcus Vance (Store Operator)",
                "role": UserRole.STORE_OPERATOR,
                "customer_id": None
            },
            {
                "id": "USR-000003",
                "email": "analyst@yottaflex.ai",
                "password": "Password123!",
                "full_name": "Elena Rostova (Merchandising Analyst)",
                "role": UserRole.ANALYST,
                "customer_id": None
            },
            {
                "id": "USR-000004",
                "email": "customer@yottaflex.ai",
                "password": "Password123!",
                "full_name": f"{first_cust.first_name if first_cust else 'Erin'} {first_cust.last_name if first_cust else 'Riley'} (Customer)",
                "role": UserRole.CUSTOMER,
                "customer_id": cust_id
            }
        ]

        for u in demo_users:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if not existing:
                new_user = User(
                    id=u["id"],
                    email=u["email"],
                    hashed_password=hash_password(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"],
                    customer_id=u["customer_id"],
                    is_active=True
                )
                db.add(new_user)
                print(f"Created user: {u['email']} [{u['role'].value}]")
            else:
                existing.hashed_password = hash_password(u["password"])
                existing.role = u["role"]
                existing.customer_id = u["customer_id"]
                print(f"Updated user: {u['email']} [{u['role'].value}]")

        db.commit()
        print("All 4 demo users seeded successfully with password 'Password123!'")
    finally:
        db.close()

if __name__ == "__main__":
    seed_users()

