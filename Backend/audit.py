from sqlalchemy.orm import Session

from models import AuditLog


def record_audit(
    db: Session,
    action: str,
    user_id: int | None = None,
    resource: str | None = None,
    ip_address: str | None = None,
    details: str | None = None,
):
    entry = AuditLog(
        user_id=user_id,
        action=action,
        resource=resource,
        ip_address=ip_address,
        details=details,
    )

    db.add(entry)
    db.commit()

    return entry
