// TypeScript types for the simulation API response.
// Field names match the Python engine output exactly — do not rename.

export interface SimulationReport {
  run_id: string
  institutional_profile: string
  timestamp: string
  seed: number
  performance_scores: PerformanceScores
  moral_reckoning: MoralReckoning
  synthesis: Synthesis
  event_log: SimEvent[]
  glp_optimal: GlpOptimal
  reflective_state?: ReflectiveState
  // Enriched patient data (populated client-side via /api/patient-profiles)
  patient_profiles?: Record<string, PatientProfile>
  // Capacity metadata echoed back from simulation call
  capacity?: CapacityConfig
}

export interface PerformanceScores {
  patient_safety_score: number
  patient_experience_score: number
  staff_stress_score: number
  ethics_intervention_count: number
  system_throughput_index: number
  // RULE-A1: the five signals above are never collapsed into a composite. No
  // institutional_efficacy_score field exists in the payload by design.
  interpretation: string
}

export interface MoralReckoning {
  declared_values: Record<string, number>
  value_drift: ValueDrift
  ethical_debt: EthicalDebt
  tension_signals: TensionSignals
  harm_classifications: HarmClassifications
  refusals: Refusals
  unavoidable_harm_summary: UnavoidableHarmSummary
}

export interface ValueDrift {
  maximum_drift: number
  average_drift: number
  primary_misalignment: string
  interpretation: string
  [key: string]: number | string  // dynamic drift fields e.g. dignity_drift
}

export interface EthicalDebt {
  current_debt: number
  interpretation: string
  category_breakdown: Record<string, number>
  accrual_log?: Array<{ reason: string; amount: number; tick: number }>
}

export interface TensionSignals {
  active: { active_count: number; types: string[] }
  history: Array<{ type: string; severity: number; tick: number; contributing_factors?: string[] }>
}

export interface HarmClassifications {
  summary: {
    total_harms_classified: number
    forced_count: number
    avoidable_count: number
    by_type?: Record<string, number>
  }
  details: Array<{
    harm_type: string
    justification: string
    avoidable_with?: string
    alternative_actions?: string[]
    tick?: number
  }>
}

export interface Refusals {
  summary: { total_refusals: number }
  details: Array<{
    reason: string
    description: string
    requires_human: boolean
    alternative_suggestions?: string[]
    tick?: number
  }>
}

export interface UnavoidableHarmSummary {
  harms_that_occurred: string[]
  values_not_honored: string[]
  trade_offs_unresolved: string[]
  summary?: string
  forced_harms?: number
  avoidable_harms?: number
}

export interface Synthesis {
  insights: SynthesisInsight[]
  recommendation: string
  cost_accounting: {
    // RULE-A1: no composite performance/efficacy score is reported.
    ethical_debt: number
    forced_harms: number
    avoidable_harms: number
    value_drift_average: number
    value_drift_maximum: number
    active_tensions: number
  }
  critical_question: string
}

export type Severity = 'INFO' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface SynthesisInsight {
  type: string
  severity: Severity
  message: string
  data?: Record<string, unknown>
}

export interface ReflectiveState {
  status?: 'unavailable'
  reason?: string
  tick?: number
  operational_state?: {
    current_tick: number
    active_patients: number
    patient_locations: Record<string, string>
    queue_lengths: Record<string, number>
    room_occupancy: Record<string, number>
    waiting_times: Record<string, number>
    active_bottlenecks: string[]
    throughput_rate: number
    escalation_queue_depth: number
    overload_level: number
  }
  human_state?: Record<string, number>
  governance_state?: {
    policy_adherence: number
    override_count: number
    explained_override_ratio: number
    escalation_success_rate: number
    escalation_failure_rate: number
    escalation_congestion: number
    fairness_interventions: number
    governance_stability: number
    governance_drift: number
    accountability_trace_completeness: number
  }
  trust_state?: {
    patient_trust: number
    staff_trust: number
    institutional_trust: number
    trust_fragmentation: number
    trust_recovery_rate: number
    trust_degradation_rate: number
    compliance_probability: number
    escalation_willingness: number
    patient_abandonment_risk: number
    institutional_fragility: number
    workflow_bypass_probability: number
    evidence: Record<string, number>
  }
  hidden_strain_state?: {
    latent_stress: number
    silent_overload: number
    normalized_dysfunction: number
    fatigue_memory: number
    delayed_failure_risk: number
    invisible_suffering: number
    unresolved_pressure: number
    strain_hotspots: Record<string, number>
    evidence: Record<string, number>
  }
  observations?: Array<{
    type: string
    severity: Severity | string
    message: string
    evidence?: Record<string, unknown>
    governance_implication?: string
    tick?: number
  }>
}

// Simulation event log (for Decision Inspector)
export interface SimEvent {
  run_id: string
  event_id: string
  timestamp: number
  sequence: number
  event_type: string
  payload: Record<string, unknown>
}

// GLP optimal allocation result
export interface GlpOptimal {
  status: 'optimal' | 'unavailable' | 'error'
  total_rooms?: number
  objective_value?: number
  deviations?: Record<string, {
    target: number
    optimal: number | null
    actual: number
    d_minus: number
    d_plus: number
  }>
  forced_deviations?: string[]
  avoidable_deviations?: string[]
  eic_note?: string
  reason?: string
  placeholder?: string
}

// Screen 1 form state
export interface SimulationParams {
  profile: 'Government Hospital' | 'Private Hospital' | 'Balanced'
  duration_ticks: number
  seed: number
  patients_per_hour?: number
  er_capacity?: number
  opd_capacity?: number
}

// Rich patient profile generated by DeepSeek after simulation
export interface PatientProfile {
  patient_id: string
  age: number
  gender: 'M' | 'F'
  chief_complaint: string
  arrival_gate: boolean  // true = walk-in, false = ambulance / referral
  history: string[]
  vitals?: {
    bp?: string
    spo2?: number
    temp?: number
    pulse?: number
  }
  clinical_notes?: string
}

// Capacity configuration stored alongside simulation results
export interface CapacityConfig {
  patients_per_hour: number
  er_capacity: number
  opd_capacity: number
}

export const SESSION_KEY = 'im_result'
export const CAPACITY_KEY = 'im_capacity'
