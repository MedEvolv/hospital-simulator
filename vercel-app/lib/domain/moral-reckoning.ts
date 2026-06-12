/**
 * The Moral-Reckoning layer — the canonical domain model.
 *
 * SOURCE OF TRUTH: docs/MORAL_RECKONING_SPECIFICATION.md (the 7 priorities),
 * docs/MASTER_GLOSSARY.md §C, docs/CANON_ALIGNMENT.md §2 (the NaHzHaR mapping).
 *
 * Part of the docs-as-types bridge: each construct here is the engineering shape of a
 * documented priority, and carries the NaHzHaR phase it expresses (Notice·Hold·Heal·Release).
 */

// ── NaHzHaR — the rhythm under the layer (CANON_ALIGNMENT §2) ──────────────────
export type NaHzHaRPhase = 'notice' | 'hold' | 'heal' | 'release'

// ── Insight severity (MORAL_RECKONING_SPEC §8) ────────────────────────────────
export type InsightSeverity = 'INFO' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

// ── The five declared values (MORAL_RECKONING_SPEC §1; engine DeclaredValues) ──
export type ValueDimension =
  | 'patient_dignity'
  | 'fairness'
  | 'transparency'
  | 'safety_primacy'
  | 'staff_welfare'

// ── Priority 1: Value Drift (NaHzHaR: Notice) ─────────────────────────────────
/** drift = |declared − observed| per dimension. Surfaced as SYSTEMIC, never individual (RULE-M2). */
export interface ValueDrift {
  declared: Record<ValueDimension, number>
  observed: Record<ValueDimension, number>
  drift: Record<ValueDimension, number>
  primaryMisalignment: ValueDimension | null
  /** Always framed as a property of the system under pressure (RULE-M2 / Finding 5). */
  interpretation: string
}

// ── Priority 2: Ethical Debt (NaHzHaR: Hold, unreleased) ──────────────────────
/** Accumulates across decisions; decays slowly (assumption: 0.005/tick — VALIDATION §4). Never reset silently (RULE-M3). */
export interface EthicalDebt {
  currentDebt: number
  accrualLog: Array<{ tick: number; amount: number; reason: string; category: string }>
}

// ── Priority 3: Tension Signals (NaHzHaR: Hold) ───────────────────────────────
/** Pre-collapse: strain absorbed silently (wait in the 0.80–0.95×threshold band). Leading indicator, not an error. */
export interface TensionSignal {
  tick: number
  kind: string
  severity: number
  explanation: string
}

// ── Priority 4: Forced vs Avoidable Harm (RULE-M1) ────────────────────────────
/** Only AVOIDABLE harm is "within governance reach." WHO ICPS (2009): preventable = avoidable. */
export type HarmClass = 'forced' | 'avoidable'

export interface HarmEvent {
  tick: number
  kind: string
  classification: HarmClass
  /** Why this classification — for forced, the binding capacity constraint; for avoidable, the alternative that existed. */
  rationale: string
  /** Where PyGuLP proved forcedness (harm remaining in the optimal allocation), the proof reference. */
  glpProof?: string
}

// ── Priority 5: Refusal (NaHzHaR: Release; RULE-M5) ───────────────────────────
/** The five refusal reasons (MORAL_RECKONING_SPEC §5). Refusal cannot be disabled or suppressed. */
export type RefusalReason =
  | 'conflicting_signals'
  | 'insufficient_data'
  | 'policy_ambiguity'
  | 'harm_threshold'
  | 'epistemic_uncertainty'

export interface Refusal {
  tick: number
  reason: RefusalReason
  /** Refusals are governance signals, not failures — the system declining to act unsafely. */
  explanation: string
}

// ── Priorities 6–7: Unavoidable-harm summary + Epistemic humility (Release) ───
export interface UnavoidableHarmSummary {
  forcedCount: number
  avoidableCount: number
  /** Honest accounting of the cost paid — answers "What did this cost us, and why?" */
  narrative: string
}

// ── The whole moral-reckoning result ──────────────────────────────────────────
export interface MoralReckoning {
  valueDrift: ValueDrift
  ethicalDebt: EthicalDebt
  tensions: TensionSignal[]
  harms: HarmEvent[]
  refusals: Refusal[]
  unavoidableHarm: UnavoidableHarmSummary
  /** Auto-detected patterns with severity. */
  insights: Array<{ severity: InsightSeverity; phase: NaHzHaRPhase; message: string }>
  /** Verbatim, always (MASTER_GLOSSARY §G). */
  criticalQuestion: 'What did this cost us, and why?'
}

/** The seven priorities, each tied to its NaHzHaR phase — the documented mapping made data. */
export const MORAL_PRIORITIES = [
  { n: 1, name: 'Value Drift', phase: 'notice' },
  { n: 2, name: 'Ethical Debt', phase: 'hold' },
  { n: 3, name: 'Tension Signals', phase: 'hold' },
  { n: 4, name: 'Forced vs Avoidable Harm', phase: 'heal' },
  { n: 5, name: 'Refusal to Act', phase: 'release' },
  { n: 6, name: 'Unavoidable Harm Summary', phase: 'release' },
  { n: 7, name: 'Epistemic Humility', phase: 'release' },
] as const satisfies ReadonlyArray<{ n: number; name: string; phase: NaHzHaRPhase }>
