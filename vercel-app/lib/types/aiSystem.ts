/**
 * AI System Registry types — v2 architecture.
 *
 * Defines AI systems active in the simulation: their type, autonomy level,
 * risk profile, and workflow location.
 *
 * Autonomy levels L0–L6 are central to detecting automation drift — the gap
 * between declared autonomy (what policy says) and effective autonomy (what
 * actually happens under operational strain).
 */

// ── AI System Types ───────────────────────────────────────────────────────────

export type AISystemType =
  | 'triage_ai'
  | 'scheduling_ai'
  | 'documentation_ai'
  | 'discharge_summary_llm'
  | 'clinical_decision_support'
  | 'deterioration_alerting'
  | 'coding_billing_optimizer'
  | 'care_coordination_agent'
  | 'intake_chatbot'
  | 'radiology_interpretation_ai'

export type WorkflowArea =
  | 'triage'
  | 'admission'
  | 'discharge'
  | 'medication'
  | 'documentation'
  | 'scheduling'
  | 'alerting'
  | 'billing'
  | 'intake'
  | 'imaging'

// ── Autonomy Levels (L0–L6) ───────────────────────────────────────────────────
//
// L0 No AI         — human-only workflow
// L1 AI Informs    — AI provides information, no recommendation
// L2 AI Suggests   — AI recommends, human decides and acts
// L3 AI Drafts     — AI produces output requiring human approval
// L4 AI Acts Rev.  — AI acts within reversible boundaries
// L5 AI Acts Sup.  — AI takes consequential action with monitoring
// L6 Unacceptable  — AI acts without adequate oversight in high-risk clinical context

export type AutonomyLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const AUTONOMY_LEVEL_LABELS: Record<AutonomyLevel, string> = {
  0: 'L0 — No AI',
  1: 'L1 — AI Informs',
  2: 'L2 — AI Suggests',
  3: 'L3 — AI Drafts',
  4: 'L4 — AI Acts Reversibly',
  5: 'L5 — AI Acts Under Supervision',
  6: 'L6 — Unacceptable Autonomy',
}

// ── AI System Definition ──────────────────────────────────────────────────────

export interface AISystem {
  id: string
  name: string
  type: AISystemType
  workflow: WorkflowArea

  // Autonomy — declared vs effective (drift detection)
  declaredAutonomyLevel: AutonomyLevel   // what governance policy says
  effectiveAutonomyLevel?: AutonomyLevel // what actually happens under strain

  // Oversight
  requiredHumanReview: boolean
  reversibility: 'none' | 'partial' | 'full'
  auditability: number                   // 0–100

  // Risk profile
  hallucinationRisk: number              // 0–100
  automationDriftRisk: number            // 0–100
  clinicalRiskSeverity: number           // 0–100 (consequence if wrong)
  biasRisk: number                       // 0–100
  failureVisibility: number              // 0–100 (100 = instantly obvious when wrong)

  // Governance burden
  reviewTimeSecondsBaseline: number
  acceptanceRateBaseline: number         // 0–1 (under normal conditions)
}

// ── Standard AI Systems (used in initial scenarios) ───────────────────────────

export const TRIAGE_AI: AISystem = {
  id: 'triage-ai-v1',
  name: 'AI Triage System',
  type: 'triage_ai',
  workflow: 'triage',
  declaredAutonomyLevel: 2,
  requiredHumanReview: true,
  reversibility: 'partial',
  auditability: 70,
  hallucinationRisk: 20,
  automationDriftRisk: 65,
  clinicalRiskSeverity: 85,
  biasRisk: 40,
  failureVisibility: 60,
  reviewTimeSecondsBaseline: 45,
  acceptanceRateBaseline: 0.80,
}

export const DISCHARGE_SUMMARY_LLM: AISystem = {
  id: 'discharge-llm-v1',
  name: 'Discharge Summary LLM',
  type: 'discharge_summary_llm',
  workflow: 'discharge',
  declaredAutonomyLevel: 3,
  requiredHumanReview: true,
  reversibility: 'full',
  auditability: 85,
  hallucinationRisk: 60,
  automationDriftRisk: 75,
  clinicalRiskSeverity: 70,
  biasRisk: 20,
  failureVisibility: 40,  // low — hallucinated content blends with real
  reviewTimeSecondsBaseline: 120,
  acceptanceRateBaseline: 0.70,
}

export const SCHEDULING_OPTIMIZER: AISystem = {
  id: 'scheduling-ai-v1',
  name: 'Scheduling Optimizer',
  type: 'scheduling_ai',
  workflow: 'scheduling',
  declaredAutonomyLevel: 4,
  requiredHumanReview: false,
  reversibility: 'full',
  auditability: 90,
  hallucinationRisk: 10,
  automationDriftRisk: 45,
  clinicalRiskSeverity: 50,
  biasRisk: 70,  // high — tends to delay chronic/complex patients
  failureVisibility: 30,  // low — equity violations are gradual and invisible
  reviewTimeSecondsBaseline: 0,
  acceptanceRateBaseline: 0.95,
}

export const STANDARD_AI_SYSTEMS: AISystem[] = [
  TRIAGE_AI,
  DISCHARGE_SUMMARY_LLM,
  SCHEDULING_OPTIMIZER,
]
