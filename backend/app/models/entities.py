from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, 
    Text, Index, CheckConstraint, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.models.enums import (
    UserRole, CustomerStatus, AccountStatus, TierLevel, OrderStatus,
    TransactionType, TransactionStatus, RedemptionStatus,
    ExpiryBatchStatus, AnomalySeverity, AnomalyIssueType
)

def utcnow():
    return datetime.now(timezone.utc)

# 1. Customer Entity
class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(50), primary_key=True)  # CUST-000001
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    status = Column(SQLEnum(CustomerStatus), default=CustomerStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    loyalty_account = relationship("LoyaltyAccount", back_populates="customer", uselist=False, cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")
    tier_history = relationship("TierHistory", back_populates="customer", cascade="all, delete-orphan")


# 2. Tier Entity
class Tier(Base):
    __tablename__ = "tiers"

    id = Column(String(50), primary_key=True)  # TIER-BRONZE, etc.
    name = Column(String(50), unique=True, nullable=False)  # Bronze, Silver, Gold, Platinum
    min_spend = Column(Float, nullable=False)
    max_spend = Column(Float, nullable=True)  # None for Platinum (unbounded)
    multiplier = Column(Float, default=1.0, nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    loyalty_accounts = relationship("LoyaltyAccount", back_populates="tier")
    tier_histories = relationship("TierHistory", back_populates="tier")


# 3. LoyaltyAccount Entity
class LoyaltyAccount(Base):
    __tablename__ = "loyalty_accounts"

    id = Column(String(50), primary_key=True)  # LOY-CUST-000001
    customer_id = Column(String(50), ForeignKey("customers.id"), unique=True, nullable=False, index=True)
    current_tier_id = Column(String(50), ForeignKey("tiers.id"), nullable=False, index=True)
    cached_balance = Column(Integer, default=0, nullable=False)
    lifetime_points_earned = Column(Integer, default=0, nullable=False)
    lifetime_points_redeemed = Column(Integer, default=0, nullable=False)
    lifetime_points_expired = Column(Integer, default=0, nullable=False)
    lifetime_points_reversed = Column(Integer, default=0, nullable=False)
    qualifying_net_spend = Column(Float, default=0.0, nullable=False)
    gross_spend = Column(Float, default=0.0, nullable=False)
    status = Column(SQLEnum(AccountStatus), default=AccountStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    customer = relationship("Customer", back_populates="loyalty_account")
    tier = relationship("Tier", back_populates="loyalty_accounts")
    transactions = relationship("PointsTransaction", back_populates="loyalty_account", cascade="all, delete-orphan")
    points_lots = relationship("PointsLot", back_populates="loyalty_account", cascade="all, delete-orphan")
    redemptions = relationship("Redemption", back_populates="loyalty_account", cascade="all, delete-orphan")


# 4. Rule Entity
class Rule(Base):
    __tablename__ = "rules"

    id = Column(String(50), primary_key=True)  # RULE-ACCRUAL-01
    name = Column(String(100), nullable=False)
    rule_type = Column(String(50), default="ACCRUAL", nullable=False)  # ACCRUAL, EXPIRY, etc.
    spend_threshold = Column(Float, default=100.0, nullable=False)  # Spend required per point
    points_awarded = Column(Integer, default=1, nullable=False)
    expiry_days = Column(Integer, default=365, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    rule_histories = relationship("RuleHistory", back_populates="rule", cascade="all, delete-orphan")


# 5. Order Entity
class Order(Base):
    __tablename__ = "orders"

    id = Column(String(50), primary_key=True)  # ORD-2026-000001
    customer_id = Column(String(50), ForeignKey("customers.id"), nullable=False, index=True)
    total_gross_amount = Column(Float, nullable=False)
    discount_amount = Column(Float, default=0.0, nullable=False)
    net_amount = Column(Float, nullable=False)
    eligible_net_spend = Column(Float, nullable=False)
    points_earned = Column(Integer, default=0, nullable=False)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.COMPLETED, nullable=False)
    order_date = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    customer = relationship("Customer", back_populates="orders")
    order_lines = relationship("OrderLine", back_populates="order", cascade="all, delete-orphan")
    returns = relationship("OrderReturn", back_populates="order", cascade="all, delete-orphan")


# 6. OrderLine Entity
class OrderLine(Base):
    __tablename__ = "order_lines"

    id = Column(String(50), primary_key=True)  # ORDL-2026-000001-01
    order_id = Column(String(50), ForeignKey("orders.id"), nullable=False, index=True)
    product_sku = Column(String(100), nullable=False)
    product_name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Float, nullable=False)
    line_total = Column(Float, nullable=False)
    is_eligible_for_points = Column(Boolean, default=True, nullable=False)

    order = relationship("Order", back_populates="order_lines")


# 7. PointsTransaction Entity (Immutable Ledger)
class PointsTransaction(Base):
    __tablename__ = "points_transactions"

    id = Column(String(50), primary_key=True)  # PTS-2026-00000001
    loyalty_account_id = Column(String(50), ForeignKey("loyalty_accounts.id"), nullable=False, index=True)
    customer_id = Column(String(50), ForeignKey("customers.id"), nullable=False, index=True)
    transaction_type = Column(SQLEnum(TransactionType), nullable=False)
    points_amount = Column(Integer, nullable=False)  # Signed integer
    reference_entity = Column(String(50), nullable=True)  # ORDER, REDEMPTION, RETURN, EXPIRY
    reference_entity_id = Column(String(50), nullable=True, index=True)
    original_transaction_id = Column(String(50), ForeignKey("points_transactions.id"), nullable=True, index=True)
    rule_id = Column(String(50), ForeignKey("rules.id"), nullable=True)
    expiry_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(SQLEnum(TransactionStatus), default=TransactionStatus.POSTED, nullable=False)
    reason = Column(String(255), nullable=True)
    idempotency_key = Column(String(100), unique=True, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)

    loyalty_account = relationship("LoyaltyAccount", back_populates="transactions")
    original_transaction = relationship("PointsTransaction", remote_side=[id])


# 8. Reward Entity
class Reward(Base):
    __tablename__ = "rewards"

    id = Column(String(50), primary_key=True)  # RWD-001
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    points_required = Column(Integer, nullable=False)
    monetary_value = Column(Float, default=0.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    stock_count = Column(Integer, default=-1, nullable=False)  # -1 = unlimited
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    redemptions = relationship("Redemption", back_populates="reward")


# 9. Redemption Entity
class Redemption(Base):
    __tablename__ = "redemptions"

    id = Column(String(50), primary_key=True)  # RDM-2026-000001
    loyalty_account_id = Column(String(50), ForeignKey("loyalty_accounts.id"), nullable=False, index=True)
    customer_id = Column(String(50), ForeignKey("customers.id"), nullable=False, index=True)
    reward_id = Column(String(50), ForeignKey("rewards.id"), nullable=False, index=True)
    points_redeemed = Column(Integer, nullable=False)
    status = Column(SQLEnum(RedemptionStatus), default=RedemptionStatus.SUCCESSFUL, nullable=False)
    failure_reason = Column(String(255), nullable=True)
    idempotency_key = Column(String(100), unique=True, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    loyalty_account = relationship("LoyaltyAccount", back_populates="redemptions")
    reward = relationship("Reward", back_populates="redemptions")


# 10. ExpiryBatch Entity
class ExpiryBatch(Base):
    __tablename__ = "expiry_batches"

    id = Column(String(50), primary_key=True)  # EXP-2026-000001
    execution_date = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    cutoff_date = Column(DateTime(timezone=True), nullable=False)
    total_accounts_processed = Column(Integer, default=0, nullable=False)
    total_points_expired = Column(Integer, default=0, nullable=False)
    status = Column(SQLEnum(ExpiryBatchStatus), default=ExpiryBatchStatus.COMPLETED, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


# --- Supporting Tables ---

# PointsLot (FIFO lot tracking)
class PointsLot(Base):
    __tablename__ = "points_lots"

    id = Column(String(50), primary_key=True)  # LOT-2026-000001
    loyalty_account_id = Column(String(50), ForeignKey("loyalty_accounts.id"), nullable=False, index=True)
    original_transaction_id = Column(String(50), ForeignKey("points_transactions.id"), nullable=False, index=True)
    initial_points = Column(Integer, nullable=False)
    remaining_points = Column(Integer, nullable=False)
    earned_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    is_expired = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    loyalty_account = relationship("LoyaltyAccount", back_populates="points_lots")
    original_transaction = relationship("PointsTransaction")


# OrderReturn
class OrderReturn(Base):
    __tablename__ = "order_returns"

    id = Column(String(50), primary_key=True)  # RET-2026-000001
    order_id = Column(String(50), ForeignKey("orders.id"), nullable=False, index=True)
    return_amount = Column(Float, nullable=False)
    eligible_return_amount = Column(Float, nullable=False)
    points_reversed = Column(Integer, default=0, nullable=False)
    reason = Column(String(255), nullable=True)
    return_date = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    order = relationship("Order", back_populates="returns")
    return_lines = relationship("OrderReturnLine", back_populates="order_return", cascade="all, delete-orphan")


# OrderReturnLine
class OrderReturnLine(Base):
    __tablename__ = "order_return_lines"

    id = Column(String(50), primary_key=True)  # RETL-2026-000001-01
    return_id = Column(String(50), ForeignKey("order_returns.id"), nullable=False, index=True)
    order_line_id = Column(String(50), ForeignKey("order_lines.id"), nullable=False)
    quantity_returned = Column(Integer, default=1, nullable=False)
    refund_amount = Column(Float, nullable=False)

    order_return = relationship("OrderReturn", back_populates="return_lines")
    order_line = relationship("OrderLine")


# TierHistory
class TierHistory(Base):
    __tablename__ = "tier_history"

    id = Column(String(50), primary_key=True)  # TH-000001
    customer_id = Column(String(50), ForeignKey("customers.id"), nullable=False, index=True)
    tier_id = Column(String(50), ForeignKey("tiers.id"), nullable=False)
    qualifying_net_spend_at_transition = Column(Float, nullable=False)
    transition_date = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    reason = Column(String(255), nullable=True)

    customer = relationship("Customer", back_populates="tier_history")
    tier = relationship("Tier", back_populates="tier_histories")


# RuleHistory
class RuleHistory(Base):
    __tablename__ = "rule_history"

    id = Column(String(50), primary_key=True)  # RH-000001
    rule_id = Column(String(50), ForeignKey("rules.id"), nullable=False, index=True)
    spend_threshold = Column(Float, nullable=False)
    points_awarded = Column(Integer, nullable=False)
    expiry_days = Column(Integer, nullable=False)
    effective_from = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    effective_to = Column(DateTime(timezone=True), nullable=True)

    rule = relationship("Rule", back_populates="rule_histories")


# RedemptionAttempt
class RedemptionAttempt(Base):
    __tablename__ = "redemption_attempts"

    id = Column(String(50), primary_key=True)  # RA-000001
    customer_id = Column(String(50), ForeignKey("customers.id"), nullable=False, index=True)
    reward_id = Column(String(50), ForeignKey("rewards.id"), nullable=False)
    points_requested = Column(Integer, nullable=False)
    available_balance = Column(Integer, nullable=False)
    success = Column(Boolean, nullable=False)
    failure_reason = Column(String(255), nullable=True)
    attempted_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


# AuditLog
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(50), primary_key=True)  # AUD-000001
    entity_name = Column(String(50), nullable=False, index=True)
    entity_id = Column(String(50), nullable=False, index=True)
    action = Column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, REVERSE, EXPIRE
    old_values = Column(Text, nullable=True)
    new_values = Column(Text, nullable=True)
    performed_by = Column(String(100), default="SYSTEM", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False, index=True)


# IdempotencyRecord
class IdempotencyRecord(Base):
    __tablename__ = "idempotency_records"

    id = Column(String(100), primary_key=True)  # Unique idempotency key
    action_type = Column(String(50), nullable=False)
    response_code = Column(Integer, nullable=False)
    response_payload = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


# AnomalyRecord
class AnomalyRecord(Base):
    __tablename__ = "anomaly_records"

    id = Column(String(50), primary_key=True)  # ANOM-000001
    anomaly_id = Column(String(50), unique=True, nullable=False, index=True)
    issue_type = Column(SQLEnum(AnomalyIssueType), nullable=False, index=True)
    entity_name = Column(String(50), nullable=False)
    entity_id = Column(String(50), nullable=False, index=True)
    expected_result = Column(String(255), nullable=False)
    actual_result = Column(String(255), nullable=False)
    severity = Column(SQLEnum(AnomalySeverity), default=AnomalySeverity.CRITICAL, nullable=False)
    explanation = Column(Text, nullable=False)
    is_injected = Column(Boolean, default=False, nullable=False)
    is_detected = Column(Boolean, default=False, nullable=False)
    detected_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)


# --- RBAC Entities ---

# User
class User(Base):
    __tablename__ = "users"

    id = Column(String(50), primary_key=True)  # USR-000001
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, index=True)
    customer_id = Column(String(50), ForeignKey("customers.id"), nullable=True, index=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

    customer = relationship("Customer")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


# RefreshToken
class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String(500), primary_key=True)  # JWT refresh token string
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    user = relationship("User", back_populates="refresh_tokens")

