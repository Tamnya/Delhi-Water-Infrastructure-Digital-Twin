import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Activity, AlertTriangle, Check, Search, ShieldCheck, X } from 'lucide-react'

export type PortalRole = 'public' | 'field' | 'supervisor' | 'admin'
export type PortalTask = { id: string; title: string; zone: string; assignedTo: string; employeeId: string; due: string; status: 'Assigned' | 'In progress' | 'Completed' | 'Needs review'; progress: number; report: string; remarks: string; priority: 'Routine' | 'High' }
export type DemoGrievance = { id: string; category: string; area: string; description: string; status: string }
export type RiskSample = { id: string; zone: string; type: string; risk: 'Low' | 'Moderate' | 'High'; score: number; reason: string }

export const demoEmployees = [
  { name: 'Aarav Mehta', id: 'EMP-2047', role: 'Field Technician' },
  { name: 'Meera Khan', id: 'EMP-1982', role: 'Field Engineer' },
  { name: 'Rohan Das', id: 'EMP-2361', role: 'Field Technician' },
]

export const demoRisks: RiskSample[] = [
  { id: 'SIM-P-004', zone: 'Sample Zone North', type: 'Pressure anomaly', risk: 'High', score: 86, reason: 'Synthetic pressure drop across 3 sample readings' },
  { id: 'SIM-P-002', zone: 'Sample Zone Central', type: 'Flow imbalance', risk: 'Moderate', score: 58, reason: 'Synthetic inlet/outlet flow difference' },
  { id: 'SIM-P-001', zone: 'Sample Zone South', type: 'Sensor check', risk: 'Low', score: 21, reason: 'Synthetic reading within expected sample range' },
]

const faqs = [
  { q: 'How do I submit a water service grievance?', a: 'Choose a category, enter the affected area and describe the issue. In this prototype, submission creates a sample tracking number in this browser only; it is not sent to DJB.' },
  { q: 'How can I track my grievance?', a: 'The prototype shows the tracking number and sample status immediately after submission. A real portal would connect this to an authorized grievance system.' },
  { q: 'Does the map show Delhi water pipes?', a: 'No. It currently shows an OpenStreetMap context basemap only. Verified DJB pipeline geometry has not been received or loaded.' },
  { q: 'What do the risk levels mean?', a: 'Risk levels in the role dashboards are illustrative synthetic scenarios. They do not describe real pipes, sensors, or active Delhi incidents.' },
  { q: 'How do staff tasks work in this demo?', a: 'Employees can update assigned sample tasks. Supervisors and administrators can review the team queue and assign sample tasks. Changes stay in browser memory and reset on refresh.' },
]

export function DemoNotice({ children = 'DEMO ACCESS - role views and records are simulated in this browser. This is not government authentication; do not enter real personal, employee, or grievance data.' }: { children?: string }) {
  return <div className="demo-notice"><ShieldCheck size={16}/><span>{children}</span></div>
}

export function SimulatedRiskBanner() {
  const risk = demoRisks[0]
  return <div className="sim-risk-banner"><span className="sim-alert-pulse"/><div><small>SIMULATION ALERT · NOT A LIVE DJB WARNING</small><b>{risk.id} · {risk.risk} illustrative risk</b><span>{risk.zone}: {risk.reason}.</span></div><span className="sim-score">{risk.score}<small>/100</small></span></div>
}

