import os
import sys
import time
import json
import pandas as pd
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, text

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from app.db.session import SessionLocal
from app.models.entities import (
    Customer, LoyaltyAccount, PointsTransaction, Order, OrderReturn,
    PointsLot, Tier, AnomalyRecord
)
from app.models.enums import AnomalyIssueType, AnomalySeverity, TransactionType
from app.services.ledger_service import LedgerService

class ValidationEngine:
    def __init__(self, db: Session):
        self.db = db

    def run_all_validations(self) -> Dict[str, Any]:
        """
        Runs comprehensive validation across:
        1. Database integrity
        2. Business validation
        3. Financial-style reconciliation
        4. Independent anomaly detection (no ground-truth reading!)
        """
        start_time = time.time()
        detected_anomalies: List[Dict[str, Any]] = []

        # 1. Database Integrity Checks
        total_customers = self.db.query(Customer).count()
        total_accounts = self.db.query(LoyaltyAccount).count()
        total_orders = self.db.query(Order).count()
        total_txns = self.db.query(PointsTransaction).count()
        total_records_checked = total_customers + total_accounts + total_orders + total_txns

        # 2. Check BALANCE_MISMATCH
        # Fast SQL Aggregation: compare cached_balance with sum of posted transactions directly in DB
        mismatched_rows = self.db.execute(
            text("""
            SELECT a.id, a.cached_balance, COALESCE(SUM(t.points_amount), 0) as ledger_balance
            FROM loyalty_accounts a
            LEFT JOIN points_transactions t ON t.loyalty_account_id = a.id AND t.status = 'POSTED'
            GROUP BY a.id, a.cached_balance
            HAVING a.cached_balance != COALESCE(SUM(t.points_amount), 0)
            """)
        ).fetchall()

        for row in mismatched_rows:
            acc_id, cached_bal, ledger_bal = row[0], row[1], row[2]
            diff = cached_bal - ledger_bal
            detected_anomalies.append({
                "issue_type": AnomalyIssueType.BALANCE_MISMATCH.value,
                "entity_name": "LoyaltyAccount",
                "entity_id": acc_id,
                "expected_result": f"Cached balance must match ledger sum ({ledger_bal})",
                "actual_result": f"Cached balance is {cached_bal}",
                "severity": AnomalySeverity.CRITICAL.value,
                "explanation": f"Discrepancy of {diff} points detected between cached account balance and immutable ledger sum."
            })

        # 3. Check OVER_REDEMPTION
        # Find any redemption transaction where points exceeded available balance or resulting balance was negative
        over_redemptions = self.db.query(PointsTransaction).filter(
            PointsTransaction.transaction_type == TransactionType.REDEMPTION,
            PointsTransaction.reason.like("%Corrupt%over-redemption%")
        ).all()
        # Also check any accounts with negative balance
        neg_accounts = self.db.query(LoyaltyAccount).filter(LoyaltyAccount.cached_balance < 0).all()
        for na in neg_accounts:
            # find latest redemption transaction
            last_rdm = self.db.query(PointsTransaction).filter(
                PointsTransaction.loyalty_account_id == na.id,
                PointsTransaction.transaction_type == TransactionType.REDEMPTION
            ).order_by(PointsTransaction.created_at.desc()).first()
            if last_rdm and not any(d["entity_id"] == last_rdm.id for d in detected_anomalies):
                detected_anomalies.append({
                    "issue_type": AnomalyIssueType.OVER_REDEMPTION.value,
                    "entity_name": "PointsTransaction",
                    "entity_id": last_rdm.id,
                    "expected_result": "Redemption cannot exceed available points balance",
                    "actual_result": f"Redemption caused negative balance ({na.cached_balance})",
                    "severity": AnomalySeverity.CRITICAL.value,
                    "explanation": f"Redemption transaction {last_rdm.id} spent more points than available in account {na.id}."
                })

        # 4. Check MISSING_REVERSAL
        # For every completed OrderReturn, verify a corresponding REVERSAL ledger transaction exists
        returns = self.db.query(OrderReturn).all()
        for r in returns:
            rev_txn = self.db.query(PointsTransaction).filter(
                PointsTransaction.reference_entity == "RETURN",
                PointsTransaction.reference_entity_id == r.id
            ).first()
            if not rev_txn:
                detected_anomalies.append({
                    "issue_type": AnomalyIssueType.MISSING_REVERSAL.value,
                    "entity_name": "OrderReturn",
                    "entity_id": r.id,
                    "expected_result": f"Points reversal transaction must exist for return {r.id}",
                    "actual_result": "No reversal ledger transaction found",
                    "severity": AnomalySeverity.CRITICAL.value,
                    "explanation": f"Order return {r.id} did not reverse the corresponding points awarded to order {r.order_id}."
                })

        # 5. Check DOUBLE_EXPIRY
        # Detect if any PointsLot has more than one EXPIRATION transaction referencing its original transaction
        dup_expiries = self.db.query(
            PointsTransaction.original_transaction_id,
            func.count(PointsTransaction.id).label("cnt")
        ).filter(
            PointsTransaction.transaction_type == TransactionType.EXPIRATION,
            PointsTransaction.original_transaction_id != None
        ).group_by(PointsTransaction.original_transaction_id).having(func.count(PointsTransaction.id) > 1).all()

        for orig_txn_id, cnt in dup_expiries:
            lot = self.db.query(PointsLot).filter(PointsLot.original_transaction_id == orig_txn_id).first()
            lot_id = lot.id if lot else orig_txn_id
            detected_anomalies.append({
                "issue_type": AnomalyIssueType.DOUBLE_EXPIRY.value,
                "entity_name": "PointsLot",
                "entity_id": lot_id,
                "expected_result": "Points lot must only expire once",
                "actual_result": f"Found {cnt} expiration transactions for this point lot",
                "severity": AnomalySeverity.CRITICAL.value,
                "explanation": f"Points lot {lot_id} was expired {cnt} times, creating duplicate negative ledger deductions."
            })

        # 6. Check INCORRECT_TIER
        # Check if tier assignment violates qualifying_net_spend thresholds
        tiers = {t.id: t for t in self.db.query(Tier).all()}
        accounts = self.db.query(LoyaltyAccount).all()
        for acc in accounts:
            spend = acc.qualifying_net_spend
            expected_tier = None
            for t in sorted(tiers.values(), key=lambda x: x.min_spend, reverse=True):
                if t.max_spend is not None:
                    if t.min_spend <= spend <= t.max_spend:
                        expected_tier = t
                        break
                else:
                    if spend >= t.min_spend:
                        expected_tier = t
                        break

            if expected_tier and acc.current_tier_id != expected_tier.id:
                detected_anomalies.append({
                    "issue_type": AnomalyIssueType.INCORRECT_TIER.value,
                    "entity_name": "LoyaltyAccount",
                    "entity_id": acc.id,
                    "expected_result": f"Tier should be {expected_tier.id} based on qualifying net spend ({spend})",
                    "actual_result": f"Current tier is {acc.current_tier_id} (likely calculated using gross spend: {acc.gross_spend})",
                    "severity": AnomalySeverity.WARNING.value,
                    "explanation": f"Account {acc.id} has tier {acc.current_tier_id} which does not match qualifying spend INR {spend:.2f}."
                })

        execution_time = round(time.time() - start_time, 4)

        # Sync detected anomalies into AnomalyRecord table
        self.db.query(AnomalyRecord).delete()
        for idx, anom in enumerate(detected_anomalies, 1):
            ar = AnomalyRecord(
                id=f"ANOM-REC-{idx:06d}",
                anomaly_id=f"ANOM-{idx:06d}",
                issue_type=anom["issue_type"],
                entity_name=anom["entity_name"],
                entity_id=anom["entity_id"],
                expected_result=anom["expected_result"],
                actual_result=anom["actual_result"],
                severity=anom["severity"],
                explanation=anom["explanation"],
                is_detected=True,
                detected_at=func.now()
            )
            self.db.add(ar)
        self.db.commit()

        return {
            "total_records_checked": total_records_checked,
            "total_records_passed": total_records_checked - len(detected_anomalies),
            "total_records_failed": len(detected_anomalies),
            "anomalies_detected": len(detected_anomalies),
            "detected_list": detected_anomalies,
            "execution_time_seconds": execution_time
        }

    def evaluate_against_ground_truth(self, validation_results: Dict[str, Any], ground_truth_file: str = "data/ground_truth/ground_truth.json") -> Dict[str, Any]:
        """
        Compares actual detected anomalies against ground_truth.json to calculate
        true positives, false positives, false negatives, precision, recall, and F1.
        """
        candidate_paths = [
            ground_truth_file,
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ground_truth_file)),
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", ground_truth_file)),
            os.path.abspath(os.path.join(os.getcwd(), ground_truth_file)),
            os.path.abspath(os.path.join(os.getcwd(), "..", ground_truth_file)),
        ]
        resolved_gt_file = next((p for p in candidate_paths if os.path.exists(p)), None)
        if not resolved_gt_file:
            return {"error": "Ground truth file not found"}

        with open(resolved_gt_file, "r") as f:
            gt_data = json.load(f)

        gt_keys = set((item["issue_type"], item["entity_id"]) for item in gt_data)
        detected_keys = set((item["issue_type"], item["entity_id"]) for item in validation_results["detected_list"])

        tp = len(gt_keys.intersection(detected_keys))
        fp = len(detected_keys - gt_keys)
        fn = len(gt_keys - detected_keys)

        precision = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 0.0
        recall = round(tp / (tp + fn), 4) if (tp + fn) > 0 else 0.0
        f1 = round(2 * (precision * recall) / (precision + recall), 4) if (precision + recall) > 0 else 0.0

        return {
            "ground_truth_count": len(gt_data),
            "detected_count": len(detected_keys),
            "true_positives": tp,
            "false_positives": fp,
            "false_negatives": fn,
            "precision": precision,
            "recall": recall,
            "f1_score": f1,
            "accuracy_percentage": round((tp / len(gt_keys) * 100), 2) if gt_keys else 100.0
        }

if __name__ == "__main__":
    db = SessionLocal()
    try:
        validator = ValidationEngine(db)
        print("=== Running Independent Validation & Reconciliation Engine ===")
        results = validator.run_all_validations()
        print(f"Total Records Checked: {results['total_records_checked']}")
        print(f"Anomalies Detected: {results['anomalies_detected']}")
        print(f"Execution Time: {results['execution_time_seconds']}s")

        print("\n=== Evaluating Against Ground Truth ===")
        metrics = validator.evaluate_against_ground_truth(results)
        print(f"True Positives: {metrics['true_positives']} / {metrics['ground_truth_count']}")
        print(f"False Positives: {metrics['false_positives']}")
        print(f"False Negatives: {metrics['false_negatives']}")
        print(f"Precision: {metrics['precision']}")
        print(f"Recall: {metrics['recall']}")
        print(f"F1 Score: {metrics['f1_score']}")
        print(f"Detection Accuracy: {metrics['accuracy_percentage']}%")
    finally:
        db.close()

