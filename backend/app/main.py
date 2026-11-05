import hashlib
import json
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_engine
from app.models import ImportReview
from app.schemas import ImportReviewRecord, ImportStageResponse, ImportValidationRequest, ImportValidationResponse, SourceRecord

app = FastAPI(title="Delhi Water Twin API", version="0.1.0", description="Evidence-first data foundation; no operational network loaded.")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

SOURCES = [
    SourceRecord(id="djb", organization="Delhi Jal Board", title="DJB public portal and GIS references", url="https://delhijalboard.delhi.gov.in/", domain="Operational assets", availability="No public pipeline download identified in this review", usage="Authoritative acquisition required", license="UNKNOWN"),
    SourceRecord(id="ogd", organization="Government of India", title="Open Government Data Platform India", url="https://data.gov.in/", domain="Public datasets", availability="Portal; no pipeline layer verified", usage="Dataset-specific review required"),
    SourceRecord(id="osm", organization="OpenStreetMap contributors", title="OpenStreetMap", url="https://www.openstreetmap.org/", domain="Context map", availability="Public map and community data", usage="Context only; never infer buried pipes", license="ODbL 1.0"),
    SourceRecord(id="geofabrik", organization="Geofabrik GmbH / OpenStreetMap contributors", title="Geofabrik India extracts", url="https://download.geofabrik.de/asia/india.html", domain="Context data", availability="India PBF and Delhi zone extracts listed", usage="OSM context only; no DJB authority", license="ODbL 1.0"),
    SourceRecord(id="copernicus", organization="Copernicus Data Space Ecosystem", title="Sentinel earth observation", url="https://dataspace.copernicus.eu/", domain="Research imagery", availability="Search and download services", usage="Surface context; not underground asset evidence", license="Sentinel data legal notice"),
    SourceRecord(id="dst", organization="Department of Science & Technology, India", title="DST geospatial policy and resources", url="https://dst.gov.in/geospatial", domain="Policy & standards", availability="Public policy and guidance documents", usage="Governance reference; not a Delhi pipe dataset", license="Document-specific"),
    SourceRecord(id="epanet", organization="US Environmental Protection Agency", title="EPANET", url="https://www.epa.gov/water-research/epanet", domain="Hydraulic modeling", availability="Public-domain application, toolkit and manuals", usage="Simulation software; requires a valid network model", license="Public domain"),
    SourceRecord(id="leakdb", organization="KIOS Research and Innovation Center of Excellence", title="LeakDB", url="https://zenodo.org/records/13985057", domain="Research benchmark", availability="Public record; 13.9 GB listed", usage="Research only; check license before use", license="UNKNOWN; record rights field blank"),
    SourceRecord(id="battledim", organization="KIOS Research and Innovation Center of Excellence", title="BattLeDIM 2020", url="https://zenodo.org/records/4017659", domain="Research benchmark", availability="Public record; approximately 550 MB listed", usage="Research only; check license before redistribution", license="UNKNOWN; record rights field blank"),
    SourceRecord(id="multisource", organization="Constantine the Philosopher University in Nitra", title="Hourly anomaly scores and leak labels", url="https://zenodo.org/records/15096167", domain="Research benchmark", availability="8,737 hourly records; CC BY 4.0; anonymized WDN", usage="Research demo; leak-proximity labels and derived anomaly scores", license="CC BY 4.0"),
    SourceRecord(id="wntr", organization="US Environmental Protection Agency", title="Water Network Tool for Resilience (WNTR)", url="https://github.com/USEPA/WNTR", domain="Hydraulic modeling", availability="Public Python package and repository", usage="Research/simulation library; not a data source", license="Revised BSD"),
    SourceRecord(id="literature", organization="Scientific publishers and patent offices", title="Publications and patent records", url="https://patents.google.com/", domain="Research literature", availability="Public search portals; record access varies", usage="Discovery only; not legal or novelty opinion", license="Record-specific"),
]

SIMULATION_MODEL = json.loads((Path(__file__).parent / "simulation_model.json").read_text(encoding="utf-8"))


@app.get("/api/health")
def health():
    return {"status": "ok", "operational_network_loaded": False}


@app.get("/api/sources", response_model=list[SourceRecord])
def list_sources():
    return SOURCES


