/**
 * Saved run — one shape for persist and reopen.
 *
 * Candidate 1 (architecture review 2026-08-16): a reopened run must arrive
 * at the results page identical to a fresh run. Persist used to store
 * `{ events }` only; results then dereferenced performance_scores.interpretation.
 *
 * Both directions live here. A partial is not a saved run.
 */

import type {
  GlpOptimal,
  MoralReckoning,
  PerformanceScores,
  SimEvent,
  SimulationReport,
  Synthesis,
} from '@/lib/types'

export const SAVED_RUN_VERSION = 1 as const
export const SAVED_EVENT_CAP = 200

export type ResultsReport = SimulationReport & {
  scenario_run?: unknown
  _disclaimer?: string
}

export interface SavedRun {
  version: typeof SAVED_RUN_VERSION
  run_id: string
  institutional_profile: string
  timestamp: string
  seed: number
  performance_scores: PerformanceScores
  moral_reckoning: MoralReckoning
  synthesis: Synthesis
  glp_optimal: GlpOptimal
  event_log: SimEvent[]
  scenario_run?: unknown
  capacity?: SimulationReport['capacity']
  reflective_state?: SimulationReport['reflective_state']
  _disclaimer: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPerformanceScores(value: unknown): value is PerformanceScores {
  if (!isRecord(value)) return false
  return typeof value.interpretation === 'string'
    && typeof value.patient_safety_score === 'number'
    && typeof value.patient_experience_score === 'number'
    && typeof value.staff_stress_score === 'number'
    && typeof value.ethics_intervention_count === 'number'
    && typeof value.system_throughput_index === 'number'
}

function isSynthesis(value: unknown): value is Synthesis {
  if (!isRecord(value) || !isRecord(value.cost_accounting)) return false
  const cost = value.cost_accounting
  return typeof cost.ethical_debt === 'number'
    && typeof value.recommendation === 'string'
    && typeof value.critical_question === 'string'
    && Array.isArray(value.insights)
}

function isMoralReckoning(value: unknown): value is MoralReckoning {
  if (!isRecord(value)) return false
  return isRecord(value.declared_values)
    && isRecord(value.value_drift)
    && isRecord(value.ethical_debt)
    && isRecord(value.harm_classifications)
    && isRecord(value.refusals)
    && isRecord(value.unavoidable_harm_summary)
}

/** The fields the results page actually dereferences. A partial `{ events }` fails this. */
export function isResultsPayload(value: unknown): value is ResultsReport {
  if (!isRecord(value)) return false
  if (!isPerformanceScores(value.performance_scores)) return false
  if (!isMoralReckoning(value.moral_reckoning)) return false
  if (!isSynthesis(value.synthesis)) return false
  if (!isRecord(value.glp_optimal) || typeof value.glp_optimal.status !== 'string') return false
  if (!Array.isArray(value.event_log)) return false
  if (typeof value.run_id !== 'string') return false
  if (typeof value.institutional_profile !== 'string') return false
  if (typeof value.timestamp !== 'string') return false
  if (typeof value.seed !== 'number') return false
  return true
}

export function toSavedRun(report: ResultsReport): SavedRun {
  const events = Array.isArray(report.event_log) ? report.event_log.slice(0, SAVED_EVENT_CAP) : []
  return {
    version: SAVED_RUN_VERSION,
    run_id: report.run_id,
    institutional_profile: report.institutional_profile,
    timestamp: report.timestamp,
    seed: report.seed,
    performance_scores: report.performance_scores,
    moral_reckoning: report.moral_reckoning,
    synthesis: report.synthesis,
    glp_optimal: report.glp_optimal,
    event_log: events,
    scenario_run: report.scenario_run,
    capacity: report.capacity,
    reflective_state: report.reflective_state,
    _disclaimer: report._disclaimer
      ?? 'This is a scenario-based governance simulation. It does not predict reality.',
  }
}

export function fromSavedRun(raw: unknown): ResultsReport | null {
  if (!isResultsPayload(raw)) return null
  const report: ResultsReport = {
    run_id: raw.run_id,
    institutional_profile: raw.institutional_profile,
    timestamp: raw.timestamp,
    seed: raw.seed,
    performance_scores: raw.performance_scores,
    moral_reckoning: raw.moral_reckoning,
    synthesis: raw.synthesis,
    glp_optimal: raw.glp_optimal,
    event_log: raw.event_log,
    _disclaimer: typeof raw._disclaimer === 'string'
      ? raw._disclaimer
      : 'This is a scenario-based governance simulation. It does not predict reality.',
  }
  if (raw.scenario_run !== undefined) report.scenario_run = raw.scenario_run
  if (raw.capacity !== undefined) report.capacity = raw.capacity
  if (raw.reflective_state !== undefined) report.reflective_state = raw.reflective_state
  return report
}
