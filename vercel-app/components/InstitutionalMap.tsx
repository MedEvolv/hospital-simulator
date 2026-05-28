'use client'

import { useState, useMemo } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type OverlayMode =
  | 'none'
  | 'queue_density'
  | 'trust_degradation'
  | 'ethical_debt'
  | 'ai_interventions'

interface ZoneState {
  id: string
  label: string
  shortLabel: string
  description: string
  // 0–100 computed from event log
  queuePressure: number
  trustLevel: number      // 100 = fully trusted
  ethicalDebt: number     // 0 = clean, 100 = maximal
  aiEventCount: number
  patientCount: number
  staffLoad: number       // 0–100
  escalationCount: number
  governanceStatus: 'nominal' | 'strained' | 'failing'
}

interface InstitutionalMapProps {
  /** Augmented event log from scenario run */
  eventLog?: Array<{
    event_type: string
    timestamp: number
    payload: Record<string, unknown>
  }>
  /** Governance state snapshot */
  trustLevel?: number
  ethicalDebtTotal?: number
  hiddenStrain?: number
}

// ── Zone layout constants ─────────────────────────────────────────────────────

const ZONE_DEFS: Array<{
  id: string
  label: string
  shortLabel: string
  description: string
  col: number  // CSS grid column
  row: number
  colSpan?: number
}> = [
  {
    id: 'triage',
    label: 'Triage',
    shortLabel: 'TRIAGE',
    description: 'Initial patient assessment. ESI level assigned. AI triage assist active.',
    col: 1, row: 1,
  },
  {
    id: 'er',
    label: 'Emergency Room',
    shortLabel: 'ER',
    description: 'ESI 1–2 patients. High acuity. Highest ethical load per decision.',
    col: 2, row: 1,
  },
  {
    id: 'opd',
    label: 'OPD',
    shortLabel: 'OPD',
    description: 'Outpatient. Scheduling algorithm active. Chronic patient displacement risk.',
    col: 3, row: 1,
  },
  {
    id: 'waiting',
    label: 'Waiting',
    shortLabel: 'WAIT',
    description: 'Queue holding area. Invisible harm accumulates here. High ethical debt zone.',
    col: 1, row: 2, colSpan: 2,
  },
  {
    id: 'discharge',
    label: 'Discharge',
    shortLabel: 'DISCH',
    description: 'AI discharge summary generation. Hallucination risk. Accountability chain ends here.',
    col: 3, row: 2,
  },
]

// ── Event → zone attribution ──────────────────────────────────────────────────

function attributeEventToZone(eventType: string, payload: Record<string, unknown>): string | null {
  const t = eventType.toUpperCase()

  // Explicit zone in payload
  if (typeof payload.zone === 'string') return payload.zone.toLowerCase()
  if (typeof payload.room_type === 'string') {
    const rt = (payload.room_type as string).toLowerCase()
    if (rt.includes('er') || rt.includes('emergency')) return 'er'
    if (rt.includes('opd') || rt.includes('outpatient')) return 'opd'
  }

  // Infer from event type
  if (t === 'TRIAGE_STAGE_1_ASSIGNED' || t === 'TRIAGE_STAGE_2_ASSIGNED' || t === 'ESI_LEVEL_ASSIGNED') return 'triage'
  if (t === 'PATIENT_ARRIVAL') return 'triage'
  if (t === 'QUEUE_ASSIGNMENT' || t === 'QUEUE_REORDER' || t === 'ROOM_OVERLOAD') return 'waiting'
  if (t === 'PATIENT_ADMITTED') {
    const triage = String(payload.triage ?? '').toUpperCase()
    return triage === 'RED' ? 'er' : 'opd'
  }
  if (t === 'ROOM_DISCHARGE') return 'discharge'
  if (t === 'AI_HALLUCINATION_MISSED') return 'discharge'
  if (t === 'QUEUE_DISPLACEMENT') return 'waiting'
  if (t === 'ESCALATION_FAILED' || t === 'ESCALATION_SUGGESTED') return 'er'
  if (t === 'ESCALATION_SUCCESS') return 'er'
  if (t === 'CORRECTION_BURDEN') return 'triage'

  return null
}

// ── Compute zone states from event log ────────────────────────────────────────

