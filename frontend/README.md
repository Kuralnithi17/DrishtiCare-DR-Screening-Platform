<div align="center">

# DrishtiCare

### Explainable AI Diabetic Retinopathy Screening Platform

<img src="https://img.shields.io/badge/UI%20Prototype-7C3AED?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Healthcare%20AI-0EA5E9?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Computer%20Vision-10B981?style=for-the-badge"/>

</div>

---

## Overview

**DrishtiCare** is a React and TypeScript client for an **Explainable AI-based Diabetic Retinopathy (DR) Screening Platform** designed as a clinical decision-support system. It communicates with the FastAPI backend in `../backend`.

The interface is designed around real-world healthcare challenges such as **poor retinal image quality, uncertain AI predictions, limited connectivity, and patient language barriers**.

The client has separate **Doctor, Patient, and Admin portals**. Live backend data powers authentication, verification, patient records, screenings, reporting, consultation booking, analytics, audit events, and health status. AI inference availability depends on the configured model and MATLAB/runtime services.

---

## Key Features

### Doctor Portal

- Patient management and screening workflow
- Retinal image / video upload
- Image quality assessment interface
- AI-based DR screening results
- Severity classification
- Confidence / uncertainty indicators
- Explainable AI heatmap visualization
- Clinician verification
- Structured medical report review

### Patient Portal

- Mobile-friendly results interface
- Easy-to-understand screening information
- Simplified medical explanations
- English, Hindi, and Tamil interface translations
- Optional report narration through browser speech synthesis where supported

### Admin Portal

- Doctor application review and access management
- Platform-wide patient and screening monitoring
- Screening and hospital analytics
- Persisted audit history and system health checks

## Languages

The language selector supports English, Hindi, and Tamil. Selected language is persisted in browser storage. Shared translations are maintained in `src/data/translations.ts`; new visible strings should be added for all three locales and rendered through `getTranslation` or an existing localized helper rather than hard-coded in a component.

---

## AI Workflow

```text
Retinal Image
      ↓
Image Quality Assessment
      ↓
DR Detection & Severity Analysis
      ↓
Confidence Estimation
      ↓
Explainable AI / Grad-CAM
      ↓
Doctor Verification
      ↓
Structured Report
      ↓
Patient-Friendly Results
```

---

## Technology Stack

### Frontend

<p>
  <img src="https://skillicons.dev/icons?i=html,css,javascript,typescript,react,tailwind" />
</p>

**HTML5 · CSS3 · JavaScript · TypeScript · React · Tailwind CSS**

---

## Design Focus

DrishtiCare's interface focuses on creating a healthcare experience that is:

- **Clinician-focused** — clear information for faster review
- **Explainable** — visual representation of AI findings
- **Accessible** — simplified patient-facing information
- **Multilingual** — designed for regional-language support
- **Human-in-the-loop** — automated findings remain subject to clinical verification
- **Real-world oriented** — designed with low-quality images and connectivity challenges in mind

---

## Development

From this directory, install dependencies and start Vite:

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

The Vite proxy expects the backend at `http://127.0.0.1:8000`. Start the API from the repository root with `python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000`. Run `npm run build` to type-check and create a production build.

---

<div align="center">

### DrishtiCare

**Making AI-assisted retinal screening more explainable and accessible.**

</div>
