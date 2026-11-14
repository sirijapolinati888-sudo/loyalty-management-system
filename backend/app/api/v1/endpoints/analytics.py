from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.entities import Customer, LoyaltyAccount, Order, PointsTransaction, AnomalyRecord
from app.models.enums import TransactionType, TransactionStatus, AnomalyIssueType
from app.services.validation_engine import ValidationEngine

router = APIRouter()

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_customers = db.query(Customer).count()
    total_accounts = db.query(LoyaltyAccount).count()
    total_orders = db.query(Order).count()

    # 1. Real KPI calculations from posted ledger transactions
    pts_earned = db.query(func.sum(PointsTransaction.points_amount)).filter(
        PointsTransaction.transaction_type == TransactionType.ACCRUAL,
        PointsTransaction.status == TransactionStatus.POSTED
    ).scalar() or 0

    pts_redeemed = abs(db.query(func.sum(PointsTransaction.points_amount)).filter(
        PointsTransaction.transaction_type == TransactionType.REDEMPTION,
        PointsTransaction.status == TransactionStatus.POSTED
    ).scalar() or 0)

    pts_expired = abs(db.query(func.sum(PointsTransaction.points_amount)).filter(
        PointsTransaction.transaction_type == TransactionType.EXPIRATION,
        PointsTransaction.status == TransactionStatus.POSTED
    ).scalar() or 0)

    pts_reversed = abs(db.query(func.sum(PointsTransaction.points_amount)).filter(
        PointsTransaction.transaction_type == TransactionType.REVERSAL,
        PointsTransaction.status == TransactionStatus.POSTED
    ).scalar() or 0)

    outstanding_points = db.query(func.sum(LoyaltyAccount.cached_balance)).scalar() or 0

    # 2. Run Validation/Reconciliation Engine for live reconciliation metrics
    validator = ValidationEngine(db)
    v_results = validator.run_all_validations()
    total_checked = total_accounts
    reconciled_accounts = total_accounts - sum(1 for a in v_results["detected_list"] if a["issue_type"] == AnomalyIssueType.BALANCE_MISMATCH.value)
    reconciliation_rate = round((reconciled_accounts / total_checked * 100), 2) if total_checked > 0 else 100.0

    # Counts by anomaly category
    balance_mismatches = sum(1 for a in v_results["detected_list"] if a["issue_type"] == AnomalyIssueType.BALANCE_MISMATCH.value)
    over_redemptions = sum(1 for a in v_results["detected_list"] if a["issue_type"] == AnomalyIssueType.OVER_REDEMPTION.value)
    missing_reversals = sum(1 for a in v_results["detected_list"] if a["issue_type"] == AnomalyIssueType.MISSING_REVERSAL.value)
    double_expiries = sum(1 for a in v_results["detected_list"] if a["issue_type"] == AnomalyIssueType.DOUBLE_EXPIRY.value)
    incorrect_tiers = sum(1 for a in v_results["detected_list"] if a["issue_type"] == AnomalyIssueType.INCORRECT_TIER.value)

    # 3. Transaction Types Breakdown with exact counts & percentages
    all_types = [TransactionType.ACCRUAL, TransactionType.REDEMPTION, TransactionType.REVERSAL, TransactionType.EXPIRATION, TransactionType.ADJUSTMENT]
    txn_type_counts = dict(
        db.query(PointsTransaction.transaction_type, func.count(PointsTransaction.id))
        .group_by(PointsTransaction.transaction_type).all()
    )
    total_txns = sum(txn_type_counts.values()) or 1
    txn_distribution = []
    for t in all_types:
        cnt = txn_type_counts.get(t, 0)
        pct = round((cnt / total_txns) * 100, 2)
        txn_distribution.append({
            "type": t.value,
            "count": cnt,
            "percentage": pct
        })

    # 4. Monthly trends (Earned vs Redeemed, Expiration & Reversal)
    txns = db.query(PointsTransaction).all()
    monthly_data = {}
    for t in txns:
        m = t.created_at.strftime("%Y-%m")
        if m not in monthly_data:
            monthly_data[m] = {"month": m, "earned": 0, "redeemed": 0, "expired": 0, "reversed": 0}
        if t.transaction_type == TransactionType.ACCRUAL:
            monthly_data[m]["earned"] += t.points_amount
        elif t.transaction_type == TransactionType.REDEMPTION:
            monthly_data[m]["redeemed"] += abs(t.points_amount)
        elif t.transaction_type == TransactionType.EXPIRATION:
            monthly_data[m]["expired"] += abs(t.points_amount)
        elif t.transaction_type == TransactionType.REVERSAL:
            monthly_data[m]["reversed"] += abs(t.points_amount)

    monthly_trends = [monthly_data[k] for k in sorted(monthly_data.keys())]

    # 5. Customer Tier Distribution
    tier_counts = db.query(LoyaltyAccount.current_tier_id, func.count(LoyaltyAccount.id)).group_by(LoyaltyAccount.current_tier_id).all()
    tier_distribution = [{"tier": t[0], "count": t[1]} for t in tier_counts]

    # 6. Transaction Status Distribution
    status_counts = db.query(PointsTransaction.status, func.count(PointsTransaction.id)).group_by(PointsTransaction.status).all()
    status_distribution = [{"status": str(s[0].value) if hasattr(s[0], 'value') else str(s[0]), "count": s[1]} for s in status_counts]

    # 7. Anomaly Category Distribution
    anom_counts = db.query(AnomalyRecord.issue_type, func.count(AnomalyRecord.id)).group_by(AnomalyRecord.issue_type).all()
    anom_distribution = [{"category": str(c[0].value) if hasattr(c[0], 'value') else str(c[0]), "count": c[1]} for c in anom_counts]

    # Determine loaded dataset mode
    dataset_mode = "Full Mode (Scale)" if total_customers >= 10000 else "Starter Mode"

    return {
        "dataset_info": {
            "mode": dataset_mode,
            "seed": 20261022,
            "total_customers": total_customers,
            "total_orders": total_orders,
            "total_transactions": sum(txn_type_counts.values())
        },
        "kpis": {
            "total_customers": total_customers,
            "total_orders": total_orders,
            "points_earned": pts_earned,
            "points_redeemed": pts_redeemed,
            "points_expired": pts_expired,
            "points_reversed": pts_reversed,
            "current_outstanding_points": outstanding_points,
            "active_loyalty_accounts": total_accounts,
            "anomalies_detected": len(v_results["detected_list"]),
            "reconciliation_rate": reconciliation_rate
        },
        "reconciliation": {
            "total_accounts_checked": total_checked,
            "reconciled_accounts": reconciled_accounts,
            "balance_mismatches": balance_mismatches,
            "over_redemptions": over_redemptions,
            "missing_reversals": missing_reversals,
            "double_expiries": double_expiries,
            "incorrect_tiers": incorrect_tiers
        },
        "txn_distribution": txn_distribution,
        "monthly_trends": monthly_trends,
        "tier_distribution": tier_distribution,
        "status_distribution": status_distribution,
        "anom_distribution": anom_distribution
    }
