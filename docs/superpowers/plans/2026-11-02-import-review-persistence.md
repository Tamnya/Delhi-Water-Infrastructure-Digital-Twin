# Import Review Metadata Persistence Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist an auditable review record for a structurally validated import without storing or promoting its geometry into the Delhi asset registry.

**Architecture:** SQLAlchemy models and an Alembic migration create an `import_reviews` table in PostGIS-backed PostgreSQL. A new API route stores the submitted manifest, feature count, and canonical GeoJSON SHA-256 only; the existing validation route remains non-persistent. The UI exposes staging as a separate explicit action.

**Tech Stack:** FastAPI, Pydantic, SQLAlchemy, Alembic, PostgreSQL/PostGIS, React, TypeScript.

**Spec:** User brief, sections 1, 3, 4, 19, 20, and 22; current provenance model in `docs/DATA_PROVENANCE.md`.

## Global Constraints

- Asset geometry remains absent from the operational registry until documented review/promotion exists.
- Preserve source metadata, CRS, license/restrictions, quality, temporal validity, positional accuracy, and validation evidence.
- Duplicate package checksums within a data domain return a conflict; separate domains remain independent.
- Import staging stores metadata and a digest only, not the submitted GeoJSON body.
- No user-facing route reports a staged candidate as a verified asset.

## Review Focus

- Database unavailable: return actionable 503 while validation-only endpoint stays available.
- Duplicate dataset payload: return 409 and retain the original pending review.
- Malformed GeoJSON/provenance: schema validation rejects before any DB write.
- Private source reference: review metadata remains a local-development function with no public exposure claim.
- Benchmark GeoJSON staged: remains only a review row and does not populate operational assets.

## Files

- Create `backend/app/database.py`, `backend/app/models.py`, `backend/alembic.ini`, `backend/alembic/env.py`, `backend/alembic/versions/0001_import_reviews.py`.
- Modify `backend/app/main.py`, `backend/app/schemas.py`, `backend/requirements.txt`, `frontend/src/App.tsx`, `README.md`, architecture/security docs.
- Test `backend/tests/test_api.py`.

## Tasks

### Task 1: Persistence schema and migration

- [x] Add SQLAlchemy base/session setup that loads local environment configuration.
- [x] Create the metadata-only import review model and Alembic migration with PostGIS extension, indexes, check constraints, and unique `(data_domain, dataset_sha256)` key.
- [ ] Verify migration imports and model syntax; test SQLite-compatible model creation where possible (syntax check passed; runtime packages unavailable).

### Task 2: Explicit stage action

- [x] Add `POST /api/imports/stage`; store provenance, feature count, explicit data domain, status `PENDING_REVIEW`, and SHA-256 only.
- [x] Return 409 for duplicate dataset hash, 503 for unavailable database, and never store geometry.
- [x] Add API tests for successful staging, same-domain duplicate conflict, cross-domain separation, and database unavailable behavior (authored, not executable in current environment).

### Task 3: UI and documentation

- [x] Add a separate “Save review record” action after validation passes.
- [x] Show record ID and pending-review status, and explain geometry is not saved/promoted.
- [x] Document migration command, staging behavior, privacy limit, and updated verification state.

---
