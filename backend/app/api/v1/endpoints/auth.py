import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.entities import User, RefreshToken, Customer
from app.models.enums import UserRole
from app.core.security import verify_password, hash_password, create_access_token, create_refresh_token, decode_token
from app.core.auth_deps import get_current_user

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    customer_id: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    req_email = req.email.strip().lower()
    user = db.query(User).filter(User.email == req_email).first()

    # If user not found in User table, check if it matches a generated synthetic Customer record
    if not user:
        cust = db.query(Customer).filter(Customer.email == req_email).first()
        if cust and req.password == "Password123!":
            # Auto-provision a Customer role User session for this customer
            user = User(
                id=f"USR-{cust.id}",
                email=cust.email,
                hashed_password=hash_password("Password123!"),
                full_name=f"{cust.first_name} {cust.last_name}",
                role=UserRole.CUSTOMER,
                customer_id=cust.id,
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account suspended")

    token_payload = {
        "sub": user.id,
        "email": user.email,
        "role": user.role.value,
        "customer_id": user.customer_id
    }
    access_token = create_access_token(token_payload)
    refresh_token_str = create_refresh_token(token_payload)

    # Persist refresh token session
    db_refresh = RefreshToken(
        id=refresh_token_str,
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        is_revoked=False
    )
    db.add(db_refresh)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token_str,
        "token_type": "bearer",
        "user": user
    }

@router.post("/refresh", response_model=AuthResponse)
def refresh_session(req: RefreshRequest, db: Session = Depends(get_db)):
    token_rec = db.query(RefreshToken).filter(
        RefreshToken.id == req.refresh_token,
        RefreshToken.is_revoked == False
    ).first()
    if not token_rec or token_rec.expires_at <= datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    user = db.query(User).filter(User.id == token_rec.user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    # Rotate refresh token: revoke current, issue new
    token_rec.is_revoked = True

    token_payload = {
        "sub": user.id,
        "email": user.email,
        "role": user.role.value,
        "customer_id": user.customer_id
    }
    new_access = create_access_token(token_payload)
    new_refresh = create_refresh_token(token_payload)

    new_db_token = RefreshToken(
        id=new_refresh,
        user_id=user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        is_revoked=False
    )
    db.add(new_db_token)
    db.commit()

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer",
        "user": user
    }

@router.post("/logout")
def logout(req: Optional[RefreshRequest] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if req and req.refresh_token:
        token_rec = db.query(RefreshToken).filter(RefreshToken.id == req.refresh_token).first()
        if token_rec:
            token_rec.is_revoked = True
            db.commit()
    else:
        # Revoke all active sessions for this user
        db.query(RefreshToken).filter(RefreshToken.user_id == current_user.id).update({"is_revoked": True})
        db.commit()

    return {"status": "success", "message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

