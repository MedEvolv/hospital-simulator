/**
 * Human-State Engine types — v2 architecture.
 *
 * Models emotional, cognitive, and physiological state as operationally
 * consequential. Human state affects:
 * - escalation willingness
 * - review thoroughness
 * - AI acceptance rate
 * - governance compliance
 * - moral distress accumulation
 */

// ── Human Roles ───────────────────────────────────────────────────────────────

export type HumanRole =
  | 'nurse'
  | 'junior_doctor'
  | 'senior_doctor'
  | 'resident'
  | 'administrator'
  | 'receptionist'
  | 'technician'
  | 'patient'
  | 'caregiver'
  | 'governance_committee_member'

// ── Staff State ───────────────────────────────────────────────────────────────

export interface StaffVariables {
  fatigue: number                    // 0–100
  cognitiveLoad: number              // 0–100
  burnout: number                    // 0–100
  moralDistress: number              // 0–100
  alertFatigue: number               // 0–100
  trustInAI: number                  // 0–100
  trustInInstitution: number         // 0–100
  escalationWillingness: number      // 0–100
  reviewCapacity: number             // 0–100 (decreases with fatigue + load)
  overrideConfidence: number         // 0–100 (willingness to challenge AI)
  perceivedBlameRisk: number         // 0–100 (fear of being blamed for AI errors)
}

// ── Patient State ─────────────────────────────────────────────────────────────

export interface PatientVariables {
  anxiety: number                    // 0–100
  frustration: number                // 0–100
  trustInInstitution: number         // 0–100
  abandonmentRisk: number            // 0–100
  complaintLikelihood: number        // 0–100
  complianceLikelihood: number       // 0–100
  abilityToEscalate: number          // 0–100 (health literacy + language + access)
  digitalLiteracy: number            // 0–100
  languageCompatibility: number      // 0–100 (with staff + AI systems)
}

// ── Combined Human State ──────────────────────────────────────────────────────

export interface HumanState {
  id: string
  role: HumanRole
  staff?: StaffVariables
  patient?: PatientVariables
  currentTick: number
  stateHistory: HumanStateHistoryEntry[]
}

export interface HumanStateHistoryEntry {
  tick: number
  triggerEvent: string
  changes: Partial<StaffVariables & PatientVariables>
  explanation: string
}

// ── State Change Drivers ──────────────────────────────────────────────────────
// Events that increase fatigue, cognitive load, moral distress, etc.

export type HumanStateDriver =
  | 'workload_increase'
  | 'shift_extension'
  | 'queue_pressure'
  | 'repeated_alerts'
  | 'ignored_escalation'
  | 'unclear_accountability'
  | 'ai_error_observed'
  | 'governance_intervention'
  | 'successful_recovery'
  | 'patient_harm_witnessed'
  | 'ai_override_blamed'
  | 'security_incident'

// ── Engine Output ─────────────────────────────────────────────────────────────

export interface HumanStateEngineOutput {
  updatedState: HumanState
  explanation: string
  delta: Partial<StaffVariables & PatientVariables>
  riskFlags: HumanStateRiskFlag[]
}

export interface HumanStateRiskFlag {
  type: 'review_failure_risk' | 'escalation_failure_risk' | 'automation_reliance_risk' | 'burnout_imminent'
  severity: 'low' | 'medium' | 'high' | 'critical'
  affectedRole: HumanRole
  recommendation: string
}
