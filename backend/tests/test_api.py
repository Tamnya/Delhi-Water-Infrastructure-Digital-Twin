from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

import app.main as main_module
from app.database import Base
from app.main import app
from app.models import ImportReview

client = TestClient(app)


def valid_import_payload(data_domain="OPERATIONAL_CANDIDATE"):
    return {
        "manifest": {"data_domain": data_domain, "organization": "Example", "source_reference": "Document 12", "acquired_at": "2026-11-02", "published_at": "2026-10-01", "license": "CC BY 4.0", "restrictions": "Research use only", "crs": "EPSG:4326", "dataset_version": "v1", "source_quality": "publisher-stated", "temporal_validity": "2018 observations", "positional_accuracy": "UNKNOWN", "validation_evidence": "Source metadata inspected"},
        "dataset": {"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "Point", "coordinates": [77.2, 28.6]}, "properties": {"asset_id": "source-1"}}]},
    }


def test_health_makes_absence_of_network_explicit():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["operational_network_loaded"] is False


def test_source_catalog_keeps_benchmarks_labeled():
    response = client.get("/api/sources")
    assert response.status_code == 200
    sources = {item["id"]: item for item in response.json()}
    assert sources["leakdb"]["domain"] == "Research benchmark"
    assert sources["djb"]["license"] == "UNKNOWN"


def test_source_catalog_covers_all_researched_source_types():
    response = client.get("/api/sources")
    assert response.status_code == 200
    sources = {item["id"]: item for item in response.json()}
    assert {"djb", "ogd", "osm", "geofabrik", "copernicus", "dst", "epanet", "leakdb", "battledim", "wntr", "literature"} <= sources.keys()
    assert sources["epanet"]["domain"] == "Hydraulic modeling"
    assert sources["leakdb"]["domain"] == "Research benchmark"


def test_import_validation_is_non_persistent():
    payload = {
        "manifest": {"data_domain": "OPERATIONAL_CANDIDATE", "organization": "Example", "source_reference": "https://example.org/data", "acquired_at": "2026-11-02", "license": "UNKNOWN", "restrictions": "UNKNOWN", "crs": "EPSG:4326"},
        "dataset": {"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "Point", "coordinates": [77.2, 28.6]}, "properties": {}}]},
    }
    response = client.post("/api/imports/validate", json=payload)
    assert response.status_code == 200
    assert response.json()["persistence"] == "NOT_PERSISTED"
    assert response.json()["feature_count"] == 1
    assert response.json()["status"] == "UNKNOWN"


def test_import_rejects_missing_provenance_and_geometry():
    response = client.post("/api/imports/validate", json={"manifest": {"organization": "Example"}, "dataset": {"type": "FeatureCollection", "features": []}})
    assert response.status_code == 422


def test_import_rejects_malformed_coordinates():
    payload = valid_import_payload()
    payload["dataset"]["features"][0]["geometry"] = {"type": "LineString", "coordinates": [[77.2, 28.6]]}
    assert client.post("/api/imports/validate", json=payload).status_code == 422


def test_stage_import_saves_metadata_digest_but_not_geometry(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    monkeypatch.setattr(main_module, "get_engine", lambda: engine)

    response = client.post("/api/imports/stage", json=valid_import_payload())

    assert response.status_code == 201
    body = response.json()
    assert body["review_status"] == "PENDING_REVIEW"
    assert body["data_domain"] == "OPERATIONAL_CANDIDATE"
    assert body["geometry_stored"] is False
    with Session(engine) as session:
        record = session.get(ImportReview, body["id"])
        assert record is not None
        assert record.feature_count == 1
        assert record.data_domain == "OPERATIONAL_CANDIDATE"
        assert record.dataset_version == "v1"
        assert record.source_quality == "publisher-stated"
        assert record.dataset_sha256 == body["dataset_sha256"]
        assert not hasattr(record, "geometry")
    engine.dispose()


def test_stage_import_rejects_duplicate_dataset(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    monkeypatch.setattr(main_module, "get_engine", lambda: engine)

    first = client.post("/api/imports/stage", json=valid_import_payload())
    second = client.post("/api/imports/stage", json=valid_import_payload())

    assert first.status_code == 201
    assert second.status_code == 409
    engine.dispose()


def test_same_dataset_can_be_staged_in_separate_domains(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    monkeypatch.setattr(main_module, "get_engine", lambda: engine)

    operational = client.post("/api/imports/stage", json=valid_import_payload("OPERATIONAL_CANDIDATE"))
    research = client.post("/api/imports/stage", json=valid_import_payload("RESEARCH_BENCHMARK"))

    assert operational.status_code == 201
    assert research.status_code == 201
    assert research.json()["data_domain"] == "RESEARCH_BENCHMARK"
    engine.dispose()


def test_import_review_queue_lists_saved_provenance_without_geometry(monkeypatch):
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    monkeypatch.setattr(main_module, "get_engine", lambda: engine)

    staged = client.post("/api/imports/stage", json=valid_import_payload())
    response = client.get("/api/imports/reviews")

    assert staged.status_code == 201
    assert response.status_code == 200
    records = response.json()
    assert len(records) == 1
    assert records[0]["id"] == staged.json()["id"]
    assert records[0]["review_status"] == "PENDING_REVIEW"
    assert records[0]["organization"] == "Example"
    assert records[0]["crs"] == "EPSG:4326"
    assert records[0]["feature_count"] == 1
    assert records[0]["dataset_sha256"] == staged.json()["dataset_sha256"]
    assert "geometry" not in records[0]
    assert "dataset" not in records[0]
    engine.dispose()


def test_stage_import_reports_database_unavailable(monkeypatch):
    def unavailable_engine():
        raise RuntimeError("DATABASE_URL is not configured.")

    monkeypatch.setattr(main_module, "get_engine", unavailable_engine)
    response = client.post("/api/imports/stage", json=valid_import_payload())
    assert response.status_code == 503
    assert response.json()["detail"] == "DATABASE_URL is not configured."
