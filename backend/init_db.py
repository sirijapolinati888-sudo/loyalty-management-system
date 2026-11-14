import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.db.session import engine, Base
import app.models

def create():
    print("Creating all tables in PostgreSQL (yottaflex)...")
    Base.metadata.create_all(bind=engine)
    print("ALL TABLES CREATED SUCCESSFULLY IN POSTGRESQL!")
    print("TABLE COUNT:", len(Base.metadata.tables))
    for t in sorted(Base.metadata.tables.keys()):
        print(" -", t)

if __name__ == "__main__":
    create()
