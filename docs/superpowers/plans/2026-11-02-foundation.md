# Delhi Water Twin Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the first functional foundation for a Delhi water infrastructure twin while clearly showing that no verified DJB pipeline geometry has been loaded.

**Architecture:** React and TypeScript with Vite provide the GIS/data source workbench, Leaflet shows a legitimate OpenStreetMap basemap, and a FastAPI service exposes health, source registry, and import validation endpoints. PostgreSQL/PostGIS is configured through Docker Compose; source and attribute provenance are represented explicitly and operational assets remain empty until imported.

**Tech Stack:** React, TypeScript, Vite, Leaflet, Python, FastAPI, Pydantic, SQLAlchemy, PostgreSQL/PostGIS, Docker Compose.

**Spec:** User-provided pasted brief at `C:\Users\Tamnya Sharma\.codex\attachments\f586d204-ccee-439d-bccf-cb53e036a307\Pasted text.txt`, sections 1, 2, 3, 4, 5, 19, 20, and 22.

## Global Constraints

- No fabricated Delhi infrastructure, measurements, incident records, citations, or model performance.
- Explicit status values: VERIFIED, SOURCE_REPORTED, DERIVED, ESTIMATED, SIMULATED, UNKNOWN, CONFLICTING.
- Retain provenance, source, dates, version, license, CRS, source identifiers, validation, and measured/documented/calculated/estimated/unknown semantics.
- Keep authoritative assets, telemetry, public benchmarks, simulations, and model results separated.
- Clearly identify public basemap data as contextual and not pipeline evidence.
- Do not claim data was downloaded or integrated unless it was.
- No credentials in source control; environment examples contain placeholders only.
- Use Docker Compose and PostGIS; do not add unnecessary infrastructure.

## Review Focus

- No DJB network is available: map must show zero pipeline assets and explain why.
- OSM basemap is inaccessible: app still shows source status and the absence of infrastructure without implying tiles are data.
- CSV/GeoJSON imports omit provenance or CRS: reject or mark validation errors; never silently accept unknown CRS.
- GeoJSON contains invalid geometry or unsupported properties: report row/feature validation clearly.
- Benchmark records appear in a Delhi operational view: keep benchmark space visibly separate.

## File Structure

- `frontend/`: Vite application, GIS canvas, source management, asset registry, benchmark workspace.
- `backend/app/`: FastAPI routes, provenance schemas, import validation.
- `backend/tests/`: API and provenance validation checks.
- `docs/`: assessment, data-source findings, provenance, architecture, and first milestone limitations.
- `docker-compose.yml`, `.env.example`: local services and placeholder configuration.

## Tasks

### Task 1: Evidence and provenance foundation

**Files:** Create `docs/ARCHITECTURE.md`, `docs/DATA_SOURCES.md`, `docs/DATA_PROVENANCE.md`, `docs/LIMITATIONS.md`, and root `README.md`.

- [x] Record inspected repository state and current source findings with links and clear access/availability caveats.
- [x] Define the provenance vocabulary and required source and attribute fields in a machine-readable-compatible form.
- [x] Document DJB acquisition checklist and distinguish GIS context, operational assets, and benchmarks.

### Task 2: API and database foundation

**Files:** Create `backend/app/main.py`, `backend/app/schemas.py`, `backend/requirements.txt`, `backend/tests/test_api.py`, `docker-compose.yml`, `.env.example`.

- [x] Define source metadata and asset import request schemas with required provenance and CRS.
- [x] Add `/api/health`, `/api/sources`, and `/api/imports/validate` endpoints; validation must not persist data.
- [ ] Verify missing source/license/CRS and malformed GeoJSON produce actionable 4xx responses (test cases are authored; pytest cannot run in the current host environment).
- [x] Add PostGIS service configuration and environment-only credentials.

### Task 3: GIS and data-source workbench

**Files:** Create `frontend/package.json`, `frontend/index.html`, `frontend/src/*`, `frontend/vite.config.ts`.

- [x] Create responsive navigation for Overview, Map & Assets, Data Sources, Imports, and Research Benchmarks.
- [x] Show an OSM basemap with required attribution and no pipe overlays; show an explicit no-verified-network state.
- [x] Create a provenance-required GeoJSON validation flow backed by the API and a blank CSV schema-reference template. CSV parsing is not implemented yet.
- [x] Keep research benchmarks in a distinct workspace with dataset type and provenance labels.

### Task 4: Verify the first milestone

- [ ] Run backend validation checks and frontend production build where dependencies are available (blocked by missing pytest/TypeScript/Vite packages and package-registry DNS failure).
- [ ] Check API routes and Docker Compose configuration; record unavailable external services explicitly (Compose syntax checked; API runtime and PostGIS startup blocked by local environment).
- [x] Update documentation to match observed implementation and validation status.

---
