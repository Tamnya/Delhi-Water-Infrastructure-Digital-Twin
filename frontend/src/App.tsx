import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Activity, AlertTriangle, ArrowDownToLine, ArrowUpRight, BookOpen, Check, Database, FileUp, Layers3, Map as MapIcon, Search, ShieldCheck, Waves, X } from 'lucide-react'
import Aurora from './components/Aurora'
import { DemoNotice, EmployeeDashboard, PortalRole, PortalTask, DemoGrievance, PublicServicesView, SimulatedRiskBanner, TourPanel, demoEmployees } from './PortalViews'
import simulationData from './data/simulation_model.json'

type Source = { id: string; organization: string; title: string; url: string; domain: string; availability: string; usage: string; license: string }
type ImportReview = { id: string; data_domain: string; organization: string; source_reference: string; acquired_at: string; published_at: string | null; license: string; restrictions: string; crs: string; dataset_version: string; source_quality: string; temporal_validity: string; positional_accuracy: string; validation_evidence: string; feature_count: number; dataset_sha256: string; review_status: 'PENDING_REVIEW'; created_at: string }
type Section = 'overview' | 'map' | 'sources' | 'imports' | 'research' | 'simulation' | 'help' | 'employee' | 'admin'
const api = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:8000')

const fallbackSources: Source[] = [
  { id: 'djb', organization: 'Delhi Jal Board', title: 'DJB public portal and GIS references', url: 'https://delhijalboard.delhi.gov.in/', domain: 'Operational assets', availability: 'No public pipeline download identified in this review', usage: 'Authoritative acquisition required', license: 'UNKNOWN' },
  { id: 'ogd', organization: 'Government of India', title: 'Open Government Data Platform India', url: 'https://data.gov.in/', domain: 'Public datasets', availability: 'Portal; no pipeline layer verified', usage: 'Dataset-specific review required', license: 'UNKNOWN' },
  { id: 'osm', organization: 'OpenStreetMap contributors', title: 'OpenStreetMap', url: 'https://www.openstreetmap.org/', domain: 'Context map', availability: 'Public map and community data', usage: 'Context only; never infer buried pipes', license: 'ODbL 1.0' },
  { id: 'geofabrik', organization: 'Geofabrik GmbH / OpenStreetMap contributors', title: 'Geofabrik India extracts', url: 'https://download.geofabrik.de/asia/india.html', domain: 'Context data', availability: 'India PBF and Delhi zone extracts listed', usage: 'OSM context only; no DJB authority', license: 'ODbL 1.0' },
  { id: 'copernicus', organization: 'Copernicus Data Space Ecosystem', title: 'Sentinel earth observation', url: 'https://dataspace.copernicus.eu/', domain: 'Research imagery', availability: 'Search and download services', usage: 'Surface context; not underground asset evidence', license: 'Sentinel data legal notice' },
  { id: 'dst', organization: 'Department of Science & Technology, India', title: 'DST geospatial policy and resources', url: 'https://dst.gov.in/geospatial', domain: 'Policy & standards', availability: 'Public policy and guidance documents', usage: 'Governance reference; not a Delhi pipe dataset', license: 'Document-specific' },
  { id: 'epanet', organization: 'US Environmental Protection Agency', title: 'EPANET', url: 'https://www.epa.gov/water-research/epanet', domain: 'Hydraulic modeling', availability: 'Public-domain application, toolkit and manuals', usage: 'Simulation software; requires a valid network model', license: 'Public domain' },
  { id: 'leakdb', organization: 'KIOS Research and Innovation Center of Excellence', title: 'LeakDB', url: 'https://zenodo.org/records/13985057', domain: 'Research benchmark', availability: 'Public record; 13.9 GB listed', usage: 'Research only; check license before use', license: 'UNKNOWN' },
  { id: 'battledim', organization: 'KIOS Research and Innovation Center of Excellence', title: 'BattLeDIM 2020', url: 'https://zenodo.org/records/4017659', domain: 'Research benchmark', availability: 'Public record; approximately 550 MB listed', usage: 'Research only; check license before redistribution', license: 'UNKNOWN' },
  { id: 'multisource', organization: 'Constantine the Philosopher University in Nitra', title: 'Hourly anomaly scores and leak labels', url: 'https://zenodo.org/records/15096167', domain: 'Research benchmark', availability: '8,737 hourly records; CC BY 4.0; anonymized WDN', usage: 'Research demo; leak-proximity labels and derived anomaly scores', license: 'CC BY 4.0' },
  { id: 'wntr', organization: 'US Environmental Protection Agency', title: 'Water Network Tool for Resilience (WNTR)', url: 'https://github.com/USEPA/WNTR', domain: 'Hydraulic modeling', availability: 'Public Python package and repository', usage: 'Research/simulation library; not a data source', license: 'Revised BSD' },
  { id: 'literature', organization: 'Scientific publishers and patent offices', title: 'Publications and patent records', url: 'https://patents.google.com/', domain: 'Research literature', availability: 'Public search portals; record access varies', usage: 'Discovery only; not legal or novelty opinion', license: 'Record-specific' },
]

const navItems: { id: Section; label: string; icon: typeof Activity; group: string }[] = [
  { id: 'overview', label: 'Overview', icon: Activity, group: 'WORKSPACE' },
  { id: 'map', label: 'Map & assets', icon: MapIcon, group: 'WORKSPACE' },
  { id: 'sources', label: 'Data sources', icon: Database, group: 'DATA' },
  { id: 'imports', label: 'Import data', icon: FileUp, group: 'DATA' },
  { id: 'research', label: 'Research bench', icon: BookOpen, group: 'RESEARCH' },
  { id: 'simulation', label: 'Simulation lab', icon: Activity, group: 'RESEARCH' },
]

const staffTasks: PortalTask[] = [
  { id: 'DEMO-T-101', title: 'Review sample pressure alert', zone: 'Sample Zone North', assignedTo: demoEmployees[0].name, employeeId: demoEmployees[0].id, due: '2026-11-12', status: 'In progress', progress: 40, report: 'Initial review started using fictional readings.', remarks: 'Awaiting sample supervisor review.', priority: 'High' },
  { id: 'DEMO-T-102', title: 'Check sample valve record', zone: 'Sample Zone Central', assignedTo: demoEmployees[1].name, employeeId: demoEmployees[1].id, due: '2026-11-14', status: 'Assigned', progress: 0, report: '', remarks: '', priority: 'Routine' },
  { id: 'DEMO-T-103', title: 'Prepare sample zone report', zone: 'Sample Zone South', assignedTo: demoEmployees[2].name, employeeId: demoEmployees[2].id, due: '2026-11-16', status: 'Needs review', progress: 80, report: 'Draft report prepared with synthetic values.', remarks: 'Review before closing.', priority: 'Routine' },
]