function computeZoneStates(
  eventLog: InstitutionalMapProps['eventLog'],
  trustLevel: number,
  ethicalDebtTotal: number,
  hiddenStrain: number,
): Record<string, ZoneState> {
  const zones: Record<string, ZoneState> = {}

  for (const def of ZONE_DEFS) {
    zones[def.id] = {
      id: def.id,
      label: def.label,
      shortLabel: def.shortLabel,
      description: def.description,
      queuePressure: 0,
      trustLevel: trustLevel,
      ethicalDebt: 0,
      aiEventCount: 0,
      patientCount: 0,
      staffLoad: 30,
      escalationCount: 0,
      governanceStatus: 'nominal',
    }
  }

  if (!eventLog) return zones

  // Count events per zone
  const zoneCounts: Record<string, Record<string, number>> = {}
  for (const def of ZONE_DEFS) {
    zoneCounts[def.id] = {
      arrivals: 0,
      queue: 0,
      ai: 0,
      harm: 0,
      escalation: 0,
    }
  }

  for (const ev of eventLog) {
    const zone = attributeEventToZone(ev.event_type, ev.payload)
    if (!zone || !zoneCounts[zone]) continue
    const t = ev.event_type.toUpperCase()
    const counts = zoneCounts[zone]

    if (t === 'PATIENT_ARRIVAL' || t === 'PATIENT_ADMITTED') counts.arrivals++
    if (t === 'QUEUE_ASSIGNMENT' || t === 'QUEUE_REORDER' || t === 'QUEUE_DISPLACEMENT') counts.queue++
    if (t.includes('AGENT_ACTION') || t.includes('AI_') || t === 'AUTOMATION_DRIFT_SIGNAL') counts.ai++
    if (t.includes('HARM') || t === 'ETHICAL_DEBT_ACCRUAL' || t === 'QUEUE_DISPLACEMENT') counts.harm++
    if (t.includes('ESCALATION')) counts.escalation++
  }

  const totalEvents = eventLog.length || 1

  // Distribute global metrics across zones with zone-specific weights
  const ZONE_WEIGHTS: Record<string, { strain: number; debt: number; trust: number }> = {
    triage:    { strain: 0.25, debt: 0.10, trust: 0.85 },
    er:        { strain: 0.35, debt: 0.20, trust: 0.80 },
    opd:       { strain: 0.15, debt: 0.25, trust: 0.90 },
    waiting:   { strain: 0.20, debt: 0.35, trust: 0.75 },  // waiting is always ethically costly
    discharge: { strain: 0.05, debt: 0.10, trust: 0.88 },
  }

  for (const def of ZONE_DEFS) {
    const counts = zoneCounts[def.id]
    const weights = ZONE_WEIGHTS[def.id]
    const zone = zones[def.id]

    // Queue pressure: based on queue events + global hidden strain
    const zoneEventRatio = (counts.arrivals + counts.queue) / totalEvents
    zone.queuePressure = Math.min(100, Math.round(
      zoneEventRatio * 300 + hiddenStrain * weights.strain
    ))

    // Trust: global trust modified by zone weight and escalation failures
    zone.trustLevel = Math.min(100, Math.max(0, Math.round(
      trustLevel * weights.trust - (counts.escalation > 3 ? 15 : 0)
    )))

    // Ethical debt: global debt weighted by zone + harm events
    zone.ethicalDebt = Math.min(100, Math.round(
      ethicalDebtTotal * weights.debt + counts.harm * 2
    ))

    // AI event count
    zone.aiEventCount = counts.ai

    // Patient count approximation
    zone.patientCount = counts.arrivals

    // Staff load
    zone.staffLoad = Math.min(100, Math.round(zone.queuePressure * 0.7 + hiddenStrain * 0.3))

    // Escalation count
    zone.escalationCount = counts.escalation

    // Governance status
    if (zone.trustLevel < 40 || zone.ethicalDebt > 70 || zone.queuePressure > 80) {
      zone.governanceStatus = 'failing'
    } else if (zone.trustLevel < 65 || zone.ethicalDebt > 40 || zone.queuePressure > 55) {
      zone.governanceStatus = 'strained'
    } else {
      zone.governanceStatus = 'nominal'
    }
  }

  return zones
}

// ── Overlay colour functions ──────────────────────────────────────────────────

