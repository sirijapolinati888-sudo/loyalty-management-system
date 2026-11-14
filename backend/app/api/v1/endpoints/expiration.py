from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.entities import ExpiryBatch, PointsLot, User
from app.models.enums import UserRole
from app.schemas.all_schemas import ExpiryBatchResponse, RunExpiryRequest
from app.services.business_logic import ExpirationService
from app.core.auth_deps import get_current_user_optional, require_roles

router = APIRouter()

@router.get("/batches", response_model=List[ExpiryBatchResponse])
def get_expiry_batches(db: Session = Depends(get_db)):
    return db.query(ExpiryBatch).order_by(ExpiryBatch.execution_date.desc()).all()

@router.get("/lots")
def get_points_lots(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    q = db.query(PointsLot)
    # If customer, only show their own point lots
    if current_user and current_user.role == UserRole.CUSTOMER:
        q = q.join(PointsLot.loyalty_account).filter(PointsLot.loyalty_account.has(customer_id=current_user.customer_id))
    lots = q.order_by(PointsLot.expires_at.asc()).limit(100).all()
    return [{
        "id": l.id,
        "account_id": l.loyalty_account_id,
        "initial_points": l.initial_points,
        "remaining_points": l.remaining_points,
        "earned_at": l.earned_at,
        "expires_at": l.expires_at,
        "is_expired": l.is_expired
    } for l in lots]

@router.post("/run", response_model=ExpiryBatchResponse)
def run_expiration(
    req: RunExpiryRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    # Only OPERATIONS_MANAGER can run expiration
    if current_user and current_user.role != UserRole.OPERATIONS_MANAGER:
        raise HTTPException(status_code=403, detail="Forbidden: Only Operations Managers can execute expiration batches.")

    try:
        batch = ExpirationService.process_expired_points(db, cutoff_date=req.cutoff_date)
        db.commit()
        return batch
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
