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
  icon: string
  description: string
  queuePressure: number
  trustLevel: number
  ethicalDebt: number
  aiEventCount: number
  patientCount: number
  staffLoad: number
  escalationCount: number
  governanceStatus: 'nominal' | 'strained' | 'failing'
}

interface InstitutionalMapProps {
  eventLog?: Array<{
    event_type: string
    timestamp: number
    payload: Record<string, unknown>
  }>
  trustLevel?: number
  ethicalDebtTotal?: number
  hiddenStrain?: number
}

// ── Zone definitions ──────────────────────────────────────────────────────────

const ZONE_DEFS: Array<{
  id: string
  label: string
  shortLabel: string
  icon: string
  description: string
  col: number
  row: number
  colSpan?: number
}> = [
  {
    id: 'triage',
    label: 'Triage',
    shortLabel: 'TRIAGE',
    icon: '🔺',
    description: 'Initial patient assessment. ESI level assigned. AI triage assist active.',
    col: 1, row: 1,
  },
  {
    id: 'er',
    label: 'Emergency Room',
    shortLabel: 'ER',
    icon: '🚨',
    description: 'ESI 1–2 patients. High acuity. Highest ethical load per decision.',
    col: 2, row: 1,
  },
  {
    id: 'opd',
    label: 'Outpatient (OPD)',
    shortLabel: 'OPD',
    icon: '🏥',
    description: 'Outpatient. Scheduling algorithm active. Chronic patient displacement risk.',
    col: 3, row: 1,
  },
  {
    id: 'waiting',
    label: 'Waiting Area',
    shortLabel: 'WAITING',
    icon: '⏳',
    description: 'Queue holding area. Invisible harm accumulates here. High ethical debt zone.',
    col: 1, row: 2, colSpan: 2,
  },
  {
    id: 'discharge',
    label: 'Discharge',
    shortLabel: 'DISCH',
    icon: '📋',
    description: 'AI discharge summary generation. Hallucination risk. Accountability chain ends here.',
    col: 3, row: 2,
  },
]

// ── Event → zone attribution ──────────────────────────────────────────────────

