# Delhi Water Infrastructure Digital Twin

An evidence-first water-network research prototype with source provenance, import review, and a separate benchmark simulation lab. It still has no verified Delhi pipeline geometry or live telemetry.

## Run locally with Docker Desktop

Docker Desktop is the only prerequisite for this path; no host Python or Node setup is needed.

1. Open Docker Desktop and wait until it is running.
2. From this project folder, run:

   ```powershell
   docker compose up --build
   ```

3. Open the app at [http://localhost:5173](http://localhost:5173). The API docs are at [http://localhost:8000/docs](http://localhost:8000/docs), and the health check is at [http://localhost:8000/api/health](http://localhost:8000/api/health).
4. Stop the services with `Ctrl+C`, then run `docker compose down` to remove the containers. The database volume remains, so staged review metadata is retained across restarts.

The API container applies the database migration on startup. `docker compose up --build -d` starts the stack in the background; `docker compose logs -f` follows logs, and `docker compose down` stops it. Avoid `docker compose down -v` unless you intend to delete the local database volume and its staged records.

The included Compose defaults are for local development only. Do not expose these unauthenticated services to a network or use them for sensitive data.

The map uses OpenStreetMap tiles and displays required attribution. Tile availability depends on network access and the tile provider's usage policy.

## Deploy the frontend to GitHub Pages

The repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`. After the project is pushed to a GitHub repository with a `main` or `master` branch, enable **Settings → Pages → Build and deployment → GitHub Actions**. A push to that branch or a manual run from **Actions → Deploy JalSetu to GitHub Pages → Run workflow** builds and publishes `frontend/dist`.

GitHub Pages hosts static files only. This Pages build runs the research benchmark model in the browser and keeps the role dashboards, FAQs, and sample grievances as local demonstrations. It cannot run the FastAPI service or PostGIS database, so GeoJSON import validation and saved review records require the Docker Compose version. The role selector remains a demo, not secure authentication. The Actions workflow syncs the frontend's bundled model from `backend/app/simulation_model.json` before each build.

## Project state

- Public services demo: searchable FAQs and a sample grievance form. Submissions exist only in the current browser session and are not sent to DJB.
- Role dashboard demo: use the top-right “View as” selector to preview Public, Employee, Supervisor, and Admin pages. Sample tasks, fictional employee IDs, reports, remarks, and risk examples are in-memory demonstration data; refresh resets changes. The selector is not authentication and provides no secure access control.
- Guided tour: “Take a tour” in the top bar explains the overview, map, help, sources, import review, staff workflows, risk examples, research, simulation, and role preview.
- GitHub Pages build: the sample simulation runs locally in the browser from the bundled benchmark model; import review storage remains API/database-dependent.
- Risk notifications: illustrative SIM-P sample alerts only; there is no live sensor connection or real pipeline risk assessment.

- Delhi pipeline registry: **unavailable — no verified network imported**.
- Import validation: GeoJSON FeatureCollection, in memory only. The separate “Save review record” action stores provenance metadata, feature count, and a digest with `PENDING_REVIEW` status; the import review inbox lists those metadata records. Geometry is not stored, displayed, approved, or promoted.
- Research: separate catalog distinguishes the licensed simulation source from other benchmark records that have not been downloaded or evaluated.
- Simulation Lab: a class-weighted logistic-regression model trained on 5,947 early records from a public CC BY 4.0 anomaly-score/leak-proximity dataset, with 2,454 later records held out chronologically. Interactive examples and threshold changes are research-only; the dataset is an anonymized network, not Delhi.
- PostGIS, API, and frontend: Docker Compose services; the metadata-only review migration runs automatically on API startup. The local unauthenticated API must not receive sensitive source references until access controls are added.

See [docs/SIMULATION_MODEL.md](docs/SIMULATION_MODEL.md), [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md), [docs/DATA_PROVENANCE.md](docs/DATA_PROVENANCE.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), and [docs/LIMITATIONS.md](docs/LIMITATIONS.md).
