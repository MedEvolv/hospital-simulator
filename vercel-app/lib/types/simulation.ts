/**
 * Core simulation types — v2 architecture.
 *
 * These extend (not replace) the v1 types in lib/types.ts.
 * The Python engine produces events; these types describe the structure
 * the TypeScript layer uses to compute governance state from the event log.
 */

import type {
  OperationalTrustState,
  HiddenStrainState,
  EthicalDebtState,
  GovernanceDriftState,
  AutomationDriftState,
  AccountabilityState,
} from './governance'

// ── Hospital Context ──────────────────────────────────────────────────────────

export type HospitalType =
  | 'public_district'
  | 'private_chain'
  | 'teaching_hospital'
  | 'specialty_clinic'

export type DepartmentType =
  | 'er'
  | 'opd'
  | 'icu'
  | 'radiology'
  | 'discharge'
  | 'primary_care'

export interface StaffProfile {
  role: string
  count: number
  shiftHours: number
  baselineFatigue: number  // 0–100
}

export interface EscalationPathway {
  id: string
  fromRole: string
  toRole: string
  triggerCondition: string
  maxDelaySeconds: number
  isDocumented: boolean
}

export interface HospitalContext {
  hospitalType: HospitalType
  department: DepartmentType
  beds: number
  staff: StaffProfile[]
  patientInflowRate: number          // patients per hour
  digitizationMaturity: 0 | 1 | 2 | 3 | 4 | 5
  governanceMaturity: 0 | 1 | 2 | 3 | 4 | 5
  baselineOverload: number           // 0–100
  escalationPathways: EscalationPathway[]
}

// ── Simulation Event Types ────────────────────────────────────────────────────

export type SimulationEventType =
  // Patient flow (v1)
  | 'RUN_STARTED'
  | 'PATIENT_ARRIVAL'
  | 'TRIAGE_STAGE_1_ASSIGNED'
  | 'TRIAGE_STAGE_2_ASSIGNED'
  | 'QUEUE_ASSIGNMENT'
  | 'QUEUE_REORDER'
  | 'PATIENT_ADMITTED'
  | 'ROOM_DISCHARGE'
  | 'METRIC_UPDATE'
  | 'AGENT_ACTION'
  | 'ESCALATION_SUGGESTED'
  // ESI triage (v2 Phase 3)
  | 'ESI_LEVEL_ASSIGNED'
  | 'ROOM_OVERLOAD'
  | 'CORRECTION_BURDEN'
  // Governance (v2 Phase 1)
  | 'GOVERNANCE_METRIC_UPDATE'
  | 'HUMAN_STATE_UPDATE'
  | 'AUTOMATION_DRIFT_SIGNAL'
  | 'ETHICAL_DEBT_ACCRUAL'
  | 'TRUST_IMPACT_EVENT'
  | 'GOVERNANCE_INTERVENTION'
  // Scenario stressors (v2 Phase 2)
  | 'OVERLOAD_SURGE'
  | 'AI_HALLUCINATION'
  | 'STAFFING_SHORTAGE'
  | 'ALERT_FLOOD'
  | 'ESCALATION_FAILED'
  | 'ESCALATION_SUCCESS'
  | 'QUEUE_DISPLACEMENT'
  | 'ACCOUNTABILITY_AMBIGUOUS'
  | 'HUMAN_OVERRIDE_DOCUMENTED'
  | 'AI_HALLUCINATION_MISSED'
  // Cybersecurity (v2 Phase 3)
  | 'PHISHING_ATTEMPT'
  | 'CREDENTIAL_SHARE'
  | 'ALERT_SUPPRESSION'
  | 'DATA_ACCESS_BREACH'
  | 'RANSOMWARE_TRIGGER'

// ── Simulation State Snapshot ─────────────────────────────────────────────────
// Captured every N ticks — the full institutional state at a point in time.

export interface SimulationStateSnapshot {
  tick: number
  operational: OperationalState
  humanState: HumanStateAggregate
  trust: OperationalTrustState
  hiddenStrain: HiddenStrainState
  ethicalDebt: EthicalDebtState
  governanceDrift: GovernanceDriftState
  automationDrift: AutomationDriftState[]
  accountability: AccountabilityState
}

export interface OperationalState {
  queueLengths: Record<string, number>
  bedOccupancy: number          // 0–100
  staffUtilization: number      // 0–100
  escalationCount: number
  alertCount: number
  patientAbandonments: number
  throughput: number
}

export interface HumanStateAggregate {
  averageFatigue: number
  averageCognitiveLoad: number
  alertFatigue: number
  moraleScore: number           // inverse burnout
  escalationWillingness: number
  reviewCapacity: number
}

// ── Five Institutional Signal Metrics — CANONICAL (docs/MASTER_GLOSSARY §B) ────
// These are the displayed signals. NEVER collapse into a composite score (RULE-A1).
// Canonical definitions live in lib/domain/signals.ts; values come from the Python
// scoring engine (RULE-A2 — this layer renders, it does not recompute).
// NOTE (2026-06-13): the comments below were previously DRIFTED (Provider Experience,
// System Strain, Ethical Integrity Coefficient, Systemic Trust Index). Corrected to the
// documented model. This shape is the display carrier for lib/domain's canonical signals.

export interface FiveSignalMetrics {
  /** Patient Safety Signal — safe care delivered; triage/escalation failures, critical-wait breaches */
  PSS: SignalMetric
  /** Patient Experience Signal — waiting, communication, dignity; penalises the unexplained */
  PES: SignalMetric
  /** Staff Stress Signal — cumulative cognitive/moral load on staff (higher value = less strain) */
  SSS: SignalMetric
  /** Ethics Intervention Count — a COUNT of governance interventions; never a penalty (RULE-M4) */
  EIC: SignalMetric
  /** System Throughput Index — flow efficiency; high throughput + high ethical debt is the pattern to watch */
  STI: SignalMetric
}

export interface SignalMetric {
  value: number                 // 0–100
  delta: number                 // change since last snapshot
  trend: 'improving' | 'stable' | 'degrading'
  explanation: string           // one sentence, readable to tired nurse at 2am
  lastChangedByEvent?: string   // event_type that caused last significant change
}