export function PublicServicesView({ grievances, onSubmit }: { grievances: DemoGrievance[]; onSubmit: (item: DemoGrievance) => void }) {
  const [faqQuery, setFaqQuery] = useState('')
  const [category, setCategory] = useState('Supply interruption')
  const [area, setArea] = useState('')
  const [description, setDescription] = useState('')
  const [sent, setSent] = useState<DemoGrievance | null>(null)
  const matchingFaqs = useMemo(() => faqs.filter(item => `${item.q} ${item.a}`.toLowerCase().includes(faqQuery.toLowerCase())), [faqQuery])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!area.trim() || !description.trim()) return
    const grievance = { id: `DEMO-${String(Date.now()).slice(-6)}`, category, area: area.trim(), description: description.trim(), status: 'Received in local demo' }
    onSubmit(grievance)
    setSent(grievance)
    setArea('')
    setDescription('')
  }

  return <div className="portal-page">
    <PageHeading eyebrow="PUBLIC SERVICES" title="Help & grievances" intro="Find service information or try the sample grievance flow." badge="PUBLIC VIEW"/>
    <DemoNotice>DEMO FORM - submissions stay in this browser session and are not sent to DJB. Use sample details only.</DemoNotice>
    <div className="public-service-grid">
      <section className="portal-card grievance-card"><div className="portal-card-heading"><div><span className="eyebrow">SERVICE REQUEST</span><h2>Submit a grievance</h2><p>Try the interaction with fictional information.</p></div><span className="portal-icon"><Activity size={18}/></span></div>
        <form className="grievance-form" onSubmit={submit}>
          <label>Issue category<select value={category} onChange={e => setCategory(e.target.value)}><option>Supply interruption</option><option>Low pressure</option><option>Water quality concern</option><option>Leak or overflow</option><option>Other service issue</option></select></label>
          <label>Area or locality<input value={area} onChange={e => setArea(e.target.value)} placeholder="Example: Sample locality" required/></label>
          <label>What happened?<textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the sample issue" rows={4} required/></label>
          <button className="button primary" type="submit">Create sample grievance</button>
        </form>
        {sent && <div className="grievance-receipt"><Check size={16}/><div><b>Sample request created: {sent.id}</b><span>{sent.status}. The record is not transmitted or saved to a government system.</span></div></div>}
        {grievances.length > 0 && <div className="grievance-history"><b>This session's sample requests</b>{grievances.map(item => <div key={item.id}><span>{item.id}</span><small>{item.category} · {item.area}</small><em>{item.status}</em></div>)}</div>}
      </section>
      <section className="portal-card faq-card"><div className="portal-card-heading"><div><span className="eyebrow">QUICK ANSWERS</span><h2>Frequently asked questions</h2><p>Search guidance about the prototype and its services.</p></div><span className="portal-icon"><Search size={18}/></span></div>
        <div className="faq-search"><Search size={15}/><input value={faqQuery} onChange={e => setFaqQuery(e.target.value)} placeholder="Search questions or topics" aria-label="Search FAQs"/>{faqQuery && <button onClick={() => setFaqQuery('')} aria-label="Clear search"><X size={14}/></button>}</div>
        <div className="faq-list">{matchingFaqs.length ? matchingFaqs.map(item => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>) : <div className="faq-no-results">No matching answers. Try a different search.</div>}</div>
      </section>
    </div>
  </div>
}

