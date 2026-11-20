from datetime import datetime, timezone

from sqlalchemy.orm import Session

from backend.app.models.audit_log import AuditLog


def record_audit_event(
    db: Session,
    *,
    actor_type: str,
    actor_id: str,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    details: str | None = None,
) -> None:
    db.add(AuditLog(
        actor_type=actor_type,
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details,
        created_at=datetime.now(timezone.utc),
    ))