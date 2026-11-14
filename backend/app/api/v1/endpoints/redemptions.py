from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.entities import Reward, Redemption, User
from app.models.enums import UserRole
from app.schemas.all_schemas import RewardResponse, RedemptionRequest, RedemptionResponse
from app.services.business_logic import RedemptionService
from app.core.auth_deps import get_current_user_optional, require_roles

router = APIRouter()

@router.get("/rewards", response_model=List[RewardResponse])
def get_rewards(db: Session = Depends(get_db)):
    return db.query(Reward).filter(Reward.is_active == True).all()

@router.get("", response_model=List[RedemptionResponse])
def get_redemptions(
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    q = db.query(Redemption)
    if current_user and current_user.role == UserRole.CUSTOMER:
        q = q.filter(Redemption.customer_id == current_user.customer_id)
    return q.order_by(Redemption.created_at.desc()).all()

@router.post("", response_model=RedemptionResponse)
def create_redemption(
    req: RedemptionRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    # Customer data isolation
    if current_user and current_user.role == UserRole.CUSTOMER:
        if current_user.customer_id != req.customer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Customer isolation violation: You can only redeem rewards for your own account."
            )

    try:
        res = RedemptionService.redeem_points(
            db,
            customer_id=req.customer_id,
            reward_id=req.reward_id,
            idempotency_key=req.idempotency_key
        )
        db.commit()
        return res
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
