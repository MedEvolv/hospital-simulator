/**
 * Scenario System Schema — v2 Phase 2
 *
 * A scenario is a reusable, named governance stress-test configuration.
 * It specifies:
 *   - Which hospital context to simulate (type, department, staffing)
 *   - Which AI systems are in scope
 *   - Which stressors to inject at which simulation ticks
 *   - What governance patterns the facilitator expects to surface
 *
 * Stressors are TypeScript-side governance events (OVERLOAD_SURGE etc.)
 * injected into the Python-generated event log at specified ticks.
 * The TypeScript governance engines react to them exactly as they would
 * to organically produced events — because they are structurally identical.
 */

import type { HospitalContext } from '@/lib/types/simulation'
import type { AISystem } from '@/lib/types/aiSystem'

// ── Stressor types ────────────────────────────────────────────────────────────
// Subset of SimulationEventType that can be deliberately injected.

export type StressorType =
  | 'OVERLOAD_SURGE'
  | 'AI_HALLUCINATION_MISSED'
  | 'STAFFING_SHORTAGE'
  | 'ALERT_FLOOD'
  | 'ESCALATION_FAILED'
  | 'ESCALATION_SUCCESS'
  | 'QUEUE_DISPLACEMENT'
  | 'ACCOUNTABILITY_AMBIGUOUS'
  | 'HUMAN_OVERRIDE_DOCUMENTED'
  | 'GOVERNANCE_INTERVENTION'
  | 'PHISHING_ATTEMPT'
  | 'CREDENTIAL_SHARE'
  | 'ALERT_SUPPRESSION'
  | 'DATA_ACCESS_BREACH'
  | 'RANSOMWARE_TRIGGER'

// ── Scenario packs ────────────────────────────────────────────────────────────
// Packs group related scenarios for cohort training selection.

export type ScenarioPack =
  | 'automation-failure'       // AI operating beyond declared autonomy
  | 'institutional-strain'     // overload, staffing, alert flood
  | 'equity-participation'     // fairness erosion under efficiency pressure
  | 'security-stress-test'     // cybersecurity and governance breakdown

// ── Stressor definition ───────────────────────────────────────────────────────

export interface ScenarioStressor {
  /** Simulation tick at which to inject the event (1 tick = 5 simulated seconds) */
  triggerTick: number
  /** Event type to inject */
  type: StressorType
  /** 0–1 scale factor on the event's payload magnitude */
  magnitude: number
  /** AI system IDs this stressor affects (for automation drift tracking) */
  affectedSystems?: string[]
  /** Plain-language explanation shown to facilitator */
  narrative: string
}

// ── Scenario configuration ────────────────────────────────────────────────────

export interface ScenarioConfig {
  /** Stable identifier — used in URLs and sessionStorage */
  id: string
  name: string
  /** One-paragraph description shown in the scenario selector */
  description: string
  packId: ScenarioPack
  /** Override specific hospital context fields; remainder use profile defaults */
  hospitalContext?: Partial<HospitalContext>
  /** AI systems active in this scenario */
  aiSystems?: AISystem[]
  /** Ordered list of stressor events to inject */
  stressors: ScenarioStressor[]
  /**
   * Governance risk pathways this scenario is designed to surface.
   * Shown as "expected signals" in the pre-run briefing.
   */
  expectedRiskPathways: string[]
  /**
   * Structured learning objectives for the cohort.
   * Each should complete: "After this scenario, participants will be able to..."
   */
  learningObjectives: string[]
  /** Base hospital profile for the Python simulation backend */
  simulationProfile: 'Government Hospital' | 'Private Hospital' | 'Balanced'
  /** Number of simulation ticks (default 300 = 25 minutes simulated) */
  durationTicks: number
  /** Random seed for deterministic replay */
  seed: number
}

// ── Scenario run result ───────────────────────────────────────────────────────
// Returned by the runner; stored in sessionStorage alongside the base report.

import type {
  OperationalTrustState,
  HiddenStrainState,
  EthicalDebtState,
  GovernanceDriftState,
  AutomationDriftState,
} from '@/lib/types/governance'
import type { AggregateStaffState } from '@/lib/engines/humanState'
import type { FiveSignalMetrics } from '@/lib/types/simulation'
import type { SimEvent } from '@/lib/types'

export interface GovernanceSnapshot {
  tick: number
  trust: number
  hiddenStrain: number
  ethicalDebt: number
  policyPracticeGap: number
  effectiveAutonomy: number
  reviewCapacity: number
  escalationWillingness: number
}

export interface ReflectiveInsight {
  type: 'operational' | 'human_state' | 'governance' | 'trust_debt'
  severity: 'info' | 'concern' | 'critical'
  title: string
  explanation: string        // one sentence, tired nurse at 2am
  affectedConcepts: string[]
  governanceImplication: string
  suggestedIntervention?: string
}

export interface ScenarioRunResult {
  scenario: ScenarioConfig
  runId: string
  seed: number
  timestamp: string
  events: SimEvent[]
  baseEventCount: number
  injectedEventCount: number
  governanceState: {
    trust: OperationalTrustState
    hiddenStrain: HiddenStrainState
    ethicalDebt: EthicalDebtState
    governanceDrift: GovernanceDriftState
    automationDrift: AutomationDriftState[]
    humanState: AggregateStaffState
  }
  fiveSignals: FiveSignalMetrics
  governanceTimeline: GovernanceSnapshot[]
  reflectiveInsights: ReflectiveInsight[]
}
