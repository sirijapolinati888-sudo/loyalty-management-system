import os
import sys
import hashlib
import json
import shutil
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.db.session import Base
from data_generator.generate_data import SyntheticDataGenerator

SEED = 20261022

def compute_dir_hashes(directory: str):
    hashes = {}
    for root, _, files in os.walk(directory):
        for f in sorted(files):
            if f.endswith('.csv') or f.endswith('.json'):
                path = os.path.join(root, f)
                with open(path, 'rb') as fp:
                    hashes[f] = hashlib.sha256(fp.read()).hexdigest()
    return hashes

def test_reproducibility():
    print(f"=== Testing Dataset Reproducibility (Seed: {SEED}) ===")
    dir1 = "data/run1"
    dir2 = "data/run2"

    os.makedirs(dir1, exist_ok=True)
    os.makedirs(dir2, exist_ok=True)

    # Use isolated SQLite engines to ensure runs don't conflict with existing PG data
    db1_path = "run1_temp.db"
    db2_path = "run2_temp.db"
    if os.path.exists(db1_path): os.remove(db1_path)
    if os.path.exists(db2_path): os.remove(db2_path)

    engine1 = create_engine(f"sqlite:///{db1_path}")
    engine2 = create_engine(f"sqlite:///{db2_path}")

    Base.metadata.create_all(bind=engine1)
    Base.metadata.create_all(bind=engine2)

    Session1 = sessionmaker(bind=engine1)
    Session2 = sessionmaker(bind=engine2)

    # Run 1
    print("Executing Run 1...")
    gen1 = SyntheticDataGenerator(seed=SEED)
    import data_generator.generate_data as gd
    gd.SessionLocal = Session1
    gen1.generate(mode="starter", target_dir=dir1)

    # Run 2
    print("Executing Run 2...")
    gen2 = SyntheticDataGenerator(seed=SEED)
    gd.SessionLocal = Session2
    gen2.generate(mode="starter", target_dir=dir2)

    h1 = compute_dir_hashes(dir1)
    h2 = compute_dir_hashes(dir2)

    print("\nComparing SHA-256 Checksums across both runs:")
    all_matched = True
    for f in sorted(h1.keys()):
        hash1 = h1[f]
        hash2 = h2.get(f)
        match = (hash1 == hash2)
        print(f" - {f}: {'MATCH (100% Deterministic)' if match else 'MISMATCH'}")
        if not match:
            all_matched = False

    # Dispose engines before deleting files
    engine1.dispose()
    engine2.dispose()

    # Cleanup temp test files
    shutil.rmtree(dir1, ignore_errors=True)
    shutil.rmtree(dir2, ignore_errors=True)
    try:
        if os.path.exists(db1_path): os.remove(db1_path)
        if os.path.exists(db2_path): os.remove(db2_path)
    except Exception:
        pass

    print(f"\nReproducibility Verification: {'PASSED (100% Deterministic Bit-For-Bit Match)' if all_matched else 'FAILED'}")
    return all_matched

if __name__ == "__main__":
    test_reproducibility()
