# Implemented Feature List

## Clinical Workflow

- Fundus image/video intake, image-quality assessment, DR stage classification, confidence, and explainability outputs through the MATLAB/model service integration.
- Doctor portal for assigned patient records, screening review, and report approval.
- Patient portal for reports, educational explanations, and consultation booking.
- Consultation choices and appointment creation are restricted to verified doctors.

## Access and Administration

- Separate doctor, patient, and admin login flows.
- Doctor applications collect professional registration and workplace details and remain pending until admin review.
- Admin portal supports approve/reject, suspend/restore, platform-wide patient and screening views, stage/month/hospital analytics, audit history, and system health.
- Doctor login is blocked for pending, rejected, incomplete, or suspended records; legacy blank statuses are backfilled as incomplete.

## Localization and Reports

- English, Hindi, and Tamil UI language selection, persisted in browser storage.
- Patient-facing report, explanation, and consultation workflows.
- Translation strings live in `frontend/src/data/translations.ts`; visible strings added to localized screens should have all three locale entries.

This list reflects the application code and current API implementation. Model performance and clinical suitability require separate validation. See `v2-backlog.md` for planned work.
