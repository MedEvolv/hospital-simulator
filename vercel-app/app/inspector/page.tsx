'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import SeverityBadge from '@/components/SeverityBadge'
import Disclaimer from '@/components/Disclaimer'
import { SESSION_KEY, type SimulationReport, type SimEvent, type Severity } from '@/lib/types'

type SeverityFilter = Severity | 'ALL'
const SEVERITY_ORDER: Severity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'INFO']

function getSeverity(event: SimEvent): Severity | null {
  const s = event.payload?.severity
  if (typeof s === 'string' && ['INFO', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(s)) {
    return s as Severity
  }
  return null
}

function isEthicallyFlagged(event: SimEvent): boolean {
  return (
    event.event_type === 'ethics_intervention' ||
    event.event_type === 'refusal' ||
    event.event_type === 'harm_event' ||
    event.payload?.ethical_flag === true ||
    event.payload?.requires_human === true
  )
}

// ── Three-layer interpretation ────────────────────────────────────────────────

interface EventLayers {
  what: string       // Layer 1 — what happened (clean, no jargon)
  means: string      // Layer 2 — plain English parallel
  governs: string    // Layer 3 — one governance sentence
  roleNote?: string  // Role-specific addition (Legal, QI, Med Sup)
}

function buildLayers(
  event: SimEvent,
  surveyRole: string,
  patternCounts: Record<string, number>,
): EventLayers {
  const p = event.payload ?? {}
  const tick = event.timestamp.toFixed(0)
  const et = event.event_type
  const harmType = String(p.harm_type ?? '').replace(/_/g, ' ')
  const isAvoidable = p.avoidable === true || !!p.avoidable_with
  const isRefusal = et === 'refusal' || et === 'ethics_intervention'
  const isPattern = patternCounts[et] >= 3

  // ── Layer 1: what happened ────────────────────────────────────────────────

  let what = ''
  if (et === 'patient_arrival') {
    what = `Patient ${p.patient_id ?? '?'} arrived — acuity ${p.acuity ?? '?'}, complaint: ${p.chief_complaint ?? 'not recorded'}`
  } else if (et === 'triage_decision') {
    what = `Patient ${p.patient_id ?? '?'} triaged — priority score ${p.triage_score ?? '?'}, queue position ${p.queue_position ?? '?'}${p.ethical_flag ? ' — ethical flag raised' : ''}`
  } else if (et === 'patient_discharge') {
    what = `Patient ${p.patient_id ?? '?'} discharged — outcome: ${p.outcome ?? 'not recorded'}, time in system: ${p.length_of_stay ?? '?'} ticks`
  } else if (et === 'queue_reorder') {
    what = `Queue reordered — patient ${p.patient_id ?? '?'} moved ${p.direction ?? 'up'} due to ${p.reason ?? 'condition change'}`
  } else if (et === 'refusal') {
    what = `Autonomous action declined — ${p.description ?? p.reason ?? 'decision deferred to human review'}`
  } else if (et === 'ethics_intervention') {
    what = `Ethics override triggered — ${p.description ?? p.reason ?? 'value conflict detected'}`
  } else if (et === 'harm_event') {
    what = `${harmType || 'harm recorded'} — ${p.description ?? ''}${isAvoidable ? ' (alternatives existed)' : ' (capacity-constrained)'}`
  } else if (et === 'tension_signal') {
    what = `Tension detected: ${String(p.tension_type ?? '').replace(/_/g, ' ')} — ${p.description ?? ''}`
  } else {
    what = eventSummary(event)
  }

  // ── Layer 2: what this means ──────────────────────────────────────────────

  let means = ''
  if (et === 'patient_arrival') {
    means = 'Every arrival is a new demand on a finite system. The queue is a living object — each new patient changes the position and wait time of everyone already in it.'
  } else if (et === 'triage_decision') {
    means = `Think of this like a hospital receptionist sorting a stack of paper forms by urgency. The system assigned position ${p.queue_position ?? '?'} — meaning ${p.queue_position === 1 ? 'this patient goes next' : `there are ${(Number(p.queue_position ?? 1) - 1)} people ahead`}. That position is not permanent — it will shift as new patients arrive.`
  } else if (et === 'queue_reorder') {
    means = 'Think of this like a triage nurse physically moving someone from the back of a queue to the front because their condition worsened while waiting. The system did this automatically — but it displaced someone else. Every move up the queue is a move down for another patient.'
  } else if (et === 'refusal' && p.reason === 'value_conflict') {
    means = 'The system reached a decision point where the right answer wasn\'t clear enough to act on automatically. Like a cashier calling a manager rather than making a judgment call on a disputed price. The system flagged this for human review rather than guess.'
  } else if (et === 'refusal' && p.reason === 'insufficient_context') {
    means = 'The system had enough information to identify a decision was needed, but not enough to make it responsibly. Think of a GP who refuses to prescribe without seeing the patient\'s full history — the refusal is the safe behaviour.'
  } else if (et === 'refusal' || et === 'ethics_intervention') {
    means = 'The system reached a value conflict it could not resolve algorithmically. This is functioning oversight — the design intention is that a human makes this call, not the system.'
  } else if (et === 'harm_event' && harmType.includes('dignity')) {
    means = 'A patient waited without any update or acknowledgment for longer than the institution\'s own standards allow. Not a clinical failure — a human experience failure. The system had the capacity to do something; it did not.'
  } else if (et === 'harm_event' && harmType.includes('equity')) {
    means = 'Two patients with identical clinical urgency. One was admitted. One wasn\'t. The difference wasn\'t medical. This is the kind of gap that equity frameworks exist to catch — and that incident reporting systems often miss.'
  } else if (et === 'harm_event' && isAvoidable) {
    means = `This harm had an alternative path. The simulation identified that a different protocol or resource decision could have produced a different outcome. That alternative is what governance exists to create.`
  } else if (et === 'harm_event') {
    means = 'This harm occurred because capacity was the binding constraint — no available alternative existed at this moment. It documents a structural gap, not an individual failure.'
  } else if (et === 'tension_signal') {
    means = 'The simulation detected two institutional values pulling in opposite directions, without a protocol to resolve which wins. Like a building with two emergency exits that point toward each other — the design hasn\'t accounted for the conflict.'
  } else if (et === 'patient_discharge') {
    means = `This patient's outcome — ${p.outcome ?? 'unknown'} — reflects the cumulative effect of every triage, waiting, and care decision made during their ${p.length_of_stay ?? '?'} ticks in the system.`
  } else {
    means = 'This event is part of the simulation\'s operational record. In Plain English mode, only events with governance significance receive detailed interpretation.'
  }

  // ── Layer 3: governance implication ──────────────────────────────────────

  let governs = ''
  if (isRefusal) {
    governs = 'The existence of this escalation means your governance framework has a gap that humans are expected to fill — the question is whether the human capacity to fill it was available at this tick.'
  } else if (et === 'harm_event' && isAvoidable) {
    governs = 'This harm was classified as potentially preventable — meaning a protocol, staffing, or resource decision could have produced a different outcome. It is within governance reach.'
  } else if (et === 'harm_event') {
    governs = 'This harm occurred despite no feasible alternative given actual capacity at the time. It is evidence for resource and policy advocacy — not a governance failure in the accountability sense.'
  } else if (et === 'tension_signal') {
    governs = 'Unresolved tensions are leading indicators — they precede harms when left unaddressed. The governance question is whether this conflict has been named and has a resolution protocol.'
  } else if (et === 'queue_reorder') {
    governs = 'Every queue reorder is an implicit prioritisation decision. If the institution has not explicitly decided how to handle competing urgencies, the system is deciding for it.'
  } else if (et === 'triage_decision' && p.ethical_flag) {
    governs = 'This triage decision raised an ethical flag — meaning the system identified a potential value conflict in the scoring. Whether a human reviewed this flag is the governance question.'
  } else if (et === 'patient_discharge') {
    governs = `The outcome of this discharge — ${p.outcome ?? 'unknown'} — feeds directly into the institutional safety and experience scores. Understanding the path that produced it is the work of governance review.`
  } else {
    governs = 'Review this event in context of the broader run pattern — single events are data points; patterns across events are governance signals.'
  }

  // ── Role-specific note ────────────────────────────────────────────────────

  let roleNote: string | undefined

  if ((surveyRole === 'ethics') && (isRefusal || p.requires_human === true)) {
    roleNote = `This event was documented at tick ${tick}. The system declined to act autonomously and flagged for human review. Whether that review occurred — and by whom, and with what outcome — is a governance question with documentation implications.`
  } else if (surveyRole === 'qi' && et === 'harm_event' && isAvoidable) {
    roleNote = 'Classified as a preventable adverse event under WHO patient safety taxonomy (WHO, 2005). The mitigation pathway is documented in the event payload above.'
  } else if ((surveyRole === 'ceo' || surveyRole === 'cmo') && isPattern) {
    roleNote = `This event type has occurred ${patternCounts[et]} times in this run. This pattern — not any single event — is the governance signal. Individual events happen. Patterns reveal structure.`
  }

  return { what, means, governs, roleNote }
}

// ── Event card ────────────────────────────────────────────────────────────────

function EventCard({
  event,
  expanded,
  onToggle,
  plainEnglish,
  surveyRole,
  patternCounts,
}: {
  event: SimEvent
  expanded: boolean
  onToggle: () => void
  plainEnglish: boolean
  surveyRole: string
  patternCounts: Record<string, number>
}) {
  const sev = getSeverity(event)
  const flagged = isEthicallyFlagged(event)
  const layers = useMemo(
    () => buildLayers(event, surveyRole, patternCounts),
    [event, surveyRole, patternCounts],
  )

  return (
    <div className="border border-slate-800 rounded-lg bg-slate-900 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-800/50 transition-colors"
      >
        <span className="text-xs font-mono text-slate-600 tabular-nums mt-0.5 shrink-0 w-14">
          t{event.timestamp.toFixed(0)}
        </span>
        <span className="text-xs font-mono text-slate-400 shrink-0 mt-0.5 w-36 truncate">
          {event.event_type.replace(/_/g, ' ')}
        </span>
        <span className="flex-1 text-sm text-slate-300 leading-relaxed">
          {layers.what}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {flagged && (
            <span className="text-xs text-amber-500 border border-amber-900 px-1.5 py-0.5 rounded">
              ethical
            </span>
          )}
          {sev && <SeverityBadge severity={sev} />}
          <span className="text-slate-600 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-800 bg-slate-950/50">
          {plainEnglish ? (
            // ── Plain English: three layers ────────────────────────────────
            <div className="px-4 py-4 space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  What happened
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">{layers.what}</p>
              </div>

              <div className="space-y-1 border-l-2 border-slate-700 pl-3">
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  What this means
                </p>
                <p className="text-sm text-slate-400 leading-relaxed">{layers.means}</p>
              </div>

              <div className="space-y-1 border-l-2 border-blue-900 pl-3">
                <p className="text-[10px] font-mono text-blue-600 uppercase tracking-widest">
                  Why it matters for governance
                </p>
                <p className="text-sm text-slate-400 leading-relaxed">{layers.governs}</p>
              </div>

              {layers.roleNote && (
                <div className="space-y-1 border border-amber-900/40 bg-amber-950/20 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] font-mono text-amber-600/70 uppercase tracking-widest">
                    Role-specific note
                  </p>
                  <p className="text-sm text-amber-200/70 leading-relaxed">{layers.roleNote}</p>
                </div>
              )}

              <details className="group">
                <summary className="text-xs text-slate-600 hover:text-slate-400 cursor-pointer list-none flex items-center gap-1">
                  <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                  Technical payload
                </summary>
                <div className="mt-2">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs mb-3">
                    <MetaRow label="Event ID" value={event.event_id} />
                    <MetaRow label="Sequence" value={String(event.sequence)} />
                    <MetaRow label="Tick" value={event.timestamp.toFixed(1)} />
                    <MetaRow label="Type" value={event.event_type} />
                  </div>
                  <pre className="text-xs text-slate-400 bg-slate-900 rounded p-3 overflow-x-auto whitespace-pre-wrap break-words">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          ) : (
            // ── Technical mode: original payload view ──────────────────────
            <div className="px-4 py-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs mb-3">
                <MetaRow label="Event ID" value={event.event_id} />
                <MetaRow label="Sequence" value={String(event.sequence)} />
                <MetaRow label="Tick" value={event.timestamp.toFixed(1)} />
                <MetaRow label="Type" value={event.event_type} />
              </div>
              <div>
                <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">Payload</p>
                <pre className="text-xs text-slate-400 bg-slate-900 rounded p-3 overflow-x-auto whitespace-pre-wrap break-words">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InspectorScreen() {
  const router = useRouter()
  const [report, setReport] = useState<SimulationReport | null>(null)
  const [surveyRole, setSurveyRole] = useState<string>('')
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('HIGH')
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [ethicalOnly, setEthicalOnly] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [plainEnglish, setPlainEnglish] = useState(true)

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) { router.replace('/'); return }
    setReport(JSON.parse(raw))

    // Read role from survey for role-specific notes
    try {
      const survey = sessionStorage.getItem('im_survey')
      if (survey) {
        const parsed = JSON.parse(survey)
        if (parsed.role) setSurveyRole(parsed.role)
      }
    } catch { /* survey is optional */ }
  }, [router])

  // Pattern counts across the full event log (not just filtered)
  const patternCounts = useMemo<Record<string, number>>(() => {
    if (!report) return {}
    const counts: Record<string, number> = {}
    for (const e of report.event_log) {
      counts[e.event_type] = (counts[e.event_type] ?? 0) + 1
    }
    return counts
  }, [report])

  const eventTypes = useMemo(() => {
    if (!report) return []
    return Array.from(new Set(report.event_log.map(e => e.event_type))).sort()
  }, [report])

  const filteredEvents = useMemo(() => {
    if (!report) return []
    return report.event_log
      .filter(e => {
        if (severityFilter !== 'ALL') {
          const sev = getSeverity(e)
          if (severityFilter === 'HIGH') {
            if (!sev || !['HIGH', 'CRITICAL'].includes(sev)) return false
          } else {
            const cutoff = SEVERITY_ORDER.indexOf(severityFilter)
            const evIdx = sev ? SEVERITY_ORDER.indexOf(sev) : 99
            if (evIdx > cutoff) return false
          }
        }
        if (typeFilter !== 'ALL' && e.event_type !== typeFilter) return false
        if (ethicalOnly && !isEthicallyFlagged(e)) return false
        return true
      })
      .sort((a, b) => a.sequence - b.sequence)
  }, [report, severityFilter, typeFilter, ethicalOnly])

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (!report) return null

  return (
    <main className="max-w-4xl mx-auto px-6 py-14">
      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="mb-8">
        <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">
          Decision Inspector · {report.institutional_profile} · seed {report.seed}
        </p>
        <h1 className="text-4xl font-light text-slate-50 tracking-tight mb-3">
          What decisions were made, and why?
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
          A tick-by-tick record of simulation decisions. Default view shows only HIGH and CRITICAL
          events to reduce alert fatigue. Adjust filters to explore the full run.
        </p>
      </header>

      {/* ── Plain English / Technical toggle ──────────────────────── */}
      <div className="flex items-center gap-3 mb-6 p-3 border border-slate-800 rounded-lg bg-slate-900/40 w-fit">
        <span className="text-xs text-slate-500">View mode:</span>
        <button
          onClick={() => setPlainEnglish(true)}
          className={`text-xs px-3 py-1.5 rounded transition-colors ${
            plainEnglish
              ? 'bg-slate-700 text-slate-100'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Plain English
        </button>
        <button
          onClick={() => setPlainEnglish(false)}
          className={`text-xs px-3 py-1.5 rounded transition-colors ${
            !plainEnglish
              ? 'bg-slate-700 text-slate-100'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Technical
        </button>
        {plainEnglish && (
          <span className="text-[10px] text-slate-600 border-l border-slate-800 pl-3">
            Three-layer view: what happened · what it means · why it matters
            {surveyRole && ` · role notes: ${surveyRole}`}
          </span>
        )}
      </div>

      {/* ── Filters ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div>
          <label className="text-xs font-mono text-slate-500 uppercase tracking-widest mr-2">Severity</label>
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value as SeverityFilter)}
            className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-slate-600"
          >
            <option value="HIGH">HIGH + CRITICAL (default)</option>
            <option value="MEDIUM">MEDIUM and above</option>
            <option value="INFO">All events</option>
            <option value="ALL">All (unfiltered)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-mono text-slate-500 uppercase tracking-widest mr-2">Type</label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-slate-600"
          >
            <option value="ALL">All types</option>
            {eventTypes.map(t => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={ethicalOnly}
            onChange={e => setEthicalOnly(e.target.checked)}
            className="accent-amber-500"
          />
          <span className="text-xs text-slate-400">Ethical flags only</span>
        </label>
        <span className="ml-auto text-xs text-slate-500 tabular-nums">
          {filteredEvents.length} / {report.event_log.length} events
        </span>
      </div>

      {/* ── Event log ─────────────────────────────────────────────── */}
      {filteredEvents.length === 0 ? (
        <div className="border border-slate-800 rounded-lg p-8 text-center text-sm text-slate-500">
          No events match the current filters.{' '}
          <button
            onClick={() => { setSeverityFilter('ALL'); setTypeFilter('ALL'); setEthicalOnly(false) }}
            className="text-slate-400 underline hover:text-slate-200"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEvents.map(event => (
            <EventCard
              key={event.event_id}
              event={event}
              expanded={expandedIds.has(event.event_id)}
              onToggle={() => toggleExpand(event.event_id)}
              plainEnglish={plainEnglish}
              surveyRole={surveyRole}
              patternCounts={patternCounts}
            />
          ))}
        </div>
      )}

      {/* ── Navigation ───────────────────────────────────────────── */}
      <div className="flex gap-4 mt-10 mb-12">
        <button
          onClick={() => router.back()}
          className="border border-slate-700 text-slate-300 px-6 py-3 rounded-lg hover:bg-slate-800 transition-colors text-sm"
        >
          ← Back to results
        </button>
        <button
          onClick={() => router.replace('/')}
          className="border border-slate-800 text-slate-500 px-6 py-3 rounded-lg hover:text-slate-300 hover:border-slate-700 transition-colors text-sm"
        >
          New simulation
        </button>
      </div>

      <Disclaimer />
    </main>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function eventSummary(event: SimEvent): string {
  const p = event.payload
  if (!p) return event.event_type
  if (event.event_type === 'patient_arrival') {
    return `Patient ${p.patient_id ?? ''} arrived — acuity ${p.acuity ?? '?'}, ${p.chief_complaint ?? 'unknown complaint'}`
  }
  if (event.event_type === 'triage_decision') {
    return `Patient ${p.patient_id ?? ''} triaged — score ${p.triage_score ?? '?'}, queue position ${p.queue_position ?? '?'}`
  }
  if (event.event_type === 'patient_discharge') {
    return `Patient ${p.patient_id ?? ''} discharged — outcome: ${p.outcome ?? '?'}, LOS ${p.length_of_stay ?? '?'} ticks`
  }
  if (event.event_type === 'ethics_intervention' || event.event_type === 'refusal') {
    return String(p.description ?? p.reason ?? event.event_type)
  }
  if (event.event_type === 'harm_event') {
    return `${String(p.harm_type ?? 'harm').replace(/_/g, ' ')} — ${p.description ?? ''}`
  }
  if (event.event_type === 'tension_signal') {
    return `${String(p.tension_type ?? 'tension').replace(/_/g, ' ')} — ${p.description ?? ''}`
  }
  return JSON.stringify(p).slice(0, 120)
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-slate-600 shrink-0">{label}:</span>
      <span className="text-slate-400 font-mono">{value}</span>
    </div>
  )
}
