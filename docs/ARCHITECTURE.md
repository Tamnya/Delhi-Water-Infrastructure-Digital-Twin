# Architecture (initial foundation)

## Implemented in the first milestone

- React + TypeScript + Vite frontend with navigation for map/assets, data sources, imports, and benchmark research.
- Leaflet basemap uses OpenStreetMap tiles with attribution. The map is contextual only; there is no pipe geometry overlay.
- FastAPI exposes health, source catalog, validation-only GeoJSON, explicit metadata staging, and a read-only pending-review list.
- Docker Compose defines PostgreSQL/PostGIS; Alembic creates a metadata-only `import_reviews` table. The stage API stores provenance, feature count and a canonical dataset digest, never feature geometry.
- Source and asset provenance schemas reserve explicit quality/status fields.

## Boundaries

Operational geography and telemetry are separate from public benchmark datasets, simulations, and model outputs. The benchmark workspace contains catalog metadata only; data files are not locally installed. The validation endpoint does not save records; the separate staging endpoint saves review metadata only and does not promote assets. The review list returns provenance and a digest, but not geometry; it is not an approval or asset-promotion workflow. No authentication/authorization is implemented yet and this local foundation is not production deployment-ready.

## Next architecture steps

Add a source registry, data-access roles and audit logs before private utility data is connected; implement a reviewed/promotion workflow before any geometry reaches the operational asset registry; then handle telemetry and benchmark ingestion in separate stores/namespaces. EPANET/WNTR integration and analytics follow only after a documented network model is available.