function App() {
  const [section, setSection] = useState<Section>('overview')
  const [role, setRole] = useState<PortalRole>('public')
  const [employeeId, setEmployeeId] = useState(demoEmployees[0].id)
  const [tasks, setTasks] = useState(staffTasks)
  const [grievances, setGrievances] = useState<DemoGrievance[]>([])
  const [sources, setSources] = useState<Source[]>(fallbackSources)
  const [apiState, setApiState] = useState<'loading' | 'connected' | 'offline'>('loading')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [reviewRefresh, setReviewRefresh] = useState(0)
  const reduceMotion = useReducedMotion()

  const visibleNav = navItems.filter(item => role === 'admin' || ['overview', 'map', 'sources', 'research', 'simulation'].includes(item.id) || (role === 'supervisor' && item.id === 'research'))
  const changeRole = (next: PortalRole) => { setRole(next); setSection(next === 'public' ? 'overview' : next === 'admin' ? 'admin' : 'employee') }
  const updateTask = (id: string, patch: Partial<PortalTask>) => setTasks(current => current.map(task => task.id === id ? { ...task, ...patch } : task))
  const assignTask = (task: Omit<PortalTask, 'id'>) => setTasks(current => [{ ...task, id: `DEMO-T-${String(Date.now()).slice(-5)}` }, ...current])

  useEffect(() => {
    fetch(`${api}/api/sources`).then(r => { if (!r.ok) throw new Error('API unavailable'); return r.json() })
      .then((data: Source[]) => { setSources(data); setApiState('connected') }).catch(() => setApiState('offline'))
  }, [])

  const filtered = useMemo(() => sources.filter(s => `${s.title} ${s.organization} ${s.domain}`.toLowerCase().includes(query.toLowerCase())), [sources, query])

  return <div className="experience-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setSection('overview')} aria-label="Jalsetu home"><span className="brand-mark"><Waves size={19}/></span><span><strong>jalsetu</strong><small>WATER, WITH PROOF</small></span></button>
      <nav className="primary-nav" aria-label="Main navigation">{visibleNav.map(item => { const Icon = item.icon; return <motion.button key={item.id} data-nav={item.id} className={`nav-item ${section === item.id ? 'active' : ''}`} onClick={() => setSection(item.id)} whileTap={reduceMotion ? undefined : { scale: .96 }}><Icon size={15}/><span>{item.label}</span>{section === item.id && <motion.i className="nav-indicator" layoutId="nav-indicator" transition={{ type: 'spring', stiffness: 420, damping: 34 }}/>}</motion.button> })}{role !== 'public' && <><button className={`nav-item ${['employee', 'overview'].includes(section) && role !== 'admin' ? 'active' : ''}`} onClick={() => setSection('employee')}><Activity size={15}/><span>My dashboard</span></button>{role === 'admin' && <button className={`nav-item ${section === 'admin' ? 'active' : ''}`} onClick={() => setSection('admin')}><ShieldCheck size={15}/><span>Admin</span></button>}</>}<button className={`nav-item ${section === 'help' ? 'active' : ''}`} onClick={() => setSection('help')}><Search size={15}/><span>Help & FAQs</span></button></nav>
      <div className="top-actions"><label className="role-preview"><span>VIEW AS</span><select value={role} onChange={event => changeRole(event.target.value as PortalRole)} aria-label="Switch demo role"><option value="public">Public</option><option value="field">Employee</option><option value="supervisor">Supervisor</option><option value="admin">Admin</option></select></label><div className={`api-status ${apiState}`}><i/>{apiState === 'connected' ? 'API connected' : apiState === 'offline' ? 'Local catalog' : 'Connecting'}</div><TourPanel/></div>
    </header>
    <main className="main-area">
      <div className="portal-banners"><DemoNotice/><SimulatedRiskBanner/></div>
      {role !== 'public' && <div className="employee-picker"><span>DEMO EMPLOYEE PROFILE</span><select value={employeeId} onChange={event => setEmployeeId(event.target.value)}>{demoEmployees.map(person => <option key={person.id} value={person.id}>{person.name} · {person.id}</option>)}</select></div>}
      <AnimatePresence mode="wait" initial={false}><motion.section key={section} className={`page-content page-${section}`} initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14, filter: 'blur(5px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, filter: 'blur(3px)' }} transition={{ duration: reduceMotion ? .01 : .28, ease: [0.22, 1, 0.36, 1] }}>
        {section === 'overview' && role !== 'public' ? <EmployeeDashboard role={role} employeeId={employeeId} tasks={tasks} onTaskUpdate={updateTask} onAssign={assignTask}/> : null}
        {section === 'overview' && role === 'public' && <Overview sourceCount={sources.length} reduceMotion={Boolean(reduceMotion)} onOpenMap={() => setSection('map')} onOpenSources={() => setSection('help')} onOpenImports={() => setSection('help')} onOpenResearch={() => setSection('simulation')} />}
        {section === 'map' && <MapView onOpenIntake={() => setSection(role === 'admin' ? 'imports' : 'help')}/>}
        {section === 'sources' && <SourcesView sources={filtered} query={query} onQuery={setQuery}/>}
        {section === 'imports' && <><ImportView onNotice={setNotice} onStaged={() => setReviewRefresh(value => value + 1)}/><ImportReviewQueue refresh={reviewRefresh}/></>}
        {section === 'research' && <ResearchView sources={sources.filter(s => s.domain === 'Research benchmark')}/>}
        {section === 'simulation' && <SimulationView/>}
        {section === 'help' && <PublicServicesView grievances={grievances} onSubmit={item => setGrievances(current => [item, ...current])}/>}
        {section === 'employee' && role !== 'public' && <EmployeeDashboard role={role} employeeId={employeeId} tasks={tasks} onTaskUpdate={updateTask} onAssign={assignTask}/>}
        {section === 'admin' && role === 'admin' && <EmployeeDashboard role="admin" employeeId={employeeId} tasks={tasks} onTaskUpdate={updateTask} onAssign={assignTask}/>}
      </motion.section></AnimatePresence>
      <footer className="page-footer"><span><ShieldCheck size={14}/> No verified water-network geometry is currently loaded</span><span>Build 0.4 · Evidence status: <b>RESEARCH PROTOTYPE</b></span></footer>
    </main>
    {notice && <div className="toast"><Check size={17}/>{notice}<button onClick={() => setNotice('')}><X size={15}/></button></div>}
  </div>
}