export function EmployeeDashboard({ role, employeeId, tasks, onTaskUpdate, onAssign }: { role: Exclude<PortalRole, 'public'>; employeeId: string; tasks: PortalTask[]; onTaskUpdate: (id: string, patch: Partial<PortalTask>) => void; onAssign: (task: Omit<PortalTask, 'id'>) => void }) {
  const [title, setTitle] = useState('')
  const [zone, setZone] = useState('Sample Zone North')
  const [assignee, setAssignee] = useState(demoEmployees[0].id)
  const canManage = role === 'supervisor' || role === 'admin'
  const visibleTasks = role === 'field' ? tasks.filter(task => task.employeeId === employeeId) : tasks
  const completed = visibleTasks.filter(task => task.status === 'Completed').length

  function assignTask(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return
    const employee = demoEmployees.find(item => item.id === assignee) || demoEmployees[0]
    onAssign({ title: title.trim(), zone, assignedTo: employee.name, employeeId: employee.id, due: '2026-11-12', status: 'Assigned', progress: 0, report: '', remarks: '', priority: 'Routine' })
    setTitle('')
  }

  return <div className="portal-page">
    <PageHeading eyebrow={role === 'admin' ? 'ADMINISTRATION' : role === 'supervisor' ? 'TEAM OPERATIONS' : 'STAFF WORKSPACE'} title={role === 'admin' ? 'Administrator dashboard' : role === 'supervisor' ? 'Supervisor dashboard' : 'Employee dashboard'} intro={role === 'field' ? `Your assigned sample work · ${employeeId}` : 'Review sample work, progress updates and operational demonstrations.'} badge={role.toUpperCase()}/>
    <DemoNotice>DEMO WORK QUEUE - task records, employee IDs, reports and risk examples are fictional and reset when this page reloads.</DemoNotice>
    {role === 'supervisor' && <SupervisorPipelineLookup/>}
    <div className="ops-stat-grid"><div><small>{role === 'field' ? 'MY TASKS' : 'SAMPLE TASKS'}</small><b>{visibleTasks.length}</b><span>in this demonstration queue</span></div><div><small>COMPLETED</small><b>{completed}</b><span>marked complete in this session</span></div><div><small>TEAM MEMBERS</small><b>{role === 'field' ? '1' : demoEmployees.length}</b><span>sample employee profiles</span></div><div><small>PIPELINE RECORDS</small><b>0 verified</b><span>inventory stays disconnected</span></div></div>
    {canManage && <section className="portal-card assignment-card"><div className="portal-card-heading"><div><span className="eyebrow">TASK CONTROL</span><h2>Assign a sample task</h2><p>New work appears in the selected employee's demo dashboard.</p></div></div><form className="assignment-form" onSubmit={assignTask}><label>Task description<input value={title} onChange={e => setTitle(e.target.value)} placeholder="Example: inspect sample valve" required/></label><label>Sample zone<select value={zone} onChange={e => setZone(e.target.value)}><option>Sample Zone North</option><option>Sample Zone Central</option><option>Sample Zone South</option></select></label><label>Assign to<select value={assignee} onChange={e => setAssignee(e.target.value)}>{demoEmployees.map(person => <option key={person.id} value={person.id}>{person.name} · {person.id}</option>)}</select></label><button className="button primary" type="submit">Assign sample task</button></form></section>}
    <section className="task-section"><div className="task-section-heading"><div><span className="eyebrow">WORK ORDERS</span><h2>{role === 'field' ? 'My assigned tasks' : 'Team task register'}</h2></div><span className="pill slate">{visibleTasks.length} DEMO RECORDS</span></div>
      <div className="task-list">{visibleTasks.map(task => <TaskCard key={task.id} task={task} canEdit={role === 'field' ? task.employeeId === employeeId : canManage} onUpdate={patch => onTaskUpdate(task.id, patch)}/>)}</div>
    </section>
    {role === 'admin' && <AdminPipelineSummary/>}
    {role !== 'field' && <RiskScenarioPanel/>}
  </div>
}

function SupervisorPipelineLookup() {
  const [query, setQuery] = useState('')
  return <section className="portal-card supervisor-pipeline-lookup">
    <div className="portal-card-heading"><div><span className="eyebrow">PIPELINE MONITORING</span><h2>Find a pipeline</h2><p>Look up an asset by pipeline ID, locality, route, or linked sensor once verified data is available.</p></div><span className="pill amber">0 VERIFIED</span></div>
    <label className="pipeline-search"><Search size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search pipeline ID, locality, route, or sensor" aria-label="Search pipelines"/><span>LOOKUP</span>{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear pipeline search"><X size={14}/></button>}</label>
    <div className="pipeline-search-empty"><AlertTriangle size={17}/><div><b>{query ? `No verified match for “${query}”` : 'Pipeline lookup is waiting for an approved dataset'}</b><span>No pipeline geometry or searchable asset records are loaded yet. Search results will appear here after source review; routes will not be inferred from the basemap.</span></div></div>
    <div className="pipeline-detail-preview"><span>WHEN DATA IS AVAILABLE, THIS PANEL CAN SHOW</span><div><b>Pipeline record</b><small>ID · material · diameter · condition</small></div><div><b>Route & map</b><small>Clickable geometry · start and end points</small></div><div><b>Connected sensors</b><small>Sensor ID · latest reading · connection status</small></div><div><b>Monitoring history</b><small>Risk notices · inspections · assigned work</small></div></div>
  </section>
}

