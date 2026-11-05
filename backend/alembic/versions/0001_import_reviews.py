"""Create metadata-only import review records.

Revision ID: 0001_import_reviews
Revises:
Create Date: 2026-11-02
"""

from alembic import op
import sqlalchemy as sa

revision = "0001_import_reviews"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    op.create_table(
        "import_reviews",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("data_domain", sa.String(length=32), nullable=False),
        sa.Column("organization", sa.Text(), nullable=False),
        sa.Column("source_reference", sa.Text(), nullable=False),
        sa.Column("acquired_at", sa.Date(), nullable=False),
        sa.Column("published_at", sa.Date(), nullable=True),
        sa.Column("license", sa.Text(), nullable=False),
        sa.Column("restrictions", sa.Text(), nullable=False),
        sa.Column("crs", sa.String(length=128), nullable=False),
        sa.Column("dataset_version", sa.Text(), nullable=False),
        sa.Column("source_quality", sa.Text(), nullable=False),
        sa.Column("temporal_validity", sa.Text(), nullable=False),
        sa.Column("positional_accuracy", sa.Text(), nullable=False),
        sa.Column("validation_evidence", sa.Text(), nullable=False),
        sa.Column("feature_count", sa.Integer(), nullable=False),
        sa.Column("dataset_sha256", sa.String(length=64), nullable=False),
        sa.Column("review_status", sa.String(length=24), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("feature_count > 0", name="ck_import_reviews_feature_count_positive"),
        sa.CheckConstraint("data_domain IN ('OPERATIONAL_CANDIDATE', 'RESEARCH_BENCHMARK', 'SIMULATION', 'SENSOR_TELEMETRY', 'MODEL_OUTPUT')", name="ck_import_reviews_data_domain"),
        sa.CheckConstraint("review_status = 'PENDING_REVIEW'", name="ck_import_reviews_status"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("data_domain", "dataset_sha256", name="uq_import_reviews_domain_dataset_sha256"),
    )
    op.create_index("ix_import_reviews_created_at", "import_reviews", ["created_at"])
    op.create_index("ix_import_reviews_review_status", "import_reviews", ["review_status"])


def downgrade() -> None:
    op.drop_index("ix_import_reviews_review_status", table_name="import_reviews")
    op.drop_index("ix_import_reviews_created_at", table_name="import_reviews")
    op.drop_table("import_reviews")
