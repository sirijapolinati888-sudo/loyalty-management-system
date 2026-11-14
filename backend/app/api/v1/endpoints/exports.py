import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter()

@router.get("/download/{folder}/{filename}")
def download_file(folder: str, filename: str):
    allowed_folders = ["master", "transactions", "anomalies", "ground_truth", "exports"]
    if folder not in allowed_folders:
        raise HTTPException(status_code=400, detail="Invalid folder")
    
    # Search in project root/data as well as backend/data
    candidate_paths = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..", "data", folder, filename)),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "data", folder, filename)),
        os.path.abspath(os.path.join(os.getcwd(), "data", folder, filename)),
        os.path.abspath(os.path.join(os.getcwd(), "..", "data", folder, filename)),
    ]
    file_path = next((p for p in candidate_paths if os.path.exists(p)), None)
    if not file_path:
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path, filename=filename)
