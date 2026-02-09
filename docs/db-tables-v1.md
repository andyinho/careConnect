# V1 Database Tables (Draft)

This document translates `docs/v1-schema.md` into a minimal relational schema for PostgreSQL (V1).

Principles:

- Human-in-the-loop: AI output is stored separately from staff-verified data
- Auditability: every sensitive action produces an audit log event
- V1 simplicity: store AI outputs as JSONB (avoid over-normalizing early)

---

## Tables (V1)

### clinics

Scope boundary for records.

- `id` (uuid, pk)
- `name` (text)
- `created_at` (timestamp)

---

### users

Represents staff actors (who upload, review, approve).

- `id` (uuid, pk)
- `clinic_id` (uuid, fk → clinics.id)
- `email` (text, unique)
- `role` (text; V1: `STAFF`)
- `created_at` (timestamp)

---

### uploads

Represents a file uploaded by clinic staff.

- `id` (uuid, pk)
- `clinic_id` (uuid, fk → clinics.id)
- `uploaded_by_user_id` (uuid, fk → users.id)
- `original_filename` (text)
- `mime_type` (text)
- `storage_key` (text)
- `status` (text; V1: `UPLOADED | PROCESSING | EXTRACTED | VERIFIED | REJECTED | ERROR`)
- `created_at` (timestamp)
- `updated_at` (timestamp)

Suggested indexes:

- `(clinic_id, created_at DESC)`
- `(status)`

---

### extraction_jobs

Represents a single AI processing run for an upload (supports retries and traceability).

- `id` (uuid, pk)
- `upload_id` (uuid, fk → uploads.id)
- `status` (text; V1: `QUEUED | RUNNING | SUCCEEDED | FAILED`)
- `model_name` (text)
- `prompt_version` (text)
- `error_message` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

Suggested indexes:

- `(upload_id)`
- `(status)`

---

### extraction_results

Stores structured AI output and metadata for review.

- `id` (uuid, pk)
- `extraction_job_id` (uuid, fk → extraction_jobs.id, unique in V1)
- `overall_confidence` (numeric 0..1)
- `summary` (text)
- `flags` (jsonb)
- `suggestions_json` (jsonb)
- `created_at` (timestamp)

Suggested indexes:

- `(extraction_job_id)`

Notes:

- JSONB is used because extraction output is nested and will evolve.
- V1 does not require querying deep inside JSON beyond display and review.

---

### review_sessions

Captures staff review and the final approved payload.

- `id` (uuid, pk)
- `upload_id` (uuid, fk → uploads.id)
- `extraction_job_id` (uuid, fk → extraction_jobs.id)
- `reviewed_by_user_id` (uuid, fk → users.id)
- `status` (text; V1: `IN_PROGRESS | APPROVED | REJECTED`)
- `final_payload_json` (jsonb)
- `created_at` (timestamp)
- `updated_at` (timestamp)

Suggested indexes:

- `(upload_id)`
- `(status)`

---

### patients

Canonical patient record created only after staff approval.

- `id` (uuid, pk)
- `clinic_id` (uuid, fk → clinics.id)
- `upload_id` (uuid, fk → uploads.id, nullable)
- `first_name` (text)
- `last_name` (text)
- `dob` (date)
- `phone` (text, nullable)
- `email` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

Suggested indexes:

- `(clinic_id, last_name, first_name)`
- `(upload_id)`

Notes:

- V1 assumes approved uploads create new patients (no identity dedupe yet).

---

### audit_logs

Tracks “who did what and when” for sensitive actions.

- `id` (uuid, pk)
- `clinic_id` (uuid, fk → clinics.id)
- `actor_user_id` (uuid, fk → users.id)
- `entity_type` (text; e.g., `UPLOAD`, `EXTRACTION_JOB`, `REVIEW_SESSION`, `PATIENT`)
- `entity_id` (uuid)
- `action` (text; e.g., `UPLOAD_CREATED`, `EXTRACTION_COMPLETED`, `REVIEW_APPROVED`)
- `metadata_json` (jsonb; safe metadata only, avoid raw form text)
- `created_at` (timestamp)

Suggested indexes:

- `(clinic_id, created_at DESC)`
- `(entity_type, entity_id)`

---

## V1 Rules (enforced in application logic)

- Upload status transitions must move forward only.
- AI suggestions are never written to `patients` until a staff approval occurs.
- Approval creates:
    - a `review_sessions` row with `final_payload_json`
    - a `patients` row with canonical fields
    - one or more `audit_logs` events
