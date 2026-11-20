from typing import Optional
from pydantic import BaseModel
from backend.app.schemas.doctor import DoctorOut
from backend.app.schemas.patient import PatientOut

class DoctorLoginRequest(BaseModel):
    doctor_id: str
    password: str

class AdminLoginRequest(BaseModel):
    email: str
    password: str

class PatientLoginRequest(BaseModel):
    identifier: Optional[str] = None
    patient_id: Optional[str] = None
    phone_number: Optional[str] = None

class AuthResponse(BaseModel):
    status: str = "success"
    role: str  # "doctor" | "patient" | "admin"
    token: str
    doctor: Optional[DoctorOut] = None
    patient: Optional[PatientOut] = None
    admin: Optional[dict] = None
    message: Optional[str] = None
