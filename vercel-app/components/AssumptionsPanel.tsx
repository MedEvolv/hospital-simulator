'use client'

/**
 * AssumptionsPanel — v2 Phase 8
 *
 * Expandable "Model Assumptions" panel for every major screen.
 * Satisfies Hard Gate invariant: model assumptions visible on every screen.
 *
 * Global assumptions are always shown.
 * Screen-specific assumptions can be added via the `additions` prop.
 */

import { useState } from 'react'

// ── Global assumption categories ──────────────────────────────────────────────

interface Assumption {
  category: 'simplification' | 'not_modelled' | 'known_gap' | 'validation'
  text: string
}

const GLOBAL_ASSUMPTIONS: Assumption[] = [
  // Simplifications
  {
    category: 'simplification',
    text: 'Patient severity follows a simplified ESI 1–5 distribution rather than real case-mix data.',
  },
  {
    category: 'simplification',
    text: 'Staff fatigue accumulates linearly per shift; actual fatigue curves are non-linear and individual.',
  },
  {
    category: 'simplification',
    text: 'AI autonomy levels are modelled as discrete steps (L0–L6); real systems occupy a continuum.',
  },
  {
    category: 'simplification',
    text: 'Governance interventions take effect at the next simulation tick; real institutional change is slower.',
  },
  {
    category: 'simplification',
    text: 'Ethical debt accrues at deterministic rates; real moral injury and institutional drift are probabilistic.',
  },

  // Not modelled
  {
    category: 'not_modelled',
    text: 'Patient demographic variation — age, comorbidity profiles, language barriers — is not modelled.',
  },
  {
    category: 'not_modelled',
    text: 'Inter-hospital referral networks, ambulance routing, and transfer delays are outside scope.',
  },
  {
    category: 'not_modelled',
    text: 'Individual staff psychology — previous trauma, supervisor relationships — is not modelled.',
  },
  {
    category: 'not_modelled',
    text: 'Regulatory and legal consequences of governance failures are not simulated.',
  },
  {
    category: 'not_modelled',
    text: 'External adversarial actors (ransomware operators, insider threats) are simplified stressor events.',
  },

  // Known gaps
  {
    category: 'known_gap',
    text: 'The causal graph uses heuristic rules, not empirically validated causal inference from hospital data.',
  },
  {
    category: 'known_gap',
    text: 'Five-signal metric weights have not been validated against clinical governance outcomes research.',
  },
  {
    category: 'known_gap',
    text: 'Scenario stressor magnitudes are expert estimates, not derived from real incident data.',
  },

  // Validation
  {
    category: 'validation',
    text: 'This simulation has not been validated against real hospital operational data or clinical trial outcomes.',
  },
  {
    category: 'validation',
    text: 'Results represent plausible governance dynamics, not predictions of what will happen in any specific institution.',
  },
]

