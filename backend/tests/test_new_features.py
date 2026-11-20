import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import init_db

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    init_db()

def test_get_available_doctors():
    res = client.get("/api/v1/patient/doctors")
    assert res.status_code == 200
    doctors = res.json()
    assert isinstance(doctors, list)
    assert len(doctors) >= 5
    doc_ids = [d["doctor_id"] for d in doctors]
    assert "DOC-ANITA" in doc_ids
    assert "DOC-RAJESH" in doc_ids
    assert all(doctor["verification_status"] == "VERIFIED" for doctor in doctors)

def test_patient_appointment_booking_and_data_isolation():
    # Login patient PT-8924
    patient_headers = {"X-Patient-Id": "PT-8924"}
    
    # Book consultation with Dr. Anita
    booking_payload = {
        "doctor_id": "DOC-ANITA",
        "appointment_date": "2026-09-15",
        "appointment_time": "10:30 AM",
        "reason": "Moderate DR consultation and retinal follow-up"
    }
    res = client.post("/api/v1/patient/appointments", json=booking_payload, headers=patient_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["doctor_id"] == "DOC-ANITA"
    assert data["patient_id"] == "PT-8924"
    assert data["appointment_date"] == "2026-09-15"
    assert data["status"] == "Confirmed"
    
    # Get patient appointments
    get_res = client.get("/api/v1/patient/appointments", headers=patient_headers)
    assert get_res.status_code == 200
    appts = get_res.json()
    assert any(a["appointment_id"] == data["appointment_id"] for a in appts)

    # Doctor DOC-ANITA should see this appointment
    doc_anita_headers = {"X-Doctor-Id": "DOC-ANITA"}
    doc_res = client.get("/api/v1/doctor/appointments", headers=doc_anita_headers)
    assert doc_res.status_code == 200
    doc_appts = doc_res.json()
    assert any(a["appointment_id"] == data["appointment_id"] for a in doc_appts)

    # Doctor DOC-RAJESH should NOT see DOC-ANITA's appointment (Data Isolation)
    doc_rajesh_headers = {"X-Doctor-Id": "DOC-RAJESH"}
    rajesh_res = client.get("/api/v1/doctor/appointments", headers=doc_rajesh_headers)
    assert rajesh_res.status_code == 200
    rajesh_appts = rajesh_res.json()
    assert not any(a["appointment_id"] == data["appointment_id"] for a in rajesh_appts)

def test_patient_chat_hindi_response():
    patient_headers = {"X-Patient-Id": "PT-8924"}
    chat_payload = {
        "message": "नमस्ते, मेरी रिपोर्ट का क्या मतलब है?",
        "language": "hi"
    }
    res = client.post("/api/v1/patient/chat", json=chat_payload, headers=patient_headers)
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert len(data["reply"]) > 0


def test_admin_login_and_doctor_verification_workflow():
    admin_res = client.post(
        "/api/v1/auth/admin/login",
        json={"email": "admin@drishticare.health", "password": "admin123"}
    )
    assert admin_res.status_code == 200, admin_res.text
    admin_data = admin_res.json()
    assert admin_data["role"] == "admin"

    reg_res = client.post(
        "/api/v1/doctors/register",
        json={
            "full_name": "Dr. Test Verifier",
            "email": "testverifier@example.com",
            "mobile_number": "+91 98765 11223",
            "qualification": "MD Ophthalmology",
            "medical_registration_number": "NMC-VERIFY-2026",
            "medical_council": "National Medical Commission",
            "hospital_name": "Urban Eye Centre",
            "hospital_address": "MG Road, Bengaluru",
            "password": "StrongPass@123",
            "profile_photo_url": "https://example.com/doc.jpg",
            "certificate_url": "https://example.com/certificate.pdf"
        }
    )
    assert reg_res.status_code == 200, reg_res.text
    doctor_data = reg_res.json()
    assert doctor_data["verification_status"] == "PENDING"
    assert "doctor_id" in doctor_data

    status_res = client.get(f"/api/v1/doctors/status/{doctor_data['doctor_id']}")
    assert status_res.status_code == 200
    assert status_res.json()["verification_status"] == "PENDING"

    approved_res = client.post(
        f"/api/v1/admin/doctors/{doctor_data['doctor_id']}/verify",
        json={"decision": "approve", "notes": "Verified against council records"},
        headers={"X-Admin-Email": "admin@drishticare.health"}
    )
    assert approved_res.status_code == 200, approved_res.text
    approved_payload = approved_res.json()
    assert approved_payload["verification_status"] == "VERIFIED"

    login_res = client.post(
        "/api/v1/auth/doctor/login",
        json={"doctor_id": doctor_data["doctor_id"], "password": "StrongPass@123"}
    )
    assert login_res.status_code == 200, login_res.text
    assert login_res.json()["role"] == "doctor"

    blocked_res = client.post(
        "/api/v1/auth/doctor/login",
        json={"doctor_id": doctor_data["doctor_id"], "password": "wrong-password"}
    )
    assert blocked_res.status_code == 401

    summary_res = client.get(
        "/api/v1/admin/summary",
        headers={"X-Admin-Email": "admin@drishticare.health"}
    )
    assert summary_res.status_code == 200, summary_res.text
    summary = summary_res.json()
    assert summary["total_doctors"] == sum([
        summary["pending_requests"],
        summary["verified_doctors"],
        summary["rejected_applications"],
        summary["suspended_doctors"],
        summary["incomplete_doctors"],
    ])

    admin_headers = {"X-Admin-Email": "admin@drishticare.health"}
    patients_res = client.get("/api/v1/admin/patients", headers=admin_headers)
    screenings_res = client.get("/api/v1/admin/screenings", headers=admin_headers)
    analytics_res = client.get("/api/v1/admin/analytics", headers=admin_headers)
    audit_res = client.get("/api/v1/admin/audit-logs", headers=admin_headers)
    assert patients_res.status_code == 200, patients_res.text
    assert screenings_res.status_code == 200, screenings_res.text
    assert analytics_res.status_code == 200, analytics_res.text
    assert audit_res.status_code == 200, audit_res.text
    assert isinstance(patients_res.json(), list)
    assert isinstance(screenings_res.json(), list)
    assert {"stage_distribution", "monthly_trends", "hospital_statistics"}.issubset(analytics_res.json())
    assert any(log["action"] == "admin.login_success" for log in audit_res.json())


def test_rejected_doctor_is_hidden_blocked_from_booking_and_told_status():
    doctor_res = client.post(
        "/api/v1/doctors/register",
        json={
            "full_name": "Dr. Rejected Applicant",
            "email": "rejected.applicant@example.com",
            "mobile_number": "+91 98765 11224",
            "qualification": "MD Ophthalmology",
            "medical_registration_number": "NMC-REJECTED-2026",
            "medical_council": "National Medical Commission",
            "hospital_name": "Test Eye Centre",
            "hospital_address": "Bengaluru",
            "password": "DoctorPass@123",
        }
    )
    assert doctor_res.status_code == 200, doctor_res.text
    doctor_id = doctor_res.json()["doctor_id"]

    reject_res = client.post(
        f"/api/v1/admin/doctors/{doctor_id}/verify",
        json={"decision": "reject", "notes": "Credentials could not be verified."},
        headers={"X-Admin-Email": "admin@drishticare.health"},
    )
    assert reject_res.status_code == 200, reject_res.text

    available_res = client.get("/api/v1/patient/doctors")
    assert available_res.status_code == 200
    assert doctor_id not in {doctor["doctor_id"] for doctor in available_res.json()}

    login_res = client.post(
        "/api/v1/auth/doctor/login",
        json={"doctor_id": doctor_id, "password": "DoctorPass@123"},
    )
    assert login_res.status_code == 403
    assert "rejected by the admin" in login_res.json()["detail"].lower()

    booking_res = client.post(
        "/api/v1/patient/appointments",
        json={
            "doctor_id": doctor_id,
            "appointment_date": "2026-11-06",
            "appointment_time": "10:30 AM",
            "reason": "Follow-up consultation",
        },
        headers={"X-Patient-Id": "PT-8924"},
    )
    assert booking_res.status_code == 403
