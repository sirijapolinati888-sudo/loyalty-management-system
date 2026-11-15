"""
Background job that rebuilds the loyalty dataset from the seeded synthetic generator.

Pipeline: clear loyalty data (users are kept) -> generate -> export CSV/JSON
-> optionally inject the 5 benchmark anomalies -> run detection so the
anomaly_records table and dashboards reflect the new data.
"""
import os
import sys
import threading
import traceback
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.db.session import SessionLocal, Base
from app.models.entities import User, Customer, LoyaltyAccount, Order, PointsTransaction, AnomalyRecord

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
DATA_DIR = os.path.join(PROJECT_ROOT, "data")
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

# Tables that survive a regeneration (demo logins and their sessions)
PRESERVED_TABLES = {"users", "refresh_tokens"}

_lock = threading.Lock()
_state: Dict[str, Any] = {
    "state": "idle",  # idle | running | completed | failed
    "mode": None,
    "inject_anomalies": None,
    "message": "No generation has been run since the server started.",
    "started_at": None,
    "finished_at": None,
    "counts": None,
    "error": None,
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _update(**fields: Any) -> None:
    with _lock:
        _state.update(fields)


def get_status() -> Dict[str, Any]:
    with _lock:
        return dict(_state)


def start(mode: str, inject_anomalies: bool) -> Optional[Dict[str, Any]]:
    """Starts a generation run. Returns None if one is already running."""
    with _lock:
        if _state["state"] == "running":
            return None
        _state.update(
            state="running",
            mode=mode,
            inject_anomalies=inject_anomalies,
            message="Starting…",
            started_at=_now(),
            finished_at=None,
            counts=None,
            error=None,
        )
        snapshot = dict(_state)
    threading.Thread(target=_run, args=(mode, inject_anomalies), daemon=True).start()
    return snapshot


def _clear_loyalty_data() -> Dict[str, str]:
    """Deletes every non-user table. Returns the user -> customer links to restore afterwards."""
    db = SessionLocal()
    try:
        links = {u.id: u.customer_id for u in db.query(User).filter(User.customer_id != None).all()}
        db.query(User).filter(User.customer_id != None).update({User.customer_id: None}, synchronize_session=False)
        for table in reversed(Base.metadata.sorted_tables):
            if table.name not in PRESERVED_TABLES:
                db.execute(table.delete())
        db.commit()
        return links
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def _restore_user_links(links: Dict[str, str]) -> None:
    db = SessionLocal()
    try:
        for user_id, customer_id in links.items():
            if db.query(Customer.id).filter(Customer.id == customer_id).first():
                db.query(User).filter(User.id == user_id).update({User.customer_id: customer_id}, synchronize_session=False)
        db.commit()
    finally:
        db.close()


def _run(mode: str, inject_anomalies: bool) -> None:
    from data_generator.generate_data import SyntheticDataGenerator
    from data_generator.inject_anomalies import inject_anomalies as inject
    from app.services.validation_engine import ValidationEngine

    try:
        _update(message="Clearing existing loyalty data…")
        links = _clear_loyalty_data()

        SyntheticDataGenerator().generate(mode=mode, target_dir=DATA_DIR, progress=lambda m: _update(message=m))
        _restore_user_links(links)

        if inject_anomalies:
            _update(message="Injecting benchmark anomalies…")
            inject(DATA_DIR)

        _update(message="Running anomaly detection & reconciliation…")
        db = SessionLocal()
        try:
            ValidationEngine(db).run_all_validations()
            counts = {
                "customers": db.query(Customer).count(),
                "accounts": db.query(LoyaltyAccount).count(),
                "orders": db.query(Order).count(),
                "transactions": db.query(PointsTransaction).count(),
                "anomalies": db.query(AnomalyRecord).count(),
            }
        finally:
            db.close()

        _update(
            state="completed",
            finished_at=_now(),
            counts=counts,
            message=(
                f"Generated {counts['customers']:,} customers, {counts['orders']:,} orders and "
                f"{counts['transactions']:,} transactions (seed 20261022)."
            ),
        )
    except Exception as exc:
        traceback.print_exc()
        _update(state="failed", finished_at=_now(), error=str(exc), message=f"Generation failed: {exc}")
