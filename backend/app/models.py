from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import CheckConstraint, Date, DateTime, Index, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ImportReview(Base):
    __tablename__ = "import_reviews"
    __table_args__ = (
        UniqueConstraint("data_domain", "dataset_sha256", name="uq_import_reviews_domain_dataset_sha256"),
        CheckConstraint("feature_count > 0", name="ck_import_reviews_feature_count_positive"),
        CheckConstraint("data_domain IN ('OPERATIONAL_CANDIDATE', 'RESEARCH_BENCHMARK', 'SIMULATION', 'SENSOR_TELEMETRY', 'MODEL_OUTPUT')", name="ck_import_reviews_data_domain"),
        CheckConstraint("review_status = 'PENDING_REVIEW'", name="ck_import_reviews_status"),
        Index("ix_import_reviews_created_at", "created_at"),
        Index("ix_import_reviews_review_status", "review_status"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    data_domain: Mapped[str] = mapped_column(String(32), nullable=False)
    organization: Mapped[str] = mapped_column(Text, nullable=False)
    source_reference: Mapped[str] = mapped_column(Text, nullable=False)
    acquired_at: Mapped[date] = mapped_column(Date, nullable=False)
    published_at: Mapped[date | None] = mapped_column(Date, nullable=True)
    license: Mapped[str] = mapped_column(Text, nullable=False)
    restrictions: Mapped[str] = mapped_column(Text, nullable=False)
    crs: Mapped[str] = mapped_column(String(128), nullable=False)
    dataset_version: Mapped[str] = mapped_column(Text, nullable=False, default="UNKNOWN")
    source_quality: Mapped[str] = mapped_column(Text, nullable=False, default="UNKNOWN")
    temporal_validity: Mapped[str] = mapped_column(Text, nullable=False, default="UNKNOWN")
    positional_accuracy: Mapped[str] = mapped_column(Text, nullable=False, default="UNKNOWN")
    validation_evidence: Mapped[str] = mapped_column(Text, nullable=False, default="UNKNOWN")
    feature_count: Mapped[int] = mapped_column(Integer, nullable=False)
    dataset_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    review_status: Mapped[str] = mapped_column(String(24), nullable=False, default="PENDING_REVIEW")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
