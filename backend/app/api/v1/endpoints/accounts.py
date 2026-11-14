from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.entities import LoyaltyAccount, PointsLot
from app.schemas.all_schemas import LoyaltyAccountResponse
from app.services.ledger_service import LedgerService

router = APIRouter()

@router.get("", response_model=List[LoyaltyAccountResponse])
def get_accounts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    tier_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(LoyaltyAccount)
    if tier_id:
        q = q.filter(LoyaltyAccount.current_tier_id == tier_id)
    return q.offset(skip).limit(limit).all()

@router.get("/{account_id}", response_model=LoyaltyAccountResponse)
def get_account(account_id: str, db: Session = Depends(get_db)):
    acc = db.query(LoyaltyAccount).filter(LoyaltyAccount.id == account_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")
    return acc

@router.get("/{account_id}/reconciliation")
def reconcile_account(account_id: str, db: Session = Depends(get_db)):
    try:
        return LedgerService.reconcile_account(db, account_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

