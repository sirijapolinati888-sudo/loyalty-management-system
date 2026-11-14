from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.enums import (
    CustomerStatus, AccountStatus, TierLevel, OrderStatus,
    TransactionType, TransactionStatus, RedemptionStatus,
    AnomalySeverity, AnomalyIssueType
)

# --- Customer ---
class CustomerBase(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    status: CustomerStatus = CustomerStatus.ACTIVE

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# --- Tier ---
class TierBase(BaseModel):
    name: str
    min_spend: float
    max_spend: Optional[float] = None
    multiplier: float = 1.0
    description: Optional[str] = None

class TierCreate(TierBase):
    id: str

class TierResponse(TierBase):
    id: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# --- LoyaltyAccount ---
class LoyaltyAccountResponse(BaseModel):
    id: str
    customer_id: str
    current_tier_id: str
    cached_balance: int
    lifetime_points_earned: int
    lifetime_points_redeemed: int
    lifetime_points_expired: int
    lifetime_points_reversed: int
    qualifying_net_spend: float
    gross_spend: float
    status: AccountStatus
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# --- Rule ---
class RuleBase(BaseModel):
    name: str
    rule_type: str = "ACCRUAL"
    spend_threshold: float = 100.0
    points_awarded: int = 1
    expiry_days: int = 365
    is_active: bool = True
    description: Optional[str] = None

class RuleCreate(RuleBase):
    id: str

class RuleResponse(RuleBase):
    id: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

# --- Order & OrderLine ---
class OrderLineCreate(BaseModel):
    product_sku: str
    product_name: str
    category: str
    quantity: int = 1
    unit_price: float
    is_eligible_for_points: bool = True

class OrderLineResponse(OrderLineCreate):
    id: str
    order_id: str
    line_total: float
    class Config:
        from_attributes = True

class OrderCreate(BaseModel):
    customer_id: str
    total_gross_amount: float
    discount_amount: float = 0.0
    order_lines: List[OrderLineCreate] = []

class OrderResponse(BaseModel):
    id: str
    customer_id: str
    total_gross_amount: float
    discount_amount: float
    net_amount: float
    eligible_net_spend: float
    points_earned: int
    status: OrderStatus
    order_date: datetime
    class Config:
        from_attributes = True

# --- Order Return ---
class OrderReturnLineItem(BaseModel):
    order_line_id: str
    quantity_returned: int

class OrderReturnCreate(BaseModel):
    order_id: str
    reason: Optional[str] = "Customer return"
    return_lines: List[OrderReturnLineItem] = []

class OrderReturnResponse(BaseModel):
    id: str
    order_id: str
    return_amount: float
    eligible_return_amount: float
    points_reversed: int
    reason: Optional[str]
    return_date: datetime
    class Config:
        from_attributes = True

# --- PointsTransaction ---
class PointsTransactionResponse(BaseModel):
    id: str
    loyalty_account_id: str
    customer_id: str
    transaction_type: TransactionType
    points_amount: int
    reference_entity: Optional[str]
    reference_entity_id: Optional[str]
    original_transaction_id: Optional[str]
    rule_id: Optional[str]
    expiry_date: Optional[datetime]
    status: TransactionStatus
    reason: Optional[str]
    idempotency_key: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

# --- Reward & Redemption ---
class RewardCreate(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    points_required: int
    monetary_value: float = 0.0
    stock_count: int = -1

class RewardResponse(RewardCreate):
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True

class RedemptionRequest(BaseModel):
    customer_id: str
    reward_id: str
    idempotency_key: Optional[str] = None

class RedemptionResponse(BaseModel):
    id: str
    loyalty_account_id: str
    customer_id: str
    reward_id: str
    points_redeemed: int
    status: RedemptionStatus
    failure_reason: Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

# --- Expiry ---
class RunExpiryRequest(BaseModel):
    cutoff_date: Optional[datetime] = None

class ExpiryBatchResponse(BaseModel):
    id: str
    execution_date: datetime
    cutoff_date: datetime
    total_accounts_processed: int
    total_points_expired: int
    status: str
    class Config:
        from_attributes = True

# --- Anomalies & Validation ---
class AnomalyRecordResponse(BaseModel):
    id: str
    anomaly_id: str
    issue_type: AnomalyIssueType
    entity_name: str
    entity_id: str
    expected_result: str
    actual_result: str
    severity: AnomalySeverity
    explanation: str
    is_injected: bool
    is_detected: bool
    detected_at: Optional[datetime]
    class Config:
        from_attributes = True

