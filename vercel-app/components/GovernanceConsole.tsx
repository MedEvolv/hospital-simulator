'use client'

import { useState } from 'react'
import {
  INTERVENTION_CATALOGUE,
  type GovernanceIntervention,
  type InterventionType,
} from '@/lib/interventions/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface GovernanceConsoleProps {
  /** Current governance metric values (0–100) */
  metrics?: {
    trust: number
    hiddenStrain: number
    ethicalDebt: number
    governanceDrift: number
    automationDrift: number
    reviewCapacity: number
    escalationWillingness: number
  }
  /** Called when an intervention is applied */
  onInterventionApplied?: (intervention: GovernanceIntervention) => void
  /** Run ID for audit log attribution */
  runId?: string
  /** Scenario name for context */
  scenarioName?: string
}

// ── Default (placeholder) metrics when no scenario is loaded ──────────────────

const DEFAULT_METRICS = {
  trust: 70,
  hiddenStrain: 35,
  ethicalDebt: 20,
  governanceDrift: 25,
  automationDrift: 30,
  reviewCapacity: 75,
  escalationWillingness: 70,
}

// ── Metric display labels ─────────────────────────────────────────────────────

const METRIC_LABELS: Record<string, { label: string; highMeansGood: boolean }> = {
  trust:                 { label: 'Operational trust',       highMeansGood: true },
  hiddenStrain:          { label: 'Hidden strain',           highMeansGood: false },
  ethicalDebt:           { label: 'Ethical debt',            highMeansGood: false },
  governanceDrift:       { label: 'Governance drift',        highMeansGood: false },
  automationDrift:       { label: 'Automation drift',        highMeansGood: false },
  reviewCapacity:        { label: 'Review capacity',         highMeansGood: true },
  escalationWillingness: { label: 'Escalation willingness',  highMeansGood: true },
}

// ── Helper: compute projected metric after effects ────────────────────────────

function projectMetrics(
  current: typeof DEFAULT_METRICS,
  intervention: typeof INTERVENTION_CATALOGUE[0],
) {
  const projected = { ...current }
  for (const effect of intervention.effects) {
    const key = effect.metric as keyof typeof projected
    if (key in projected) {
      projected[key] = Math.max(0, Math.min(100, projected[key] + effect.delta))
    }
  }
  return projected
}

// ── Metric value bar ──────────────────────────────────────────────────────────

function MetricBar({
  label, value, projected, highMeansGood,
}: {
  label: string
  value: number
  projected?: number
  highMeansGood: boolean
}) {
  const effectiveValue = highMeansGood ? value : (100 - value)
  const color = effectiveValue >= 70
    ? 'bg-slate-500'
    : effectiveValue >= 45
    ? 'bg-amber-600'
    : 'bg-red-700'

  const delta = projected !== undefined ? projected - value : undefined
  const deltaColor = delta !== undefined
    ? (highMeansGood ? delta >= 0 : delta <= 0)
      ? 'text-slate-400'
      : 'text-amber-400'
    : ''

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500">{label}</span>
        <div className="flex items-center gap-2">
          {delta !== undefined && delta !== 0 && (
            <span className={`text-[10px] font-mono ${deltaColor}`}>
              {delta > 0 ? `+${delta}` : delta}
            </span>
          )}
          <span className="text-xs font-mono tabular-nums text-slate-400">{Math.round(value)}</span>
          {projected !== undefined && projected !== value && (
            <span className="text-xs font-mono tabular-nums text-slate-300">→ {Math.round(projected)}</span>
          )}
        </div>
      </div>
      <div className="relative h-1 bg-slate-800 rounded-full overflow-visible">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
        {projected !== undefined && projected !== value && (
          <div
            className="absolute top-0 h-full rounded-full bg-slate-300 opacity-30"
            style={{
              left: `${Math.min(value, projected)}%`,
              width: `${Math.abs(projected - value)}%`,
            }}
          />
        )}
      </div>
    </div>
  )
}

