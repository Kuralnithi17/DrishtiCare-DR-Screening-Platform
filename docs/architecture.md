# Architecture

DrishtiCare is a React, TypeScript, and Vite frontend backed by a FastAPI service and SQLAlchemy database. The application has three role-based portals: doctor, patient, and administrator.

## Portals

- **Doctor:** verified clinicians manage assigned patients and screenings, review AI results, and approve reports.
- **Patient:** patients view their reports, use the educational assistant, and book consultations with verified doctors.
- **Admin:** administrators verify doctor applications, manage doctor access, view patients and screenings platform-wide, inspect aggregate analytics and audit events, and check system health.

## Backend

- `backend/app/main.py` creates the FastAPI application, initializes database tables and seed records, and mounts the API under `/api/v1`.
- `backend/app/api/routes/auth.py` handles doctor, patient, and admin login. Doctor login is denied unless the doctor's verification status is `VERIFIED`.
- `backend/app/api/routes/admin.py` provides admin-protected doctor, patient, screening, analytics, audit, and summary endpoints. Doctor registrations start as `PENDING`; legacy records with blank status are migrated to `INCOMPLETE`.
- `backend/app/api/routes/patient_portal.py` lists verified doctors for consultation booking and rejects bookings to any non-verified doctor.
- SQLAlchemy models are in `backend/app/models/`. Audit events are persisted in the `audit_logs` table.
- The database defaults to SQLite at `storage/dr_screening_fallback.db`; set `DATABASE_URL` to use another supported SQLAlchemy database.

## Frontend

- `frontend/src/App.tsx` selects the portal view based on the authenticated role.
- `frontend/src/context/PortalContext.tsx` owns session, role, and language state. Language is persisted in local storage and applied to the document language attribute.
- `frontend/src/data/translations.ts` contains English, Hindi, and Tamil strings used by localized components. Missing keys fall back to English.
- `frontend/src/services/apiService.ts` sends requests to `/api/v1`; Vite proxies `/api` and `/static` to `http://127.0.0.1:8000` during development.

## Access and Trust Boundaries

- Admin endpoints require an admin bearer token (or the explicit test/development admin header).
- Patient/doctor data in admin views comes from admin-scoped endpoints rather than clinician-scoped list endpoints.
- Consultation availability is enforced both in the doctor list and when a booking is submitted.
- AI outputs are decision-support information and require clinical interpretation; the platform is not a substitute for professional care.
