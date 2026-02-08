# CareConnect

CareConnect is a portfolio project that demonstrates how patient intake and consent workflows can be designed with usability, role-based access control, and HIPAA-aware data handling in mind.

This project emphasizes correctness, clarity, and system boundaries over feature breadth.

## Problem

Patient intake is a critical choke point in healthcare systems. Errors or poor design at this stage can lead to compliance risks, data integrity issues, and poor patient experiences.

This project focuses on building a **safe, auditable intake workflow**, not just a simple form UI.

## Goals

- Model a realistic patient intake workflow
- Capture and record explicit patient consent
- Enforce role-based access (patient vs staff)
- Maintain audit logs for sensitive actions
- Keep the system intentionally small and understandable

## Non-Goals

- Real EHR integrations
- Billing or payments
- Production-grade authentication
- Multi-clinic or multi-tenant support

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

`npm install`
`npm run dev`

### 4) Verify

The API runs on port 4000 by default.

- Health: http://localhost:4000/health
- DB Check: http://localhost:4000/db-check

### Stop services

- Stop API server: `Ctrl + C`
- Stop database: from project root `docker compose down`

## Status

🚧 In progress — project setup and system foundations.

## Tech Stack

- Node.js
- Express
- PostgreSQL
- Docker
- JavaScript (ES Modules)
