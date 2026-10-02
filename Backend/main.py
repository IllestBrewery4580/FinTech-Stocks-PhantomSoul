from datetime import datetime, timezone

from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Request,
    status,
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm

from pydantic import BaseModel, EmailStr

from sqlalchemy.orm import Session

from audit import record_audit
from auth import (
    create_access_token,
    get_current_user,
    hash_password,
    require_roles,
    verify_password,
)

from database import Base, engine, get_db

from models import User


# ==========================================================
# DATABASE INITIALIZATION
# ==========================================================

Base.metadata.create_all(bind=engine)


# ==========================================================
# APPLICATION
# ==========================================================

app = FastAPI(
    title="PhantomSoul API",
    description="Investment Intelligence Operating System",
    version="0.1.0",
)


# ==========================================================
# CORS
# ==========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# REQUEST MODELS
# ==========================================================

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


# ==========================================================
# HEALTH CHECK
# ==========================================================

@app.get("/")
def root():
    return {
        "system": "PHANTOMSOUL",
        "status": "ONLINE",
        "version": "0.1.0",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
    }


# ==========================================================
# REGISTER
# ==========================================================

@app.post("/auth/register")
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):
    email = request.email.lower().strip()

    # ----------------------------------------------
    # Password validation
    # ----------------------------------------------

    if len(request.password) < 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 12 characters.",
        )

    # ----------------------------------------------
    # Existing account
    # ----------------------------------------------

    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # ----------------------------------------------
    # CREATE USER
    # ----------------------------------------------

    user = User(
        email=email,
        password_hash=hash_password(
            request.password
        ),

        # IMPORTANT:
        # The client cannot choose this.
        role="client",

        is_active=True,
        is_email_verified=False,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    # ----------------------------------------------
    # AUDIT
    # ----------------------------------------------

    record_audit(
        db=db,
        action="USER_REGISTERED",
        user_id=user.id,
        resource=f"user:{user.id}",
    )

    return {
        "message": (
            "Account created. "
            "Email verification is required."
        ),
        "user_id": user.id,
    }


# ==========================================================
# LOGIN
# ==========================================================

@app.post("/auth/login")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    email = form_data.username.lower().strip()

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    # ----------------------------------------------
    # Do not reveal whether the email exists.
    # ----------------------------------------------

    if user is None:
        record_audit(
            db=db,
            action="LOGIN_FAILED",
            ip_address=request.client.host
            if request.client
            else None,
            details="Invalid credentials",
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # ----------------------------------------------
    # Password
    # ----------------------------------------------

    if not verify_password(
        form_data.password,
        user.password_hash,
    ):
        record_audit(
            db=db,
            action="LOGIN_FAILED",
            user_id=user.id,
            ip_address=request.client.host
            if request.client
            else None,
            details="Invalid credentials",
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # ----------------------------------------------
    # Account status
    # ----------------------------------------------

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive.",
        )

    # ----------------------------------------------
    # Email verification
    # ----------------------------------------------
    #
    # Temporarily disabled so you can test the system
    # before connecting an email provider.
    #
    # Later:
    #
    # if not user.is_email_verified:
    #     raise HTTPException(...)
    #

    # ----------------------------------------------
    # Update login timestamp
    # ----------------------------------------------

    user.last_login_at = datetime.now(timezone.utc)

    db.commit()

    # ----------------------------------------------
    # Audit
    # ----------------------------------------------

    record_audit(
        db=db,
        action="USER_LOGIN",
        user_id=user.id,
        ip_address=request.client.host
        if request.client
        else None,
    )

    # ----------------------------------------------
    # Token
    # ----------------------------------------------

    access_token = create_access_token(user)

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


# ==========================================================
# CURRENT USER
# ==========================================================

@app.get("/me")
def me(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "is_email_verified": current_user.is_email_verified,
    }


# ==========================================================
# CLIENT AREA
# ==========================================================

@app.get("/client/portfolio")
def client_portfolio(
    current_user: User = Depends(
        require_roles("client")
    ),
):
    return {
        "user": current_user.email,
        "area": "client",
        "message": "Client portfolio endpoint authorized.",
    }


# ==========================================================
# EMPLOYEE AREA
# ==========================================================

@app.get("/employee/internal-research")
def internal_research(
    current_user: User = Depends(
        require_roles(
            "advisor",
            "analyst",
            "compliance",
            "admin",
        )
    ),
):
    return {
        "user": current_user.email,
        "role": current_user.role,
        "area": "internal-research",
        "message": "Internal research endpoint authorized.",
    }


# ==========================================================
# ADMIN / COMPLIANCE AUDIT AREA
# ==========================================================

@app.get("/admin/audit-log")
def audit_log(
    current_user: User = Depends(
        require_roles(
            "compliance",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):
    from models import AuditLog

    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(100)
        .all()
    )

    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "resource": log.resource,
            "ip_address": log.ip_address,
            "details": log.details,
            "created_at": log.created_at,
        }
        for log in logs
    ]
