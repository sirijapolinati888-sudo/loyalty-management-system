from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.entities import LoyaltyAccount, PointsTransaction, PointsLot
from app.models.enums import TransactionStatus

class LedgerService:
    @staticmethod
    def get_ledger_balance(db: Session, account_id: str) -> int:
        """
        Calculates real-time balance by summing all posted signed transactions.
        Available Balance = Sum of all posted signed ledger transactions.
        """
        result = db.query(func.sum(PointsTransaction.points_amount)).filter(
            PointsTransaction.loyalty_account_id == account_id,
            PointsTransaction.status == TransactionStatus.POSTED
        ).scalar()
        return result or 0

    @staticmethod
    def get_lot_balance(db: Session, account_id: str) -> int:
        """
        Calculates balance from unexpired remaining points in lots.
        """
        result = db.query(func.sum(PointsLot.remaining_points)).filter(
            PointsLot.loyalty_account_id == account_id,
            PointsLot.is_expired == False
        ).scalar()
        return result or 0

    @staticmethod
    def reconcile_account(db: Session, account_id: str) -> dict:
        """
        Reconciles stored cached balance with ledger sum and active points lot sum.
        """
        account = db.query(LoyaltyAccount).filter(LoyaltyAccount.id == account_id).first()
        if not account:
            raise ValueError(f"Account {account_id} not found.")

        ledger_sum = LedgerService.get_ledger_balance(db, account_id)
        lot_sum = LedgerService.get_lot_balance(db, account_id)
        cached_bal = account.cached_balance

        is_reconciled = (cached_bal == ledger_sum)

        return {
            "account_id": account_id,
            "customer_id": account.customer_id,
            "cached_balance": cached_bal,
            "ledger_balance": ledger_sum,
            "lot_balance": lot_sum,
            "discrepancy": cached_bal - ledger_sum,
            "is_reconciled": is_reconciled
        }