@app.get("/api/simulation/summary")
def simulation_summary():
    dataset = SIMULATION_MODEL["dataset"]
    training = SIMULATION_MODEL["training"]
    return {
        "dataset": dataset,
        "training": training,
        "scenarios": [
            {key: value for key, value in scenario.items() if key != "features"}
            for scenario in SIMULATION_MODEL["scenarios"]
        ],
    }


@app.post("/api/simulation/run")
def run_simulation(payload: dict):
    scenario = next((item for item in SIMULATION_MODEL["scenarios"] if item["id"] == payload.get("scenario_id")), None)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Unknown benchmark scenario.")
    threshold = payload.get("threshold", 0.5)
    if not isinstance(threshold, (int, float)) or not 0.1 <= threshold <= 0.9:
        raise HTTPException(status_code=422, detail="Threshold must be between 0.1 and 0.9.")

    model = SIMULATION_MODEL["model"]
    score = model["bias"]
    contributions = []
    for index, feature in enumerate(SIMULATION_MODEL["dataset"]["feature_columns"]):
        raw = scenario["features"].get(feature)
        value = model["medians"][index] if raw is None else raw
        normalized = (value - model["means"][index]) / model["scales"][index]
        contribution = normalized * model["weights"][index]
        score += contribution
        contributions.append({"feature": feature, "value": raw, "contribution": contribution})
    score = 1 / (1 + __import__("math").exp(-max(-30, min(30, score))))
    return {
        "scenario_id": scenario["id"],
        "timestamp": scenario["timestamp"],
        "benchmark_score": score,
        "threshold": threshold,
        "flagged": score >= threshold,
        "actual_label": scenario["actual_label"],
        "label_meaning": "Within ±7 days of a recorded leak" if scenario["actual_label"] else "Outside the ±7 day leak-proximity window",
        "top_signals": sorted(contributions, key=lambda item: abs(item["contribution"]), reverse=True)[:4],
    }


@app.post("/api/imports/validate", response_model=ImportValidationResponse)
def validate_import(payload: ImportValidationRequest):
    return ImportValidationResponse(
        valid=True,
        feature_count=len(payload.dataset.features),
        message="Metadata and GeoJSON structure accepted for review. Nothing was saved or added to the operational map.",
    )


@app.post("/api/imports/stage", response_model=ImportStageResponse, status_code=201)
def stage_import(payload: ImportValidationRequest):
    canonical_data = json.dumps(payload.dataset.model_dump(mode="json"), sort_keys=True, separators=(",", ":"))
    dataset_sha256 = hashlib.sha256(canonical_data.encode("utf-8")).hexdigest()
    manifest = payload.manifest
    review = ImportReview(
        data_domain=manifest.data_domain.value,
        organization=manifest.organization,
        source_reference=manifest.source_reference,
        acquired_at=manifest.acquired_at,
        published_at=manifest.published_at,
        license=manifest.license,
        restrictions=manifest.restrictions,
        crs=manifest.crs,
        dataset_version=manifest.dataset_version,
        source_quality=manifest.source_quality,
        temporal_validity=manifest.temporal_validity,
        positional_accuracy=manifest.positional_accuracy,
        validation_evidence=manifest.validation_evidence,
        feature_count=len(payload.dataset.features),
        dataset_sha256=dataset_sha256,
        review_status="PENDING_REVIEW",
    )
    try:
        with Session(get_engine()) as session:
            session.add(review)
            session.commit()
            review_id = review.id
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except IntegrityError as error:
        raise HTTPException(status_code=409, detail="This exact GeoJSON dataset has already been staged for review.") from error
    except SQLAlchemyError as error:
        raise HTTPException(status_code=503, detail="The review database is unavailable. Nothing was staged.") from error
    return ImportStageResponse(
        id=review_id,
        data_domain=manifest.data_domain,
        review_status="PENDING_REVIEW",
        feature_count=len(payload.dataset.features),
        dataset_sha256=dataset_sha256,
        message="Provenance metadata and dataset digest were saved for review. Geometry was not stored or promoted to the asset registry.",
    )


@app.get("/api/imports/reviews", response_model=list[ImportReviewRecord])
def list_import_reviews(limit: int = Query(default=50, ge=1, le=200)):
    try:
        with Session(get_engine()) as session:
            return session.scalars(
                select(ImportReview).order_by(ImportReview.created_at.desc()).limit(limit)
            ).all()
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except SQLAlchemyError as error:
        raise HTTPException(status_code=503, detail="The review database is unavailable.") from error
