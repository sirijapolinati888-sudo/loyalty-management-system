import os
import sys
import json
import random
from datetime import datetime, timezone
import pandas as pd
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from app.db.session import SessionLocal
from app.models.entities import (
    Customer, LoyaltyAccount, PointsTransaction, Order, OrderReturn,
    PointsLot, AnomalyRecord, Tier, ExpiryBatch
)
from app.models.enums import AnomalyIssueType, AnomalySeverity, TransactionType, ExpiryBatchStatus

def inject_anomalies(data_dir: str = "data"):
    """
    Injects the 5 mandatory business anomalies cleanly without corrupting unrelated records:
    1. BALANCE_MISMATCH
    2. OVER_REDEMPTION
    3. MISSING_REVERSAL
    4. DOUBLE_EXPIRY
    5. INCORRECT_TIER
    """
    print("=== Injecting 5 Mandatory Anomaly Cases (Clean Isolation) ===")
    db: Session = SessionLocal()
    ground_truth = []

    try:
        # Case 1: BALANCE_MISMATCH
        # Select an account that has no returns or complex edges
        acc_1 = db.query(LoyaltyAccount).filter(LoyaltyAccount.cached_balance > 100).first()
        if acc_1:
            orig_val = acc_1.cached_balance
            corrupt_val = orig_val + 500
            acc_1.cached_balance = corrupt_val
            db.flush()

            anom_1 = {
                "anomaly_id": "ANOM-000001",
                "issue_type": AnomalyIssueType.BALANCE_MISMATCH.value,
                "entity_name": "LoyaltyAccount",
                "entity_id": acc_1.id,
                "expected_result": f"Cached balance must match ledger sum ({orig_val})",
                "actual_result": f"Cached balance is {corrupt_val}",
                "severity": AnomalySeverity.CRITICAL.value,
                "explanation": "Stored loyalty account balance was corrupted by +500 points, causing mismatch with immutable ledger sum."
            }

            ground_truth.append(anom_1)
            print(f"Injected Case 1: BALANCE_MISMATCH on {acc_1.id}")

        # Case 2: OVER_REDEMPTION
        # Find another account and inject a redemption transaction that exceeds its points
        acc_2 = db.query(LoyaltyAccount).filter(
            LoyaltyAccount.id != (acc_1.id if acc_1 else ""),
            LoyaltyAccount.cached_balance > 0
        ).first()
        if acc_2:
            excess_amount = acc_2.cached_balance + 250
            txn_id = "PTS-2026-99990001"
            corrupt_rdm = PointsTransaction(
                id=txn_id,
                loyalty_account_id=acc_2.id,
                customer_id=acc_2.customer_id,
                transaction_type=TransactionType.REDEMPTION,
                points_amount=-excess_amount,
                reference_entity="REDEMPTION",
                reference_entity_id="RDM-OVER-999",
                reason="Corrupt over-redemption test injection",
                created_at=datetime.now(timezone.utc)
            )

            db.add(corrupt_rdm)
            acc_2.cached_balance -= excess_amount
            db.flush()

            anom_2 = {
                "anomaly_id": "ANOM-000002",
                "issue_type": AnomalyIssueType.OVER_REDEMPTION.value,
                "entity_name": "PointsTransaction",
                "entity_id": txn_id,
                "expected_result": "Redemption cannot exceed available points balance",
                "actual_result": f"Redeemed {excess_amount} exceeding available balance",
                "severity": AnomalySeverity.CRITICAL.value,
                "explanation": f"PointsTransaction {txn_id} spent {excess_amount} points, exceeding available balance."
            }
            ground_truth.append(anom_2)
            print(f"Injected Case 2: OVER_REDEMPTION on {acc_2.id} via txn {txn_id}")

        # Case 3: MISSING_REVERSAL
        # Create an OrderReturn for which NO reversal ledger transaction is ever created,
        # but don't touch the account balance so we don't cause an unintended balance mismatch!
        target_order = db.query(Order).filter(
            Order.customer_id != acc_1.customer_id,
            Order.customer_id != (acc_2.customer_id if acc_2 else "")
        ).first()

        missing_ret_id = "RET-2026-999999"
        missing_return = OrderReturn(
            id=missing_ret_id,
            order_id=target_order.id,
            return_amount=target_order.total_gross_amount * 0.5,
            eligible_return_amount=target_order.eligible_net_spend * 0.5,
            points_reversed=int(target_order.points_earned * 0.5),
            reason="Injected unreversed return anomaly",
            return_date=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc)
        )

        db.add(missing_return)
        # Note: We deliberately do NOT create any PointsTransaction for this return!
        db.flush()

        anom_3 = {
            "anomaly_id": "ANOM-000003",
            "issue_type": AnomalyIssueType.MISSING_REVERSAL.value,
            "entity_name": "OrderReturn",
            "entity_id": missing_ret_id,
            "expected_result": f"Points reversal transaction must exist for return {missing_ret_id}",
            "actual_result": "No reversal ledger transaction found for this return",
            "severity": AnomalySeverity.CRITICAL.value,
            "explanation": f"Order return {missing_ret_id} was completed but no points reversal transaction was posted."
        }
        ground_truth.append(anom_3)
        print(f"Injected Case 3: MISSING_REVERSAL on OrderReturn {missing_ret_id}")

        # Case 4: DOUBLE_EXPIRY
        # Find an existing expired lot that already had an expiration transaction
        orig_exp_txn = db.query(PointsTransaction).filter(
            PointsTransaction.transaction_type == TransactionType.EXPIRATION,
            PointsTransaction.original_transaction_id != None
        ).first()

        if not orig_exp_txn:
            # Pick any lot and create the first legitimate expiry
            lot = db.query(PointsLot).first()
            lot_acc = db.query(LoyaltyAccount).filter(LoyaltyAccount.id == lot.loyalty_account_id).first()
            orig_exp_txn = PointsTransaction(
                id="PTS-2026-88880001",
                loyalty_account_id=lot.loyalty_account_id,
                customer_id=lot_acc.customer_id,
                transaction_type=TransactionType.EXPIRATION,
                points_amount=-lot.initial_points,
                reference_entity="EXPIRY_BATCH",
                reference_entity_id="EXP-2026-000001",
                original_transaction_id=lot.original_transaction_id,
                reason=f"Legitimate expiry for lot {lot.id}",
                created_at=datetime.now(timezone.utc)
            )
            db.add(orig_exp_txn)
            lot.is_expired = True
            lot.remaining_points = 0
            lot_acc.cached_balance = max(0, lot_acc.cached_balance - lot.initial_points)
            db.flush()
        else:
            lot = db.query(PointsLot).filter(PointsLot.original_transaction_id == orig_exp_txn.original_transaction_id).first()

        # Inject the DUPLICATE second expiration transaction on the same lot
        dup_exp_txn_id = "PTS-2026-99990002"
        dup_exp_txn = PointsTransaction(
            id=dup_exp_txn_id,
            loyalty_account_id=lot.loyalty_account_id,
            customer_id=orig_exp_txn.customer_id,
            transaction_type=TransactionType.EXPIRATION,
            points_amount=-25,
            reference_entity="EXPIRY_BATCH",
            reference_entity_id="EXP-DUPLICATE",
            original_transaction_id=orig_exp_txn.original_transaction_id,
            reason="Corrupted duplicate expiry transaction",
            created_at=datetime.now(timezone.utc)
        )
        
        db.add(dup_exp_txn)
        # Update account cached balance to match duplicate txn so it doesn't trigger balance mismatch
        exp_account = db.query(LoyaltyAccount).filter(LoyaltyAccount.id == lot.loyalty_account_id).first()
        exp_account.cached_balance -= 25
        db.flush()

        anom_4 = {
            "anomaly_id": "ANOM-000004",
            "issue_type": AnomalyIssueType.DOUBLE_EXPIRY.value,
            "entity_name": "PointsLot",
            "entity_id": lot.id,
            "expected_result": "Points lot must only expire once",
            "actual_result": f"Multiple expiration transactions reference lot {lot.id}",
            "severity": AnomalySeverity.CRITICAL.value,
            "explanation": f"Points lot {lot.id} was expired multiple times, deducting points repeatedly."
        }
        ground_truth.append(anom_4)
        print(f"Injected Case 4: DOUBLE_EXPIRY on lot {lot.id}")

        # Case 5: INCORRECT_TIER
        # Pick an account and promote to Platinum or Gold based on gross spend
        acc_5 = db.query(LoyaltyAccount).filter(
            LoyaltyAccount.id not in [acc_1.id, acc_2.id, lot.loyalty_account_id],
            LoyaltyAccount.current_tier_id == "TIER-BRONZE"
        ).first()

        if acc_5:
            acc_5.gross_spend = 120000.0  # Platinum-level gross spend
            acc_5.qualifying_net_spend = 5000.0  # Bronze qualifying spend
            acc_5.current_tier_id = "TIER-PLATINUM"  # Wrong tier assigned!
            db.flush()

            anom_5 = {
                "anomaly_id": "ANOM-000005",
                "issue_type": AnomalyIssueType.INCORRECT_TIER.value,
                "entity_name": "LoyaltyAccount",
                "entity_id": acc_5.id,
                "expected_result": "Tier should be TIER-BRONZE based on qualifying net spend (5000.0)",
                "actual_result": "Current tier is TIER-PLATINUM (calculated using gross spend: 120000.0)",
                "severity": AnomalySeverity.WARNING.value,
                "explanation": "Customer membership tier was calculated using total gross spend instead of qualifying net spend."
            }
            ground_truth.append(anom_5)
            print(f"Injected Case 5: INCORRECT_TIER on {acc_5.id}")

        db.commit()

        # Save Ground Truth
        gt_dir = os.path.join(data_dir, "ground_truth")
        os.makedirs(gt_dir, exist_ok=True)
        gt_df = pd.DataFrame(ground_truth)
        gt_csv = os.path.join(gt_dir, "ground_truth.csv")
        gt_json = os.path.join(gt_dir, "ground_truth.json")

        gt_df.to_csv(gt_csv, index=False)
        with open(gt_json, "w") as f:
            json.dump(ground_truth, f, indent=2)

        print(f"Clean Ground Truth successfully written to {gt_csv} & {gt_json}")

    finally:
        db.close()

if __name__ == "__main__":
    inject_anomalies("data")