// ── Intervention card ─────────────────────────────────────────────────────────

function InterventionCard({
  intervention,
  metrics,
  isSelected,
  isApplied,
  onSelect,
  onApply,
}: {
  intervention: typeof INTERVENTION_CATALOGUE[0]
  metrics: typeof DEFAULT_METRICS
  isSelected: boolean
  isApplied: boolean
  onSelect: () => void
  onApply: () => void
}) {
  const projected = isSelected ? projectMetrics(metrics, intervention) : null

  return (
    <div
      className={`border rounded-lg transition-all ${
        isApplied
          ? 'border-slate-700 bg-slate-900/30 opacity-60'
          : isSelected
          ? 'border-slate-500 bg-slate-900/70'
          : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
      }`}
    >
      {/* ── Card header (always visible) ───────────────────────── */}
      <button
        type="button"
        onClick={onSelect}
        disabled={isApplied}
        className="w-full text-left p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-sm font-medium text-slate-200">{intervention.label}</h3>
              {intervention.requiresApproval && (
                <span className="text-[10px] font-mono border border-amber-900/60 text-amber-500 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  committee
                </span>
              )}
              {isApplied && (
                <span className="text-[10px] font-mono border border-slate-700 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  applied
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{intervention.description}</p>
          </div>
          <span className="text-xs font-mono text-slate-700 shrink-0 mt-0.5">
            {isSelected ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {/* ── Expanded content ────────────────────────────────────── */}
      {isSelected && !isApplied && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-800 pt-4">
          {/* Rationale */}
          <div>
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">
              When to apply
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">{intervention.rationale}</p>
          </div>

          {/* Effects preview */}
          <div>
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-2">
              Projected effect
            </p>
            <div className="space-y-2">
              {intervention.effects.map(effect => {
                const meta = METRIC_LABELS[effect.metric]
                if (!meta) return null
                const current = metrics[effect.metric as keyof typeof metrics] ?? 50
                return (
                  <div key={effect.metric} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500">{meta.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono tabular-nums text-slate-500">{current}</span>
                      <span className="text-slate-700">→</span>
                      <span className={`text-xs font-mono tabular-nums ${
                        (effect.delta > 0 && meta.highMeansGood) || (effect.delta < 0 && !meta.highMeansGood)
                          ? 'text-slate-300'
                          : 'text-amber-400'
                      }`}>
                        {Math.max(0, Math.min(100, current + effect.delta))}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tradeoff */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">
                Benefits
              </p>
              <ul className="space-y-1">
                {intervention.tradeoff.benefits.map((b, i) => (
                  <li key={i} className="text-slate-400 before:content-['+'] before:mr-1.5 before:text-slate-600">
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">
                Costs
              </p>
              <ul className="space-y-1">
                {intervention.tradeoff.costs.map((c, i) => (
                  <li key={i} className="text-slate-400 before:content-['−'] before:mr-1.5 before:text-slate-600">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Tradeoff summary */}
          <div className="border-l-2 border-slate-700 pl-3">
            <p className="text-xs text-slate-400 italic leading-relaxed">
              {intervention.tradeoff.summary}
            </p>
          </div>

          {/* Reversibility */}
          <p className="text-[10px] font-mono text-slate-700">
            {intervention.reversible ? '↩ reversible' : '⚠ irreversible — cannot be undone'}
            {intervention.requiresApproval ? ' · committee approval required' : ''}
          </p>

          {/* Apply button */}
          <button
            type="button"
            onClick={onApply}
            className={`w-full py-3 rounded-lg text-sm font-medium transition-colors ${
              intervention.requiresApproval
                ? 'border border-amber-900/60 text-amber-400 hover:bg-amber-950/30'
                : 'bg-slate-200 text-slate-950 hover:bg-white'
            }`}
          >
            {intervention.requiresApproval
              ? 'Apply (requires committee approval)'
              : 'Apply intervention'
            }
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function GovernanceConsole({
  metrics: externalMetrics,
  onInterventionApplied,
  runId,
  scenarioName,
}: GovernanceConsoleProps) {
  const [metrics, setMetrics] = useState(externalMetrics ?? DEFAULT_METRICS)
  const [selectedType, setSelectedType] = useState<InterventionType | null>(null)
  const [appliedTypes, setAppliedTypes] = useState<Set<InterventionType>>(new Set())
  const [log, setLog] = useState<Array<{ label: string; summary: string; timestamp: string }>>([])

  function applyIntervention(intervention: typeof INTERVENTION_CATALOGUE[0]) {
    const projected = projectMetrics(metrics, intervention)
    setMetrics(projected)
    setAppliedTypes(prev => new Set([...prev, intervention.type]))
    setSelectedType(null)

    const entry = {
      label: intervention.label,
      summary: intervention.tradeoff.summary,
      timestamp: new Date().toLocaleTimeString(),
    }
    setLog(prev => [entry, ...prev])

    if (onInterventionApplied) {
      onInterventionApplied({
        ...intervention,
        id: `${intervention.type}-${Date.now()}`,
        status: 'applied',
        appliedAtTick: undefined,
        appliedBy: 'facilitator',
      })
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-1">
          Governance console
        </p>
        <h2 className="text-3xl font-light text-slate-50 tracking-tight mb-2">
          Intervene.
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
          Governance interventions modify the institutional state going forward.
          Every intervention involves a tradeoff — the console makes them explicit before you commit.
          {scenarioName && (
            <> Scenario context: <span className="text-slate-300">{scenarioName}</span>.</>
          )}
        </p>
        {runId && (
          <p className="text-[10px] font-mono text-slate-700 mt-2">
            run {runId.slice(0, 8)} · all interventions are logged to the audit trail
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: current state panel ─────────────────────────── */}
        <div className="lg:col-span-1">
          <div className="border border-slate-800 rounded-lg p-5 bg-slate-950/60 sticky top-6">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">
              Current governance state
            </p>
            <div className="space-y-3">
              {Object.entries(METRIC_LABELS).map(([key, meta]) => {
                const value = metrics[key as keyof typeof metrics] ?? 50
                const selectedIntervention = selectedType
                  ? INTERVENTION_CATALOGUE.find(i => i.type === selectedType)
                  : null
                const projected = selectedIntervention
                  ? projectMetrics(metrics, selectedIntervention)[key as keyof typeof metrics]
                  : undefined
                return (
                  <MetricBar
                    key={key}
                    label={meta.label}
                    value={value}
                    projected={projected}
                    highMeansGood={meta.highMeansGood}
                  />
                )
              })}
            </div>

            {log.length > 0 && (
              <div className="mt-5 border-t border-slate-800 pt-4">
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-3">
                  Applied interventions
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {log.map((entry, i) => (
                    <div key={i} className="text-xs">
                      <span className="text-slate-400">{entry.label}</span>
                      <span className="text-slate-700 ml-2">{entry.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: intervention catalogue ─────────────────────── */}
        <div className="lg:col-span-2 space-y-3">
          {INTERVENTION_CATALOGUE.map(intervention => (
            <InterventionCard
              key={intervention.type}
              intervention={intervention}
              metrics={metrics}
              isSelected={selectedType === intervention.type}
              isApplied={appliedTypes.has(intervention.type)}
              onSelect={() => setSelectedType(
                selectedType === intervention.type ? null : intervention.type
              )}
              onApply={() => applyIntervention(intervention)}
            />
          ))}
        </div>
      </div>

      {/* ── Disclaimer ────────────────────────────────────────────── */}
      <div className="mt-10 border-t border-slate-800 pt-6">
        <p className="text-[10px] font-mono text-slate-700 text-center tracking-wider">
          This is a scenario-based governance simulation. Interventions affect the simulation
          state only — they do not reflect real clinical decisions. They do not predict reality.
        </p>
      </div>
    </div>
  )
}
