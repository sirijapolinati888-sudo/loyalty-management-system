import enum

class UserRole(str, enum.Enum):
    OPERATIONS_MANAGER = "OPERATIONS_MANAGER"
    STORE_OPERATOR = "STORE_OPERATOR"
    ANALYST = "ANALYST"
    CUSTOMER = "CUSTOMER"

class CustomerStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"

class AccountStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    FROZEN = "FROZEN"
    CLOSED = "CLOSED"

class TierLevel(str, enum.Enum):
    BRONZE = "Bronze"
    SILVER = "Silver"
    GOLD = "Gold"
    PLATINUM = "Platinum"

class OrderStatus(str, enum.Enum):
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    RETURNED = "RETURNED"
    PARTIALLY_RETURNED = "PARTIALLY_RETURNED"

class TransactionType(str, enum.Enum):
    ACCRUAL = "ACCRUAL"
    REDEMPTION = "REDEMPTION"
    REVERSAL = "REVERSAL"
    EXPIRATION = "EXPIRATION"
    ADJUSTMENT = "ADJUSTMENT"
    REDEMPTION_REVERSAL = "REDEMPTION_REVERSAL"

class TransactionStatus(str, enum.Enum):
    POSTED = "POSTED"
    PENDING = "PENDING"
    REVERSED = "REVERSED"
    FAILED = "FAILED"

class RedemptionStatus(str, enum.Enum):
    SUCCESSFUL = "SUCCESSFUL"
    FAILED = "FAILED"
    REVERSED = "REVERSED"

class ExpiryBatchStatus(str, enum.Enum):
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class AnomalySeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    WARNING = "WARNING"
    INFO = "INFO"

class AnomalyIssueType(str, enum.Enum):
    BALANCE_MISMATCH = "BALANCE_MISMATCH"
    OVER_REDEMPTION = "OVER_REDEMPTION"
    MISSING_REVERSAL = "MISSING_REVERSAL"
    DOUBLE_EXPIRY = "DOUBLE_EXPIRY"
    INCORRECT_TIER = "INCORRECT_TIER"
