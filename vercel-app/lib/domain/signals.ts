/**
 * The Five Signals — the canonical domain model.
 *
 * SOURCE OF TRUTH: docs/MASTER_GLOSSARY.md §B, docs/METHODOLOGY.md §3.
 * These definitions are the DOCUMENTED model (PRD v2 / Python engine), confirmed
 * canonical by bhai 2026-06-13. They supersede the drifted definitions in
 * lib/types/simulation.ts (which renamed PES→Provider, SSS→System Strain,
 * EIC→Ethical Integrity, STI→Systemic Trust — that drift is being corrected).
 *
 * This file is part of the docs-as-types bridge: when the glossary changes, these
 * types change; when these types drift from the glossary, the mirror is broken.
 */

// ── The five signal keys ──────────────────────────────────────────────────────
// RULE-A1 (docs/RULE_SETS.md): these are held SEPARATE, never collapsed into a
// composite. The type system enforces it — see FiveSignals below: there is no
// `composite` / `ies` / `overall` field, and adding one is a release blocker.

export type SignalKey = 'PSS' | 'PES' | 'SSS' | 'EIC' | 'STI'

/**
 * Canonical signal definitions (MASTER_GLOSSARY §B). The `name` and `kind` are
 * the documented truth; `kind` distinguishes the 0–100 signals from EIC, which
 * is a COUNT, not a score (a critical distinction — RULE-M4).
 */
export const SIGNAL_DEFINITIONS = {
  PSS: {
    name: 'Patient Safety Signal',
    kind: 'score', // 0–100
    gloss:
      'How consistently safe care was delivered across all patients in a run; ' +
      'accounts for triage breaches, escalation failures, and admission delays for critical patients.',
    anchor: 'WHO ICPS (2009); Donabedian (1988); NABH PSQ',
  },
  PES: {
    name: 'Patient Experience Signal',
    kind: 'score', // 0–100
    gloss:
      'Waiting times, communication quality, and dignity preserved through care — ' +
      'distinct from clinical outcome. Penalises the UNEXPLAINED, not the deviation.',
    anchor: 'Donabedian (1988); NABH PRE (PREMs)',
  },
  SSS: {
    name: 'Staff Stress Signal',
    kind: 'score', // 0–100 (engine computes 100 − accumulated stress)
    gloss:
      'Cumulative cognitive and moral load on clinical staff across a run. Sustained ' +
      'high SSS in AI-assisted settings is linked to moral injury — a governance concern, not HR.',
    anchor: 'Jameton (1984); Dean/Talbot/Dean (2019); Walia (correction burden)',
  },
  EIC: {
    name: 'Ethics Intervention Count',
    kind: 'count', // an integer count — NOT a 0–100 score
    gloss:
      'How many times the simulation triggered a governance override or deferred to human ' +
      'judgement. NOT a penalty: a higher count means the moral-reckoning layer was engaged. ' +
      'A ZERO EIC in a high-acuity run is the warning sign (RULE-M4).',
    anchor: 'Original construct; ICMR (2023) HITL framing',
  },
  STI: {
    name: 'System Throughput Index',
    kind: 'score', // 0–100
    gloss:
      'How efficiently the ED processed patient volume in a run. High throughput bought with ' +
      'high ethical debt or value drift is the exact pattern this tool exists to surface.',
    anchor: 'operations vocabulary; Goodhart/Strathern caution',
  },
} as const

export type SignalKind = (typeof SIGNAL_DEFINITIONS)[SignalKey]['kind']

// ── A single signal reading ───────────────────────────────────────────────────

export interface ScoreSignal {
  kind: 'score'
  /** 0–100. Higher = the value was better honoured (NOT "faster"). */
  value: number
  delta: number
  trend: 'improving' | 'stable' | 'degrading'
  /** One sentence, readable to a tired nurse at 2am. Observation, never verdict (RULE-G1). */
  explanation: string
  lastChangedByEvent?: string
}

export interface CountSignal {
  kind: 'count'
  /** An integer count of interventions. Never ranked, never minimised (RULE-M4). */
  value: number
  /** Context is mandatory: a count alone is meaningless; zero-in-high-acuity is the alarm. */
  explanation: string
}

// ── The five signals, held separate (RULE-A1) ─────────────────────────────────
// NOTE TO FUTURE EDITORS: do not add a composite/overall/IES field here or anywhere
// downstream. The five are reported separately, always. A composite is a release
// blocker (RULE-A1; the IES quarantine, docs/VALIDATION_AND_LIMITATIONS §5 #6).

export interface FiveSignals {
  PSS: ScoreSignal
  PES: ScoreSignal
  SSS: ScoreSignal
  /** EIC is a COUNT, not a score — the type makes the distinction unforgeable. */
  EIC: CountSignal
  STI: ScoreSignal
}

/** Compile-time guard: every SignalKey has a definition. */
const _exhaustive: Record<SignalKey, unknown> = SIGNAL_DEFINITIONS
void _exhaustive
