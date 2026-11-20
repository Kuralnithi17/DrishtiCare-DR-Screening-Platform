from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    admin_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    doctor_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    dob = Column(String(20), nullable=False)  # Legacy/backup password storage used during compatibility
    email = Column(String(100), nullable=True)
    phone = Column(String(30), nullable=True)
    qualification = Column(String(200), nullable=True)
    medical_registration_number = Column(String(100), nullable=True)
    medical_council = Column(String(200), nullable=True)
    hospital_name = Column(String(200), nullable=True, default="District Hospital Eye Care Centre")
    hospital_address = Column(Text, nullable=True)
    hospital = Column(String(200), nullable=True, default="District Hospital Eye Care Centre")
    department = Column(String(100), nullable=True, default="Rural Retinal AI Screening Unit")
    certificate_path = Column(String(255), nullable=True)
    profile_photo_path = Column(String(255), nullable=True)
    verification_status = Column(String(30), nullable=False, default="PENDING")
    verification_notes = Column(Text, nullable=True)
    verified_by = Column(String(100), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    password_hash = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    patients = relationship("Patient", back_populates="doctor")
    screenings = relationship("Screening", back_populates="doctor")