function Overview({ sourceCount, reduceMotion, onOpenMap, onOpenSources, onOpenImports, onOpenResearch }: { sourceCount: number; reduceMotion: boolean; onOpenMap: () => void; onOpenSources: () => void; onOpenImports: () => void; onOpenResearch: () => void }) {
  const steps = [
    { n: '01', title: 'Find the source', text: 'Start with an authoritative record and keep its provenance attached.', icon: Database, action: 'Browse source library', go: onOpenSources, tint: 'mint' },
    { n: '02', title: 'Qualify the data', text: 'Check shape, coordinate system, rights and what the file can support.', icon: FileUp, action: 'Open the intake', go: onOpenImports, tint: 'peach' },
    { n: '03', title: 'Explore carefully', text: 'Use public research benchmarks in their own separated workspace.', icon: BookOpen, action: 'Visit research bench', go: onOpenResearch, tint: 'lavender' },
  ]
  return <div className="overview-experience">
    <section className="hero-stage">
      <Aurora colorStops={['#10b8a6', '#d8ff62', '#36d6af']} amplitude={1.15} blend={.46} speed={.32} height={.72} scale={1.2} glow={.7} layers={2} mouseInteraction opacity={.92} className="hero-aurora" />
      <div className="hero-grain" aria-hidden="true" />
      <motion.div className="hero-copy" initial={reduceMotion ? false : { opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? .01 : .7, ease: [.22, 1, .36, 1] }}>
        <div className="hero-kicker"><span className="live-beacon"/> A WATER TWIN, IN THE MAKING <i/> DELHI, INDIA</div>
        <h1 className="hero-title">Let the water<br/><em>tell its story.</em></h1>
        <p className="hero-lede">A living picture of a city’s water system starts with one thing: <strong>evidence you can trust.</strong></p>
        <div className="hero-ctas"><motion.button className="button hero-primary" onClick={onOpenImports} whileHover={{ scale: 1.035 }} whileTap={{ scale: .97 }}>Bring a source into view <ArrowUpRight size={17}/></motion.button><button className="hero-secondary" onClick={onOpenMap}><span className="round-arrow"><MapIcon size={15}/></span> Explore the map</button></div>
        <div className="hero-footnote"><ShieldCheck size={14}/> Real records only. No imagined pipes, readings or incidents.</div>
      </motion.div>
      <motion.div className="hero-art" initial={reduceMotion ? false : { opacity: 0, scale: .88, rotate: -5 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: reduceMotion ? .01 : 1, delay: .12, type: 'spring', stiffness: 70, damping: 18 }} aria-label="Abstract water-inspired artwork; it does not represent mapped infrastructure">
        <div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-orbit orbit-three"/>
        <div className="water-core"><div className="core-wave wave-a"/><div className="core-wave wave-b"/><span>J</span></div>
        <div className="orbit-dot dot-a"/><div className="orbit-dot dot-b"/><div className="orbit-dot dot-c"/>
        <motion.div className="float-note note-top" animate={reduceMotion ? undefined : { y: [0, -8, 0] }} transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}><i/> SOURCE-LED <b>{sourceCount}</b><small>references catalogued</small></motion.div>
        <motion.div className="float-note note-bottom" animate={reduceMotion ? undefined : { y: [0, 7, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: .7 }}><span className="lock-ring"><ShieldCheck size={13}/></span><span><b>Proof before prediction</b><small>Every layer earns its place</small></span></motion.div>
        <span className="art-caption">AN ABSTRACT WATER FIELD · NOT GEOGRAPHIC DATA</span>
      </motion.div>
      <div className="hero-stamp"><span>01</span><i/> FOUNDATION</div>
    </section>

    <div className="truth-ribbon"><span className="ribbon-mark"><Waves size={16}/></span><span className="ribbon-label">CURRENT REALITY</span><span className="ribbon-main">The verified Delhi pipe network is not connected yet.</span><button onClick={onOpenSources}>See what is needed <ArrowUpRight size={14}/></button><span className="ribbon-orb" aria-hidden="true"/></div>

    <section className="journey-section"><div className="journey-heading"><div><div className="eyebrow"><span className="eyebrow-dot"/> A GOOD TWIN GROWS IN LAYERS</div><h2>Start with what’s <em>known.</em></h2></div><p>From source records to an operational picture—one carefully checked layer at a time.</p></div>
      <div className="journey-grid">{steps.map((step, index) => { const Icon = step.icon; return <motion.button key={step.n} className={`journey-card ${step.tint}`} onClick={step.go} initial={reduceMotion ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ delay: reduceMotion ? 0 : index * .09, duration: reduceMotion ? .01 : .55 }} whileHover={reduceMotion ? undefined : { y: -7, transition: { duration: .2 } }} whileTap={reduceMotion ? undefined : { scale: .985 }}><span className="journey-number">{step.n} <i/></span><span className="journey-icon"><Icon size={21}/></span><b>{step.title}</b><span className="journey-text">{step.text}</span><span className="journey-link">{step.action}<ArrowUpRight size={14}/></span><span className="card-spark" aria-hidden="true">✳</span></motion.button> })}</div>
    </section>

    <section className="reality-section"><div className="reality-copy"><div className="eyebrow"><span className="eyebrow-dot"/> A CLEAR STARTING POINT</div><h2>Plenty of potential.<br/><em>Nothing made up.</em></h2><p>The workspace is ready for records and research. It does not yet have verified pipelines, live sensor data, or operational detections.</p></div><div className="reality-list"><div><span className="reality-dot muted-dot"/><span>Verified water assets</span><b>Not connected</b></div><div><span className="reality-dot muted-dot"/><span>Sensor telemetry</span><b>Not configured</b></div><div><span className="reality-dot amber-dot"/><span>Source catalog</span><b>{sourceCount} references</b></div><div><span className="reality-dot green-dot"/><span>Research workspace</span><b>Separate & ready</b></div></div></section>
    <section className="end-note"><span>JALSETU <i>✳</i> DELHI WATER INFRASTRUCTURE</span><span>BUILT FOR PROOF, THEN POSSIBILITY</span></section>
  </div>
}

