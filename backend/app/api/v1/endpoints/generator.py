from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.auth_deps import require_roles
from app.models.enums import UserRole
from app.services import generation_job

router = APIRouter()

ops_only = require_roles([UserRole.OPERATIONS_MANAGER])


@router.post("/run", status_code=202)
def trigger_generation(
    mode: str = "starter",
    inject_anomalies: bool = Query(True, description="Inject the 5 benchmark anomalies after generating"),
    _user=Depends(ops_only),
):
    """Replaces all loyalty data with a freshly generated dataset (seed 20261022). Runs in the background."""
    if mode not in ["starter", "full"]:
        raise HTTPException(status_code=400, detail="Mode must be 'starter' or 'full'")

    job = generation_job.start(mode, inject_anomalies)
    if job is None:
        raise HTTPException(status_code=409, detail="A generation run is already in progress")
    return job


@router.get("/status")
def generation_status(_user=Depends(ops_only)):
    return generation_job.get_status()
