import os
import sys
import json
import hashlib
from datetime import datetime, timezone
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from app.db.session import SessionLocal
from app.models.entities import (
    Customer, LoyaltyAccount, Tier, Rule, Reward, Order,
    OrderLine, PointsTransaction, PointsLot, Redemption,
    ExpiryBatch, OrderReturn, OrderReturnLine, TierHistory, RuleHistory
)

def compute_file_hash(filepath: str) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def export_sql_and_manifest():
    print("=== Generating SQL Seed Data and Source Manifest ===")
    db: Session = SessionLocal()
    exports_dir = "data/exports"
    os.makedirs(exports_dir, exist_ok=True)
    
    sql_path = os.path.join(exports_dir, "seed_data.sql")
    manifest_path = os.path.join(exports_dir, "manifest.json")

    # 1. Export SQL Seed Data
    print("Exporting SQL Seed Data to", sql_path)
    with open(sql_path, "w", encoding="utf-8") as sql_f:
        sql_f.write("-- YottaFlex.ai Loyalty Points Management System SQL Seed Export\n")
        sql_f.write(f"-- Generated: {datetime.now(timezone.utc).isoformat()}\n")
        sql_f.write("-- Fixed Seed: 20261022\n\n")

        # Tiers
        sql_f.write("-- Tiers\n")
        for t in db.query(Tier).all():
            sql_f.write(f"INSERT INTO tiers (id, name, min_spend, max_spend, multiplier, description, created_at, updated_at) VALUES ('{t.id}', '{t.name}', {t.min_spend}, {'NULL' if t.max_spend is None else t.max_spend}, {t.multiplier}, '{t.description}', '{t.created_at}', '{t.updated_at}') ON CONFLICT (id) DO NOTHING;\n")

        # Rules
        sql_f.write("\n-- Rules\n")
        for r in db.query(Rule).all():
            sql_f.write(f"INSERT INTO rules (id, name, rule_type, spend_threshold, points_awarded, expiry_days, is_active, description, created_at, updated_at) VALUES ('{r.id}', '{r.name}', '{r.rule_type}', {r.spend_threshold}, {r.points_awarded}, {r.expiry_days}, {r.is_active}, '{r.description}', '{r.created_at}', '{r.updated_at}') ON CONFLICT (id) DO NOTHING;\n")

        # Rewards
        sql_f.write("\n-- Rewards\n")
        for rw in db.query(Reward).all():
            sql_f.write(f"INSERT INTO rewards (id, name, description, points_required, monetary_value, is_active, stock_count, created_at, updated_at) VALUES ('{rw.id}', '{rw.name}', '{rw.description}', {rw.points_required}, {rw.monetary_value}, {rw.is_active}, {rw.stock_count}, '{rw.created_at}', '{rw.updated_at}') ON CONFLICT (id) DO NOTHING;\n")

        # Sample Customers & Accounts (first 50)
        sql_f.write("\n-- Baseline Customers & Accounts (Sample)\n")
        for c in db.query(Customer).limit(50).all():
            sql_f.write(f"INSERT INTO customers (id, first_name, last_name, email, phone, status, created_at, updated_at) VALUES ('{c.id}', '{c.first_name}', '{c.last_name}', '{c.email}', '{c.phone}', '{c.status.value}', '{c.created_at}', '{c.updated_at}') ON CONFLICT (id) DO NOTHING;\n")
        for acc in db.query(LoyaltyAccount).limit(50).all():
            sql_f.write(f"INSERT INTO loyalty_accounts (id, customer_id, current_tier_id, cached_balance, lifetime_points_earned, lifetime_points_redeemed, lifetime_points_expired, lifetime_points_reversed, qualifying_net_spend, gross_spend, status, created_at, updated_at) VALUES ('{acc.id}', '{acc.customer_id}', '{acc.current_tier_id}', {acc.cached_balance}, {acc.lifetime_points_earned}, {acc.lifetime_points_redeemed}, {acc.lifetime_points_expired}, {acc.lifetime_points_reversed}, {acc.qualifying_net_spend}, {acc.gross_spend}, '{acc.status.value}', '{acc.created_at}', '{acc.updated_at}') ON CONFLICT (id) DO NOTHING;\n")

    # 2. Generate Manifest
    print("Generating Provenance Manifest to", manifest_path)
    file_records = {}
    for folder in ["master", "transactions", "ground_truth", "exports"]:
        f_dir = os.path.join("data", folder)
        if os.path.exists(f_dir):
            for fname in sorted(os.listdir(f_dir)):
                f_path = os.path.join(f_dir, fname)
                if os.path.isfile(f_path) and fname != "manifest.json":
                    file_records[f"{folder}/{fname}"] = {
                        "size_bytes": os.path.getsize(f_path),
                        "sha256": compute_file_hash(f_path)
                    }

    manifest = {
        "dataset_name": "YottaFlex.ai Synthetic Loyalty & Ledger Dataset",
        "generation_date": datetime.now(timezone.utc).isoformat(),
        "generator_version": "2.0.0-enterprise",
        "random_seed": 20261022,
        "configuration": {
            "currency": "INR",
            "spend_threshold_inr": 100.0,
            "points_per_threshold": 1,
            "expiry_days": 365,
            "rounding_method": "floor"
        },
        "record_counts": {
            "customers": db.query(Customer).count(),
            "loyalty_accounts": db.query(LoyaltyAccount).count(),
            "tiers": db.query(Tier).count(),
            "rules": db.query(Rule).count(),
            "rewards": db.query(Reward).count(),
            "orders": db.query(Order).count(),
            "order_lines": db.query(OrderLine).count(),
            "points_transactions": db.query(PointsTransaction).count(),
            "points_lots": db.query(PointsLot).count(),
            "redemptions": db.query(Redemption).count(),
            "expiry_batches": db.query(ExpiryBatch).count()
        },
        "files": file_records,
        "data_provenance": "100% synthetically generated with deterministic pseudorandom seed 20261022. No external personally identifiable information (PII) used."
    }

    with open(manifest_path, "w", encoding="utf-8") as mf:
        json.dump(manifest, mf, indent=2)

    db.close()
    print("Export and Manifest generation completed successfully!")

if __name__ == "__main__":
    export_sql_and_manifest()

