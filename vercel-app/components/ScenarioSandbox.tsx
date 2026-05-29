'use client'

/**
 * Scenario Sandbox — v2 Phase 4
 *
 * Side-by-side governance scenario comparison.
 * Two independent simulation slots (A / B).
 * Each slot selects a scenario, applies parameter overrides,
 * and runs independently via /api/run-scenario.
 *
 * Comparison panel surfaces after both slots complete.
 */

import { useState, useEffect } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScenarioMeta {
  id: string
  name: string
  description: string
  packId: string
  simulationProfile: string
  durationTicks: number
  stressorCount: number
}

interface SlotConfig {
  scenarioId: string | null
  staffingLevel: number       // 0–100
  patientLoad: number         // 0–100
  autonomyLevel: number       // 0–100 (AI autonomy override)
  governanceMaturity: number  // 0–100
}

interface SlotRun {
  pss: number
  pes: number
  sss: number
  eic: number
  sti: number
  insightCount: number
  criticalInsightCount: number
  eventCount: number
  runId: string
  scenarioName: string
}

type SlotId = 'A' | 'B'

// ── Pack colours ──────────────────────────────────────────────────────────────

const PACK_BADGE: Record<string, string> = {
  'automation-failure':  'text-amber-400 border-amber-800/60 bg-amber-950/40',
  'institutional-strain':'text-orange-400 border-orange-800/60 bg-orange-950/40',
  'equity-participation':'text-sky-400 border-sky-800/60 bg-sky-950/40',
  'security-stress-test':'text-rose-400 border-rose-800/60 bg-rose-950/40',
}

const PACK_LABELS: Record<string, string> = {
  'automation-failure':  'Automation failure',
  'institutional-strain':'Institutional strain',
  'equity-participation':'Equity & participation',
  'security-stress-test':'Security stress test',
}

// ── Scenarios fetched from registry API — no hardcoded list ──────────────────

// ── Signal definitions ────────────────────────────────────────────────────────

const SIGNAL_DEFS: Array<{
  key: keyof SlotRun & ('pss' | 'pes' | 'sss' | 'eic' | 'sti')
  label: string
  abbr: string
  highMeansGood: boolean
  description: string
}> = [
  { key: 'pss', abbr: 'PSS', label: 'Patient Safety Signal',        highMeansGood: true,  description: 'Absence of patient harm events and escalation failures' },
  { key: 'pes', abbr: 'PES', label: 'Provider Experience Signal',   highMeansGood: true,  description: 'Staff fatigue, moral distress, override confidence' },
  { key: 'sss', abbr: 'SSS', label: 'System Strain Signal',         highMeansGood: false, description: 'Queue pressure, documentation load, governance strain (lower = worse)' },
  { key: 'eic', abbr: 'EIC', label: 'Ethical Integrity Coefficient', highMeansGood: true,  description: 'Absence of ethical debt across fairness and privacy categories' },
  { key: 'sti', abbr: 'STI', label: 'Systemic Trust Index',         highMeansGood: true,  description: 'Operational trust, governance drift resistance, automation discipline' },
]

// ── Slot colour palette ───────────────────────────────────────────────────────