function MapView({ onOpenIntake }: { onOpenIntake: () => void }) {
  return <><div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> OPERATIONAL GEOGRAPHY</div><h1 className="compact-title">Map & assets</h1><p className="intro">Geographic context with source-aware infrastructure layers.</p></div><span className="pill amber large-pill"><AlertTriangle size={13}/> NETWORK UNAVAILABLE</span></div><div className="map-layout"><div className="map-workspace"><MapContainer center={[28.6139,77.209]} zoom={11} zoomControl={false} className="full-map"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><ZoomControl position="bottomright"/></MapContainer><div className="map-tools"><span className="map-context-chip"><Layers3 size={15}/> OSM CONTEXT · NO ASSETS</span></div><div className="map-empty map-empty-large"><div className="empty-symbol"><Waves size={22}/></div><b>Water network not connected</b><span>Only geographic context is shown. No pipe locations are inferred.</span><button onClick={onOpenIntake}>Import verified data <ArrowUpRight size={14}/></button></div><div className="map-scale">Delhi, India · Basemap from OpenStreetMap</div></div><aside className="map-side"><div className="side-title"><h3>Asset registry</h3><span className="pill slate">0 ASSETS</span></div><div className="registry-empty"><div className="registry-icon"><Database size={20}/></div><b>No verified assets</b><p>Asset records will appear after a source-backed dataset has been validated and approved.</p><button className="button secondary" onClick={onOpenIntake}><FileUp size={15}/> Start an import</button></div><div className="side-divider"/><div className="source-metadata"><span>LAYER STATUS</span><b><i className="dot muted"/> Water pipelines</b><small>Source: Not connected</small><small>Geometry: UNKNOWN</small><small>Validation: Not started</small></div></aside></div></>
}

function SourcesView({ sources, query, onQuery }: { sources: Source[]; query: string; onQuery: (s: string) => void }) {
  return <><div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> PROVENANCE & ACQUISITION</div><h1 className="compact-title">Data sources</h1><p className="intro">Track origin, access and appropriate use before data enters the workspace.</p></div><a className="button primary link-button" href="/DATA_SOURCES.md" target="_blank">Data acquisition report <ArrowUpRight size={15}/></a></div><div className="status-banner subtle-banner"><div className="banner-icon"><ShieldCheck size={18}/></div><div className="banner-copy"><b>Source existence does not equal verified asset data</b><p>Each dataset needs its own provenance, license, coverage and quality review before import.</p></div></div><div className="table-toolbar"><div className="search-box"><Search size={16}/><input placeholder="Search sources or organizations" value={query} onChange={e => onQuery(e.target.value)}/></div><span className="table-count">{sources.length} sources documented</span></div><div className="source-table"><div className="table-head"><span>DATA SOURCE</span><span>DOMAIN</span><span>ACCESS & STATUS</span><span>LICENSE</span><span/></div>{sources.map(s => <div className="table-row" key={s.id}><div className="source-name"><div className={`source-logo ${s.id}`}>{s.id === 'djb' ? 'D' : s.id === 'osm' ? 'O' : s.id === 'leakdb' || s.id === 'battledim' ? 'R' : 'G'}</div><div><b>{s.title}</b><small>{s.organization}</small></div></div><span><span className={`domain-tag ${s.domain === 'Research benchmark' ? 'research-tag' : ''}`}>{s.domain}</span></span><span className="access-cell">{s.availability}</span><span className="license-cell">{s.license}</span><a className="external-link" href={s.url} target="_blank" rel="noreferrer" aria-label={`Open ${s.title}`}><ArrowUpRight size={16}/></a></div>)}</div><div className="note-box"><AlertTriangle size={17}/><p><b>Data acquisition status:</b> DJB public references describe GIS and pipeline mapping work, but this project has not received a downloadable authoritative network layer. Request current data, permission and metadata directly from DJB.</p></div></>
}

