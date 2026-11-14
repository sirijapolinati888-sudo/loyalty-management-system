from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.validation_engine import ValidationEngine

router = APIRouter()

@router.get("/report")
def get_validation_report(db: Session = Depends(get_db)):
    validator = ValidationEngine(db)
    results = validator.run_all_validations()
    metrics = validator.evaluate_against_ground_truth(results)
    return {
        "validation_results": results,
        "ground_truth_metrics": metrics
    }

