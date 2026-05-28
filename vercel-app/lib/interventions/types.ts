/**
 * Governance Intervention Types — v2 Phase 5
 *
 * Interventions are deliberate governance actions that modify the simulation
 * state going forward. Every intervention:
 *   1. Emits a GOVERNANCE_INTERVENTION event to the immutable log
 *   2. Modifies one or more metric states
 *   3. Has a pre-computed tradeoff explanation
 *   4. Has a 5-tick window comparison (pre vs post)
 *
 * Design invariant: interventions cannot undo past events.
 * They only affect state from the point of application forward.
 */

export type InterventionType =
  | 'PAUSE_AI_SYSTEM'
  | 'LOWER_AUTONOMY_LEVEL'
  | 'REQUIRE_HUMAN_REVIEW'
  | 'TRIGGER_FAIRNESS_AUDIT'
  | 'ACTIVATE_SURGE_PROTOCOL'
  | 'REDISTRIBUTE_STAFF'
  | 'ADD_FRONTLINE_PARTICIPATION'
  | 'CHANGE_ESCALATION_THRESHOLD'
  | 'ESCALATE_TO_COMMITTEE'

export type InterventionStatus = 'pending' | 'applied' | 'rolled_back'

export interface InterventionEffect {
  /** Metric key and the delta applied (positive = improvement) */
  metric: 'trust' | 'hiddenStrain' | 'ethicalDebt' | 'governanceDrift' | 'automationDrift' | 'reviewCapacity' | 'escalationWillingness'
  delta: number
  label: string
}

export interface InterventionTradeoff {
  /** What this intervention costs */
  costs: string[]
  /** What this intervention improves */
  benefits: string[]
  /** One-line summary */
  summary: string
}

export interface GovernanceIntervention {
  id: string
  type: InterventionType
  label: string
  description: string        // one sentence, readable to tired nurse at 2am
  rationale: string          // why you would apply this
  tradeoff: InterventionTradeoff
  effects: InterventionEffect[]
  /** Whether this intervention can be reversed */
  reversible: boolean
  /** Whether this requires committee approval before applying */
  requiresApproval: boolean
  status: InterventionStatus
  appliedAtTick?: number
  appliedBy?: string
}

// ── Intervention catalogue ────────────────────────────────────────────────────
// These are the pre-defined interventions available in the governance console.

