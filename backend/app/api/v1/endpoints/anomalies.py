from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.entities import AnomalyRecord
from app.schemas.all_schemas import AnomalyRecordResponse

router = APIRouter()

@router.get("", response_model=List[AnomalyRecordResponse])
def get_anomalies(
    severity: Optional[str] = None,
    issue_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(AnomalyRecord)
    if severity:
        q = q.filter(AnomalyRecord.severity == severity)
    if issue_type:
        q = q.filter(AnomalyRecord.issue_type == issue_type)
    return q.all()

