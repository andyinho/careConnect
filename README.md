# CareConnect

CareConnect demonstrates how AI-assisted patient intake workflows can be designed with human review, auditability, and HIPAA-aware data handling at their core.

The system models an internal clinic workflow:

**Staff uploads intake documents → AI extracts structured data → Staff reviews and approves → System saves canonical patient record**

CareConnect models how modern healthcare operations tools can integrate AI into high-stakes workflows while preserving data integrity, compliance boundaries, and human oversight.

## Problem

Patient intake is a critical choke point in healthcare systems.

In many clinics:

- Paper forms are scanned and manually entered into systems
- Staff spend significant time retyping demographic and insurance information
- Errors introduced at intake propagate downstream into scheduling, billing, and eligibility workflows
- There is limited traceability of who modified patient data and when

AI introduces an opportunity to reduce manual data entry. However, in regulated healthcare environments, automation without oversight creates risk.

CareConnect focuses on designing a safe, auditable, human-in-the-loop workflow — not just document parsing.

## Goals (V1)

- Model a realistic AI-assisted intake workflow
- Support document uploads (PDF/image)
- Extract structured fields using AI
- Require explicit staff review before saving data
- Maintain audit logs for sensitive actions
- Enforce clinic-scoped access control
- Keep the system intentionally small and understandable

## Workflow (V1)

- Staff uploads intake document
- System performs OCR and AI-based structured extraction
- AI generates field-level suggestions with confidence scores
- Staff reviews and edits extracted data
- Staff approves the final payload
- System saves a canonical patient record

AI-generated suggestions are never treated as truth until approved by a human reviewer.

## Non-Goals

- Real EHR integrations
- Insurance eligibility verification
- Billing or payments
- Production-grade authentication
- Multi-clinic enterprise tenancy features
- Full FHIR implementation
- Patient-facing portal experience

## Why This Project Exists

The project demonstrates applied system design in a regulated healthcare domain, with a focus on safe AI integration and workflow-driven architecture.

The project intentionally models:

- AI systems that require structured human validation
- Explicit workflow state transitions rather than simple CRUD operations
- Clear separation between AI-generated suggestions and system-of-record data
- Audit-aware backend architecture
- Architectural decisions influenced by compliance and PHI boundaries

The system is intentionally scoped to remain understandable while still reflecting realistic operational complexity found in healthcare environments.

## High-Level Architecture

- Client: React application for patients and clinic staff
- Server: Node.js + Express API
- Database: PostgreSQL
- Infrastructure: Docker (local development)

## Run Locally

Docker is used to run PostgreSQL locally in a consistent, reproducible environment.

### Prerequisites

- Node.js (LTS recommended)
- Docker Desktop

### 1) Start the database (PostgreSQL)

From the project root:

`docker compose up -d`

### 2) Configure environment variables

Copy the example env file:

```
cd server
cp .env.example .env
```

Fill in the values in `server/.env` (see `.env.example` for required variables)

### 3) Start the API server

From `server/`:

```
npm install
npm run dev
```

### 4) Verify

The API runs on port 4000 by default.

- Health: http://localhost:4000/health
- DB Check: http://localhost:4000/db-check

### Stop services

- Stop API server: `Ctrl + C`
- Stop database: from project root `docker compose down`

## Status

🚧 In progress — Building out RESTful endpoints and core logic.

## Tech Stack

- Node.js
- Express
- PostgreSQL
- Docker
- JavaScript (ES Modules)

For detailed data modeling decisions, see the [V1 Schema](docs/v1-schema.md).
