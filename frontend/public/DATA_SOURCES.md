# Data source availability report

Research checked on 2026-11-02. This records what public pages state and what this project actually inspected. No dataset was downloaded or integrated during this milestone.

| Source | Observed contents/access | Suitability and limits |
|---|---|---|
| [Delhi Jal Board](https://delhijalboard.delhi.gov.in/) | Public portal; searchable documents are primarily PDF tender material. A 2018 technical bid says DJB used ArcGIS and that an existing distribution-network base map was available to DJB, while warning it might not represent the network at the contract start; a later tender document refers to GIS mapping of water pipelines and sewers. The portal did not expose a downloadable pipe layer/API in this check. | Delhi operational context; actual coverage, temporal currency, file format, license, positional accuracy, and release route for the internal map remain unverified. Authoritative custodian to contact, but tender references do not grant access. |
| [Open Government Data Platform India](https://data.gov.in/) | Public dataset catalogue. Portal timed out in this check; no Delhi water-pipeline dataset was found in the searches performed. OGD guidance describes machine-readable formats including CSV, XLS/ODS, XML, KML, GML and RSS/Atom; registered users can generate API keys for API URLs. | India-wide government catalogue, dataset-specific geography and temporal coverage vary. No relevant data identified. Verify each record's source, access method, license, update frequency, and metadata before use. |
| [OpenStreetMap](https://www.openstreetmap.org/) | Global community-maintained vector database. ODbL; attribution and share-alike obligations apply to database use. | Suitable for contextual roads/place mapping where tags exist. Coverage and positional accuracy vary. OSM is not an authoritative DJB network inventory; roads cannot be used to infer buried pipe routes. |
| [Geofabrik India extract](https://download.geofabrik.de/asia/india.html) | India PBF extract and Delhi administrative-zone subregion extracts were listed as current on the checked page. Page identifies OSM contributors and ODbL 1.0. | Can support an OSM context layer after deliberate download/import. It is an India-scale extract and not a verified water-network dataset; full India download is large. This project has not downloaded it. |
| [Copernicus Data Space](https://dataspace.copernicus.eu/) | Public global and historical Earth-observation catalogue. Browser services and APIs include OData, STAC, Sentinel Hub Catalog, and OGC map/feature/coverage services. Product access/download may require account authorization; Sentinel products are available in native product archives and through services. Sentinel data is stated free/full/open under its legal notice; other portal material can have narrower terms. | Temporal coverage depends on mission/product. Useful for surface/land-cover context and change analysis. Optical/radar imagery does not establish underground pipe location or confirm a leak. No Delhi product queried or downloaded. |
| [DST geospatial resources](https://dst.gov.in/geospatial) | Policy, guidelines, standards and related program material. The 2021 geospatial guidelines describe liberalized acquisition subject to the sensitive-attributes list and related restrictions. | Governance and policy source, not itself a Delhi pipe dataset. Data rights, sensitivity, organizational policy, and current rules still require review. |
| [US EPA EPANET](https://www.epa.gov/water-research/epanet) | Public-domain Windows application, toolkit, manuals and source project. EPANET 2.2 software/toolkit listed by EPA dated 2020-07-23; model inputs use EPANET network descriptions (commonly `.inp`). | No geographic coverage or observation period: it is software. Engineering/research simulation only. Requires a valid network model and boundary/operating inputs; simulation output is not field measurement. |
| [LeakDB](https://zenodo.org/records/13985057) | Public Zenodo v1 (published 2024-10-24), global synthetic benchmark scenarios; record lists one 13.9 GB ZIP archive. The Rights/License field was blank in the page view checked; archive contents were not inspected. | Research benchmark only, not Delhi. No field observation period established from the record summary. Do not assume license from public access; confirm terms and archive contents before use. Not downloaded. |
| [BattLeDIM](https://zenodo.org/records/4017659) | Public Zenodo v1 (published 2020-09-07), L-Town benchmark. Record lists XLSX/CSV SCADA and demand records, leakage CSV/text, configuration YAML, and EPANET `.inp` network files, totaling about 550.5 MB. The Zenodo Rights/License field was blank in the checked view; a third-party catalog describes CC BY 4.0, so verify directly before redistribution. | Research benchmark with recorded 2018 data and a separate 2019 evaluation described in competition materials. Associated with a benchmark/virtual network, not Delhi. Not downloaded; benchmark performance does not establish Delhi performance. |
| [WNTR](https://github.com/USEPA/WNTR) | EPA Python package for water network resilience analyses and simulations; repository states Revised BSD license. | Research/simulation library. It does not provide Delhi network data. Pin a supported release and validate against EPANET when integration begins. |
| Scientific publications and patent databases | Public search surfaced BattLeDIM results and review literature, and patent records such as [US20240084561A1](https://patents.google.com/patent/US20240084561A1). | Initial discovery only, not a novelty, freedom-to-operate, or patentability assessment. Patent claims and legal status require formal review. |

## Delhi Jal Board acquisition checklist

- Request the current authoritative water distribution and transmission asset layers from the DJB Mapping Cell, including whether sewer assets are in separate layers.
- Request data custodian, permitted operational/research uses, license/authorization, sensitivity restrictions, and storage/sharing requirements.
- Request export format/service, schema, unique source identifiers, network topology, node/valve/reservoir/pump relationships, and source system/version.
- Request publication/acquisition/update dates, geographic coverage, coordinate reference system and datum, positional accuracy, completeness, and known gaps.
- Request attribute definitions and field-level provenance for material, diameter, installation year, depth, ownership, status, and repair history; preserve missing values as UNKNOWN.
- Request as-built / survey evidence, validation procedure, update workflow, and change history.
- Clarify whether derived geometry may be stored, transformed, shared, or shown in this application; document approval before import.
- Validate a representative sample with DJB before promoting records from SOURCE_REPORTED to VERIFIED.

## Sources checked

- DJB GIS tender reference: [DJB tender document](https://delhijalboard.delhi.gov.in/sites/default/files/Jalboard/tender/tendernotice_1.pdf) and [DJB technical bid](https://delhijalboard.delhi.gov.in/sites/default/files/delhijalboard_data/Volume_1_Technical_Bid-Part-A_0.pdf).
- OGD formats and API access: [data.gov.in help](https://www.data.gov.in/help) and [NDSAP implementation guidance](https://data.gov.in/sites/default/files/NDSAP_Implementation_Guidelines_2.2.pdf).
- OSM terms: [OSM copyright and license](https://www.openstreetmap.org/copyright).
- Geofabrik: [India extract listing](https://download.geofabrik.de/asia/india.html).
- Copernicus: [Data Space terms](https://dataspace.copernicus.eu/terms-and-conditions).
- Copernicus interfaces: [Catalogue APIs](https://dataspace.copernicus.eu/analyse/apis/catalogue-apis), [OData documentation](https://documentation.dataspace.copernicus.eu/APIs/OData.html).
- DST: [Geospatial guidelines page](https://dst.gov.in/geospatial).
- EPA: [EPANET](https://www.epa.gov/water-research/epanet).
- LeakDB: [Zenodo record](https://zenodo.org/records/13985057).
- BattLeDIM: [Zenodo record](https://zenodo.org/records/4017659).
- WNTR: [USEPA repository](https://github.com/USEPA/WNTR).
