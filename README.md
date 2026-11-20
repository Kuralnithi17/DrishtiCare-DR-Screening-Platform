👁️ DrishtiCare — Explainable AI Diabetic Retinopathy Screening Platform
 
Smart India Hackathon 2026 | Problem Statement ID: `SIH26038`
 
A clinical decision-support platform that uses **Explainable AI** to screen for Diabetic Retinopathy (DR) — built specifically for real-world rural healthcare conditions: poor image quality, unstable internet, and patient language barriers.
 
---
 
📌 Problem Statement
 
Diabetic Retinopathy is one of the leading causes of preventable blindness worldwide, and India — with one of the largest diabetic populations globally — faces a severe screening gap. Millions of diabetic patients remain undiagnosed until vision loss becomes irreversible, largely due to:
 
- **Shortage of ophthalmologists**, especially in rural and semi-urban areas
- **Manual screening** that is time-consuming, subjective, and dependent on expert availability
- **Low-quality diagnostic inputs**, since rural centers often lack access to high-resolution fundus cameras
- **Unreliable internet connectivity**, disrupting access to cloud-based diagnostic tools
- **Language and literacy barriers**, preventing patients from understanding technical medical reports
- **Lack of trust in AI diagnosis**, due to black-box predictions with no visual justification
There is a critical need for an accurate, robust, and accessible AI screening solution that works reliably in low-resource settings, explains its reasoning to doctors, and communicates results to patients in their own language — enabling early referral and timely intervention.
 
---
 
💡 Our Solution
 
DrishtiCare implements an **Explainable AI DR Screening Platform** with image-quality assessment, DR classification, confidence and explainability outputs, clinician review, and patient-facing reports. Inference depends on the configured model and MATLAB/runtime services. The interface supports English, Hindi, and Tamil; optional report narration uses browser speech synthesis where available.
 
---
🧠 Core AI Pipeline
 
| Stage | Function |
|-------|----------|
| **1. Quality Assessment** | Backend model-service integration assesses submitted retinal media and returns quality results when the configured service is available. |
| **2. DR Classification** | The configured inference service returns a DR stage and confidence score. |
| **3. Clinical Review** | Screening records retain review status and clinician notes for human oversight. |
| **4. Explainability** | The inference integration can provide Grad-CAM/overlay assets when available. |
| **5. Patient Reports** | Structured findings are presented to patients after clinician review. |
 
---
 
🖥️ Three-Portal System
 
👨‍⚕️ Doctor Portal
- Manage patient records
- Upload fundus images/videos
- Review AI-generated Grad-CAM heatmaps
- Approve or edit AI-generated reports before finalization
🧑‍🦱 Patient Portal
- Mobile-friendly app to access results
- Multilingual patient-facing reports and educational explanations
- Optional report narration using browser speech synthesis where supported
🛡️ Admin Portal
- Separate administrator login and dashboard
- Review doctor registration details and approve or reject applications
- Manage verified doctor access, including suspension and restoration
- Monitor patients, screenings, referral counts, hospital trends, and system health
- Review persisted sign-in, registration, and verification audit events

Doctor accounts must be verified before clinical login. Only verified doctors appear as consultation choices, and the booking API enforces the same rule.
---
 
🚧 Design Goals and Current Coverage
 
| # | Challenge | Our Approach |
|---|-----------|--------------|
| 1 | **Low image quality** — rural centers often lack high-resolution cameras | Quality assessment and rejection states are integrated into the screening workflow; model robustness requires deployment-specific validation |
| 2 | **Unreliable internet connectivity** — service access can be interrupted | Offline/on-device inference and synchronization remain planned work; the current frontend depends on the API for live platform data |
| 3 | **Language barrier** | The application UI supports English, Hindi, and Tamil; additional screen translations are tracked as ongoing work |
| 4 | **Low literacy & limited English proficiency** | Patient-facing explanations are provided, with optional browser speech narration for reports; a conversational voice assistant remains planned |
| 5 | **Lack of trust & transparency in AI diagnosis** | Screening results include review states and explainability assets when provided by the configured inference service; clinicians remain responsible for review |
 
---
 
🚀 Key Features
 
- ✅ **Pre-diagnostic Quality Gate** — rejects unusable scans before they reach the model
- ✅ **Severity Classification** — grades DR across standard clinical stages
- ✅ **Lesion Localization** — pinpoints affected retinal regions
- ✅ **Explainable Heatmaps (Grad-CAM)** — visual justification for every prediction
- ✅ **Confidence-Aware Predictions** — automatic escalation of uncertain cases to doctors
- ✅ **Multilingual UI** — English, Hindi, and Tamil, with language preference persisted in the browser
- ✅ **Patient Education** — report explanations and optional browser-based report narration
- ✅ **Human-in-the-Loop Reporting** — every AI report is doctor-reviewed before finalization
- ✅ **Professional Verification** — administrator approval is required before doctor portal access
- ✅ **Admin Operations Dashboard** — platform-wide patient, doctor, screening, analytics, audit, and health views
- ✅ **English, Hindi, and Tamil UI** — language selection is persisted across reloads; localized UI strings are maintained in `frontend/src/data/translations.ts`

---
🧰 Run Locally

Install backend dependencies from the repository root and start FastAPI:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

In a second terminal, install and start the frontend:

```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

The Vite development server proxies API and static-file requests to `http://127.0.0.1:8000`. The local demo admin credentials are `admin@drishticare.health` / `admin123`; replace these before any deployment.

See [docs/architecture.md](docs/architecture.md) for portal boundaries and API ownership, [docs/mvp-feature-list.md](docs/mvp-feature-list.md) for implemented scope, and [docs/v2-backlog.md](docs/v2-backlog.md) for work that remains planned.
---
 
 🩺 DR Severity Stages Classified
 
| Stage | Description |
|-------|-------------|
| 0 – No DR | No visible abnormalities |
| 1 – Mild | Microaneurysms present |
| 2 – Moderate | More extensive vascular damage |
| 3 – Severe | Significant blood vessel blockage |
| 4 – Proliferative DR | Abnormal new vessel growth, high risk of blindness |
 
---
