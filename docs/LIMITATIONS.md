# Known limitations

- No authoritative Delhi water-pipeline geometry has been obtained or imported. The map intentionally shows zero operational pipe assets.
- OSM tiles are a contextual basemap and do not establish underground asset locations.
- No telemetry, incidents, repairs, hydraulic network, forecasts, leak alerts, or risk scores are present.
- Import validation is in memory; a separate stage action stores only source metadata, feature count and SHA-256 digest in a pending-review table. It does not store geometry, parse CSV, perform full topology checks, or confirm survey accuracy. The stage endpoint is unauthenticated and must remain local/non-sensitive until access controls are implemented.
- Source catalog is research notes, not a live connector. Link accessibility and source contents can change.
- PostgreSQL/PostGIS configuration and an Alembic metadata-staging migration exist; local database startup and migration execution remain unverified because Docker Desktop is unavailable.
- The frontend and API are not production secured; do not expose utility data through this development build.
- Benchmark records are catalogued as research resources but not downloaded, license-cleared, or evaluated.
- No field validation, leak-detection performance, patent novelty, or operational readiness is claimed.
