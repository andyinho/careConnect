# V1 Schema (Draft)

## Purpose

Define the minimum data model for V1 of the following workflow:

**Staff uploads intake file → AI extracts fields → Staff reviews/edits → Staff approves → Save patient record**

This schema is designed to support:

- Human-in-the-loop review (AI suggestions are not truth)
- Auditability (who changed what and when)
- Clinic-scoped access (records belong to a clinic)

---

## Core Entities (V1)

### Upload

Represents a file uploaded by clinic staff (PDF or image).

**Why it exists:**  
Track the file, processing lifecycle, and who uploaded it.

**Key fields**

- `id`
- `clinic_id`
- `uploaded_by_user_id`
- `original_filename`
- `mime_type`
- `storage_key` (blob location; never publicly accessible)
- `status` (see Status Flow)
- `created_at`

---

### Extraction Job

Represents one AI processing run for a given upload.

**Why it exists:**  
Retry processing, track failures, and capture model/prompt details for reproducibility.

**Key fields**

- `id`
- `upload_id`
- `status`
- `model_name`
- `prompt_version`
- `created_at`

---

### Extraction Result (Suggestions)

Represents AI-proposed structured data **plus** confidence and optional evidence.

**Important:**  
Suggestions are never saved as patient data until a human reviews and approves them.

**Key fields**

- `id`
- `extraction_job_id`
- `overall_confidence` (0..1)
- `summary` (short natural language explanation)
- `flags[]` (structured reasons to review)
- `suggestions_json` (JSON object of suggested values + confidence per field)
- `created_at`

**suggestions_json shape (conceptual)**

- Each field is represented as an object:
    - `value`
    - `confidence` (0..1)
    - `source` (optional: "form", page number, etc.)
    - `evidence` (optional short snippet)

Example field:

- `patient.dateOfBirth.value = "1994-08-17"`
- `patient.dateOfBirth.confidence = 0.92`

---

### Review Session

Represents the staff review and approval step.

**Why it exists:**  
Capture the staff-approved values and tie approval to a user and timestamp.

**Key fields**

- `id`
- `upload_id`
- `extraction_job_id`
- `reviewed_by_user_id`
- `status` (`IN_PROGRESS` | `APPROVED` | `REJECTED`)
- `final_payload_json` (the staff-approved values only)
- `created_at`

---

### Patient (Canonical Record)

Represents saved patient data after review and approval.

**Why it exists:**  
This is the system-of-record representation created only after human validation.

**Key fields (initial V1)**

- `id`
- `clinic_id`
- `first_name`
- `last_name`
- `dob`
- `phone`
- `email`
- `created_at`

---

### Audit Log (V1 minimal)

Represents an audit trail event for sensitive actions.

**Why it exists:**  
Healthcare workflows require traceability: who did what and when.

**Key fields**

- `id`
- `clinic_id`
- `actor_user_id`
- `entity_type` (e.g., `UPLOAD`, `EXTRACTION_JOB`, `REVIEW_SESSION`, `PATIENT`)
- `entity_id`
- `action` (e.g., `UPLOAD_CREATED`, `EXTRACTION_COMPLETED`, `REVIEW_APPROVED`)
- `metadata_json` (safe metadata; avoid raw form text)
- `created_at`

---

## Status Flow (V1)

### Upload status

`UPLOADED → PROCESSING → EXTRACTED → VERIFIED | REJECTED | ERROR`

Notes:

- `EXTRACTED` means the AI produced suggestions and they are ready for staff review.
- `VERIFIED` means staff approved final values.
- `ERROR` is for system failures (upload unreadable, AI call failed, etc.).

### Extraction Job status

`QUEUED → RUNNING → SUCCEEDED | FAILED`

### Review Session status

`IN_PROGRESS → APPROVED | REJECTED`

---

## Canonical Fields to Extract (V1)

These are the fields V1 attempts to extract from intake forms and present for staff review.

### Patient

#### Identity & Demographics

- `patient.firstName` (string, required)
- `patient.lastName` (string, required)
- `patient.dateOfBirth` (date `YYYY-MM-DD`, required)
- `patient.phone` (string, optional)
- `patient.email` (string, optional)

#### Address (optional)

