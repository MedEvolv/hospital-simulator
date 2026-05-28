'use client'

import { useState } from 'react'

// ── Types — mirrors lib/scenarios/schema.ts ReflectiveInsight ─────────────────

export type InsightType =
  | 'operational'
  | 'human_state'
  | 'governance'
  | 'trust_debt'

export type InsightSeverity = 'info' | 'concern' | 'critical'

export interface ReflectiveInsight {
  type: InsightType
  severity: InsightSeverity
  title: string
  explanation: string         // one sentence, readable to a tired nurse at 2 a.m.
  affectedConcepts: string[]
  governanceImplication: string
  suggestedIntervention?: string
}

// ── Category metadata ─────────────────────────────────────────────────────────

const TYPE_META: Record<InsightType, {
  label: string
  cardBorder: string
  tagStyle: string
}> = {
  operational: {
    label: 'Operational',
    cardBorder: 'border-slate-800 bg-slate-950/40',
    tagStyle: 'text-slate-400 border-slate-700',
  },
  human_state: {
    label: 'Human state',
    cardBorder: 'border-blue-900/40 bg-blue-950/10',
    tagStyle: 'text-blue-400 border-blue-900/60',
  },
  governance: {
    label: 'Governance',
    cardBorder: 'border-amber-900/40 bg-amber-950/10',
    tagStyle: 'text-amber-400 border-amber-900/60',
  },
  trust_debt: {
    label: 'Trust & debt',
    cardBorder: 'border-rose-900/40 bg-rose-950/10',
    tagStyle: 'text-rose-400 border-rose-900/60',
  },
}

// ── Severity badge ────────────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<InsightSeverity, string> = {
  info:     'text-slate-500 border-slate-700 bg-slate-900',
  concern:  'text-amber-500 border-amber-900/60 bg-amber-950/30',
  critical: 'text-red-400 border-red-900/60 bg-red-950/30',
}

const SEVERITY_LABELS: Record<InsightSeverity, string> = {
  info:     'INFO',
  concern:  'CONCERN',
  critical: 'CRITICAL',
}

function SeverityTag({ severity }: { severity: InsightSeverity }) {
  return (
    <span className={`text-[10px] font-mono border px-1.5 py-0.5 rounded uppercase tracking-wider ${SEVERITY_STYLES[severity]}`}>
      {SEVERITY_LABELS[severity]}
    </span>
  )
}

// ── Individual insight card ───────────────────────────────────────────────────