function ImportView({ onNotice, onStaged }: { onNotice: (s: string) => void; onStaged: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [validatedFile, setValidatedFile] = useState<File | null>(null)
  const [dataDomain, setDataDomain] = useState('')
  const [org, setOrg] = useState('')
  const [reference, setReference] = useState('')
  const [license, setLicense] = useState('UNKNOWN')
  const [restrictions, setRestrictions] = useState('UNKNOWN')
  const [crs, setCrs] = useState('')
  const [acquired, setAcquired] = useState('')
  const [published, setPublished] = useState('')
  const [datasetVersion, setDatasetVersion] = useState('UNKNOWN')
  const [sourceQuality, setSourceQuality] = useState('UNKNOWN')
  const [temporalValidity, setTemporalValidity] = useState('UNKNOWN')
  const [positionalAccuracy, setPositionalAccuracy] = useState('UNKNOWN')
  const [validationEvidence, setValidationEvidence] = useState('Not yet reviewed')
  const [result, setResult] = useState('')
  const [busy, setBusy] = useState(false)
  const [staging, setStaging] = useState(false)
  const [stageResult, setStageResult] = useState('')
  const [preparedRequest, setPreparedRequest] = useState<{ manifest: Record<string, unknown>; dataset: unknown } | null>(null)
  const [validatedSignature, setValidatedSignature] = useState('')
  const requestSignature = JSON.stringify([dataDomain, org, reference, license, restrictions, crs, acquired, published, datasetVersion, sourceQuality, temporalValidity, positionalAccuracy, validationEvidence])
  const blankCsv = () => { const content = 'data_domain,source_id,organization,source_reference,acquired_at,publication_date,dataset_version,license,restrictions,source_quality,temporal_validity,positional_accuracy,validation_evidence,crs,asset_id,geometry_wkt,attribute_name,attribute_value,unit,data_status,attribute_source,method,uncertainty\n'; const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type:'text/csv'}));a.download='asset_import_template.csv';a.click();URL.revokeObjectURL(a.href) }
  const validate = async () => {
    if (!file) { setResult('Choose a GeoJSON file first.'); return }
    setBusy(true); setResult(''); setStageResult(''); setPreparedRequest(null); setValidatedSignature(''); setValidatedFile(null)
    try {
      const dataset = JSON.parse(await file.text())
      const requestBody = { manifest: { data_domain: dataDomain, organization: org, source_reference: reference, acquired_at: acquired, published_at: published || null, license, restrictions, crs, dataset_version: datasetVersion, source_quality: sourceQuality, temporal_validity: temporalValidity, positional_accuracy: positionalAccuracy, validation_evidence: validationEvidence }, dataset }
      const response = await fetch(`${api}/api/imports/validate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail?.map((d: { msg: string }) => d.msg).join('; ') || 'Validation failed.')
      setPreparedRequest(requestBody)
      setValidatedFile(file)
      setValidatedSignature(requestSignature)
      setResult(`${body.feature_count} feature${body.feature_count === 1 ? '' : 's'} passed structural checks. ${body.message}`)
      onNotice('GeoJSON structure validated; no records were saved.')
    } catch (e) { setResult(e instanceof Error ? e.message : 'Could not validate this file.') }
    finally { setBusy(false) }
  }
  const stage = async () => {
    if (!preparedRequest || file !== validatedFile || validatedSignature !== requestSignature) { setStageResult('The file or metadata changed. Validate again before saving a review record.'); return }
    setStaging(true); setStageResult('')
    try {
      const response = await fetch(`${api}/api/imports/stage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(preparedRequest) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.detail?.map((d: { msg: string }) => d.msg).join('; ') || 'Could not save review record.')
      setStageResult(`Review ${body.id} · ${body.review_status}. Metadata saved; geometry was not stored.`)
      setPreparedRequest(null)
      setValidatedFile(null)
      setValidatedSignature('')
      onStaged()
      onNotice('Import metadata saved for review. No asset geometry was stored.')
    } catch (e) { setStageResult(e instanceof Error ? e.message : 'Could not save review record.') }
    finally { setStaging(false) }
  }
  return <><div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> SOURCE-TRACEABLE INGESTION</div><h1 className="compact-title">Import data</h1><p className="intro">Validate GeoJSON before review; the downloadable CSV is a schema reference only.</p></div><button className="button secondary" onClick={blankCsv}><ArrowDownToLine size={15}/> Download blank template</button></div><div className="import-warning"><ShieldCheck size={18}/><div><b>Validation is separate from staging</b><span>Validation checks structure and provenance. You may then save a review record containing metadata and a file digest; geometry is not stored or promoted. This local, unauthenticated workflow is for non-sensitive data only.</span></div></div><div className="import-grid"><div className="panel import-form"><h3>Dataset provenance</h3><p>Record where the file came from. Use UNKNOWN when the source does not provide a value.</p><div className="form-grid"><label>Data domain<select value={dataDomain} onChange={e=>setDataDomain(e.target.value)}><option value="" disabled>Choose a domain</option><option value="OPERATIONAL_CANDIDATE">Operational GIS candidate</option><option value="RESEARCH_BENCHMARK">Research benchmark</option><option value="SIMULATION">Simulation</option><option value="SENSOR_TELEMETRY">Sensor telemetry</option><option value="MODEL_OUTPUT">Model output</option></select></label><label>Source organization<input value={org} onChange={e=>setOrg(e.target.value)} placeholder="e.g. Delhi Jal Board"/></label><label>Original URL or document reference<input value={reference} onChange={e=>setReference(e.target.value)} placeholder="https://… or document ID"/></label><label>Acquisition date<input type="date" value={acquired} onChange={e=>setAcquired(e.target.value)}/></label><label>Publication date, if known<input type="date" value={published} onChange={e=>setPublished(e.target.value)}/></label><label>Dataset license or UNKNOWN<input value={license} onChange={e=>setLicense(e.target.value)} placeholder="Enter source license"/></label><label>Use restrictions or UNKNOWN<input value={restrictions} onChange={e=>setRestrictions(e.target.value)} placeholder="Enter restrictions or UNKNOWN"/></label><label>Coordinate reference system<input value={crs} onChange={e=>setCrs(e.target.value)} placeholder="Enter explicit CRS, e.g. EPSG:4326"/></label><label>Dataset version<input value={datasetVersion} onChange={e=>setDatasetVersion(e.target.value)} placeholder="UNKNOWN"/></label><label>Source quality<input value={sourceQuality} onChange={e=>setSourceQuality(e.target.value)} placeholder="UNKNOWN"/></label><label>Temporal validity<input value={temporalValidity} onChange={e=>setTemporalValidity(e.target.value)} placeholder="UNKNOWN"/></label><label>Positional accuracy<input value={positionalAccuracy} onChange={e=>setPositionalAccuracy(e.target.value)} placeholder="UNKNOWN"/></label><label>Validation evidence<input value={validationEvidence} onChange={e=>setValidationEvidence(e.target.value)} placeholder="Not yet reviewed"/></label></div><label className="file-drop"><input type="file" accept=".geojson,.json,application/geo+json,application/json" onChange={e=>setFile(e.target.files?.[0] ?? null)}/><FileUp size={21}/><b>{file?.name ?? 'Choose a GeoJSON file'}</b><span>FeatureCollection format · validation only</span></label><div className="import-actions"><button className="button primary validate-button" disabled={busy} onClick={validate}>{busy ? 'Validating…' : 'Validate dataset'} <ArrowUpRight size={15}/></button><button className="button secondary validate-button" disabled={!preparedRequest || file !== validatedFile || validatedSignature !== requestSignature || staging} onClick={stage}>{staging ? 'Saving…' : 'Save review record'}</button></div>{result && <div className={`validation-result ${result.includes('passed') ? 'success' : 'error'}`}>{result}</div>}{stageResult && <div className="validation-result stage-result">{stageResult}</div>}</div><div className="panel requirements-panel"><h3>Before you import</h3><p>These fields preserve traceability from the first review.</p>{['Source organization and original reference','Acquisition date and dataset version','License and restrictions','Explicit coordinate reference system','Feature geometry and original identifiers','Unknown values remain explicitly unknown'].map((x,i)=><div className="requirement" key={x}><span>{i+1}</span>{x}</div>)}<div className="provenance-tip"><b>Attribute provenance</b><p>Geometry-level validation does not verify source authority or positional accuracy. Review attributes individually and retain their source and status.</p></div></div></div></>
}

