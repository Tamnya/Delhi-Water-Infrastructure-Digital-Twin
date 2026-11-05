# Roadmap

1. Foundation: repository, API/UI, PostGIS configuration, provenance rules. Metadata-only import staging and migration are implemented and runtime-checked; authentication and an operational asset schema remain.
2. Geographic foundation: source-aware Delhi basemap and import review. Context basemap, validation-only GeoJSON intake, and a pending metadata review queue are implemented. The queue does not retain or display geometry, so human asset review and promotion still require the original file and an authorized source; no utility geometry is available.
3. Asset registry: implement only after an authorized, documented DJB asset dataset is obtained.
4. Sensor framework: register devices and validate/audit telemetry after sensor specifications and associations are available.
5. Hydraulic integration: integrate EPANET/WNTR against documented benchmarks and later an authorized network model.
6. Detection and localization: baseline methods, controlled evaluation, uncertainty and benchmark comparison.
7. Predictive maintenance: time-aware risk and consequence models after suitable failure/history data is available.
8. Alerts and operations: evidence-linked review and inspection workflows with auditability.
9. Research/validation: reproducible experiments, ablations, sensor-loss studies, model calibration and limitations.
10. Deployment readiness: access control, security, backup, observability, data retention and production integration testing.

No phase is considered complete solely because a screen exists.
