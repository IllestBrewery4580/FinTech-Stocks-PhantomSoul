from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(
        String(320),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash = Column(
        String(255),
        nullable=False,
    )

    # IMPORTANT:
    # The backend controls this value.
    #
    # Public registration creates "client".
    # Employee/admin roles must be assigned through
    # an authorized backend process.
    role = Column(
        String(50),
        nullable=False,
        default="client",
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
    )

    is_email_verified = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    last_login_at = Column(
        DateTime,
        nullable=True,
    )


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    action = Column(
        String(100),
        nullable=False,
    )

    resource = Column(
        String(255),
        nullable=True,
    )

    ip_address = Column(
        String(45),
        nullable=True,
    )

    details = Column(
        Text,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
