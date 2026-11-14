from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.entities import Order, OrderLine, OrderReturn, OrderReturnLine, User
from app.models.enums import UserRole
from app.schemas.all_schemas import OrderResponse, OrderLineResponse, OrderReturnCreate, OrderReturnResponse
from app.services.business_logic import ReversalService
from app.core.auth_deps import get_current_user_optional, require_roles

router = APIRouter()

@router.get("", response_model=List[OrderResponse])
def get_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    customer_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    q = db.query(Order)
    # If customer, isolate strictly to own orders
    if current_user and current_user.role == UserRole.CUSTOMER:
        q = q.filter(Order.customer_id == current_user.customer_id)
    elif customer_id:
        q = q.filter(Order.customer_id == customer_id)

    if status:
        q = q.filter(Order.status == status)
    return q.order_by(Order.order_date.desc()).offset(skip).limit(limit).all()

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    o = db.query(Order).filter(Order.id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user and current_user.role == UserRole.CUSTOMER:
        if o.customer_id != current_user.customer_id:
            raise HTTPException(status_code=403, detail="Customer isolation violation")
    return o

@router.get("/{order_id}/lines", response_model=List[OrderLineResponse])
def get_order_lines(
    order_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    o = db.query(Order).filter(Order.id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    if current_user and current_user.role == UserRole.CUSTOMER:
        if o.customer_id != current_user.customer_id:
            raise HTTPException(status_code=403, detail="Customer isolation violation")
    return db.query(OrderLine).filter(OrderLine.order_id == order_id).all()

@router.post("/returns", response_model=OrderReturnResponse)
def process_order_return(
    req: OrderReturnCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Store/Warehouse Operator and Operations Manager can process returns and trigger reversals."""
    if current_user and current_user.role not in [UserRole.OPERATIONS_MANAGER, UserRole.STORE_OPERATOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only Store Operators and Operations Managers can process returns/reversals."
        )

    order = db.query(Order).filter(Order.id == req.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Calculate return totals
    return_id = f"RET-2026-{db.query(OrderReturn).count() + 1:06d}"
    ret_amount = order.total_gross_amount * 0.5  # default partial 50%
    elig_ret = order.eligible_net_spend * 0.5

    now = datetime.now(timezone.utc)
    order_return = OrderReturn(
        id=return_id,
        order_id=order.id,
        return_amount=ret_amount,
        eligible_return_amount=elig_ret,
        points_reversed=0,
        reason=req.reason or "Customer store return",
        return_date=now,
        created_at=now
    )
    db.add(order_return)
    db.flush()

    try:
        ReversalService.process_order_return(db, order_return)
        db.commit()
        return order_return
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
