# Deployment status

Local development uses Docker Compose for PostGIS, the FastAPI API, and the Vite frontend. The API container applies Alembic migrations at startup. This is a development setup, not a production web server; authentication, backups, and monitoring are not implemented. Do not deploy this version with sensitive utility data.

Production strategy to define after authorization/data residency review: containerized API/UI, managed or self-hosted PostGIS with tested backup/restore, TLS, secret management, role-based access, audit/monitoring, pinned dependencies, migration gates, and separate dev/research/operational environments. Fine-grained geospatial data and sensitive attributes must follow current law, source agreements, and applicable storage restrictions.
