'use client'

import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FiveSignals {
  pss: number  // Patient Safety Signal       0–100  (higher = safer)
  pes: number  // Patient Experience Signal   0–100  (higher = better experience/dignity)
  sss: number  // Staff Stress Signal         0–100  (higher = LESS strain)
  eic: number  // Ethics Intervention Count   a COUNT, not a 0–100 score (RULE-M4)
  sti: number  // System Throughput Index     0–100  (flow efficiency)
}

export interface HumanStateSnapshot {
  averageFatigue: number
  averageCognitiveLoad: number
  alertFatigue: number
  moraleScore: number
  escalationWillingness: number
  reviewCapacity: number
}

export interface GovernanceStateSnapshot {
  // Top-level fields are optional — only human_state is rendered in this component
  trust?: number
  hidden_strain?: number
  ethical_debt?: number
  governance_drift?: number
  automation_drift?: number
  human_state: HumanStateSnapshot
}

interface VitalSignalDef {
  abbrev: keyof FiveSignals
  fullName: string
  highMeansGood: boolean   // true → high = green; false → high = red (strain indicator)
  description: string
  governanceNote: string
}

const SIGNAL_DEFS: VitalSignalDef[] = [
  {
    abbrev: 'pss',
    fullName: 'Patient Safety Signal',
    highMeansGood: true,
    description: 'Safe care consistency across all patients in this scenario run.',
    governanceNote: 'PSS below 60 under high load signals a structural capacity problem, not a staffing failure.',
  },
  {
    abbrev: 'pes',
    fullName: 'Patient Experience Signal',
    highMeansGood: true,
    description: 'Waiting times, communication quality, and dignity preserved through care.',
    governanceNote: 'PES penalises the unexplained, not the deviation — an unexplained queue jump costs more than the wait itself.',
  },
  {
    abbrev: 'sss',
    fullName: 'Staff Stress Signal',
    highMeansGood: true,
    description: 'Cumulative cognitive and moral load on staff across the run (higher value = less strain).',
    governanceNote: 'Sustained staff stress links to moral injury — a governance concern, not an HR one. The correction burden is its primary driver.',
  },
  {
    abbrev: 'eic',
    fullName: 'Ethics Intervention Count',
    highMeansGood: true,
    description: 'A COUNT of governance overrides / deferrals to human judgement.',
    governanceNote: 'EIC is a count, never a penalty: a higher count means the governance layer was engaged. A ZERO in a high-acuity run is the warning sign (RULE-M4).',
  },
  {
    abbrev: 'sti',
    fullName: 'System Throughput Index',
    highMeansGood: true,
    description: 'Flow efficiency — how much patient volume the ED processed.',
    governanceNote: 'High throughput bought with high ethical debt or value drift is the pattern to surface — not celebrate.',
  },
]

// ── Colour mapping ─────────────────────────────────────────────────────────────

function getSignalColor(value: number, highMeansGood: boolean): {
  text: string
  bar: string
  glow: string
} {
  // For "high = good" metrics: good → amber → red as value falls
  // For "high = bad" (strain): good → amber → red as value rises
  const effectiveValue = highMeansGood ? value : (100 - value)

  if (effectiveValue >= 70) {
    return { text: 'text-slate-700', bar: 'bg-slate-500', glow: '' }
  }
  if (effectiveValue >= 45) {
    return { text: 'text-amber-400', bar: 'bg-amber-500', glow: 'shadow-amber-900/50' }
  }
  return { text: 'text-red-400', bar: 'bg-red-600', glow: 'shadow-red-900/50' }
}

function getSeverityLabel(value: number, highMeansGood: boolean): string {
  const effectiveValue = highMeansGood ? value : (100 - value)
  if (effectiveValue >= 70) return 'nominal'
  if (effectiveValue >= 45) return 'degraded'
  return 'critical'
}

// ── Gauge: individual signal ──────────────────────────────────────────────────

