from fastapi import Depends, HTTPException, status

from auth import get_current_user
from models import User


def require_roles(*allowed_roles):
    """
    Require the authenticated user to have one of the
    specified roles.

    Example:

        current_user = Depends(
            require_roles("admin", "compliance")
        )
    """

    def role_checker(
        current_user: User = Depends(get_current_user),
    ):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource.",
            )

        return current_user

    return role_checker


# ==========================================================
# CLIENT PERMISSIONS
# ==========================================================

def require_client(
    current_user: User = Depends(
        require_roles("client")
    ),
):
    return current_user


# ==========================================================
# EMPLOYEE PERMISSIONS
# ==========================================================

def require_employee(
    current_user: User = Depends(
        require_roles(
            "advisor",
            "analyst",
            "compliance",
            "admin",
        )
    ),
):
    return current_user


# ==========================================================
# ADVISOR PERMISSIONS
# ==========================================================

def require_advisor(
    current_user: User = Depends(
        require_roles(
            "advisor",
            "admin",
        )
    ),
):
    return current_user


# ==========================================================
# ANALYST PERMISSIONS
# ==========================================================

def require_analyst(
    current_user: User = Depends(
        require_roles(
            "analyst",
            "advisor",
            "admin",
        )
    ),
):
    return current_user


# ==========================================================
# COMPLIANCE PERMISSIONS
# ==========================================================

def require_compliance(
    current_user: User = Depends(
        require_roles(
            "compliance",
            "admin",
        )
    ),
):
    return current_user


# ==========================================================
# ADMIN PERMISSIONS
# ==========================================================

def require_admin(
    current_user: User = Depends(
        require_roles("admin")
    ),
):
    return current_user 