function ImportReviewQueue({ refresh }: { refresh: number }) {
  const [records, setRecords] = useState<ImportReview[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'offline'>('loading')
  const load = async () => {
    setState('loading')
    try {
      const response = await fetch(`${api}/api/imports/reviews`)
      if (!response.ok) throw new Error('The review database is not available.')
      setRecords(await response.json())
      setState('ready')
    } catch { setState('offline') }
  }
  useEffect(() => { void load() }, [refresh])

  return <section className="review-queue">
    <div className="review-queue-head"><div><div className="eyebrow"><span className="eyebrow-dot"/> METADATA-ONLY INBOX</div><h2>Import review</h2><p>Staged records stay pending until a human checks the original file and source.</p></div><button className="button secondary" onClick={() => void load()} disabled={state === 'loading'}>{state === 'loading' ? 'Refreshing…' : 'Refresh inbox'} <Activity size={14}/></button></div>
    {state === 'loading' && <div className="review-empty"><span className="review-spinner"/> Loading review records…</div>}
    {state === 'offline' && <div className="review-empty review-offline"><b>Review inbox is unavailable</b><span>Start the local API and database, then refresh. GeoJSON validation remains separate from this saved queue.</span><button className="text-button" onClick={() => void load()}>Try again <ArrowUpRight size={13}/></button></div>}
    {state === 'ready' && records.length === 0 && <div className="review-empty"><div className="review-empty-mark"><Database size={21}/></div><b>No records waiting yet</b><span>Validated data only appears here after you choose “Save review record.”</span></div>}
    {state === 'ready' && records.length > 0 && <div className="review-record-list">{records.map(record => <article className="review-record" key={record.id}>
      <div className="review-record-main"><div className="review-record-label"><span className="review-status"><i/> PENDING REVIEW</span><span>{record.data_domain.replace(/_/g, ' ')}</span></div><h3>{record.organization}</h3><a href={record.source_reference.startsWith('http') ? record.source_reference : undefined} target="_blank" rel="noreferrer" className="review-reference">{record.source_reference}</a></div>
      <div className="review-record-facts"><div><span>FEATURES</span><b>{record.feature_count.toLocaleString()}</b></div><div><span>CRS</span><b>{record.crs}</b></div><div><span>ACQUIRED</span><b>{record.acquired_at}</b></div><div><span>LICENSE</span><b>{record.license}</b></div><div><span>VERSION</span><b>{record.dataset_version}</b></div><div><span>ADDED</span><b>{new Date(record.created_at).toLocaleDateString()}</b></div></div>
      <div className="review-record-digest"><span>DATASET SHA-256 · GEOMETRY NOT STORED</span><code title={record.dataset_sha256}>{record.dataset_sha256}</code><small>Use this digest to match the record to the original local file during review.</small></div>
    </article>)}</div>}
    <p className="review-queue-note"><ShieldCheck size={14}/> This inbox exposes provenance metadata only. It does not display, approve, promote, or retain the submitted geometry.</p>
  </section>
}

type SimulationScenario = { id: string; title: string; description: string; timestamp: string; actual_label: number; benchmark_score: number }
type SimulationSummary = { dataset: { name: string; doi: string; url: string; license: string; attribution: string; records: number; label: string; data_note: string }; training: { method: string; split: string; train_rows: number; holdout_rows: number; accuracy: number; majority_baseline_accuracy: number; holdout_positive_rate: number; precision: number; recall: number; f1: number; confusion: { tp: number; fp: number; tn: number; fn: number } }; scenarios: SimulationScenario[] }
type SimulationResult = { scenario_id: string; timestamp: string; benchmark_score: number; threshold: number; flagged: boolean; actual_label: number; label_meaning: string; top_signals: { feature: string; value: number | null; contribution: number }[] }

const bundledModel = simulationData as {
  dataset: SimulationSummary['dataset'] & { feature_columns: string[] }
  training: SimulationSummary['training']
  model: { bias: number; medians: number[]; means: number[]; scales: number[]; weights: number[] }
  scenarios: (Omit<SimulationScenario, 'benchmark_score'> & { probability: number; features: Record<string, number | null> })[]
}
const bundledSummary: SimulationSummary = {
  dataset: bundledModel.dataset,
  training: bundledModel.training,
  scenarios: bundledModel.scenarios.map(({ features: _features, probability, ...scenario }) => ({ ...scenario, benchmark_score: probability })),
}

function runBundledScenario(scenarioId: string, threshold: number): SimulationResult | null {
  const scenario = bundledModel.scenarios.find(item => item.id === scenarioId)
  if (!scenario) return null
  let score = bundledModel.model.bias
  const contributions = bundledModel.dataset.feature_columns.map((feature, index) => {
    const value = scenario.features[feature]
    const normalized = ((value ?? bundledModel.model.medians[index]) - bundledModel.model.means[index]) / bundledModel.model.scales[index]
    const contribution = normalized * bundledModel.model.weights[index]
    score += contribution
    return { feature, value, contribution }
  })
  const benchmarkScore = 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, score))))
  return {
    scenario_id: scenario.id,
    timestamp: scenario.timestamp,
    benchmark_score: benchmarkScore,
    threshold,
    flagged: benchmarkScore >= threshold,
    actual_label: scenario.actual_label,
    label_meaning: scenario.actual_label ? 'Within ±7 days of a recorded leak' : 'Outside the ±7 day leak-proximity window',
    top_signals: contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).slice(0, 4),
  }
}

type SyntheticReading = { time: string; pressure: number; flow: number; turbidity: number }
const initialSyntheticReadings: SyntheticReading[] = [
  { time: '−5', pressure: 4.6, flow: 81, turbidity: .2 }, { time: '−4', pressure: 4.5, flow: 79, turbidity: .2 },
  { time: '−3', pressure: 4.4, flow: 80, turbidity: .3 }, { time: '−2', pressure: 4.5, flow: 82, turbidity: .2 },
  { time: '−1', pressure: 4.3, flow: 78, turbidity: .2 }, { time: 'now', pressure: 4.4, flow: 80, turbidity: .2 },
]