function attributeEventToZone(eventType: string, payload: Record<string, unknown>): string | null {
  const t = eventType.toUpperCase()

  if (typeof payload.zone === 'string') return payload.zone.toLowerCase()
  if (typeof payload.room_type === 'string') {
    const rt = (payload.room_type as string).toLowerCase()
    if (rt.includes('er') || rt.includes('emergency')) return 'er'
    if (rt.includes('opd') || rt.includes('outpatient')) return 'opd'
  }

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

// ── Compute zone states ────────────────────────────────────────────────────────

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
      icon: def.icon,
      description: def.description,
      queuePressure: 0,
      trustLevel,
      ethicalDebt: 0,
      aiEventCount: 0,
      patientCount: 0,
      staffLoad: 30,
      escalationCount: 0,
      governanceStatus: 'nominal',
    }
  }

  if (!eventLog) return zones

  const zoneCounts: Record<string, Record<string, number>> = {}
  for (const def of ZONE_DEFS) {
    zoneCounts[def.id] = { arrivals: 0, queue: 0, ai: 0, harm: 0, escalation: 0 }
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

  const ZONE_WEIGHTS: Record<string, { strain: number; debt: number; trust: number }> = {
    triage:    { strain: 0.25, debt: 0.10, trust: 0.85 },
    er:        { strain: 0.35, debt: 0.20, trust: 0.80 },
    opd:       { strain: 0.15, debt: 0.25, trust: 0.90 },
    waiting:   { strain: 0.20, debt: 0.35, trust: 0.75 },
    discharge: { strain: 0.05, debt: 0.10, trust: 0.88 },
  }

  for (const def of ZONE_DEFS) {
    const counts = zoneCounts[def.id]
    const weights = ZONE_WEIGHTS[def.id]
    const zone = zones[def.id]

    const zoneEventRatio = (counts.arrivals + counts.queue) / totalEvents
    zone.queuePressure = Math.min(100, Math.round(zoneEventRatio * 300 + hiddenStrain * weights.strain))
    zone.trustLevel = Math.min(100, Math.max(0, Math.round(trustLevel * weights.trust - (counts.escalation > 3 ? 15 : 0))))
    zone.ethicalDebt = Math.min(100, Math.round(ethicalDebtTotal * weights.debt + counts.harm * 2))
    zone.aiEventCount = counts.ai
    zone.patientCount = counts.arrivals
    zone.staffLoad = Math.min(100, Math.round(zone.queuePressure * 0.7 + hiddenStrain * 0.3))
    zone.escalationCount = counts.escalation

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

// ── Overlay colour helpers ────────────────────────────────────────────────────

function getOverlayStyle(zone: ZoneState, overlay: OverlayMode): {
  bg: string
  border: string
  intensity: number
  label?: string
} {
  if (overlay === 'none') {
    return {
      bg: zone.governanceStatus === 'failing'
        ? 'bg-red-950/40'
        : zone.governanceStatus === 'strained'
        ? 'bg-amber-950/30'
        : 'bg-slate-900/50',
      border: zone.governanceStatus === 'failing'
        ? 'border-red-700/60'
        : zone.governanceStatus === 'strained'
        ? 'border-amber-700/50'
        : 'border-slate-700/60',
      intensity: 0,
    }
  }
  if (overlay === 'queue_density') {
    const v = zone.queuePressure
    return {
      bg: v > 70 ? 'bg-orange-950/55' : v > 40 ? 'bg-amber-950/35' : 'bg-slate-900/50',
      border: v > 70 ? 'border-orange-600/60' : v > 40 ? 'border-amber-600/50' : 'border-slate-700/60',
      intensity: v,
      label: `${Math.round(v)}`,
    }
  }
  if (overlay === 'trust_degradation') {
    const v = 100 - zone.trustLevel
    return {
      bg: v > 60 ? 'bg-red-950/55' : v > 30 ? 'bg-amber-950/35' : 'bg-slate-900/50',
      border: v > 60 ? 'border-red-600/60' : v > 30 ? 'border-amber-600/50' : 'border-slate-700/60',
      intensity: v,
      label: `${Math.round(v)}%`,
    }
  }
  if (overlay === 'ethical_debt') {
    const v = zone.ethicalDebt
    return {
      bg: v > 60 ? 'bg-rose-950/55' : v > 30 ? 'bg-rose-950/30' : 'bg-slate-900/50',
      border: v > 60 ? 'border-rose-600/60' : v > 30 ? 'border-rose-700/50' : 'border-slate-700/60',
      intensity: v,
      label: `${Math.round(v)}`,
    }
  }
  if (overlay === 'ai_interventions') {
    const v = Math.min(100, zone.aiEventCount * 5)
    return {
      bg: v > 60 ? 'bg-sky-950/45' : v > 20 ? 'bg-sky-950/25' : 'bg-slate-900/50',
      border: v > 60 ? 'border-sky-600/60' : v > 20 ? 'border-sky-700/50' : 'border-slate-700/60',
      intensity: v,
      label: `${zone.aiEventCount}`,
    }
  }
  return { bg: 'bg-slate-900/50', border: 'border-slate-700/60', intensity: 0 }
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
  const { bg, border, label: overlayLabel } = getOverlayStyle(zone, overlay)

  const statusConfig = {
    failing:  { dot: 'bg-red-500',    badge: 'text-red-400 bg-red-950/60 border-red-800/60',    label: 'Failing' },
    strained: { dot: 'bg-amber-400',  badge: 'text-amber-400 bg-amber-950/60 border-amber-800/60', label: 'Strained' },
    nominal:  { dot: 'bg-emerald-500', badge: 'text-slate-500 bg-slate-800/60 border-slate-700/60', label: 'Nominal' },
  }[zone.governanceStatus]

  return (
    <button
      type="button"
      onClick={() => onSelect(selected ? null : zone.id)}
      className={`text-left border-2 rounded-xl p-5 transition-all h-full min-h-[140px] w-full ${bg} ${border} ${
        selected
          ? 'ring-2 ring-slate-400 ring-offset-2 ring-offset-slate-950'
          : 'hover:border-slate-500/80'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl leading-none">{zone.icon}</span>
          <div>
            <p className="text-base font-semibold text-slate-100 leading-tight">{zone.label}</p>
            <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-0.5">{zone.shortLabel}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[11px] font-mono border px-2 py-0.5 rounded-full uppercase tracking-wide ${statusConfig.badge}`}>
            {statusConfig.label}
          </span>
          {overlayLabel && (
            <span className="text-sm font-mono font-bold text-slate-300 tabular-nums">
              {overlayLabel}
            </span>
          )}
        </div>
      </div>

      {/* Status dot + mini bars */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2.5 h-2.5 rounded-full ${statusConfig.dot} shrink-0`} />
        {/* Inline queue pressure bar */}
        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              zone.queuePressure > 70 ? 'bg-orange-500' : zone.queuePressure > 40 ? 'bg-amber-500' : 'bg-slate-600'
            }`}
            style={{ width: `${zone.queuePressure}%` }}
          />
        </div>
        <span className="text-xs font-mono text-slate-500 tabular-nums w-8 text-right shrink-0">
          {zone.queuePressure}%
        </span>
      </div>

      {/* Stat chips */}
      <div className="flex flex-wrap gap-1.5 text-xs font-mono">
        {zone.patientCount > 0 && (
          <span className="bg-slate-800/80 text-slate-400 px-2 py-0.5 rounded-md">
            {zone.patientCount} pts
          </span>
        )}
        {zone.escalationCount > 0 && (
          <span className="bg-amber-950/60 text-amber-400 border border-amber-800/40 px-2 py-0.5 rounded-md">
            {zone.escalationCount} escalation{zone.escalationCount !== 1 ? 's' : ''}
          </span>
        )}
        {zone.aiEventCount > 0 && (
          <span className="bg-sky-950/60 text-sky-400 border border-sky-800/40 px-2 py-0.5 rounded-md">
            {zone.aiEventCount} AI events
          </span>
        )}
      </div>
    </button>
  )
}

// ── Zone detail panel ─────────────────────────────────────────────────────────

function ZoneDetailPanel({ zone, onClose }: { zone: ZoneState; onClose: () => void }) {
  const rows = [
    { label: 'Queue pressure', value: zone.queuePressure, highMeansGood: false,
      note: zone.queuePressure > 70 ? 'Critical — patients accumulating faster than throughput' : undefined },
    { label: 'Trust level',    value: zone.trustLevel,    highMeansGood: true,
      note: zone.trustLevel < 50 ? 'Degraded — staff and patients doubting system decisions' : undefined },
    { label: 'Ethical debt',   value: zone.ethicalDebt,   highMeansGood: false,
      note: zone.ethicalDebt > 50 ? 'Elevated — unreviewed decisions or displaced vulnerable patients' : undefined },
    { label: 'Staff load',     value: zone.staffLoad,     highMeansGood: false,
      note: zone.staffLoad > 70 ? 'High — cognitive overload risk, security incidents likely' : undefined },
  ]

  const statusConfig = {
    failing:  { label: 'Failing',  classes: 'text-red-400 bg-red-950/50 border-red-800/60' },
    strained: { label: 'Strained', classes: 'text-amber-400 bg-amber-950/50 border-amber-800/60' },
    nominal:  { label: 'Nominal',  classes: 'text-slate-400 bg-slate-800/50 border-slate-700/60' },
  }[zone.governanceStatus]

  return (
    <div className="border border-slate-600 rounded-xl p-6 bg-slate-900/80 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{zone.icon}</span>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">{zone.label}</h3>
            <span className={`text-xs font-mono border px-2.5 py-0.5 rounded-full mt-1 inline-block ${statusConfig.classes}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-200 text-sm font-mono border border-slate-700 hover:border-slate-500 px-2.5 py-1 rounded-lg transition-colors"
        >
          ✕ close
        </button>
      </div>

      <p className="text-sm text-slate-400 leading-relaxed mb-5 bg-slate-800/40 rounded-lg px-4 py-3">
        {zone.description}
      </p>

      <div className="space-y-4">
        {rows.map(({ label, value, highMeansGood, note }) => {
          const isGood = highMeansGood ? value >= 70 : value <= 30
          const isWarn = highMeansGood ? value >= 45 : value <= 55
          const numColor = isGood ? 'text-slate-300' : isWarn ? 'text-amber-400' : 'text-red-400'
          const barColor = isGood ? 'bg-slate-500' : isWarn ? 'bg-amber-500' : 'bg-red-500'

          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-300 font-medium">{label}</span>
                <span className={`text-sm font-mono font-bold tabular-nums ${numColor}`}>
                  {Math.round(value)}
                  <span className="text-xs font-normal text-slate-600 ml-0.5">/ 100</span>
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor}`}
                  style={{ width: `${value}%` }}
                />
              </div>
              {note && (
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{note}</p>
              )}
            </div>
          )
        })}
      </div>

      {(zone.aiEventCount > 0 || zone.escalationCount > 0) && (
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col gap-2">
          {zone.aiEventCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-sky-400">
              <span className="bg-sky-950/50 border border-sky-800/40 px-2.5 py-0.5 rounded-md font-mono font-bold">
                {zone.aiEventCount}
              </span>
              <span className="text-slate-400">AI interventions logged in this zone</span>
            </div>
          )}
          {zone.escalationCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-400">
              <span className="bg-amber-950/50 border border-amber-800/40 px-2.5 py-0.5 rounded-md font-mono font-bold">
                {zone.escalationCount}
              </span>
              <span className="text-slate-400">escalation events — check event log for unresolved chains</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Overlay definitions ────────────────────────────────────────────────────────

const OVERLAY_META: Array<{ value: OverlayMode; label: string; description: string }> = [
  { value: 'none',              label: 'Governance',    description: 'Zone health derived from trust + strain + ethical debt combined' },
  { value: 'queue_density',     label: 'Queue density', description: 'Queue pressure per zone — higher means patients waiting longer, invisible harm accumulating' },
  { value: 'trust_degradation', label: 'Trust decay',   description: 'Where operational trust has degraded most — affects override willingness' },
  { value: 'ethical_debt',      label: 'Ethical debt',  description: 'Accumulated ethical cost weighted by zone activity and vulnerable cohort impact' },
  { value: 'ai_interventions',  label: 'AI activity',   description: 'Zones with highest AI event density — review for automation drift' },
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
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-1">
          Institutional map
        </p>
        <h2 className="text-2xl font-light text-slate-100 tracking-tight mb-2">
          Where the pressure accumulated
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Click any zone to see its full governance breakdown.
          Toggle the overlay to switch signal layers.
        </p>
      </div>

      {/* ── Overlay selector ───────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-3">
        {OVERLAY_META.map(o => (
          <button
            key={o.value}
            type="button"
            onClick={() => setOverlay(o.value)}
            className={`text-xs font-medium border px-3 py-1.5 rounded-lg uppercase tracking-wide transition-colors ${
              overlay === o.value
                ? 'text-slate-100 border-slate-400 bg-slate-700'
                : 'text-slate-500 border-slate-700 hover:border-slate-500 hover:text-slate-300'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500 mb-5 leading-relaxed bg-slate-900/40 border border-slate-800 rounded-lg px-3 py-2">
        {activeOverlayMeta.description}
      </p>

      {/* ── Zone grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Row 1 */}
        {(['triage', 'er', 'opd'] as const).map(id => (
          <ZoneTile
            key={id}
            zone={zoneStates[id]}
            overlay={overlay}
            selected={selectedZone === id}
            onSelect={setSelectedZone}
          />
        ))}
        {/* Row 2 */}
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

      {/* ── Detail panel ───────────────────────────────────────────── */}
      {selectedZone && zoneStates[selectedZone] && (
        <ZoneDetailPanel
          zone={zoneStates[selectedZone]}
          onClose={() => setSelectedZone(null)}
        />
      )}

      {/* ── Legend ─────────────────────────────────────────────────── */}
      <div className="mt-5 flex flex-wrap items-center gap-5 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-slate-500">Nominal</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
          <span className="text-slate-500">Strained</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
          <span className="text-slate-500">Failing</span>
        </div>
        <span className="ml-auto text-xs text-slate-700 italic">
          bar shows queue pressure · click for full detail
        </span>
      </div>
    </section>
  )
}
