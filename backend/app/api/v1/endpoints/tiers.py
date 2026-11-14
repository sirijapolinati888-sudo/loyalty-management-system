from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.entities import Tier, TierHistory
from app.schemas.all_schemas import TierResponse

router = APIRouter()

@router.get("", response_model=List[TierResponse])
def get_tiers(db: Session = Depends(get_db)):
    return db.query(Tier).order_by(Tier.min_spend.asc()).all()

@router.get("/history")
def get_tier_history(db: Session = Depends(get_db)):
    history = db.query(TierHistory).order_by(TierHistory.transition_date.desc()).limit(100).all()
    return [{
        "id": h.id,
        "customer_id": h.customer_id,
        "tier_id": h.tier_id,
        "spend_at_transition": h.qualifying_net_spend_at_transition,
        "transition_date": h.transition_date,
        "reason": h.reason
    } for h in history]