function TaskCard({ task, canEdit, onUpdate }: { task: PortalTask; canEdit: boolean; onUpdate: (patch: Partial<PortalTask>) => void }) {
  return <article className="task-card"><div className="task-card-top"><div><span className={`task-priority ${task.priority === 'High' ? 'priority-high' : ''}`}>{task.priority} priority · sample</span><h3>{task.title}</h3><p>{task.id} · {task.zone} · Due {task.due}</p></div><span className={`task-status ${task.status.toLowerCase().replace(' ', '-')}`}>{task.status}</span></div>
    <div className="task-assignee"><span>ASSIGNED TO</span><b>{task.assignedTo}</b><code>{task.employeeId}</code></div>
    <div className="task-progress"><div><span>Progress</span><b>{task.progress}%</b></div><div className="progress-track"><i style={{ width: `${task.progress}%` }}/></div>{canEdit && <input aria-label={`Progress for ${task.id}`} type="range" min="0" max="100" step="10" value={task.progress} onChange={e => { const progress = Number(e.target.value); onUpdate({ progress, status: progress === 100 ? 'Completed' : progress > 0 ? 'In progress' : 'Assigned' }) }}/>}</div>
    <div className="task-notes"><label>Work report<textarea value={task.report} onChange={e => onUpdate({ report: e.target.value })} placeholder={canEdit ? 'Add a sample work report' : 'No report submitted'} readOnly={!canEdit} rows={2}/></label><label>Remarks<textarea value={task.remarks} onChange={e => onUpdate({ remarks: e.target.value })} placeholder={canEdit ? 'Add sample remarks or blockers' : 'No remarks'} readOnly={!canEdit} rows={2}/></label></div>
    {canEdit && <div className="task-edit-note"><Check size={13}/> Changes are reflected in this local demo view.</div>}
  </article>
}

function AdminPipelineSummary() {
  return <section className="portal-card pipeline-admin-card"><div className="portal-card-heading"><div><span className="eyebrow">PIPELINE REGISTER</span><h2>Infrastructure records</h2><p>Production fields are reserved for an authorized DJB dataset.</p></div><span className="pill amber">NO VERIFIED DATA</span></div><div className="empty-register"><span className="empty-register-mark"><AlertTriangle size={19}/></span><div><b>Verified pipe records: 0</b><span>Geometry, material, diameter, condition, and update history will appear here only after the source is approved.</span></div></div></section>
}

function RiskScenarioPanel() {
  return <section className="portal-card risk-scenario-card"><div className="portal-card-heading"><div><span className="eyebrow">RISK & WARNINGS</span><h2>Illustrative risk scenarios</h2><p>Example levels for demonstrating notification and review workflows.</p></div><span className="pill amber">SYNTHETIC</span></div><div className="risk-table"><div className="risk-table-head"><span>SAMPLE ASSET</span><span>ZONE / SIGNAL</span><span>RISK LEVEL</span><span>SCORE</span></div>{demoRisks.map(risk => <div className={`risk-row risk-${risk.risk.toLowerCase()}`} key={risk.id}><b>{risk.id}</b><span><strong>{risk.zone}</strong><small>{risk.reason}</small></span><em>{risk.risk}</em><b>{risk.score}/100</b></div>)}</div><p className="risk-disclaimer"><AlertTriangle size={14}/> These are hand-authored demo scenarios, not model output, field measurements, or real pipeline risk ratings.</p></section>
}

