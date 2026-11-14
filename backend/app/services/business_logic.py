from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select, update
from app.models.entities import (
    LoyaltyAccount, PointsTransaction, PointsLot, Order, OrderLine,
    Rule, Tier, TierHistory, OrderReturn, OrderReturnLine, Redemption,
    Reward, ExpiryBatch, RedemptionAttempt, AuditLog, IdempotencyRecord
)
from app.models.enums import (
    TransactionType, TransactionStatus, OrderStatus,
    RedemptionStatus, ExpiryBatchStatus
)
from app.core.config import settings

def utcnow():
    return datetime.now(timezone.utc)

def get_next_points_transaction_id(db: Session, offset: int = 1) -> str:
    """
    Safely calculates a monotonically increasing unique transaction ID
    without conflicting with existing database records or manually injected IDs.
    """
    prefix = "PTS-2026-"
    txns = db.query(PointsTransaction.id).filter(PointsTransaction.id.like(f"{prefix}%")).all()
    max_num = 0
    for (tid,) in txns:
        suffix = tid[len(prefix):]
        if suffix.isdigit() and int(suffix) < 80000000:
            val = int(suffix)
            if val > max_num:
                max_num = val
    return f"{prefix}{max_num + offset:08d}"

class AccrualService:
    @staticmethod
    def process_order_accrual(
        db: Session,
        order: Order,
        rule: Optional[Rule] = None,
        transaction_id: Optional[str] = None,
        lot_id: Optional[str] = None
    ) -> Tuple[PointsTransaction, PointsLot]:
        """
        Accrue loyalty points for an eligible order:
        Points Earned = floor(Eligible Net Spend / spend_threshold) * points_awarded
        """
        if order.status == OrderStatus.CANCELLED:
            raise ValueError(f"Cannot accrue points on cancelled order {order.id}")

        if not rule:
            rule = db.query(Rule).filter(Rule.is_active == True, Rule.rule_type == "ACCRUAL").first()
            if not rule:
                # Default fallback rule
                rule = Rule(
                    id="RULE-DEFAULT",
                    name="Standard Earning Rule",
                    rule_type="ACCRUAL",
                    spend_threshold=settings.POINTS_EARN_THRESHOLD_INR,
                    points_awarded=1,
                    expiry_days=settings.DEFAULT_POINTS_EXPIRY_DAYS,
                    is_active=True
                )
                db.add(rule)
                db.flush()

        # Find Loyalty Account
        account = db.query(LoyaltyAccount).filter(LoyaltyAccount.customer_id == order.customer_id).with_for_update().first()
        if not account:
            raise ValueError(f"No loyalty account found for customer {order.customer_id}")

        # Calculate points
        points_earned = int(order.eligible_net_spend // rule.spend_threshold) * rule.points_awarded
        order.points_earned = points_earned

        # Update Account spends
        account.gross_spend += order.total_gross_amount
        account.qualifying_net_spend += order.eligible_net_spend
        account.cached_balance += points_earned
        account.lifetime_points_earned += points_earned

        # Determine deterministic IDs if not supplied
        if not transaction_id:
            transaction_id = get_next_points_transaction_id(db)

        if not lot_id:
            count = db.query(PointsLot).count() + 1
            lot_id = f"LOT-2026-{count:06d}"

        expiry_date = order.order_date + timedelta(days=rule.expiry_days)

        # 1. Create Transaction (Signed amount > 0)
        txn = PointsTransaction(
            id=transaction_id,
            loyalty_account_id=account.id,
            customer_id=order.customer_id,
            transaction_type=TransactionType.ACCRUAL,
            points_amount=points_earned,
            reference_entity="ORDER",
            reference_entity_id=order.id,
            rule_id=rule.id,
            expiry_date=expiry_date,
            status=TransactionStatus.POSTED,
            reason=f"Points accrued for order {order.id}",
            created_at=order.order_date
        )
        db.add(txn)
        db.flush()

        # 2. Create PointsLot for FIFO tracking
        lot = PointsLot(
            id=lot_id,
            loyalty_account_id=account.id,
            original_transaction_id=txn.id,
            initial_points=points_earned,
            remaining_points=points_earned,
            earned_at=order.order_date,
            expires_at=expiry_date,
            is_expired=False,
            created_at=order.order_date,
            updated_at=order.order_date
        )
        db.add(lot)

        # 3. Check Tier Progression
        TierService.evaluate_tier(db, account, order.order_date)

        # 4. Audit Log
        audit = AuditLog(
            id=f"AUD-{db.query(AuditLog).count() + 1:06d}",
            entity_name="LoyaltyAccount",
            entity_id=account.id,
            action="ACCRUAL",
            new_values=f"Earned {points_earned} pts, New balance {account.cached_balance}",
            performed_by="AccrualService",
            created_at=order.order_date
        )
        db.add(audit)

        return txn, lot


class RedemptionService:
    @staticmethod
    def redeem_points(
        db: Session,
        customer_id: str,
        reward_id: str,
        idempotency_key: Optional[str] = None,
        custom_redemption_id: Optional[str] = None,
        custom_txn_id: Optional[str] = None,
        timestamp: Optional[datetime] = None
    ) -> Redemption:
        """
        Concurrency-safe redemption using database row-level locking (with_for_update)
        and FIFO lot consumption.
        """
        now = timestamp or utcnow()

        # 1. Check idempotency
        if idempotency_key:
            existing = db.query(Redemption).filter(Redemption.idempotency_key == idempotency_key).first()
            if existing:
                return existing

        reward = db.query(Reward).filter(Reward.id == reward_id).first()
        if not reward or not reward.is_active:
            raise ValueError("Reward not found or inactive.")

        points_needed = reward.points_required

        # 2. Lock account with row-level lock
        account = db.query(LoyaltyAccount).filter(LoyaltyAccount.customer_id == customer_id).with_for_update().first()
        if not account:
            raise ValueError(f"Loyalty account for {customer_id} not found.")

        # 3. Validate Balance
        if account.cached_balance < points_needed:
            # Record failed attempt
            attempt = RedemptionAttempt(
                id=f"RA-{db.query(RedemptionAttempt).count() + 1:06d}",
                customer_id=customer_id,
                reward_id=reward_id,
                points_requested=points_needed,
                available_balance=account.cached_balance,
                success=False,
                failure_reason=f"Insufficient balance. Needed {points_needed}, available {account.cached_balance}",
                attempted_at=now
            )
            db.add(attempt)
            db.commit()
            raise ValueError(f"Insufficient balance. Available: {account.cached_balance}, Required: {points_needed}")

        # 4. Consume Points Lots via FIFO (Earliest expiring first)
        active_lots = db.query(PointsLot).filter(
            PointsLot.loyalty_account_id == account.id,
            PointsLot.remaining_points > 0,
            PointsLot.is_expired == False
        ).order_by(PointsLot.expires_at.asc()).all()

        points_to_consume = points_needed
        for lot in active_lots:
            if points_to_consume <= 0:
                break
            deduct = min(lot.remaining_points, points_to_consume)
            lot.remaining_points -= deduct
            points_to_consume -= deduct
            lot.updated_at = now

        # Update Account
        account.cached_balance -= points_needed
        account.lifetime_points_redeemed += points_needed

        # 5. Create PointsTransaction (Negative signed amount)
        if not custom_txn_id:
            custom_txn_id = get_next_points_transaction_id(db)

        if not custom_redemption_id:
            custom_redemption_id = f"RDM-2026-{db.query(Redemption).count() + 1:06d}"

        txn = PointsTransaction(
            id=custom_txn_id,
            loyalty_account_id=account.id,
            customer_id=customer_id,
            transaction_type=TransactionType.REDEMPTION,
            points_amount=-points_needed,
            reference_entity="REDEMPTION",
            reference_entity_id=custom_redemption_id,
            status=TransactionStatus.POSTED,
            reason=f"Redemption for {reward.name}",
            idempotency_key=idempotency_key,
            created_at=now
        )
        db.add(txn)

        # 6. Create Redemption record
        redemption = Redemption(
            id=custom_redemption_id,
            loyalty_account_id=account.id,
            customer_id=customer_id,
            reward_id=reward_id,
            points_redeemed=points_needed,
            status=RedemptionStatus.SUCCESSFUL,
            idempotency_key=idempotency_key,
            created_at=now,
            updated_at=now
        )
        db.add(redemption)

        # 7. Record successful attempt
        db.flush()
        attempt = RedemptionAttempt(
            id=f"RA-{db.query(RedemptionAttempt).count() + 1:06d}",
            customer_id=customer_id,
            reward_id=reward_id,
            points_requested=points_needed,
            available_balance=account.cached_balance + points_needed,
            success=True,
            attempted_at=now
        )
        db.add(attempt)
        db.flush()

        return redemption


class ExpirationService:
    @staticmethod
    def process_expired_points(
        db: Session,
        cutoff_date: Optional[datetime] = None,
        batch_id: Optional[str] = None
    ) -> ExpiryBatch:
        """
        Expires point lots where expires_at <= cutoff_date and remaining_points > 0.
        Safely creates negative EXPIRATION ledger transactions and updates lot remaining to 0.
        """
        cutoff = cutoff_date or utcnow()
        if not batch_id:
            batch_id = f"EXP-2026-{db.query(ExpiryBatch).count() + 1:06d}"

        # Fetch candidate lots
        expired_lots = db.query(PointsLot).filter(
            PointsLot.expires_at <= cutoff,
            PointsLot.remaining_points > 0,
            PointsLot.is_expired == False
        ).all()

        total_points_expired = 0
        accounts_affected = set()
        txn_counter = 1

        for lot in expired_lots:
            points_expiring = lot.remaining_points
            if points_expiring <= 0:
                continue

            account = db.query(LoyaltyAccount).filter(LoyaltyAccount.id == lot.loyalty_account_id).with_for_update().first()
            if not account:
                continue

            # Update lot
            lot.remaining_points = 0
            lot.is_expired = True
            lot.updated_at = cutoff

            # Update account
            account.cached_balance = max(0, account.cached_balance - points_expiring)
            account.lifetime_points_expired += points_expiring
            accounts_affected.add(account.id)
            total_points_expired += points_expiring

            # Add negative ledger transaction
            txn_id = get_next_points_transaction_id(db, offset=txn_counter)
            txn_counter += 1
            txn = PointsTransaction(
                id=txn_id,
                loyalty_account_id=account.id,
                customer_id=account.customer_id,
                transaction_type=TransactionType.EXPIRATION,
                points_amount=-points_expiring,
                reference_entity="EXPIRY_BATCH",
                reference_entity_id=batch_id,
                original_transaction_id=lot.original_transaction_id,
                status=TransactionStatus.POSTED,
                reason=f"Point lot {lot.id} expired at {lot.expires_at}",
                created_at=cutoff
            )
            db.add(txn)

        batch = ExpiryBatch(
            id=batch_id,
            execution_date=cutoff,
            cutoff_date=cutoff,
            total_accounts_processed=len(accounts_affected),
            total_points_expired=total_points_expired,
            status=ExpiryBatchStatus.COMPLETED,
            created_at=cutoff
        )
        db.add(batch)
        return batch


class ReversalService:
    @staticmethod
    def process_order_return(
        db: Session,
        order_return: OrderReturn,
        custom_txn_id: Optional[str] = None
    ) -> PointsTransaction:
        """
        Reverse proportionally earned points when an order or line is returned.
        Handles negative balance protection or deficit recovery as per policy.
        """
        order = db.query(Order).filter(Order.id == order_return.order_id).first()
        if not order:
            raise ValueError("Order not found.")

        account = db.query(LoyaltyAccount).filter(LoyaltyAccount.customer_id == order.customer_id).with_for_update().first()
        if not account:
            raise ValueError("Account not found.")

        # Find original accrual transaction
        original_txn = db.query(PointsTransaction).filter(
            PointsTransaction.reference_entity == "ORDER",
            PointsTransaction.reference_entity_id == order.id,
            PointsTransaction.transaction_type == TransactionType.ACCRUAL
        ).first()

        # Calculate proportional points to reverse
        if order.eligible_net_spend > 0 and original_txn:
            ratio = min(1.0, order_return.eligible_return_amount / order.eligible_net_spend)
            points_to_reverse = int(round(original_txn.points_amount * ratio))
        else:
            points_to_reverse = 0

        order_return.points_reversed = points_to_reverse

        # Deduct from account spend & points
        account.qualifying_net_spend = max(0.0, account.qualifying_net_spend - order_return.eligible_return_amount)
        # Policy: cached_balance can become negative or stay bounded based on business rule
        account.cached_balance -= points_to_reverse
        account.lifetime_points_reversed += points_to_reverse

        # Deduct points from lot if still available
        if original_txn:
            lot = db.query(PointsLot).filter(PointsLot.original_transaction_id == original_txn.id).first()
            if lot and lot.remaining_points > 0:
                lot.remaining_points = max(0, lot.remaining_points - points_to_reverse)
                lot.updated_at = order_return.return_date

        if not custom_txn_id:
            custom_txn_id = get_next_points_transaction_id(db)

        txn = PointsTransaction(
            id=custom_txn_id,
            loyalty_account_id=account.id,
            customer_id=account.customer_id,
            transaction_type=TransactionType.REVERSAL,
            points_amount=-points_to_reverse,
            reference_entity="RETURN",
            reference_entity_id=order_return.id,
            original_transaction_id=original_txn.id if original_txn else None,
            status=TransactionStatus.POSTED,
            reason=f"Reversal for return {order_return.id} on order {order.id}",
            created_at=order_return.return_date
        )
        db.add(txn)

        # Update order status
        if order_return.return_amount >= order.total_gross_amount:
            order.status = OrderStatus.RETURNED
        else:
            order.status = OrderStatus.PARTIALLY_RETURNED

        # Re-evaluate tier
        TierService.evaluate_tier(db, account, order_return.return_date)

        return txn

class TierService:
    @staticmethod
    def evaluate_tier(db: Session, account: LoyaltyAccount, event_time: Optional[datetime] = None) -> Tier:
        """
        Determines customer tier based on qualifying_net_spend (not gross spend).
        Tiers:
          Bronze: 0 - 9,999
          Silver: 10,000 - 49,999
          Gold: 50,000 - 99,999
          Platinum: 100,000+
        """
        now = event_time or utcnow()
        spend = account.qualifying_net_spend

        # Find matching tier
        all_tiers = db.query(Tier).order_by(Tier.min_spend.desc()).all()
        matched_tier = None
        for t in all_tiers:
            if t.max_spend is not None:
                if t.min_spend <= spend <= t.max_spend:
                    matched_tier = t
                    break
            else:
                if spend >= t.min_spend:
                    matched_tier = t
                    break

        if not matched_tier and all_tiers:
            matched_tier = all_tiers[-1]  # lowest tier

        if matched_tier and matched_tier.id != account.current_tier_id:
            old_tier_id = account.current_tier_id
            account.current_tier_id = matched_tier.id
            account.updated_at = now

            # Record Tier Transition History
            th = TierHistory(
                id=f"TH-{db.query(TierHistory).count() + 1:06d}",
                customer_id=account.customer_id,
                tier_id=matched_tier.id,
                qualifying_net_spend_at_transition=spend,
                transition_date=now,
                reason=f"Qualifying net spend changed to INR {spend:.2f}"
            )
            db.add(th)

        return matched_tier
