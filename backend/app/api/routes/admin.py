import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import case, func
from sqlalchemy.orm import Session, joinedload, selectinload

from backend.app.api.deps import get_current_admin, get_db_session
from backend.app.core.auth import hash_password
from backend.app.models.audit_log import AuditLog
from backend.app.models.doctor import Admin, Doctor
from backend.app.models.patient import Patient
from backend.app.models.screening import Screening
from backend.app.schemas.doctor import DoctorOut, DoctorRegistrationRequest, DoctorReviewRequest, DoctorStatusResponse
from backend.app.services.audit_service import record_audit_event

router = APIRouter()


@router.post("/doctors/register", response_model=DoctorOut)
def register_doctor(req: DoctorRegistrationRequest, db: Session = Depends(get_db_session)):
    if not req.full_name.strip() or not req.email.strip() or not req.password.strip():
        raise HTTPException(status_code=400, detail="Full name, email, and password are required.")

    if db.query(Doctor).filter(func.lower(Doctor.email) == req.email.strip().lower()).first():
        raise HTTPException(status_code=409, detail="A doctor account with that email is already registered.")

    candidate_number = (req.medical_registration_number or "").strip()
    if candidate_number:
        duplicate = db.query(Doctor).filter(
            func.lower(Doctor.medical_registration_number) == candidate_number.lower()
        ).first()
        if duplicate:
            raise HTTPException(status_code=409, detail="That medical registration number is already associated with another doctor.")

    doctor_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
    doctor = Doctor(
        doctor_id=doctor_id,
        name=req.full_name.strip(),
        dob="00000000",
        email=req.email.strip().lower(),
        phone=(req.mobile_number or "").strip(),
        qualification=(req.qualification or "").strip(),
        medical_registration_number=candidate_number,
        medical_council=(req.medical_council or "").strip(),
        hospital_name=(req.hospital_name or "").strip(),
        hospital_address=(req.hospital_address or "").strip(),
        hospital=(req.hospital_name or "").strip(),
        department="Clinical Verification Pending",
        certificate_path=req.certificate_url or "",
        profile_photo_path=req.profile_photo_url or "",
        verification_status="PENDING",
        verification_notes="Awaiting admin verification against medical council records and submitted documents.",
        password_hash=hash_password(req.password),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(doctor)
    record_audit_event(
        db,
        actor_type="doctor_applicant",
        actor_id=doctor.doctor_id,
        action="doctor.registration_submitted",
        entity_type="doctor",
        entity_id=doctor.doctor_id,
    )
    db.commit()
    db.refresh(doctor)
    return DoctorOut.model_validate(doctor)


@router.get("/doctors/status/{doctor_id}", response_model=DoctorStatusResponse)
def get_doctor_verification_status(doctor_id: str, db: Session = Depends(get_db_session)):
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")
    return DoctorStatusResponse(
        doctor_id=doctor.doctor_id,
        verification_status=doctor.verification_status,
        verification_notes=doctor.verification_notes,
        name=doctor.name,
        medical_registration_number=doctor.medical_registration_number,
        medical_council=doctor.medical_council,
    )


@router.get("/admin/doctors", response_model=List[DoctorOut])
def list_all_doctors(db: Session = Depends(get_db_session), admin: Admin = Depends(get_current_admin)):
    doctors = db.query(Doctor).order_by(Doctor.created_at.desc()).all()
    return [DoctorOut.model_validate(doc) for doc in doctors]


@router.get("/admin/doctors/pending", response_model=List[DoctorOut])
def list_pending_doctors(db: Session = Depends(get_db_session), admin: Admin = Depends(get_current_admin)):
    doctors = db.query(Doctor).filter(Doctor.verification_status == "PENDING").order_by(Doctor.created_at.desc()).all()
    return [DoctorOut.model_validate(doc) for doc in doctors]


@router.get("/admin/doctors/{doctor_id}", response_model=DoctorOut)
def get_doctor_application(doctor_id: str, db: Session = Depends(get_db_session), admin: Admin = Depends(get_current_admin)):
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")
    return DoctorOut.model_validate(doctor)


@router.post("/admin/doctors/{doctor_id}/verify", response_model=DoctorOut)
def review_doctor_application(
    doctor_id: str,
    req: DoctorReviewRequest,
    db: Session = Depends(get_db_session),
    admin: Admin = Depends(get_current_admin),
):
    doctor = db.query(Doctor).filter(Doctor.doctor_id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found.")

    decision = (req.decision or "").strip().lower()
    if decision not in {"approve", "reject", "suspend"}:
        raise HTTPException(status_code=400, detail="Decision must be approve, reject, or suspend.")

    if decision == "approve":
        doctor.verification_status = "VERIFIED"
        doctor.verified_by = admin.name
        doctor.verified_at = datetime.now(timezone.utc)
    elif decision == "reject":
        doctor.verification_status = "REJECTED"
        doctor.verified_by = admin.name
        doctor.verified_at = datetime.now(timezone.utc)
    else:
        doctor.verification_status = "SUSPENDED"
        doctor.verified_by = admin.name
        doctor.verified_at = datetime.now(timezone.utc)

    doctor.verification_notes = req.notes or (
        "Approved after verification against professional registration records."
        if decision == "approve"
        else "Application rejected after review of credentials and registration records."
        if decision == "reject"
        else "Doctor account suspended by admin."
    )

    record_audit_event(
        db,
        actor_type="admin",
        actor_id=admin.email,
        action=f"doctor.{decision}",
        entity_type="doctor",
        entity_id=doctor.doctor_id,
        details=f"Verification status changed to {doctor.verification_status}.",
    )
    db.commit()
    db.refresh(doctor)
    return DoctorOut.model_validate(doctor)


@router.get("/admin/summary")
def admin_summary(db: Session = Depends(get_db_session), admin: Admin = Depends(get_current_admin)):
    total = db.query(Doctor).count()
    pending = db.query(Doctor).filter(Doctor.verification_status == "PENDING").count()
    verified = db.query(Doctor).filter(Doctor.verification_status == "VERIFIED").count()
    rejected = db.query(Doctor).filter(Doctor.verification_status == "REJECTED").count()
    suspended = db.query(Doctor).filter(Doctor.verification_status == "SUSPENDED").count()

    return {
        "total_doctors": total,
        "pending_requests": pending,
        "verified_doctors": verified,
        "rejected_applications": rejected,
        "suspended_doctors": suspended,
        "incomplete_doctors": total - pending - verified - rejected - suspended,
        "total_patients": db.query(Patient).count(),
        "total_screenings": db.query(Screening).count(),
        "referrals": db.query(Screening).filter(Screening.predicted_class_id >= 2).count(),
    }


@router.get("/admin/patients")
def list_admin_patients(db: Session = Depends(get_db_session), admin: Admin = Depends(get_current_admin)):
    patients = db.query(Patient).options(
        joinedload(Patient.doctor),
        selectinload(Patient.screenings),
    ).order_by(Patient.created_at.desc()).all()
    results = []
    for patient in patients:
        latest = max(patient.screenings, key=lambda screening: screening.created_at, default=None)
        class_id = latest.predicted_class_id if latest else 0
        results.append({
            "patient_id": patient.patient_id,
            "name": f"{patient.first_name} {patient.last_name}".strip(),
            "age": patient.age,
            "gender": patient.gender,
            "contact_number": patient.contact_number,
            "doctor_id": patient.doctor_id,
            "doctor_name": patient.doctor.name if patient.doctor else None,
            "screenings_count": len(patient.screenings),
            "latest_screening_id": latest.screening_id if latest else None,
            "latest_screening_date": latest.created_at.isoformat() if latest else None,
            "latest_result": latest.predicted_class_name if latest else None,
            "latest_risk_level": "high" if class_id >= 3 else "medium" if class_id == 2 else "low" if class_id == 1 else "normal",
            "latest_review_status": latest.review_status if latest else None,
        })
    return results


@router.get("/admin/screenings")
def list_admin_screenings(
    limit: int = Query(500, ge=1, le=2000),
    db: Session = Depends(get_db_session),
    admin: Admin = Depends(get_current_admin),
):
    screenings = db.query(Screening).options(
        joinedload(Screening.patient),
        joinedload(Screening.doctor),
    ).order_by(Screening.created_at.desc()).limit(limit).all()
    results = []
    for screening in screenings:
        quality = (screening.raw_ai_output or {}).get("quality_assessment") or {}
        patient_name = " ".join(filter(None, [screening.patient.first_name, screening.patient.last_name])) if screening.patient else "Unknown patient"
        results.append({
            "screening_id": screening.screening_id,
            "patient_id": screening.patient_id,
            "patient_name": patient_name,
            "doctor_id": screening.doctor_id,
            "doctor_name": screening.doctor.name if screening.doctor else None,
            "hospital": (screening.doctor.hospital_name or screening.doctor.hospital) if screening.doctor else "Unassigned",
            "created_at": screening.created_at.isoformat(),
            "status": screening.status,
            "result": screening.predicted_class_name,
            "confidence_percent": screening.confidence_percent,
            "quality_score": quality.get("overall_score"),
            "quality_decision": quality.get("decision") or ("Poor" if screening.status == "rejected" else "Not recorded"),
            "review_status": screening.review_status,
        })
    return results


@router.get("/admin/analytics")
def admin_analytics(db: Session = Depends(get_db_session), admin: Admin = Depends(get_current_admin)):
    stage_rows = db.query(
        Screening.predicted_class_name,
        func.count(Screening.id),
    ).filter(Screening.predicted_class_id >= 0).group_by(Screening.predicted_class_name).all()

    month_expression = func.strftime("%Y-%m", Screening.created_at) if db.bind.dialect.name == "sqlite" else func.to_char(Screening.created_at, "YYYY-MM")
    month_rows = db.query(
        month_expression.label("month"),
        func.count(Screening.id),
    ).group_by(month_expression).order_by(month_expression).all()

    hospital_expression = func.coalesce(Doctor.hospital_name, Doctor.hospital, "Unassigned")
    referral_count = func.sum(case((Screening.predicted_class_id >= 2, 1), else_=0))
    hospital_rows = db.query(
        hospital_expression.label("hospital"),
        func.count(Screening.id),
        referral_count,
    ).outerjoin(Doctor, Screening.doctor_id == Doctor.doctor_id).group_by(hospital_expression).order_by(func.count(Screening.id).desc()).all()

    return {
        "stage_distribution": [{"stage": stage or "Unclassified", "count": count} for stage, count in stage_rows],
        "monthly_trends": [{"month": month, "count": count} for month, count in month_rows if month],
        "hospital_statistics": [
            {"hospital": hospital, "screenings": count, "referrals": int(referrals or 0)}
            for hospital, count, referrals in hospital_rows
        ],
    }


@router.get("/admin/audit-logs")
def list_admin_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db_session),
    admin: Admin = Depends(get_current_admin),
):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [{
        "id": log.id,
        "actor_type": log.actor_type,
        "actor_id": log.actor_id,
        "action": log.action,
        "entity_type": log.entity_type,
        "entity_id": log.entity_id,
        "details": log.details,
        "created_at": log.created_at.isoformat(),
    } for log in logs]
