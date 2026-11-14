from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.models.entities import Customer, LoyaltyAccount, Order, PointsTransaction, User
from app.models.enums import UserRole
from app.schemas.all_schemas import CustomerResponse, LoyaltyAccountResponse, OrderResponse, PointsTransactionResponse
from app.core.auth_deps import get_current_user_optional, require_roles

router = APIRouter()

def verify_customer_access(customer_id: str, current_user: Optional[User]):
    """If user is a CUSTOMER, strictly ensure they only access their own customer_id."""
    if current_user and current_user.role == UserRole.CUSTOMER:
        if current_user.customer_id != customer_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Customer data isolation violation: You cannot access other customers' records."
            )

@router.get("", response_model=List[CustomerResponse])
def get_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    # If customer role, only return self
    if current_user and current_user.role == UserRole.CUSTOMER:
        c = db.query(Customer).filter(Customer.id == current_user.customer_id).first()
        return [c] if c else []

    query = db.query(Customer)
    if search:
        search_f = f"%{search}%"
        query = query.filter((Customer.first_name.ilike(search_f)) | (Customer.last_name.ilike(search_f)) | (Customer.email.ilike(search_f)) | (Customer.id.ilike(search_f)))
    return query.offset(skip).limit(limit).all()

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    verify_customer_access(customer_id, current_user)
    c = db.query(Customer).filter(Customer.id == customer_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    return c

@router.get("/{customer_id}/account", response_model=LoyaltyAccountResponse)
def get_customer_account(
    customer_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    verify_customer_access(customer_id, current_user)
    acc = db.query(LoyaltyAccount).filter(LoyaltyAccount.customer_id == customer_id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Loyalty account not found")
    return acc

@router.get("/{customer_id}/orders", response_model=List[OrderResponse])
def get_customer_orders(
    customer_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    verify_customer_access(customer_id, current_user)
    return db.query(Order).filter(Order.customer_id == customer_id).order_by(Order.order_date.desc()).all()

@router.get("/{customer_id}/transactions", response_model=List[PointsTransactionResponse])
def get_customer_transactions(
    customer_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    verify_customer_access(customer_id, current_user)
    return db.query(PointsTransaction).filter(PointsTransaction.customer_id == customer_id).order_by(PointsTransaction.created_at.desc()).all()