function getOverlayStyle(zone: ZoneState, overlay: OverlayMode): {
  bg: string
  border: string
  intensity: number
} {
  if (overlay === 'none') {
    return {
      bg: zone.governanceStatus === 'failing'
        ? 'bg-red-950/30'
        : zone.governanceStatus === 'strained'
        ? 'bg-amber-950/20'
        : 'bg-slate-900/40',
      border: zone.governanceStatus === 'failing'
        ? 'border-red-800/50'
        : zone.governanceStatus === 'strained'
        ? 'border-amber-800/40'
        : 'border-slate-800',
      intensity: 0,
    }
  }
  if (overlay === 'queue_density') {
    const v = zone.queuePressure
    return {
      bg: v > 70 ? 'bg-orange-950/50' : v > 40 ? 'bg-amber-950/30' : 'bg-slate-900/40',
      border: v > 70 ? 'border-orange-700/50' : v > 40 ? 'border-amber-700/40' : 'border-slate-800',
      intensity: v,
    }
  }
  if (overlay === 'trust_degradation') {
    const v = 100 - zone.trustLevel  // invert: high = bad
    return {
      bg: v > 60 ? 'bg-red-950/50' : v > 30 ? 'bg-amber-950/30' : 'bg-slate-900/40',
      border: v > 60 ? 'border-red-700/50' : v > 30 ? 'border-amber-700/40' : 'border-slate-800',
      intensity: v,
    }
  }
  if (overlay === 'ethical_debt') {
    const v = zone.ethicalDebt
    return {
      bg: v > 60 ? 'bg-rose-950/50' : v > 30 ? 'bg-rose-950/25' : 'bg-slate-900/40',
      border: v > 60 ? 'border-rose-700/50' : v > 30 ? 'border-rose-800/40' : 'border-slate-800',
      intensity: v,
    }
  }
  if (overlay === 'ai_interventions') {
    const v = Math.min(100, zone.aiEventCount * 5)
    return {
      bg: v > 60 ? 'bg-sky-950/40' : v > 20 ? 'bg-sky-950/20' : 'bg-slate-900/40',
      border: v > 60 ? 'border-sky-700/50' : v > 20 ? 'border-sky-800/40' : 'border-slate-800',
      intensity: v,
    }
  }
  return { bg: 'bg-slate-900/40', border: 'border-slate-800', intensity: 0 }
}

// ── Zone tile ─────────────────────────────────────────────────────────────────

