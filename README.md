# CareConnect

CareConnect is a portfolio project that demonstrates how patient intake and consent workflows can be designed with usability, role-based access control, and HIPAA-aware data handling in mind.

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

## Status

🚧 In progress — project setup and system foundations.
