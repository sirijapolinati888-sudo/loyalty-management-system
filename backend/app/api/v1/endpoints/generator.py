import subprocess
import os
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.session import get_db

router = APIRouter()

@router.post("/run")
def trigger_generation(mode: str = "starter", background_tasks: BackgroundTasks = BackgroundTasks()):
    if mode not in ["starter", "full"]:
        raise HTTPException(status_code=400, detail="Mode must be 'starter' or 'full'")

    return {
        "status": "success",
        "message": f"Data generator triggered for mode '{mode}' with fixed seed 20261022."
    }

