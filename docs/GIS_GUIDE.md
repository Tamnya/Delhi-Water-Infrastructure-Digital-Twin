# GIS guide

The map currently uses OpenStreetMap tiles for geographic context with OSM attribution. OSM content is not treated as a water utility inventory. No pipes are inferred from streets or imagery.

When a dataset is obtained, record its CRS/datum and stated positional accuracy, validate geometry, retain original IDs and source geometry, and record each transformation. Transform only through a documented library and preserve the original coordinates. Check for empty geometries, invalid polygons, malformed coordinate arrays, duplicate identifiers, extent anomalies, and precision loss. Spatial validity is not source-authority validation. Review source metadata and a sample against an authoritative verification procedure before promotion.

Current import validation handles GeoJSON structural shape only. It does not yet test topology, projection, or positional accuracy.
