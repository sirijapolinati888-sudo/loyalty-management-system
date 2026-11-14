from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.entities import PointsTransaction, User
from app.models.enums import UserRole
from app.schemas.all_schemas import PointsTransactionResponse
from app.core.auth_deps import get_current_user_optional

router = APIRouter()

@router.get("", response_model=List[PointsTransactionResponse])
def get_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    customer_id: Optional[str] = None,
    account_id: Optional[str] = None,
    txn_type: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    q = db.query(PointsTransaction)
    # If customer, isolate strictly to own transactions
    if current_user and current_user.role == UserRole.CUSTOMER:
        q = q.filter(PointsTransaction.customer_id == current_user.customer_id)
    elif customer_id:
        q = q.filter(PointsTransaction.customer_id == customer_id)

    if account_id:
        q = q.filter(PointsTransaction.loyalty_account_id == account_id)
    if txn_type:
        q = q.filter(PointsTransaction.transaction_type == txn_type)
    return q.order_by(PointsTransaction.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/{transaction_id}", response_model=PointsTransactionResponse)
def get_transaction(
    transaction_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    t = db.query(PointsTransaction).filter(PointsTransaction.id == transaction_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if current_user and current_user.role == UserRole.CUSTOMER:
        if t.customer_id != current_user.customer_id:
            raise HTTPException(status_code=403, detail="Customer isolation violation")
    return t