function InsightCard({ insight, index }: { insight: ReflectiveInsight; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const meta = TYPE_META[insight.type] ?? TYPE_META.operational

  return (
    <div className={`border rounded-lg p-4 ${meta.cardBorder}`}>
      {/* ── Header tags ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className={`text-[10px] font-mono border px-1.5 py-0.5 rounded uppercase tracking-wider ${meta.tagStyle}`}>
          {meta.label}
        </span>
        <SeverityTag severity={insight.severity} />
        <span className="text-[10px] font-mono text-slate-700">
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* ── Title ──────────────────────────────────────────────────── */}
      <h3 className="text-sm font-medium text-slate-200 mb-1.5 leading-snug">
        {insight.title}
      </h3>

      {/* ── Explanation ────────────────────────────────────────────── */}
      <p className="text-xs text-slate-400 leading-relaxed mb-3">
        {insight.explanation}
      </p>

      {/* ── Governance implication ─────────────────────────────────── */}
      <div className="border-t border-slate-800/60 pt-3">
        <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">
          Governance implication
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          {insight.governanceImplication}
        </p>
      </div>

      {/* ── Expandable: intervention + affected concepts ────────────── */}
      {(insight.suggestedIntervention || insight.affectedConcepts.length > 0) && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="text-[10px] font-mono text-slate-700 hover:text-slate-500 transition-colors mt-3 uppercase tracking-widest"
          >
            {expanded ? '▲ less' : '▼ intervention & concepts'}
          </button>

          {expanded && (
            <div className="mt-3 space-y-3">
              {insight.suggestedIntervention && (
                <div>
                  <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">
                    Suggested intervention
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {insight.suggestedIntervention}
                  </p>
                </div>
              )}
              {insight.affectedConcepts.length > 0 && (
                <div>
                  <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-1">
                    Affected concepts
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {insight.affectedConcepts.map(c => (
                      <span
                        key={c}
                        className="text-[10px] font-mono text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded"
                      >
                        {c.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Filter strip ──────────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[10px] font-mono border px-2 py-1 rounded uppercase tracking-widest transition-colors ${
        active
          ? 'text-slate-200 border-slate-500 bg-slate-800'
          : 'text-slate-600 border-slate-800 hover:border-slate-700 hover:text-slate-400'
      }`}
    >
      {label}
    </button>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

interface ReflectiveInsightFeedProps {
  insights: ReflectiveInsight[]
  scenarioName?: string
}

export default function ReflectiveInsightFeed({
  insights,
  scenarioName,
}: ReflectiveInsightFeedProps) {
  const [typeFilter, setTypeFilter] = useState<InsightType | 'all'>('all')
  const [severityFilter, setSeverityFilter] = useState<InsightSeverity | 'all'>('all')

  const filtered = insights.filter(ins => {
    const matchType = typeFilter === 'all' || ins.type === typeFilter
    const matchSev  = severityFilter === 'all' || ins.severity === severityFilter
    return matchType && matchSev
  })

  const criticalCount = insights.filter(i => i.severity === 'critical').length
  const concernCount  = insights.filter(i => i.severity === 'concern').length

  return (
    <section>
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="mb-5">
        <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-1">
          Reflective insight feed
        </p>
        <h2 className="text-2xl font-light text-slate-100 tracking-tight mb-2">
          What the scenario revealed.
        </h2>
        {scenarioName && (
          <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
            These observations emerge from replaying the governance engines over{' '}
            <span className="text-slate-300">{scenarioName}</span>.
            They are not a verdict. They are the specific moments where institutional
            structure became a liability.
          </p>
        )}
      </div>

      {/* ── Summary bar ───────────────────────────────────────────── */}
      {insights.length > 0 && (
        <div className="flex items-center gap-4 mb-4 text-xs">
          {criticalCount > 0 && (
            <span className="text-red-400">
              {criticalCount} critical {criticalCount === 1 ? 'finding' : 'findings'}
            </span>
          )}
          {concernCount > 0 && (
            <span className="text-amber-400">
              {concernCount} {concernCount === 1 ? 'concern' : 'concerns'}
            </span>
          )}
          <span className="text-slate-600">{insights.length} total</span>
        </div>
      )}

      {/* ── Filters ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 mb-5">
        <FilterChip
          label="All"
          active={typeFilter === 'all' && severityFilter === 'all'}
          onClick={() => { setTypeFilter('all'); setSeverityFilter('all') }}
        />
        <span className="text-slate-700 self-center text-xs">Type:</span>
        {(['operational', 'human_state', 'governance', 'trust_debt'] as InsightType[]).map(t => (
          <FilterChip
            key={t}
            label={TYPE_META[t].label}
            active={typeFilter === t}
            onClick={() => setTypeFilter(prev => prev === t ? 'all' : t)}
          />
        ))}
        <span className="text-slate-700 self-center text-xs ml-1">Severity:</span>
        {(['critical', 'concern', 'info'] as InsightSeverity[]).map(s => (
          <FilterChip
            key={s}
            label={SEVERITY_LABELS[s]}
            active={severityFilter === s}
            onClick={() => setSeverityFilter(prev => prev === s ? 'all' : s)}
          />
        ))}
      </div>

      {/* ── Cards ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="border border-slate-800 rounded-lg p-6 text-center">
          <p className="text-sm text-slate-600">No insights match the current filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((insight, i) => (
            <InsightCard key={`${insight.type}-${i}`} insight={insight} index={i} />
          ))}
        </div>
      )}

      {/* ── Moral reckoning gate — invariant ──────────────────────── */}
      {insights.length === 0 && (
        <div className="border border-amber-900/40 bg-amber-950/10 rounded-lg p-5 mt-3">
          <p className="text-xs font-mono text-amber-500 uppercase tracking-widest mb-2">
            Moral reckoning unavailable
          </p>
          <p className="text-sm text-slate-400 leading-relaxed">
            No reflective insights were generated for this run. Every scenario must produce
            at least one insight per category — if you see this, check the governance engine replay.
          </p>
        </div>
      )}
    </section>
  )
}