const SLOT_STYLES = {
  A: {
    label:    'text-violet-300',
    badge:    'bg-violet-950/60 border-violet-800/60 text-violet-300',
    bar:      'bg-violet-500',
    barDim:   'bg-violet-900/50',
    ring:     'ring-violet-700/50',
    header:   'bg-violet-950/30 border-violet-800/50',
    button:   'bg-violet-600 hover:bg-violet-500 text-white',
    winner:   'text-violet-300 border-violet-600/50 bg-violet-950/30',
  },
  B: {
    label:    'text-emerald-300',
    badge:    'bg-emerald-950/60 border-emerald-800/60 text-emerald-300',
    bar:      'bg-emerald-500',
    barDim:   'bg-emerald-900/50',
    ring:     'ring-emerald-700/50',
    header:   'bg-emerald-950/30 border-emerald-800/50',
    button:   'bg-emerald-700 hover:bg-emerald-600 text-white',
    winner:   'text-emerald-300 border-emerald-600/50 bg-emerald-950/30',
  },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SliderRow({
  label,
  value,
  onChange,
  description,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  description: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-mono text-slate-500">{value}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 appearance-none bg-slate-800 rounded cursor-pointer"
        title={description}
      />
      <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">{description}</p>
    </div>
  )
}

function MiniSignalBar({
  label,
  value,
  slotId,
  highMeansGood,
}: {
  label: string
  value: number
  slotId: SlotId
  highMeansGood: boolean
}) {
  const styles = SLOT_STYLES[slotId]
  const effective = highMeansGood ? value : (100 - value)
  const color = effective >= 70 ? styles.bar
    : effective >= 40 ? 'bg-amber-500'
    : 'bg-red-500'

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-slate-500 w-8 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-800 rounded h-1.5 overflow-hidden">
        <div className={`h-full rounded transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] font-mono text-slate-400 w-8 text-right shrink-0">{Math.round(value)}</span>
    </div>
  )
}

function ComparisonRow({
  def,
  slotA,
  slotB,
}: {
  def: typeof SIGNAL_DEFS[0]
  slotA: SlotRun
  slotB: SlotRun
}) {
  const aVal = slotA[def.key]
  const bVal = slotB[def.key]
  const effectiveA = def.highMeansGood ? aVal : (100 - aVal)
  const effectiveB = def.highMeansGood ? bVal : (100 - bVal)
  const winner: SlotId | 'tie' = effectiveA > effectiveB + 2 ? 'A'
    : effectiveB > effectiveA + 2 ? 'B'
    : 'tie'

  const barColorA = effectiveA >= 70 ? SLOT_STYLES.A.bar : effectiveA >= 40 ? 'bg-amber-500' : 'bg-red-500'
  const barColorB = effectiveB >= 70 ? SLOT_STYLES.B.bar : effectiveB >= 40 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="grid grid-cols-[1fr_140px_1fr] gap-4 items-center py-3 border-b border-slate-800/60 last:border-0">
      {/* Slot A */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-300">{Math.round(aVal)}</span>
          {winner === 'A' && (
            <span className="text-[9px] font-mono text-violet-400 border border-violet-800/60 px-1.5 py-0.5 rounded">better</span>
          )}
        </div>
        <div className="bg-slate-800 rounded h-2 overflow-hidden">
          <div className={`h-full rounded ${barColorA} transition-all`} style={{ width: `${aVal}%` }} />
        </div>
      </div>

      {/* Centre: metric label */}
      <div className="text-center">
        <p className="text-[11px] font-mono text-slate-300 mb-0.5">{def.abbr}</p>
        <p className="text-[10px] text-slate-600 leading-tight">{def.label}</p>
        {!def.highMeansGood && (
          <p className="text-[9px] text-slate-700 mt-0.5 italic">lower = more strain</p>
        )}
      </div>

      {/* Slot B */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between flex-row-reverse">
          <span className="text-xs font-mono text-slate-300">{Math.round(bVal)}</span>
          {winner === 'B' && (
            <span className="text-[9px] font-mono text-emerald-400 border border-emerald-800/60 px-1.5 py-0.5 rounded">better</span>
          )}
        </div>
        <div className="bg-slate-800 rounded h-2 overflow-hidden">
          <div className={`h-full rounded ${barColorB} transition-all ml-auto`} style={{ width: `${bVal}%` }} />
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ScenarioSandbox() {
  const [scenarios, setScenarios] = useState<ScenarioMeta[]>([])
  const [loadingScenarios, setLoadingScenarios] = useState(true)

  const [configs, setConfigs] = useState<Record<SlotId, SlotConfig>>({
    A: { scenarioId: null, staffingLevel: 60, patientLoad: 60, autonomyLevel: 50, governanceMaturity: 50 },
    B: { scenarioId: null, staffingLevel: 60, patientLoad: 60, autonomyLevel: 50, governanceMaturity: 50 },
  })
  const [runs, setRuns] = useState<Partial<Record<SlotId, SlotRun>>>({})
  const [loading, setLoading] = useState<Partial<Record<SlotId, boolean>>>({})
  const [errors, setErrors] = useState<Partial<Record<SlotId, string>>>({})
  const [expandedConfig, setExpandedConfig] = useState<SlotId | null>(null)

  // Fetch scenario registry on mount
  useEffect(() => {
    fetch('/api/run-scenario')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: { scenarios: ScenarioMeta[] }) => setScenarios(data.scenarios ?? []))
      .catch(() => setScenarios([]))
      .finally(() => setLoadingScenarios(false))
  }, [])

  function updateConfig(slot: SlotId, patch: Partial<SlotConfig>) {
    setConfigs(c => ({ ...c, [slot]: { ...c[slot], ...patch } }))
    // Clear run result when config changes
    if (patch.scenarioId !== undefined || patch.staffingLevel !== undefined || patch.patientLoad !== undefined) {
      setRuns(r => { const next = { ...r }; delete next[slot]; return next })
    }
  }

  async function runSlot(slot: SlotId) {
    const config = configs[slot]
    if (!config.scenarioId) return

    setLoading(l => ({ ...l, [slot]: true }))
    setErrors(e => ({ ...e, [slot]: undefined }))

    try {
      const res = await fetch('/api/run-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: config.scenarioId,
          overrides: {
            staffingLevel:       config.staffingLevel,
            patientLoad:         config.patientLoad,
            autonomyLevel:       config.autonomyLevel,
            governanceMaturity:  config.governanceMaturity,
          },
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Run failed (${res.status}): ${text.slice(0, 200)}`)
      }

      const report = await res.json()
      // Extract from scenario_run if present, fall back to root-level metrics
      const sr = report.scenario_run ?? report
      const fs = sr.five_signals ?? sr.fiveSignals ?? {}
      const insights: Array<{ severity: string }> = sr.reflective_insights ?? sr.reflectiveInsights ?? []

      const runResult: SlotRun = {
        pss: fs.PSS?.value ?? fs.pss ?? 50,
        pes: fs.PES?.value ?? fs.pes ?? 50,
        sss: fs.SSS?.value ?? fs.sss ?? 50,
        eic: fs.EIC?.value ?? fs.eic ?? 50,
        sti: fs.STI?.value ?? fs.sti ?? 50,
        insightCount:         insights.length,
        criticalInsightCount: insights.filter(i => i.severity === 'critical').length,
        eventCount:           (report.event_log ?? []).length,
        runId:                report.run_id ?? sr.runId ?? 'unknown',
        scenarioName:         scenarios.find(s => s.id === config.scenarioId)?.name ?? config.scenarioId ?? '—',
      }

      setRuns(r => ({ ...r, [slot]: runResult }))
    } catch (e) {
      setErrors(er => ({ ...er, [slot]: e instanceof Error ? e.message : 'Unknown error' }))
    } finally {
      setLoading(l => ({ ...l, [slot]: false }))
    }
  }

  // ── Composite score: equally weighted across 5 signals (SSS inverted) ────────
  function compositeScore(run: SlotRun): number {
    return Math.round((run.pss + run.pes + (100 - run.sss) + run.eic + run.sti) / 5)
  }

  const bothComplete = runs.A && runs.B

  // ── Render slot ───────────────────────────────────────────────────────────────
  function renderSlot(slot: SlotId) {
    const config = configs[slot]
    const run = runs[slot]
    const isLoading = loading[slot]
    const error = errors[slot]
    const styles = SLOT_STYLES[slot]
    const selected = scenarios.find(s => s.id === config.scenarioId)
    const isConfigExpanded = expandedConfig === slot

    return (
      <div className={`border rounded-xl overflow-hidden ring-1 ${styles.ring} border-slate-800`}>
        {/* ── Slot header ──────────────────────────────────────────────── */}
        <div className={`border-b px-5 py-3 flex items-center justify-between ${styles.header}`}>
          <div className="flex items-center gap-2.5">
            <span className={`text-[10px] font-mono border px-2 py-0.5 rounded tracking-widest uppercase ${styles.badge}`}>
              Slot {slot}
            </span>
            {run && (
              <span className="text-[10px] font-mono text-slate-500">
                {run.scenarioName}
              </span>
            )}
          </div>
          {run && (
            <span className="text-[10px] font-mono text-slate-600">
              run {run.runId.slice(-8)}
            </span>
          )}
        </div>

        <div className="p-5 space-y-5">
          {/* ── Scenario picker ──────────────────────────────────────── */}
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">
              Select scenario
            </p>
            <div className="space-y-1.5">
              {loadingScenarios && [1, 2, 3, 4].map(i => (
                <div key={i} className="h-9 bg-slate-800/40 rounded-lg animate-pulse" />
              ))}
              {!loadingScenarios && scenarios.map(s => {
                const isSelected = config.scenarioId === s.id
                const packBadge = PACK_BADGE[s.packId] ?? ''
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => updateConfig(slot, { scenarioId: s.id })}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-slate-600 bg-slate-800/60'
                        : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                          isSelected ? (slot === 'A' ? 'bg-violet-400' : 'bg-emerald-400') : 'bg-slate-700'
                        }`} />
                        <div>
                          <p className="text-xs text-slate-200 font-medium leading-snug">{s.name}</p>
                          {isSelected && (
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{s.description}</p>
                          )}
                        </div>
                      </div>
                      <span className={`text-[9px] font-mono border px-1.5 py-0.5 rounded tracking-wider uppercase shrink-0 ${packBadge}`}>
                        {PACK_LABELS[s.packId] ?? s.packId}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Parameter overrides ──────────────────────────────────── */}
          <div>
            <button
              type="button"
              onClick={() => setExpandedConfig(isConfigExpanded ? null : slot)}
              className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 uppercase tracking-widest hover:text-slate-400 transition-colors"
            >
              <span>{isConfigExpanded ? '▾' : '▸'}</span>
              Parameter overrides
            </button>
            {isConfigExpanded && (
              <div className="mt-3 space-y-4 pl-3 border-l border-slate-800">
                <SliderRow
                  label="Staffing level"
                  value={config.staffingLevel}
                  onChange={v => updateConfig(slot, { staffingLevel: v })}
                  description="Available staff relative to demand (100 = fully staffed)"
                />
                <SliderRow
                  label="Patient load"
                  value={config.patientLoad}
                  onChange={v => updateConfig(slot, { patientLoad: v })}
                  description="Incoming patient volume as % of surge capacity"
                />
                <SliderRow
                  label="AI autonomy level"
                  value={config.autonomyLevel}
                  onChange={v => updateConfig(slot, { autonomyLevel: v })}
                  description="Starting AI autonomy (0 = full human control; 100 = full AI autonomy)"
                />
                <SliderRow
                  label="Governance maturity"
                  value={config.governanceMaturity}
                  onChange={v => updateConfig(slot, { governanceMaturity: v })}
                  description="Institutional readiness for AI oversight (0 = no governance; 100 = mature)"
                />
              </div>
            )}
          </div>

          {/* ── Run button ────────────────────────────────────────────── */}
          <button
            type="button"
            onClick={() => runSlot(slot)}
            disabled={!config.scenarioId || isLoading}
            className={`w-full py-3 rounded-lg font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${styles.button}`}
          >
            {isLoading
              ? 'Running…'
              : run
              ? 'Re-run'
              : config.scenarioId
              ? `Run Slot ${slot}`
              : 'Select a scenario first'
            }
          </button>

          {/* ── Error ────────────────────────────────────────────────── */}
          {error && (
            <div className="border border-red-900 bg-red-950/30 rounded p-3">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* ── Run result: mini signals ──────────────────────────────── */}
          {run && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                Results — {run.eventCount} events
              </p>
              {SIGNAL_DEFS.map(def => (
                <MiniSignalBar
                  key={def.key}
                  label={def.abbr}
                  value={run[def.key]}
                  slotId={slot}
                  highMeansGood={def.highMeansGood}
                />
              ))}
              {/* ── Insight summary ───────────────────────────────────── */}
              <div className="flex items-center gap-4 pt-1">
                <div className="text-[10px] font-mono">
                  <span className="text-slate-500">Insights </span>
                  <span className="text-slate-300">{run.insightCount}</span>
                </div>
                {run.criticalInsightCount > 0 && (
                  <div className="text-[10px] font-mono">
                    <span className="text-slate-500">Critical </span>
                    <span className="text-red-400">{run.criticalInsightCount}</span>
                  </div>
                )}
                <div className={`ml-auto text-[10px] font-mono border px-2 py-0.5 rounded ${styles.badge}`}>
                  Composite {compositeScore(run)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Comparison summary ────────────────────────────────────────────────────────
  function renderComparison() {
    if (!runs.A || !runs.B) return null
    const scoreA = compositeScore(runs.A)
    const scoreB = compositeScore(runs.B)
    const overallWinner: SlotId | 'tie' = scoreA > scoreB + 2 ? 'A' : scoreB > scoreA + 2 ? 'B' : 'tie'

    return (
      <div className="border border-slate-800 rounded-xl overflow-hidden mt-8">
        {/* Header */}
        <div className="border-b border-slate-800 bg-slate-900/60 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">
              Comparative governance analysis
            </p>
            <p className="text-sm text-slate-200 font-medium">
              {runs.A.scenarioName} vs {runs.B.scenarioName}
            </p>
          </div>
          <div className="text-right">
            {overallWinner === 'tie' ? (
              <span className="text-[10px] font-mono text-slate-400 border border-slate-700 px-2.5 py-1.5 rounded">
                Comparable outcomes
              </span>
            ) : (
              <div className={`text-[10px] font-mono border px-2.5 py-1.5 rounded ${SLOT_STYLES[overallWinner].winner}`}>
                Slot {overallWinner} · composite {overallWinner === 'A' ? scoreA : scoreB}
              </div>
            )}
          </div>
        </div>

        {/* Comparison grid header */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-[1fr_140px_1fr] gap-4 mb-1">
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-mono border px-1.5 py-0.5 rounded ${SLOT_STYLES.A.badge}`}>A</span>
              <span className="text-[10px] text-slate-500 truncate">{runs.A.scenarioName}</span>
            </div>
            <div />
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[10px] text-slate-500 truncate text-right">{runs.B.scenarioName}</span>
              <span className={`text-[10px] font-mono border px-1.5 py-0.5 rounded ${SLOT_STYLES.B.badge}`}>B</span>
            </div>
          </div>
        </div>

        {/* Per-signal rows */}
        <div className="px-6 pb-4">
          {SIGNAL_DEFS.map(def => (
            <ComparisonRow key={def.key} def={def} slotA={runs.A!} slotB={runs.B!} />
          ))}
        </div>

        {/* Insight comparison footer */}
        <div className="border-t border-slate-800 px-6 py-4 grid grid-cols-3 gap-4 bg-slate-900/40">
          <div className="space-y-2">
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Slot A insights</p>
            <p className="text-lg font-mono text-slate-200">{runs.A.insightCount}</p>
            {runs.A.criticalInsightCount > 0 && (
              <p className="text-[10px] font-mono text-red-400">{runs.A.criticalInsightCount} critical</p>
            )}
          </div>
          <div className="space-y-2 text-center">
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Difference</p>
            <p className="text-lg font-mono text-slate-400">
              {scoreA > scoreB ? '+' : ''}{scoreA - scoreB}
            </p>
            <p className="text-[10px] font-mono text-slate-600">composite pts</p>
          </div>
          <div className="space-y-2 text-right">
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Slot B insights</p>
            <p className="text-lg font-mono text-slate-200">{runs.B.insightCount}</p>
            {runs.B.criticalInsightCount > 0 && (
              <p className="text-[10px] font-mono text-red-400">{runs.B.criticalInsightCount} critical</p>
            )}
          </div>
        </div>

        {/* Interpretation note */}
        <div className="border-t border-slate-800 px-6 py-4 bg-slate-950/40">
          <p className="text-xs text-slate-500 leading-relaxed">
            <span className="text-slate-400 font-medium">Interpretation note: </span>
            Composite scores reflect equally weighted governance health across five signals.
            A higher composite score indicates less institutional stress — not better patient care per se.
            Scenarios with more stressors may surface more learning value even if composite scores are lower.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* ── Intro ──────────────────────────────────────────────────────────── */}
      <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-2xl">
        Run two governance scenarios side by side and compare their institutional outcomes.
        Adjust staffing, patient load, AI autonomy, and governance maturity independently for each slot.
      </p>

      {/* ── Two-slot grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderSlot('A')}
        {renderSlot('B')}
      </div>

      {/* ── Comparison panel ───────────────────────────────────────────────── */}
      {bothComplete && renderComparison()}

      {/* ── Pending state hint ─────────────────────────────────────────────── */}
      {!bothComplete && (runs.A || runs.B) && (
        <div className="mt-6 border border-slate-800 rounded-lg px-5 py-4 text-center">
          <p className="text-xs text-slate-500">
            Run both slots to see the comparative governance analysis.
          </p>
        </div>
      )}
    </div>
  )
}
