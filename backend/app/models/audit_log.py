from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Integer, String, Text

from backend.app.core.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    actor_type = Column(String(30), nullable=False)
    actor_id = Column(String(150), nullable=False)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False, index=True)