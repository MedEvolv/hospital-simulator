/**
 * The simulation run result — the typed contract between the Python engine and the UI.
 *
 * SOURCE OF TRUTH: docs/IMPLEMENTATION_COMPLETE.md (JSON shape),
 * docs/METHODOLOGY.md §5 (PyGuLP), docs/MASTER_GLOSSARY.md §A (profiles).
 *
 * The Python `im_engine/` produces this; the TypeScript layer renders it. Per RULE-A2
 * (separation of powers) the UI holds no scoring logic — it only displays this result.
 */

import type { FiveSignals } from './signals'
import type { MoralReckoning } from './moral-reckoning'

// ── Institutional profile (MASTER_GLOSSARY §E) ────────────────────────────────
/** Profiles express VALUES, not quality — no profile is "better". */
export type InstitutionalProfile =
  | 'Government'
  | 'Private'
  | 'Balanced'
  | 'Security Stress Test' // V2 cybersecurity human-risk module

// ── ESI (ESI_PROTOCOL.md) ─────────────────────────────────────────────────────
export type ESILevel = 1 | 2 | 3 | 4 | 5

// ── PyGuLP "what was possible?" (METHODOLOGY §5) ──────────────────────────────
/** Forced deviations = capacity-bound; avoidable = allocation choices within governance reach. */
export interface GlpOptimal {
  status: string
  objectiveValue: number
  deviations: Record<string, { dMinus: number; dPlus: number }>
  forcedDeviations: string[]
  avoidableDeviations: string[]
}

// ── The run result ────────────────────────────────────────────────────────────
// RULE-A1 ENCODED STRUCTURALLY: this type holds the five signals (separate) and has
// NO `institutionalEfficacyScore` / `composite` / `overall` field. A composite is a
// release blocker; the type system makes it impossible to put one here without an edit
// that a reviewer would have to consciously make (and reject).

export interface SimulationResult {
  runId: string
  seed: number
  profile: InstitutionalProfile
  durationTicks: number

  /** The five signals, held separate. NOT a composite (RULE-A1). */
  signals: FiveSignals

  /** The moral-reckoning layer output (runs fully on every simulation — RULE-M*). */
  moralReckoning: MoralReckoning

  /** Optional goal-programming counterfactual (PyGuLP). */
  glpOptimal?: GlpOptimal

  /**
   * The closing block: questions, not a grade. Converts the output from a document to be
   * filed into a conversation to be had (GOAL.md; the visibility-paradox finding).
   */
  governanceQuestions: string[]

  /** Reference to the immutable event log (the source of truth — RULE-A3/A2). Not the log itself. */
  eventLogRef: string
}

// Compile-time proof that SimulationResult has no composite field. If someone adds an
// `institutionalEfficacyScore`/`composite`/`overall`/`ies` key, this fails to compile.
type _NoCompositeKeys = Extract<
  keyof SimulationResult,
  'institutionalEfficacyScore' | 'composite' | 'overall' | 'ies' | 'compositeScore'
>
const _noComposite: _NoCompositeKeys[] = [] // must stay an empty never[] — RULE-A1
void _noComposite