export const INTERVENTION_CATALOGUE: Omit<GovernanceIntervention, 'id' | 'status' | 'appliedAtTick' | 'appliedBy'>[] = [
  {
    type: 'PAUSE_AI_SYSTEM',
    label: 'Pause AI system',
    description: 'Temporarily suspend AI decision-making for a specific system, reverting to manual workflows.',
    rationale: 'Use when automation drift has made AI outputs untrustworthy or after a significant governance failure.',
    tradeoff: {
      benefits: ['Stops automation drift accumulation', 'Forces explicit human review', 'Clears accountability ambiguity'],
      costs: ['Increases staff cognitive load', 'Reduces throughput', 'May trigger alert flood'],
      summary: 'Pausing AI trades throughput for accountability clarity.',
    },
    effects: [
      { metric: 'automationDrift', delta: -30, label: 'Automation drift reset' },
      { metric: 'trust', delta: +8, label: 'Trust recovery from explicit oversight' },
      { metric: 'hiddenStrain', delta: +15, label: 'Staff load increase (manual mode)' },
    ],
    reversible: true,
    requiresApproval: false,
  },
  {
    type: 'LOWER_AUTONOMY_LEVEL',
    label: 'Lower autonomy level',
    description: 'Reduce the declared autonomy level of an AI system by one step (e.g. L4 → L3), requiring more explicit human sign-off.',
    rationale: 'Use when effective autonomy has drifted above the declared level — closes the policy-practice gap.',
    tradeoff: {
      benefits: ['Reduces policy-practice gap', 'Forces documentation of overrides', 'Auditable accountability chain'],
      costs: ['Increases review time per decision', 'Staff may resist as "extra paperwork"', 'Throughput impact at high volume'],
      summary: 'Lowering autonomy closes the governance gap but increases workload.',
    },
    effects: [
      { metric: 'automationDrift', delta: -20, label: 'Autonomy level reduction' },
      { metric: 'governanceDrift', delta: -15, label: 'Policy-practice gap narrows' },
      { metric: 'reviewCapacity', delta: -10, label: 'Review demand increases' },
    ],
    reversible: true,
    requiresApproval: false,
  },
  {
    type: 'REQUIRE_HUMAN_REVIEW',
    label: 'Require human review for all AI outputs',
    description: 'Mandate a human review step before any AI-generated clinical content is actioned.',
    rationale: 'Use when review quality has decayed and rubber-stamping is occurring — forces genuine engagement.',
    tradeoff: {
      benefits: ['Eliminates rubber-stamp risk', 'Restores accountability chain', 'Catches hallucinations before harm'],
      costs: ['High cognitive load increase', 'Bottleneck at reviewer capacity', 'Significant throughput reduction'],
      summary: 'Mandatory review is the strongest oversight intervention — and the most costly.',
    },
    effects: [
      { metric: 'automationDrift', delta: -35, label: 'Rubber-stamping stopped' },
      { metric: 'trust', delta: +12, label: 'Trust restored through explicit oversight' },
      { metric: 'hiddenStrain', delta: +25, label: 'Review bottleneck pressure' },
      { metric: 'reviewCapacity', delta: -20, label: 'Staff review demand surges' },
    ],
    reversible: true,
    requiresApproval: false,
  },
  {
    type: 'TRIGGER_FAIRNESS_AUDIT',
    label: 'Trigger fairness audit',
    description: 'Mandate a 30-day audit of scheduling and triage decisions for systematic bias against vulnerable groups.',
    rationale: 'Use when ethical debt is accruing from queue displacement or triage inequity — makes invisible harm visible.',
    tradeoff: {
      benefits: ['Surfaces systematic equity failures', 'Creates accountability evidence', 'Satisfies regulatory oversight requirement'],
      costs: ['Audit workload burden on staff', 'May surface harms that trigger further governance action', 'Vendor negotiation delays'],
      summary: 'Fairness audits are the primary instrument for making invisible ethical debt visible.',
    },
    effects: [
      { metric: 'ethicalDebt', delta: -20, label: 'Debt acknowledged and logged' },
      { metric: 'governanceDrift', delta: -10, label: 'Governance accountability improved' },
      { metric: 'hiddenStrain', delta: +8, label: 'Audit workload on staff' },
    ],
    reversible: false,
    requiresApproval: true,
  },
  {
    type: 'ACTIVATE_SURGE_PROTOCOL',
    label: 'Activate surge protocol',
    description: 'Trigger the pre-approved overload response: expand capacity thresholds, enable off-protocol admissions, notify escalation contacts.',
    rationale: 'Use when hidden strain is high and queue pressure is creating invisible harm — legitimises workarounds.',
    tradeoff: {
      benefits: ['Reduces queue pressure quickly', 'Legitimises informal workarounds', 'Activates escalation pathways'],
      costs: ['Increases resource consumption', 'May create dependency on surge state', 'Requires post-surge governance review'],
      summary: 'Surge protocol converts informal coping into authorised exception — necessary but should not be the steady state.',
    },
    effects: [
      { metric: 'hiddenStrain', delta: -25, label: 'Queue pressure released' },
      { metric: 'escalationWillingness', delta: +15, label: 'Escalation channels activated' },
      { metric: 'ethicalDebt', delta: -10, label: 'Invisible harm made visible' },
    ],
    reversible: true,
    requiresApproval: false,
  },
  {
    type: 'REDISTRIBUTE_STAFF',
    label: 'Redistribute staff',
    description: 'Reallocate clinical staff from lower-load zones to high-strain areas for the current period.',
    rationale: 'Use when staff load is critically uneven across zones and burnout is imminent in high-strain areas.',
    tradeoff: {
      benefits: ['Reduces fatigue in critical zones', 'Restores review capacity', 'Prevents burnout cascade'],
      costs: ['Reduces capacity in source zones', 'Short-term morale impact on redeployed staff', 'Requires clinical manager sign-off'],
      summary: 'Staff redistribution is a triage for institutional capacity — valuable but creates new strain elsewhere.',
    },
    effects: [
      { metric: 'reviewCapacity', delta: +20, label: 'High-load zone capacity restored' },
      { metric: 'escalationWillingness', delta: +10, label: 'Staff less isolated in burden' },
      { metric: 'hiddenStrain', delta: -15, label: 'Zone-level strain reduced' },
    ],
    reversible: true,
    requiresApproval: false,
  },
  {
    type: 'ADD_FRONTLINE_PARTICIPATION',
    label: 'Add frontline participation',
    description: 'Convene a structured session where frontline clinicians can flag AI system concerns and document governance risks.',
    rationale: 'Use when moral distress is high and staff are disengaged from governance — restores voice and reduces silent normalisation.',
    tradeoff: {
      benefits: ['Surfaces hidden governance risks', 'Reduces moral distress', 'Creates accountability evidence from ground level'],
      costs: ['Staff time investment', 'May surface concerns that require escalation', 'Not a substitute for structural fix'],
      summary: 'Frontline participation converts individual moral distress into collective governance signal.',
    },
    effects: [
      { metric: 'trust', delta: +10, label: 'Institutional trust improved' },
      { metric: 'governanceDrift', delta: -12, label: 'Workarounds documented and addressed' },
      { metric: 'escalationWillingness', delta: +20, label: 'Staff re-engaged with governance' },
    ],
    reversible: false,
    requiresApproval: false,
  },
  {
    type: 'CHANGE_ESCALATION_THRESHOLD',
    label: 'Change escalation threshold',
    description: 'Lower the trigger threshold for automatic escalation, so more events surface to senior clinicians.',
    rationale: 'Use when escalation willingness has dropped and high-risk events are being handled without escalation.',
    tradeoff: {
      benefits: ['More events reach senior oversight', 'Reduces accountability ambiguity', 'Creates audit trail'],
      costs: ['Alert volume increase', 'Risk of escalation fatigue if threshold too low', 'Senior staff bandwidth'],
      summary: 'Lower thresholds surface more — but poorly calibrated, they create the alert fatigue they are meant to prevent.',
    },
    effects: [
      { metric: 'escalationWillingness', delta: +15, label: 'Pathway cleared and lowered' },
      { metric: 'trust', delta: +5, label: 'Escalation paths now trusted' },
      { metric: 'hiddenStrain', delta: +8, label: 'Alert volume increase' },
    ],
    reversible: true,
    requiresApproval: false,
  },
  {
    type: 'ESCALATE_TO_COMMITTEE',
    label: 'Escalate to governance committee',
    description: 'Formally escalate the governance failure to the clinical AI committee for institutional review and documented response.',
    rationale: 'Use when the failure has crossed into institutional responsibility territory — creates formal accountability and paper trail.',
    tradeoff: {
      benefits: ['Assigns institutional accountability', 'Creates documented response', 'Protects frontline from blame deflection'],
      costs: ['Slow process (days to weeks)', 'May trigger external scrutiny', 'Requires evidence package'],
      summary: 'Committee escalation is slow but creates the institutional accountability that incident review demands.',
    },
    effects: [
      { metric: 'governanceDrift', delta: -20, label: 'Formal governance pathway activated' },
      { metric: 'trust', delta: +15, label: 'Institutional accountability demonstrated' },
      { metric: 'ethicalDebt', delta: -15, label: 'Governance debt acknowledged' },
    ],
    reversible: false,
    requiresApproval: true,
  },
]