function SyntheticSensorSandbox() {
  const [pressure, setPressure] = useState(4.4)
  const [flow, setFlow] = useState(80)
  const [turbidity, setTurbidity] = useState(.2)
  const [readings, setReadings] = useState(initialSyntheticReadings)
  const [streaming, setStreaming] = useState(false)
  const pressureDeviation = Math.min(1, Math.abs(pressure - 4.5) / 4.5)
  const flowDeviation = Math.min(1, Math.abs(flow - 80) / 80)
  const turbidityDeviation = Math.min(1, turbidity / 5)
  const riskScore = Math.round(pressureDeviation * 35 + flowDeviation * 35 + turbidityDeviation * 30)
  const riskLevel = riskScore >= 65 ? 'High' : riskScore >= 35 ? 'Moderate' : 'Low'

  function addReading() {
    const time = new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })
    setReadings(current => [...current, { time, pressure, flow, turbidity }].slice(-18))
  }

  useEffect(() => {
    if (!streaming) return
    const timer = window.setInterval(() => {
      const time = new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })
      const sample = {
        time,
        pressure: Math.max(.5, Math.min(8, pressure + (Math.random() - .5) * .3)),
        flow: Math.max(0, Math.min(150, flow + (Math.random() - .5) * 8)),
        turbidity: Math.max(0, Math.min(5, turbidity + (Math.random() - .5) * .16)),
      }
      setReadings(current => [...current, sample].slice(-18))
    }, 1400)
    return () => window.clearInterval(timer)
  }, [streaming, pressure, flow, turbidity])

  return <section className="synthetic-sandbox panel">
    <div className="sandbox-heading"><div><span className="simulation-tag"><Activity size={12}/> SYNTHETIC SENSOR SANDBOX</span><h2>Explore changing readings</h2><p>Adjust sample inputs, add readings, or start a browser-only stream to preview a future live-data workflow.</p></div><span className={`stream-status ${streaming ? 'streaming' : ''}`}><i/>{streaming ? 'STREAMING DEMO' : 'PAUSED'}</span></div>
    <div className="sandbox-callout"><AlertTriangle size={15}/><span>Fictional data and illustrative thresholds. This rule-based score is not the trained benchmark model, a DJB pipe assessment, or a live alert.</span></div>
    <div className="sandbox-grid">
      <div className="sandbox-controls">
        <div className="sandbox-control"><label htmlFor="sample-pressure">Pressure <b>{pressure.toFixed(1)} bar</b></label><input id="sample-pressure" type="range" min="0.5" max="8" step="0.1" value={pressure} onChange={event => setPressure(Number(event.target.value))}/><div><small>0.5 bar</small><small>8 bar</small></div></div>
        <div className="sandbox-control"><label htmlFor="sample-flow">Flow rate <b>{flow} L/s</b></label><input id="sample-flow" type="range" min="0" max="150" step="1" value={flow} onChange={event => setFlow(Number(event.target.value))}/><div><small>0 L/s</small><small>150 L/s</small></div></div>
        <div className="sandbox-control"><label htmlFor="sample-turbidity">Turbidity <b>{turbidity.toFixed(1)} NTU</b></label><input id="sample-turbidity" type="range" min="0" max="5" step="0.1" value={turbidity} onChange={event => setTurbidity(Number(event.target.value))}/><div><small>0 NTU</small><small>5 NTU</small></div></div>
        <div className="sandbox-actions"><button className="button secondary" onClick={addReading}>Add sample reading</button><button className={`button ${streaming ? 'secondary' : 'primary'}`} onClick={() => setStreaming(value => !value)}>{streaming ? 'Stop demo stream' : 'Start demo stream'}</button></div>
      </div>
      <div className="sandbox-result"><div className={`sandbox-risk risk-${riskLevel.toLowerCase()}`}><span>{riskLevel} illustrative risk</span><strong>{riskScore}<small>/100</small></strong></div><p>Changing any control recalculates this sample score immediately. Use it to demonstrate how future telemetry could feed a review workflow.</p><div className="sandbox-contributors"><span>Sample inputs</span><b>{pressure.toFixed(1)} bar · {flow} L/s · {turbidity.toFixed(1)} NTU</b></div></div>
    </div>
    <div className="sensor-chart-grid"><SyntheticChart title="Pressure" unit="bar" data={readings} field="pressure" max={8} color="#46a181"/><SyntheticChart title="Flow rate" unit="L/s" data={readings} field="flow" max={150} color="#6a8ac8"/><SyntheticChart title="Turbidity" unit="NTU" data={readings} field="turbidity" max={5} color="#d29a48"/></div>
    <div className="sandbox-footnote">Charts update from sample readings only. The demo stream pauses when you leave this page; no data is sent to a server or retained after refresh.</div>
  </section>
}

