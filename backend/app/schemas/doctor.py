from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class DoctorBase(BaseModel):
    doctor_id: str
    name: str
    hospital: Optional[str] = "District Hospital Eye Care Centre"
    department: Optional[str] = "Rural Retinal AI Screening Unit"

class DoctorOut(DoctorBase):
    id: int
    dob: str
    email: Optional[str] = None
    phone: Optional[str] = None
    qualification: Optional[str] = None
    medical_registration_number: Optional[str] = None
    medical_council: Optional[str] = None
    hospital_name: Optional[str] = None
    hospital_address: Optional[str] = None
    verification_status: Optional[str] = "VERIFIED"
    verification_notes: Optional[str] = None
    verified_by: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DoctorRegistrationRequest(BaseModel):
    full_name: str
    email: str
    mobile_number: str
    qualification: str
    medical_registration_number: str
    medical_council: str
    hospital_name: str
    hospital_address: str
    password: str
    profile_photo_url: Optional[str] = None
    certificate_url: Optional[str] = None


class DoctorReviewRequest(BaseModel):
    decision: str
    notes: Optional[str] = None


class DoctorStatusResponse(BaseModel):
    doctor_id: str
    verification_status: str
    verification_notes: Optional[str] = None
    name: Optional[str] = None
    medical_registration_number: Optional[str] = None
    medical_council: Optional[str] = None
