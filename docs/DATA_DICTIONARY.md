# Data dictionary (planned storage contract)

This dictionary defines intended semantics; these entities are not all persisted in the first milestone.

| Entity/field | Meaning | Required behavior |
|---|---|---|
| Source.id | Stable internal source reference | Never reuse for a different source |
| Source.organization / reference | Source custodian and original URL/document | Retain exact source identifier and acquisition record |
| Dataset.crs | CRS/datum for geometries | Required; do not assume or silently reproject |
| Asset.source_asset_id | Identifier supplied by source | Preserve original value |
| Asset.geometry | Source geometry | Store source CRS and transformed geometry separately when transformation is implemented |
| Attribute.value / unit | Asset property such as diameter/material/year | Unknown stays null plus UNKNOWN status; never impute silently |
| Attribute.status | Provenance state | One of the defined status values in DATA_PROVENANCE.md |
| Attribute.source_id / field | Exact origin of the attribute | Required for source-reported values |
| Attribute.method / uncertainty | Derivation/estimation method and uncertainty | Required for DERIVED/ESTIMATED |
| Observation | Sensor reading, time, value, unit, quality | Raw source record and ingestion metadata remain auditable |
| Prediction | Model output and horizon | Keep distinct from measurements; record model/version/input dataset |

## Units

Store values with explicit units and preserve original source units. Unit conversions must record source unit, target unit and conversion method. No application-wide assumed default units are defined yet.
