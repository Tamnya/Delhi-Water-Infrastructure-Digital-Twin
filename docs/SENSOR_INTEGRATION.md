# Sensor integration

No sensors or telemetry are connected. Future ingestion should require registered sensor identity, asset/node association and evidence for that association; measurement timestamp and timezone; observed value and unit; device/firmware identity where available; quality flags; source transport; receipt timestamp; sequence/duplicate key; and calibration/maintenance metadata.

Preserve raw observations immutably and store normalized values as derived records. Validate units, timestamp order, clock drift, stale intervals, duplicates/replays, plausible device status, and missingness. Distinguish sensor health alarms from network anomaly candidates. Require authentication, replay protection, rate limits, audit trails and retention policy before accepting live telemetry.
