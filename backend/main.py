import os
import sys
from pathlib import Path

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Change working directory to backend so relative paths and .env load seamlessly
os.chdir(backend_dir)

if __name__ == "__main__":
    import uvicorn
    print(f"Starting Loyalty Management System Backend from {backend_dir}...")
    print("Swagger docs will be available at: http://localhost:8000/api/v1/docs")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=[str(backend_dir / "app")],
    )