- `patient.addressLine1` (string, optional)
- `patient.addressLine2` (string, optional)
- `patient.city` (string, optional)
- `patient.state` (string, optional)
- `patient.zip` (string, optional)

### Insurance (V1)

- `insurance.provider` (string, optional)
- `insurance.memberId` (string, optional)
- `insurance.groupNumber` (string, optional)

### Intake Questions (V1)

- `intake.pregnant` (enum: `yes` | `no` | `unknown`)
- `intake.smokingStatus` (enum: `never` | `former` | `current` | `unknown`)
- `intake.smokingFrequency` (string, optional)

---

## Example Objects (V1)

### Example: Upload

```json
{
    "id": "upload_123",
    "clinic_id": "clinic_456",
    "uploaded_by_user_id": "user_789",
    "original_filename": "patient_intake_jane_doe.pdf",
    "mime_type": "application/pdf",
    "storage_key": "clinics/clinic_456/uploads/upload_123.pdf",
    "status": "UPLOADED",
    "created_at": "2026-02-08T10:15:30Z"
}
```

### Example: Extraction Result (Suggestions)

```json
{
    "id": "extract_result_001",
    "extraction_job_id": "job_001",
    "overall_confidence": 0.78,
    "summary": "Captured demographics and insurance. Pregnancy not clearly indicated.",
    "flags": [
        {
            "code": "MISSING_PREGNANCY",
            "message": "Pregnancy question not clearly answered."
        }
    ],
    "suggestions_json": {
        "patient": {
            "firstName": {
                "value": "Jane",
                "confidence": 0.91,
                "source": "form",
                "evidence": "First name: Jane"
            },
            "lastName": {
                "value": "Doe",
                "confidence": 0.93,
                "source": "form",
                "evidence": "Last name: Doe"
            },
            "dateOfBirth": {
                "value": "1994-08-17",
                "confidence": 0.92,
                "source": "form",
                "evidence": "DOB: 08/17/1994"
            },
            "phone": {
                "value": "+1-360-555-0123",
                "confidence": 0.84,
                "source": "form",
                "evidence": "Phone: (360) 555-0123"
            },
            "email": {
                "value": "jane@example.com",
                "confidence": 0.72,
                "source": "form",
                "evidence": "Email: jane@example.com"
            }
        },
        "insurance": {
            "provider": {
                "value": "Aetna",
                "confidence": 0.88,
                "source": "form",
                "evidence": "Insurance: Aetna"
            },
            "memberId": {
                "value": "W123456789",
                "confidence": 0.75,
                "source": "form",
                "evidence": "Member ID: W123456789"
            },
            "groupNumber": {
                "value": "GRP-4412",
                "confidence": 0.61,
                "source": "form",
                "evidence": "Group #: GRP-4412"
            }
        },
        "intake": {
            "pregnant": {
                "value": "unknown",
                "confidence": 0.4,
                "source": "form",
                "evidence": "Pregnant? (blank)"
            },
            "smokingStatus": {
                "value": "former",
                "confidence": 0.77,
                "source": "form",
                "evidence": "Smoking: Former"
            },
            "smokingFrequency": {
                "value": "1–2 cigarettes/week",
                "confidence": 0.55,
                "source": "form",
                "evidence": "How often: 1-2/week"
            }
        }
    },
    "created_at": "2026-02-08T10:16:10Z"
}
```

### Example: Review Session (Approved)

```json
{
    "id": "review_001",
    "upload_id": "upload_123",
    "extraction_job_id": "job_001",
    "reviewed_by_user_id": "user_789",
    "status": "APPROVED",
    "final_payload_json": {
        "patient": {
            "firstName": "Jane",
            "lastName": "Doe",
            "dateOfBirth": "1994-08-17",
            "phone": "+1-360-555-0123",
            "email": "jane@example.com"
        },
        "insurance": {
            "provider": "Aetna",
            "memberId": "W123456789",
            "groupNumber": "GRP-4412"
        },
        "intake": {
            "pregnant": "no",
            "smokingStatus": "former",
            "smokingFrequency": "1–2 cigarettes/week"
        }
    },
    "created_at": "2026-02-08T10:20:44Z"
}
```