function SyntheticChart({ title, unit, data, field, max, color }: { title: string; unit: string; data: SyntheticReading[]; field: 'pressure' | 'flow' | 'turbidity'; max: number; color: string }) {
  const width = 280, height = 92, pad = 8
  const points = data.map((item, index) => `${pad + index * (width - pad * 2) / Math.max(1, data.length - 1)},${height - pad - item[field] / max * (height - pad * 2)}`).join(' ')
  const latest = data[data.length - 1]?.[field] ?? 0
  return <div className="sensor-chart"><div className="chart-title"><span><i style={{ background: color }}/> {title}</span><b>{latest.toFixed(field === 'flow' ? 0 : 1)} <small>{unit}</small></b></div><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${title} history, latest ${latest.toFixed(1)} ${unit}`}><line x1="8" y1="12" x2="272" y2="12"/><line x1="8" y1="46" x2="272" y2="46"/><line x1="8" y1="82" x2="272" y2="82"/><polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>{data.length > 0 && <circle cx={width - pad} cy={height - pad - latest / max * (height - pad * 2)} r="3.5" fill={color}/>}</svg><div className="chart-axis"><span>Earlier</span><span>Latest</span></div></div>
}

function SimulationView() {
  const [summary, setSummary] = useState<SimulationSummary | null>(null)
  const [selected, setSelected] = useState('leak_signature')
  const [threshold, setThreshold] = useState(.5)
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    if (!api) { setSummary(bundledSummary); return }
    fetch(`${api}/api/simulation/summary`).then(r => { if (!r.ok) throw new Error(); return r.json() }).then((data: SimulationSummary) => { setSummary(data); setOffline(false) }).catch(() => { setSummary(bundledSummary); setOffline(false) })
  }, [])
  useEffect(() => {
    let cancelled = false
    if (!api) { setResult(runBundledScenario(selected, threshold)); return () => { cancelled = true } }
    fetch(`${api}/api/simulation/run`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario_id: selected, threshold }) })
      .then(r => { if (!r.ok) throw new Error(); return r.json() }).then((data: SimulationResult) => { if (!cancelled) setResult(data) }).catch(() => { if (!cancelled) setResult(runBundledScenario(selected, threshold)) })
    return () => { cancelled = true }
  }, [selected, threshold])

  const pct = (value: number) => `${(value * 100).toFixed(1)}%`
  const signalName = (name: string) => name.replace(/_anomaly_score|_power_hour|_kW|_ws_/g, ' ').replace(/_/g, ' ').trim()
  return <div className="simulation-page">
    <div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> BENCHMARK RESEARCH · NOT A LIVE TWIN</div><h1 className="compact-title">Leak scenario lab</h1><p className="intro">Explore four held-out cases from an openly licensed water-network research dataset.</p></div><span className="pill purple-pill large-pill"><Activity size={13}/> RESEARCH SIMULATION</span></div>
    <div className="simulation-warning"><ShieldCheck size={19}/><div><b>This model does not represent Delhi’s pipes or predict Delhi leaks.</b><p>It learns from precomputed anomaly scores in an anonymized benchmark. Its output is a benchmark score for similarity to periods within seven days of recorded leaks—not a calibrated probability, diagnosis, or operational alert. On GitHub Pages, the bundled model runs in this browser; backend-dependent intake and review storage are unavailable.</p></div></div>
    <SyntheticSensorSandbox/>
    {offline ? <div className="review-empty review-offline"><b>Simulation service is unavailable</b><span>Start the API and database with Docker Compose, then refresh this page.</span></div> : !summary ? <div className="review-empty"><span className="review-spinner"/><b>Loading the trained benchmark model…</b></div> : <>
      <section className="simulation-source panel"><div><span className="simulation-tag"><Database size={12}/> TRAINED ON PUBLIC DATA</span><h2>{summary.dataset.name}</h2><p>{summary.dataset.records.toLocaleString()} hourly records · 18 derived anomaly-score inputs · label: {summary.dataset.label}</p></div><a href={summary.dataset.url} target="_blank" rel="noreferrer" className="text-button">Dataset record <ArrowUpRight size={14}/></a></section>
      <div className="simulation-controls panel"><div><span className="eyebrow">DECISION THRESHOLD</span><h2>How sensitive should the flag be?</h2><p>Lower thresholds flag more cases; higher thresholds flag fewer.</p></div><label className="threshold-control"><span>{Math.round(threshold * 100)}<small>%</small></span><input aria-label="Decision threshold" type="range" min="10" max="90" step="5" value={Math.round(threshold * 100)} onChange={e => setThreshold(Number(e.target.value) / 100)}/><small>Flag when benchmark score reaches this level</small></label></div>
      <div className="scenario-grid">{summary.scenarios.map(s => <button key={s.id} className={`scenario-card ${selected === s.id ? 'selected' : ''}`} onClick={() => setSelected(s.id)}><span className="scenario-dot"/><b>{s.title}</b><small>{s.description}</small><span className="scenario-label">Recorded label: {s.actual_label ? 'leak-proximity window' : 'outside leak-proximity window'}</span></button>)}</div>
      {result && <section className="simulation-result panel"><div className="simulation-result-head"><div><div className="eyebrow">HELD-OUT BENCHMARK CASE · {result.timestamp}</div><h2>{summary.scenarios.find(s => s.id === selected)?.title}</h2><p>{summary.scenarios.find(s => s.id === selected)?.description}</p></div><div className={`simulation-outcome ${result.flagged ? 'flagged' : ''}`}><span>{pct(result.benchmark_score)}</span><small>benchmark score</small><b>{result.flagged ? 'Above threshold' : 'Below threshold'}</b></div></div>
        <div className="signal-list"><div className="signal-heading"><b>Strongest model signals</b><span>Feature contribution direction · benchmark units</span></div>{result.top_signals.map(signal => <div className="signal-row" key={signal.feature}><span>{signalName(signal.feature)}</span><div className="signal-track"><i className={signal.contribution >= 0 ? 'up' : 'down'} style={{ width: `${Math.min(100, Math.max(3, Math.abs(signal.contribution) * 36))}%` }}/></div><b>{signal.value == null ? 'Missing' : signal.value.toFixed(1)}</b></div>)}</div>
        <div className="case-truth"><ShieldCheck size={15}/><span>Benchmark ground truth: <b>{result.label_meaning}</b></span><span className={result.flagged === Boolean(result.actual_label) ? 'match' : 'mismatch'}>{result.flagged === Boolean(result.actual_label) ? 'MATCH' : 'MISMATCH'}</span></div>
      </section>}
      <section className="simulation-metrics"><div className="metrics-heading"><div><div className="eyebrow">CHRONOLOGICAL HOLDOUT</div><h2>How it performed on later records</h2></div><span>Not a Delhi validation score</span></div><div className="metrics-grid"><div><small>PRECISION</small><b>{pct(summary.training.precision)}</b><span>Of flags matched the benchmark label</span></div><div><small>RECALL</small><b>{pct(summary.training.recall)}</b><span>Of leak-proximity labels were flagged</span></div><div><small>F1 SCORE</small><b>{pct(summary.training.f1)}</b><span>Balance of precision and recall</span></div><div><small>HOLDOUT</small><b>{summary.training.holdout_rows.toLocaleString()}</b><span>Later hourly records, separated in time</span></div></div><p className="metric-caveat">At the default 50% threshold: {summary.training.confusion.tp.toLocaleString()} true flags, {summary.training.confusion.fp.toLocaleString()} false flags, {summary.training.confusion.fn.toLocaleString()} missed labeled hours. {pct(summary.training.holdout_positive_rate)} of holdout labels are positive; an always-positive rule gets {pct(summary.training.majority_baseline_accuracy)} accuracy, while this model gets {pct(summary.training.accuracy)}. Labels mark a ±7 day window, so adjacent hours are not independent leak events.</p></section>
      <div className="simulation-citation"><b>Method and attribution</b><p>{summary.training.method}; {summary.training.split}. Dataset: {summary.dataset.attribution}. Released under {summary.dataset.license}. Inputs are precomputed anomaly scores, not raw sensor signals.</p></div>
    </>}
  </div>
}

function ResearchView({ sources }: { sources: Source[] }) {
  return <><div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> ISOLATED FROM OPERATIONAL DATA</div><h1 className="compact-title">Research bench</h1><p className="intro">A separate home for public benchmarks and reproducible experiments.</p></div><span className="pill purple-pill large-pill"><BookOpen size={13}/> RESEARCH ONLY</span></div><div className="research-banner"><BookOpen size={19}/><div><b>Benchmark records are not Delhi infrastructure</b><p>The Simulation Lab uses a chronological holdout from the licensed dataset shown below. Results are not Delhi field validation.</p></div></div><div className="benchmark-grid">{sources.map(s=><div className="panel benchmark-card" key={s.id}><div className="bench-top"><div className={`source-logo ${s.id}`}>R</div><span className="pill purple-pill">PUBLIC BENCHMARK</span></div><h3>{s.title}</h3><p>{s.id === 'leakdb' ? 'Artificially created leak scenarios on multiple water distribution networks. Zenodo record lists a 13.9 GB archive.' : s.id === 'multisource' ? '8,737 hourly records from an anonymized urban water network; derived anomaly scores and leak-proximity labels. Used by the Simulation Lab.' : 'SCADA pressure and flow measurements, leakage information and the L-Town network for detection/localization benchmarking.'}</p><div className="bench-meta"><span>DATA STATUS</span><b>{s.id === 'multisource' ? 'Downloaded · research demo' : 'Not downloaded'}</b><span>LICENSE</span><b>{s.license}</b></div><a href={s.url} target="_blank" rel="noreferrer" className="text-button bench-link">Open dataset record <ArrowUpRight size={14}/></a></div>)}</div><div className="note-box"><AlertTriangle size={17}/><p><b>License gate:</b> Other benchmark records may not specify reuse rights. Confirm the license directly before downloading or redistributing their data.</p></div></>
}

export default App