export function TourPanel() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const tour = [
    { title: 'Public overview', tag: '01 · START HERE', text: 'The landing page explains the project and its data status. It distinguishes the real Delhi system from research demonstrations.' },
    { title: 'Map & assets', tag: '02 · GEOGRAPHY', text: 'The map is an OpenStreetMap context layer. There are no verified DJB pipe lines in it; this tour does not invent geometry.' },
    { title: 'Help & grievances', tag: '03 · PUBLIC SERVICE', text: 'Search FAQs and try the grievance form. It creates a local sample reference only; it is not delivered to DJB.' },
    { title: 'Data sources', tag: '04 · EVIDENCE', text: 'The catalog records source links, access notes, and license status. A source listing is not proof that the data is complete, current, or approved for operational use.' },
    { title: 'Import review', tag: '05 · DATA INTAKE', text: 'The intake checks GeoJSON structure and records provenance for review. It stores review metadata only; geometry is not saved, approved, or added to the map.' },
    { title: 'Employee dashboard', tag: '06 · STAFF DEMO', text: 'The sample employee sees assigned tasks and can update progress, reports, and remarks. These edits reset on refresh.' },
    { title: 'Supervisor and admin', tag: '07 · INTERNAL DEMO', text: 'Supervisors can assign sample tasks and search the future pipeline registry. It currently has no verified records; with an approved dataset, lookups can connect a pipeline to its clickable map route, sensors, status, and monitoring history. Admin inventory also stays empty until verified data arrives.' },
    { title: 'Risk alerts', tag: '08 · SIMULATED', text: 'The high, moderate, and low risk examples demonstrate warning design only. They are not live readings or operational alerts.' },
    { title: 'Research bench', tag: '09 · BENCHMARK', text: 'The research workspace lists public research references and keeps benchmark evidence separate from Delhi operational assets.' },
    { title: 'Simulation lab', tag: '10 · MODEL + SAMPLE STREAM', text: 'The benchmark classifier uses an anonymized public network dataset, while the sensor sandbox lets you adjust fictional pressure, flow, and turbidity readings, chart a sample stream, and preview a separate illustrative risk rule. Neither predicts Delhi conditions.' },
    { title: 'Access preview', tag: '11 · IMPORTANT', text: 'The role selector is a client-side demo preview, not real login or secure authorization. Production use needs institution-managed authentication, server-side permissions, audit logs, and privacy controls.' },
  ]
  const active = tour[step]
  return <>
    <button className="tour-open-button" onClick={() => { setOpen(true); setStep(0) }}><span className="tour-open-mark">?</span><span>Take a tour</span></button>
    <AnimatePresence>{open && <motion.div className="tour-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false) }}>
      <motion.section className="tour-panel" role="dialog" aria-modal="true" aria-labelledby="tour-title" initial={{ opacity: 0, y: 20, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: .98 }}>
        <div className="tour-panel-top"><div><span className="eyebrow">JALSETU WALKTHROUGH · {String(step + 1).padStart(2, '0')} / {String(tour.length).padStart(2, '0')}</span><div className="tour-progress">{tour.map((_, i) => <i key={i} className={i <= step ? 'done' : ''}/>)}</div></div><button className="tour-close" onClick={() => setOpen(false)} aria-label="Close tour"><X size={18}/></button></div>
        <AnimatePresence mode="wait"><motion.div key={step} className="tour-step" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: .2 }}><span className="tour-step-tag">{active.tag}</span><h2 id="tour-title">{active.title}</h2><p>{active.text}</p></motion.div></AnimatePresence>
        <div className="tour-panel-bottom"><button className="button secondary" onClick={() => setStep(value => Math.max(0, value - 1))} disabled={step === 0}>Back</button><span>{step + 1} of {tour.length}</span>{step < tour.length - 1 ? <button className="button primary" onClick={() => setStep(value => Math.min(tour.length - 1, value + 1))}>Next</button> : <button className="button primary" onClick={() => setOpen(false)}>Finish <Check size={14}/></button>}</div>
      </motion.section>
    </motion.div>}</AnimatePresence>
  </>
}

export function PageHeading({ eyebrow, title, intro, badge }: { eyebrow: string; title: string; intro: string; badge: string }) {
  return <div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> {eyebrow}</div><h1 className="compact-title">{title}</h1><p className="intro">{intro}</p></div><span className="pill purple-pill large-pill"><Activity size={13}/> {badge}</span></div>
}