// ── Category labels ───────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<Assumption['category'], {
  label: string
  labelClass: string
  dot: string
}> = {
  simplification: {
    label: 'Simplification',
    labelClass: 'text-amber-400 border-amber-800/60 bg-amber-950/30',
    dot: 'bg-amber-500',
  },
  not_modelled: {
    label: 'Not modelled',
    labelClass: 'text-slate-400 border-slate-700 bg-slate-800/40',
    dot: 'bg-slate-600',
  },
  known_gap: {
    label: 'Known gap',
    labelClass: 'text-orange-400 border-orange-800/60 bg-orange-950/30',
    dot: 'bg-orange-500',
  },
  validation: {
    label: 'Validation status',
    labelClass: 'text-rose-400 border-rose-800/60 bg-rose-950/30',
    dot: 'bg-rose-500',
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

interface AssumptionsPanelProps {
  /** Additional screen-specific assumptions to show after the global ones */
  additions?: Assumption[]
  /** Show only specific categories (all shown by default) */
  filterCategories?: Assumption['category'][]
  /** Compact layout for narrow panels */
  compact?: boolean
}

export default function AssumptionsPanel({
  additions = [],
  filterCategories,
  compact = false,
}: AssumptionsPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [activeCategory, setActiveCategory] = useState<Assumption['category'] | 'all'>('all')

  const all = [...GLOBAL_ASSUMPTIONS, ...additions]
  const filtered = filterCategories
    ? all.filter(a => filterCategories.includes(a.category))
    : all

  const displayed = activeCategory === 'all'
    ? filtered
    : filtered.filter(a => a.category === activeCategory)

  const counts = (['simplification', 'not_modelled', 'known_gap', 'validation'] as const)
    .reduce<Record<string, number>>((acc, cat) => {
      acc[cat] = filtered.filter(a => a.category === cat).length
      return acc
    }, {})

  return (
    <div className="border border-slate-800/80 rounded-lg overflow-hidden">
      {/* ── Toggle header ──────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/40 hover:bg-slate-900/60 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Model assumptions
          </span>
          <span className="text-[9px] font-mono text-slate-600 border border-slate-800 px-1.5 py-0.5 rounded">
            {filtered.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {!expanded && (
            <div className="flex items-center gap-1.5">
              {counts.known_gap > 0 && (
                <span className="flex items-center gap-1 text-[9px] font-mono text-orange-500">
                  <span className="w-1 h-1 rounded-full bg-orange-500" />
                  {counts.known_gap} gaps
                </span>
              )}
              {counts.validation > 0 && (
                <span className="flex items-center gap-1 text-[9px] font-mono text-rose-500">
                  <span className="w-1 h-1 rounded-full bg-rose-500" />
                  unvalidated
                </span>
              )}
            </div>
          )}
          <span className="text-slate-600 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* ── Expanded body ──────────────────────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-slate-800/80">
          {/* Disclaimer banner */}
          <div className="px-4 py-3 bg-rose-950/20 border-b border-rose-900/30">
            <p className="text-[11px] text-rose-300/80 leading-relaxed">
              <span className="font-medium">This is a scenario-based governance simulation.</span>{' '}
              It does not predict reality. Results represent plausible institutional dynamics
              derived from heuristic models, not validated empirical data.
            </p>
          </div>

          {/* Category filter chips */}
          {!compact && (
            <div className="flex flex-wrap gap-1.5 px-4 py-3 border-b border-slate-800/60">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`text-[9px] font-mono px-2 py-1 rounded border transition-colors ${
                  activeCategory === 'all'
                    ? 'border-slate-600 text-slate-300 bg-slate-800/60'
                    : 'border-slate-800 text-slate-600 hover:text-slate-400'
                }`}
              >
                All ({filtered.length})
              </button>
              {(['simplification', 'not_modelled', 'known_gap', 'validation'] as const).map(cat => {
                const cfg = CATEGORY_CONFIG[cat]
                if (!counts[cat]) return null
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`text-[9px] font-mono border px-2 py-1 rounded transition-colors ${
                      activeCategory === cat ? cfg.labelClass : 'border-slate-800 text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {cfg.label} ({counts[cat]})
                  </button>
                )
              })}
            </div>
          )}

          {/* Assumption rows */}
          <ul className="divide-y divide-slate-800/40 max-h-64 overflow-y-auto">
            {displayed.map((assumption, i) => {
              const cfg = CATEGORY_CONFIG[assumption.category]
              return (
                <li key={i} className="flex items-start gap-3 px-4 py-2.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} mt-1.5 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    {compact ? (
                      <p className="text-[11px] text-slate-400 leading-relaxed">{assumption.text}</p>
                    ) : (
                      <>
                        <span className={`text-[9px] font-mono border px-1.5 py-0.5 rounded mr-2 ${cfg.labelClass}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[11px] text-slate-400 leading-relaxed">{assumption.text}</span>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-slate-900/40 border-t border-slate-800/60">
            <p className="text-[10px] text-slate-600">
              For expert feedback on simulation validity, use the feedback form at the bottom of the results page.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Re-export type for callers that want to add screen-specific assumptions
export type { Assumption as ModelAssumption }