function SignalGauge({
  def,
  value,
  delta,
}: {
  def: VitalSignalDef
  value: number
  delta?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const { text, bar } = getSignalColor(value, def.highMeansGood)
  const label = getSeverityLabel(value, def.highMeansGood)

  const deltaText = delta !== undefined
    ? delta > 0
      ? `+${delta.toFixed(0)}`
      : delta < 0
      ? `${delta.toFixed(0)}`
      : '±0'
    : null

  const deltaColor = delta !== undefined
    ? def.highMeansGood
      ? delta >= 0 ? 'text-slate-600' : 'text-amber-400'
      : delta <= 0 ? 'text-slate-600' : 'text-amber-400'
    : ''

  return (
    <div className="border border-slate-200 rounded-lg bg-slate-50/60 p-4">
      {/* ── Header row ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-0.5">
            {def.abbrev.toUpperCase()}
          </p>
          <p className="text-xs text-slate-600">{def.fullName}</p>
        </div>
        <div className="text-right shrink-0">
          <span className={`text-xs font-mono border px-1.5 py-0.5 rounded ${
            label === 'nominal'
              ? 'text-slate-500 border-slate-300'
              : label === 'degraded'
              ? 'text-amber-500 border-amber-200'
              : 'text-red-400 border-red-900'
          }`}>
            {label}
          </span>
        </div>
      </div>

      {/* ── Value row ──────────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-2 mb-2">
        <p className={`text-4xl font-light tabular-nums ${text}`}>
          {Math.round(value)}
        </p>
        <div className="text-right pb-1">
          <p className="text-xs text-slate-600">/ 100</p>
          {deltaText && (
            <p className={`text-xs font-mono tabular-nums ${deltaColor}`}>
              {deltaText}
            </p>
          )}
        </div>
      </div>

      {/* ── Progress bar ───────────────────────────────────────────── */}
      <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all ${bar}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>

      {/* ── Description ────────────────────────────────────────────── */}
      <p className="text-xs text-slate-500 leading-relaxed">{def.description}</p>

      {/* ── Governance note (expandable) ───────────────────────────── */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="text-[10px] font-mono text-slate-600 hover:text-slate-600 transition-colors mt-2 uppercase tracking-widest"
      >
        {expanded ? '▲ hide note' : '▼ governance note'}
      </button>

      {expanded && (
        <p className="text-xs text-slate-600 leading-relaxed mt-2 border-t border-slate-200 pt-2">
          {def.governanceNote}
        </p>
      )}
    </div>
  )
}

// ── Human state panel ─────────────────────────────────────────────────────────

function HumanStatePanel({ state }: { state: HumanStateSnapshot }) {
  const rows: Array<{ label: string; value: number; highMeansGood: boolean }> = [
    { label: 'Review capacity', value: state.reviewCapacity, highMeansGood: true },
    { label: 'Escalation willingness', value: state.escalationWillingness, highMeansGood: true },
    { label: 'Morale', value: state.moraleScore, highMeansGood: true },
    { label: 'Fatigue', value: state.averageFatigue, highMeansGood: false },
    { label: 'Cognitive load', value: state.averageCognitiveLoad, highMeansGood: false },
    { label: 'Alert fatigue', value: state.alertFatigue, highMeansGood: false },
  ]

  return (
    <div className="border border-slate-200 rounded-lg bg-slate-50/60 p-4">
      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">
        Human state
      </p>
      <div className="space-y-2.5">
        {rows.map(({ label, value, highMeansGood }) => {
          const { text } = getSignalColor(value, highMeansGood)
          return (
            <div key={label} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">{label}</span>
                  <span className={`text-xs tabular-nums font-mono ${text}`}>
                    {Math.round(value)}
                  </span>
                </div>
                <div className="h-0.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getSignalColor(value, highMeansGood).bar}`}
                    style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-[10px] text-slate-600 mt-3 leading-relaxed">
        Human state is not a performance verdict. It is the institutional cost of operating under the conditions this scenario created.
      </p>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

interface InstitutionalVitalSignsProps {
  signals: FiveSignals
  governanceState?: GovernanceStateSnapshot
  scenarioName?: string
  runId?: string
}

export default function InstitutionalVitalSigns({
  signals,
  governanceState,
  scenarioName,
  runId,
}: InstitutionalVitalSignsProps) {
  return (
    <section>
      {/* ── Section header ────────────────────────────────────────── */}
      <div className="flex items-baseline justify-between gap-4 mb-5">
        <div>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-1">
            Five signal metrics
          </p>
          <h2 className="text-2xl font-light text-slate-900 tracking-tight">
            Institutional vital signs.
          </h2>
        </div>
        {runId && (
          <span className="text-[10px] font-mono text-slate-700 shrink-0">
            run {runId.slice(0, 8)}
          </span>
        )}
      </div>

      {scenarioName && (
        <p className="text-sm text-slate-500 mb-5 leading-relaxed">
          These metrics reflect the cumulative governance state at end of scenario:{' '}
          <span className="text-slate-700">{scenarioName}</span>.
          They are not a score — they are a map of where institutional pressure accumulated.
        </p>
      )}

      {/* ── 5 signal gauges ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {SIGNAL_DEFS.map(def => (
          <SignalGauge
            key={def.abbrev}
            def={def}
            value={signals[def.abbrev]}
          />
        ))}
      </div>

      {/* ── Human state panel (if governance state provided) ──────── */}
      {governanceState?.human_state && (
        <div className="mt-3">
          <HumanStatePanel state={governanceState.human_state} />
        </div>
      )}

      {/* ── Reading guide ─────────────────────────────────────────── */}
      <div className="mt-4 p-4 border border-slate-200/60 rounded-lg bg-slate-50/40">
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-2">
          How to read these signals
        </p>
        <p className="text-xs text-slate-600 leading-relaxed">
          PSS, PES, EIC, and STI are "high is good" metrics — degradation toward red is concerning.{' '}
          SSS is a strain indicator — high SSS means the system is under institutional pressure.{' '}
          No single signal tells the full story. The most significant pattern is when PSS or EIC
          falls while STI collapses — this is the signature of a governance failure, not a capacity one.
        </p>
      </div>
    </section>
  )
}
