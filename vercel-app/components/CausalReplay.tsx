'use client'

import { useState, useMemo } from 'react'
import type { SimEvent } from '@/lib/types'
import {
  buildReflexiveTrace,
  filterSignificantTraces,
  type ReflexiveTrace,
  type TraceImpactLevel,
} from '@/lib/traces/reflexiveTrace'
import {
  buildCausalGraph,
  findCausalChain,
  findFirstFailure,
} from '@/lib/traces/causalGraph'

// ── Types ─────────────────────────────────────────────────────────────────────

type ReplayMode = 'chronological' | 'significant' | 'governance' | 'trust_impact'

interface CausalReplayProps {
  events: SimEvent[]
  scenarioName?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const IMPACT_STYLES: Record<TraceImpactLevel, { border: string; tag: string }> = {
  critical: { border: 'border-red-900/60 bg-red-950/20',   tag: 'text-red-400 border-red-900' },
  high:     { border: 'border-amber-900/40 bg-amber-950/10', tag: 'text-amber-400 border-amber-900' },
  medium:   { border: 'border-slate-800 bg-slate-950/40',  tag: 'text-slate-400 border-slate-700' },
  low:      { border: 'border-slate-800/60 bg-transparent', tag: 'text-slate-600 border-slate-800' },
}

const CATEGORY_LABELS: Record<string, string> = {
  patient_flow: 'Patient flow',
  governance:   'Governance',
  human_state:  'Human state',
  ai_action:    'AI action',
  security:     'Security',
  ethical:      'Ethical',
}

// ── Trace event card ──────────────────────────────────────────────────────────

function TraceCard({
  trace,
  isSelected,
  isFirstFailure,
  onSelect,
}: {
  trace: ReflexiveTrace
  isSelected: boolean
  isFirstFailure: boolean
  onSelect: (id: string) => void
}) {
  const { border, tag } = IMPACT_STYLES[trace.impactLevel]

  return (
    <button
      type="button"
      onClick={() => onSelect(trace.eventId)}
      className={`w-full text-left border rounded-lg transition-all ${border} ${
        isSelected ? 'ring-1 ring-slate-400 ring-offset-1 ring-offset-slate-950' : 'hover:border-slate-600'
      }`}
    >
      <div className="p-3">
        {/* ── Header ────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            {isFirstFailure && (
              <span className="text-[9px] font-mono border border-rose-700 text-rose-400 px-1.5 py-0.5 rounded uppercase tracking-wider">
                first failure
              </span>
            )}
            <span className={`text-[9px] font-mono border px-1.5 py-0.5 rounded uppercase tracking-wider ${tag}`}>
              {trace.impactLevel}
            </span>
            <span className="text-[9px] font-mono text-slate-600 border border-slate-800 px-1.5 py-0.5 rounded">
              {CATEGORY_LABELS[trace.category] ?? trace.category}
            </span>
          </div>
          <span className="text-[9px] font-mono text-slate-700 shrink-0">t{trace.tick}</span>
        </div>

        {/* ── Event type ─────────────────────────────────────── */}
        <p className="text-[10px] font-mono text-slate-500 mb-1">
          {trace.eventType.replace(/_/g, ' ')}
        </p>

        {/* ── Surfaced explanation (the tired-nurse sentence) ─── */}
        <p className="text-xs text-slate-300 leading-snug">
          {trace.surfacedExplanation}
        </p>

        {/* ── Cost indicators ────────────────────────────────── */}
        {(trace.ethicalDebtImpact !== 0 || trace.trustImpact !== 0) && (
          <div className="flex gap-3 mt-1.5 text-[9px] font-mono">
            {trace.trustImpact !== 0 && (
              <span className={trace.trustImpact < 0 ? 'text-red-500' : 'text-slate-400'}>
                trust {trace.trustImpact > 0 ? '+' : ''}{trace.trustImpact}
              </span>
            )}
            {trace.ethicalDebtImpact !== 0 && (
              <span className={trace.ethicalDebtImpact > 0 ? 'text-amber-600' : 'text-slate-400'}>
                debt {trace.ethicalDebtImpact > 0 ? '+' : ''}{trace.ethicalDebtImpact}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  )
}

// ── Causal chain panel ────────────────────────────────────────────────────────

function CausalChainPanel({
  trace,
  events,
  onClose,
}: {
  trace: ReflexiveTrace
  events: SimEvent[]
  onClose: () => void
}) {
  const graph = useMemo(() => buildCausalGraph(events), [events])
  const chain = useMemo(
    () => findCausalChain(trace.eventId, events, graph, 4),
    [trace.eventId, events, graph],
  )

  return (
    <div className="border border-slate-700 rounded-lg bg-slate-900">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between p-4 border-b border-slate-800">
        <div>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">
            Causal chain analysis
          </p>
          <h3 className="text-sm font-medium text-slate-200">
            {trace.eventType.replace(/_/g, ' ')} — tick {trace.tick}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs font-mono text-slate-600 hover:text-slate-400 transition-colors"
        >
          ✕
        </button>
      </div>

      {/* ── Explanation ─────────────────────────────────────── */}
      <div className="p-4 border-b border-slate-800">
        <p className="text-xs text-slate-400 leading-relaxed mb-2">
          {trace.surfacedExplanation}
        </p>
        <p className="text-xs text-slate-600 leading-relaxed">
          {trace.governanceCheck.reasoning}
        </p>
      </div>

      {/* ── Recommended action ──────────────────────────────── */}
      <div className="px-4 py-3 border-b border-slate-800">
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">
          Governance action
        </p>
        <p className="text-xs text-slate-300 leading-relaxed">
          {trace.recommendedAction}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {trace.governanceCheck.escalationRequired && (
            <span className="text-[9px] font-mono border border-amber-900 text-amber-500 px-1.5 py-0.5 rounded uppercase">
              escalation required
            </span>
          )}
          {trace.governanceCheck.humanReviewRequired && (
            <span className="text-[9px] font-mono border border-blue-900 text-blue-400 px-1.5 py-0.5 rounded uppercase">
              human review
            </span>
          )}
          {trace.governanceCheck.auditRequired && (
            <span className="text-[9px] font-mono border border-slate-700 text-slate-500 px-1.5 py-0.5 rounded uppercase">
              audit required
            </span>
          )}
        </div>
      </div>

      {/* ── Causal chain ────────────────────────────────────── */}
      <div className="p-4">
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-3">
          Contributing events — {chain.chain.length > 1 ? `${chain.chain.length - 1} predecessor(s)` : 'no predecessors found'}
        </p>

        {chain.chain.length <= 1 ? (
          <p className="text-xs text-slate-600">{chain.summary}</p>
        ) : (
          <>
            <div className="space-y-2 mb-3">
              {chain.chain.map((node, i) => {
                const isTarget = node.eventId === trace.eventId
                return (
                  <div key={node.eventId} className="flex gap-2">
                    <div className="flex flex-col items-center">
                      <span className={`w-2 h-2 rounded-full mt-1 ${isTarget ? 'bg-slate-300' : 'bg-slate-700'}`} />
                      {i < chain.chain.length - 1 && (
                        <div className="w-px flex-1 bg-slate-800 mt-1" />
                      )}
                    </div>
                    <div className="pb-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[9px] font-mono ${isTarget ? 'text-slate-300' : 'text-slate-500'}`}>
                          t{node.tick}
                        </span>
                        <span className={`text-[9px] font-mono ${isTarget ? 'text-slate-200' : 'text-slate-500'}`}>
                          {node.eventType.replace(/_/g, ' ')}
                        </span>
                        {isTarget && (
                          <span className="text-[8px] font-mono border border-slate-600 text-slate-400 px-1 rounded">
                            this event
                          </span>
                        )}
                      </div>
                      {!isTarget && (
                        <p className="text-[10px] text-slate-600 leading-relaxed">
                          {node.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-slate-600 border-t border-slate-800 pt-3">
              {chain.summary}
            </p>
          </>
        )}

        {/* ── Consequences ──────────────────────────────────── */}
        {trace.consequences.length > 0 && (
          <div className="border-t border-slate-800 mt-3 pt-3">
            <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-2">
              Consequences
            </p>
            <div className="space-y-1.5">
              {trace.consequences.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`text-[10px] font-mono tabular-nums shrink-0 mt-0.5 ${
                    c.delta > 0 ? 'text-amber-600' : 'text-slate-400'
                  }`}>
                    {c.delta > 0 ? '+' : ''}{c.delta}
                  </span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{c.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Audit log entry ───────────────────────────────── */}
        <div className="border-t border-slate-800 mt-3 pt-3">
          <p className="text-[10px] font-mono text-slate-700 uppercase tracking-widest mb-1">
            Audit entry
          </p>
          <p className="text-[10px] font-mono text-slate-600 bg-slate-950 rounded p-2">
            {trace.logEntry}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function CausalReplay({ events, scenarioName }: CausalReplayProps) {
  const [mode, setMode] = useState<ReplayMode>('significant')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Build all traces
  const allTraces = useMemo(() => events.map((ev, i) => buildReflexiveTrace(ev, i)), [events])

  // Build causal graph (for first-failure detection)
  const graph = useMemo(() => buildCausalGraph(events), [events])
  const firstFailure = useMemo(() => findFirstFailure(events, graph), [events, graph])
  const firstFailureId = firstFailure?.event_id ?? null

  // Filter by mode
  const filteredTraces = useMemo(() => {
    let traces: ReflexiveTrace[]
    switch (mode) {
      case 'significant':
        traces = filterSignificantTraces(allTraces)
        break
      case 'governance':
        traces = allTraces.filter(t => t.category === 'governance' || t.category === 'ethical')
        break
      case 'trust_impact':
        traces = allTraces.filter(t => t.trustImpact !== 0 || t.ethicalDebtImpact !== 0)
        break
      default:
        traces = allTraces
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      traces = traces.filter(t =>
        t.eventType.toLowerCase().includes(q) ||
        t.surfacedExplanation.toLowerCase().includes(q) ||
        t.classification.toLowerCase().includes(q)
      )
    }

    return traces
  }, [allTraces, mode, searchQuery])

  const selectedTrace = selectedEventId
    ? allTraces.find(t => t.eventId === selectedEventId) ?? null
    : null

  const MODES: Array<{ value: ReplayMode; label: string }> = [
    { value: 'significant',    label: `Significant (${filterSignificantTraces(allTraces).length})` },
    { value: 'governance',     label: 'Governance' },
    { value: 'trust_impact',   label: 'Trust impact' },
    { value: 'chronological',  label: `All (${allTraces.length})` },
  ]

  return (
    <section>
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="mb-5">
        <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-1">
          Causal replay
        </p>
        <h2 className="text-2xl font-light text-slate-100 tracking-tight mb-2">
          Why did this happen?
        </h2>
        {scenarioName && (
          <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
            Every event in <span className="text-slate-300">{scenarioName}</span> has a reflexive
            trace — a one-sentence explanation readable to anyone who was there. Click any event
            to see its causal ancestry.
          </p>
        )}
      </div>

      {/* ── First failure callout ─────────────────────────────── */}
      {firstFailure && (
        <div className="border border-rose-900/40 bg-rose-950/10 rounded-lg p-4 mb-5">
          <p className="text-[10px] font-mono text-rose-500 uppercase tracking-widest mb-1">
            First governance failure
          </p>
          <p className="text-sm text-slate-300">
            <span className="font-medium">{firstFailure.event_type.replace(/_/g, ' ')}</span>
            {' '}at tick {Math.floor(firstFailure.timestamp / 5)} — this is where the cascade began.
          </p>
          <button
            type="button"
            onClick={() => setSelectedEventId(firstFailure.event_id ?? null)}
            className="text-[10px] font-mono text-rose-500 hover:text-rose-300 transition-colors mt-2 uppercase tracking-widest"
          >
            Trace this event →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: event list ──────────────────────────────── */}
        <div>
          {/* Mode tabs */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {MODES.map(m => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMode(m.value)}
                className={`text-[10px] font-mono border px-2 py-1 rounded uppercase tracking-widest transition-colors ${
                  mode === m.value
                    ? 'text-slate-200 border-slate-500 bg-slate-800'
                    : 'text-slate-600 border-slate-800 hover:text-slate-400 hover:border-slate-700'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search events…"
            className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-slate-600 mb-3"
          />

          {/* Event list */}
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
            {filteredTraces.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-8">
                No events match this filter.
              </p>
            ) : (
              filteredTraces.map(trace => (
                <TraceCard
                  key={trace.eventId}
                  trace={trace}
                  isSelected={selectedEventId === trace.eventId}
                  isFirstFailure={trace.eventId === firstFailureId}
                  onSelect={setSelectedEventId}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right: causal chain detail ─────────────────────── */}
        <div>
          {selectedTrace ? (
            <CausalChainPanel
              trace={selectedTrace}
              events={events}
              onClose={() => setSelectedEventId(null)}
            />
          ) : (
            <div className="border border-slate-800 rounded-lg p-8 text-center bg-slate-950/40">
              <p className="text-sm text-slate-600 leading-relaxed">
                Select an event to see its reflexive trace and causal ancestry.
              </p>
              <p className="text-xs text-slate-700 mt-2">
                Critical and high-impact events show why they happened.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats bar ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 mt-5 text-[10px] font-mono text-slate-700">
        <span>{allTraces.length} total events</span>
        <span>{filterSignificantTraces(allTraces).length} significant</span>
        <span>{allTraces.filter(t => t.impactLevel === 'critical').length} critical</span>
        <span>{allTraces.filter(t => t.governanceCheck.escalationRequired).length} required escalation</span>
        <span className="ml-auto">
          net trust: {allTraces.reduce((s, t) => s + t.trustImpact, 0).toFixed(0)}
          · debt: +{allTraces.reduce((s, t) => s + t.ethicalDebtImpact, 0).toFixed(0)}
        </span>
      </div>
    </section>
  )
}