function ZoneTile({
  zone,
  overlay,
  selected,
  onSelect,
}: {
  zone: ZoneState
  overlay: OverlayMode
  selected: boolean
  onSelect: (id: string | null) => void
}) {
  const { bg, border, intensity } = getOverlayStyle(zone, overlay)

  const statusDot = zone.governanceStatus === 'failing'
    ? 'bg-red-500'
    : zone.governanceStatus === 'strained'
    ? 'bg-amber-500'
    : 'bg-slate-600'

  return (
    <button
      type="button"
      onClick={() => onSelect(selected ? null : zone.id)}
      className={`text-left border rounded-lg p-4 transition-all h-full min-h-[100px] ${bg} ${border} ${
        selected ? 'ring-1 ring-slate-400 ring-offset-1 ring-offset-slate-950' : 'hover:border-slate-600'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot} mt-0.5 shrink-0`} />
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            {zone.shortLabel}
          </p>
        </div>
        {overlay !== 'none' && (
          <span className="text-[10px] font-mono text-slate-600 tabular-nums">
            {Math.round(intensity)}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-200 font-medium leading-snug">{zone.label}</p>

      {/* Mini stats */}
      <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono text-slate-600">
        {zone.patientCount > 0 && <span>{zone.patientCount} pts</span>}
        {zone.escalationCount > 0 && <span className="text-amber-700">{zone.escalationCount} esc</span>}
        {zone.aiEventCount > 0 && <span className="text-sky-800">{zone.aiEventCount} AI</span>}
      </div>
    </button>
  )
}

// ── Zone detail panel ─────────────────────────────────────────────────────────

function ZoneDetailPanel({ zone, onClose }: { zone: ZoneState; onClose: () => void }) {
  const rows = [
    { label: 'Queue pressure',        value: zone.queuePressure,         highMeansGood: false },
    { label: 'Trust level',           value: zone.trustLevel,            highMeansGood: true },
    { label: 'Ethical debt',          value: zone.ethicalDebt,           highMeansGood: false },
    { label: 'Staff load',            value: zone.staffLoad,             highMeansGood: false },
  ]

  return (
    <div className="border border-slate-700 rounded-lg p-5 bg-slate-900">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">
            Zone detail
          </p>
          <h3 className="text-base font-medium text-slate-100">{zone.label}</h3>
          <span className={`text-[10px] font-mono border px-1.5 py-0.5 rounded uppercase tracking-wider mt-1 inline-block ${
            zone.governanceStatus === 'failing'
              ? 'text-red-400 border-red-900'
              : zone.governanceStatus === 'strained'
              ? 'text-amber-400 border-amber-900'
              : 'text-slate-500 border-slate-700'
          }`}>
            {zone.governanceStatus}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-600 hover:text-slate-400 text-xs font-mono transition-colors"
        >
          ✕ close
        </button>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed mb-4">
        {zone.description}
      </p>

      <div className="space-y-2.5">
        {rows.map(({ label, value, highMeansGood }) => {
          const color = highMeansGood
            ? value >= 70 ? 'text-slate-400' : value >= 45 ? 'text-amber-400' : 'text-red-400'
            : value <= 30 ? 'text-slate-400' : value <= 55 ? 'text-amber-400' : 'text-red-400'
          const barColor = highMeansGood
            ? value >= 70 ? 'bg-slate-600' : value >= 45 ? 'bg-amber-600' : 'bg-red-700'
            : value <= 30 ? 'bg-slate-600' : value <= 55 ? 'bg-amber-600' : 'bg-red-700'
          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">{label}</span>
                <span className={`text-xs font-mono tabular-nums ${color}`}>{Math.round(value)}</span>
              </div>
              <div className="h-0.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${value}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {zone.aiEventCount > 0 && (
        <p className="text-xs text-sky-600 mt-4">
          {zone.aiEventCount} AI interventions logged in this zone.
        </p>
      )}
      {zone.escalationCount > 0 && (
        <p className="text-xs text-amber-600 mt-2">
          {zone.escalationCount} escalation events — check event log for unresolved chains.
        </p>
      )}
    </div>
  )
}

// ── Overlay legend ────────────────────────────────────────────────────────────

const OVERLAY_META: Array<{ value: OverlayMode; label: string; description: string }> = [
  { value: 'none',             label: 'Governance status', description: 'Zone health derived from trust + strain + debt combined' },
  { value: 'queue_density',    label: 'Queue density',     description: 'Queue pressure per zone — higher = more invisible waiting harm' },
  { value: 'trust_degradation',label: 'Trust decay',       description: 'Where operational trust has degraded most' },
  { value: 'ethical_debt',     label: 'Ethical debt',      description: 'Accumulated ethical cost weighted by zone activity' },
  { value: 'ai_interventions', label: 'AI activity',       description: 'Zones with highest AI event density' },
]

// ── Main export ───────────────────────────────────────────────────────────────

export default function InstitutionalMap({
  eventLog = [],
  trustLevel = 70,
  ethicalDebtTotal = 0,
  hiddenStrain = 30,
}: InstitutionalMapProps) {
  const [overlay, setOverlay] = useState<OverlayMode>('none')
  const [selectedZone, setSelectedZone] = useState<string | null>(null)

  const zoneStates = useMemo(
    () => computeZoneStates(eventLog, trustLevel, ethicalDebtTotal, hiddenStrain),
    [eventLog, trustLevel, ethicalDebtTotal, hiddenStrain],
  )

  const activeOverlayMeta = OVERLAY_META.find(o => o.value === overlay)!

  return (
    <section>
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="mb-5">
        <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-1">
          Institutional map
        </p>
        <h2 className="text-2xl font-light text-slate-100 tracking-tight mb-1">
          Where the pressure accumulated.
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Each zone shows how governance conditions evolved during the scenario.
          Click a zone for detail. Toggle the overlay to see different pressure signals.
        </p>
      </div>

      {/* ── Overlay selector ──────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {OVERLAY_META.map(o => (
          <button
            key={o.value}
            type="button"
            onClick={() => setOverlay(o.value)}
            className={`text-[10px] font-mono border px-2 py-1 rounded uppercase tracking-widest transition-colors ${
              overlay === o.value
                ? 'text-slate-200 border-slate-500 bg-slate-800'
                : 'text-slate-600 border-slate-800 hover:border-slate-700 hover:text-slate-400'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-slate-600 mb-4 leading-relaxed">
        {activeOverlayMeta.description}
      </p>

      {/* ── Zone grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Row 1: Triage | ER | OPD */}
        {['triage', 'er', 'opd'].map(id => (
          <ZoneTile
            key={id}
            zone={zoneStates[id]}
            overlay={overlay}
            selected={selectedZone === id}
            onSelect={setSelectedZone}
          />
        ))}
        {/* Row 2: Waiting (spans 2) | Discharge */}
        <div className="col-span-2">
          <ZoneTile
            zone={zoneStates['waiting']}
            overlay={overlay}
            selected={selectedZone === 'waiting'}
            onSelect={setSelectedZone}
          />
        </div>
        <ZoneTile
          zone={zoneStates['discharge']}
          overlay={overlay}
          selected={selectedZone === 'discharge'}
          onSelect={setSelectedZone}
        />
      </div>

      {/* ── Zone detail panel ─────────────────────────────────────── */}
      {selectedZone && zoneStates[selectedZone] && (
        <ZoneDetailPanel
          zone={zoneStates[selectedZone]}
          onClose={() => setSelectedZone(null)}
        />
      )}

      {/* ── Legend ────────────────────────────────────────────────── */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-700">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
          <span>nominal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>strained</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span>failing</span>
        </div>
        <span className="ml-auto text-slate-800">
          click a zone for detail
        </span>
      </div>
    </section>
  )
}
