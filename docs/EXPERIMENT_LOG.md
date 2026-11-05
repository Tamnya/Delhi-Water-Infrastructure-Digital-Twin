# Experiment log

## 2026-11-02 — foundation setup

- Purpose: create evidence-safe GIS and source management foundation.
- Data used: none; source pages were researched but no dataset was downloaded or ingested.
- Outcome: React/Vite and FastAPI code scaffolded; PostGIS Compose service configured; no hydraulic or leak model run.
- Validation: Docker Compose config parsed successfully; database startup was attempted but Docker Desktop's engine pipe was unavailable. Python source syntax compilation passed. Frontend package installation could not reach `registry.npmjs.org` (DNS `ENOTFOUND`). Backend tests could not run because the available host Python has no pip and no separately registered Python interpreter.
- Claims: no detection accuracy, field validation, or asset count beyond the explicit empty registry.

## 2026-11-02 — complete in-app source catalog

- Purpose: align the application source catalog with all 11 sources researched in the project brief.
- Changes: API and frontend now include all 11 source categories; overview count derives from the loaded catalog. Research datasets remain tagged separately from context, policy, hydraulic software, and literature.
- Data used: catalog metadata only; no dataset downloaded or integrated.
- Validation: Python syntax and Compose configuration checks passed. Source-catalog API test was added, but pytest and frontend build remain blocked by the environment noted above.

## 2026-11-02 — metadata-only import review staging

- Purpose: preserve an import review trail without moving unverified geometries into the operational asset registry.
- Changes: added SQLAlchemy model, PostGIS/Alembic migration, explicit import domain, API stage route with SHA-256 duplicate protection, and a separate UI action after validation.
- Stored: source/provenance fields, feature count, data domain, review status, timestamp and canonical dataset digest. GeoJSON feature data/geometry is not persisted.
- Validation: Python source compilation and Docker Compose configuration passed. API tests, frontend build, migration, and PostGIS startup were not executable because pytest/Node packages and the Docker engine are unavailable.

## 2026-11-04 — public-data Simulation Lab

- Purpose: provide interactive, clearly separated sample cases without treating public research data as Delhi infrastructure.
- Data: downloaded the 818.5 KB CC BY 4.0 CSV from Zenodo record 15096167, containing 8,737 hourly rows, 18 precomputed anomaly-score features, and a ±7 day leak-proximity label.
- Model: deterministic class-weighted logistic regression; chronological 70/30 split with a 14-day embargo (5,947 train, 2,454 holdout). Reproduction: `node backend/train_simulation_model.mjs`.
- Holdout at threshold 0.50: TP 1,219, FP 140, TN 82, FN 1,013; precision 89.7%, recall 54.6%, F1 67.9%, accuracy 53.0%. Since 91.0% of holdout labels are positive, the always-positive accuracy baseline is 91.0%; model performance is inadequate for operational detection.
- Changes: added Simulation Lab navigation, adjustable threshold, four actual held-out cases, signal contribution view, metrics/caveats, API endpoints, dataset attribution, model artifact, and reproducibility documentation. No map or Delhi asset geometry was modified.
- Limitations: model score is not calibrated; benchmark label is proximity to recorded leak periods; the data source is an anonymized non-Delhi network and contains derived anomaly scores, not raw pressure/flow data.
