from fastapi import APIRouter
from app.api.v1.endpoints import (
    health, auth, customers, accounts, orders, transactions,
    redemptions, expiration, tiers, analytics, anomalies,
    generator, validation, exports
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & RBAC"])
api_router.include_router(customers.router, prefix="/customers", tags=["Customers"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["Loyalty Accounts"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["Points Ledger"])
api_router.include_router(redemptions.router, prefix="/redemptions", tags=["Redemptions"])
api_router.include_router(expiration.router, prefix="/expiration", tags=["Expiration Management"])
api_router.include_router(tiers.router, prefix="/tiers", tags=["Membership Tiers"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
api_router.include_router(anomalies.router, prefix="/anomalies", tags=["Anomalies"])
api_router.include_router(generator.router, prefix="/generator", tags=["Data Generator"])
api_router.include_router(validation.router, prefix="/validation", tags=["Validation & Reconciliation"])
api_router.include_router(exports.router, prefix="/exports", tags=["Data Exports"])
