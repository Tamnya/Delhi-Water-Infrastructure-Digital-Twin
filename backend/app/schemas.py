from datetime import date, datetime
from enum import StrEnum
from math import isfinite
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator


class DataStatus(StrEnum):
    VERIFIED = "VERIFIED"
    SOURCE_REPORTED = "SOURCE_REPORTED"
    DERIVED = "DERIVED"
    ESTIMATED = "ESTIMATED"
    SIMULATED = "SIMULATED"
    UNKNOWN = "UNKNOWN"
    CONFLICTING = "CONFLICTING"


class DataDomain(StrEnum):
    OPERATIONAL_CANDIDATE = "OPERATIONAL_CANDIDATE"
    RESEARCH_BENCHMARK = "RESEARCH_BENCHMARK"
    SIMULATION = "SIMULATION"
    SENSOR_TELEMETRY = "SENSOR_TELEMETRY"
    MODEL_OUTPUT = "MODEL_OUTPUT"


class SourceRecord(BaseModel):
    id: str
    organization: str
    title: str
    url: HttpUrl
    domain: str
    availability: str
    usage: str
    license: str = "UNKNOWN"
    last_checked: date = date(2026, 11, 2)


class ImportManifest(BaseModel):
    data_domain: DataDomain
    organization: str = Field(min_length=1)
    source_reference: str = Field(min_length=1)
    acquired_at: date
    published_at: date | None = None
    license: str = Field(min_length=1)
    restrictions: str = Field(min_length=1)
    crs: str = Field(pattern=r"^(EPSG:\d{4,6}|[A-Za-z0-9_.:-]+)$")
    dataset_version: str = Field(default="UNKNOWN", min_length=1)
    source_quality: str = Field(default="UNKNOWN", min_length=1)
    temporal_validity: str = Field(default="UNKNOWN", min_length=1)
    positional_accuracy: str = Field(default="UNKNOWN", min_length=1)
    validation_evidence: str = Field(default="UNKNOWN", min_length=1)


class GeoJsonFeatureCollection(BaseModel):
    model_config = ConfigDict(extra="allow")

    type: str
    features: list[dict[str, Any]]
    crs: dict[str, Any] | str | None = None

    @model_validator(mode="after")
    def validate_collection(self):
        if self.type != "FeatureCollection":
            raise ValueError("GeoJSON type must be FeatureCollection")
        if not self.features:
            raise ValueError("FeatureCollection must contain at least one feature")
        for index, feature in enumerate(self.features):
            if feature.get("type") != "Feature":
                raise ValueError(f"Feature {index}: type must be Feature")
            geometry = feature.get("geometry")
            if not isinstance(geometry, dict) or geometry.get("type") not in {
                "Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection"
            }:
                raise ValueError(f"Feature {index}: valid geometry is required")
            if not _valid_geometry(geometry):
                raise ValueError(f"Feature {index}: coordinates do not form a valid GeoJSON geometry")
        return self


def _valid_position(value: Any) -> bool:
    return isinstance(value, list) and len(value) >= 2 and all(
        isinstance(component, (int, float)) and not isinstance(component, bool) and isfinite(component) for component in value
    )


def _valid_line(value: Any, minimum: int = 2) -> bool:
    return isinstance(value, list) and len(value) >= minimum and all(_valid_position(point) for point in value)


def _valid_geometry(geometry: dict[str, Any]) -> bool:
    kind = geometry["type"]
    coordinates = geometry.get("coordinates")
    if kind == "Point":
        return _valid_position(coordinates)
    if kind == "MultiPoint":
        return isinstance(coordinates, list) and len(coordinates) > 0 and all(_valid_position(p) for p in coordinates)
    if kind == "LineString":
        return _valid_line(coordinates)
    if kind == "MultiLineString":
        return isinstance(coordinates, list) and len(coordinates) > 0 and all(_valid_line(line) for line in coordinates)
    if kind == "Polygon":
        return _valid_polygon(coordinates)
    if kind == "MultiPolygon":
        return isinstance(coordinates, list) and len(coordinates) > 0 and all(_valid_polygon(polygon) for polygon in coordinates)
    geometries = geometry.get("geometries")
    return isinstance(geometries, list) and len(geometries) > 0 and all(
        isinstance(item, dict) and item.get("type") in {"Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon", "GeometryCollection"} and _valid_geometry(item)
        for item in geometries
    )


def _valid_polygon(rings: Any) -> bool:
    return isinstance(rings, list) and len(rings) > 0 and all(
        _valid_line(ring, minimum=4) and ring[0] == ring[-1] for ring in rings
    )


class ImportValidationRequest(BaseModel):
    manifest: ImportManifest
    dataset: GeoJsonFeatureCollection


class ImportValidationResponse(BaseModel):
    valid: bool
    feature_count: int
    status: DataStatus = DataStatus.UNKNOWN
    persistence: str = "NOT_PERSISTED"
    message: str


class ImportStageResponse(BaseModel):
    id: str
    data_domain: DataDomain
    review_status: Literal["PENDING_REVIEW"]
    feature_count: int
    dataset_sha256: str
    geometry_stored: Literal[False] = False
    message: str


class ImportReviewRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    data_domain: DataDomain
    organization: str
    source_reference: str
    acquired_at: date
    published_at: date | None
    license: str
    restrictions: str
    crs: str
    dataset_version: str
    source_quality: str
    temporal_validity: str
    positional_accuracy: str
    validation_evidence: str
    feature_count: int
    dataset_sha256: str
    review_status: Literal["PENDING_REVIEW"]
    created_at: datetime
