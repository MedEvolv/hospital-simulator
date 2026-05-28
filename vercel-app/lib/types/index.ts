/**
 * Central type barrel — v2 architecture.
 *
 * Imports from all type modules so consumers can use:
 *   import { HospitalContext, OperationalTrustState, HumanState } from '@/lib/types'
 *
 * The legacy types.ts (v1) is re-exported for backwards compatibility.
 * Prefer the v2 types for new code.
 */

export * from './simulation'
export * from './governance'
export * from './humanState'
export * from './aiSystem'

// ── Legacy v1 types (backwards compat) ───────────────────────────────────────
export type {
  SimulationReport,
  PerformanceScores,
  MoralReckoning,
  ValueDrift,
  EthicalDebt,
  TensionSignals,
  HarmClassifications,
  Refusals,
  UnavoidableHarmSummary,
  Synthesis,
  SynthesisInsight,
  SimEvent,
  GlpOptimal,
  SimulationParams,
  PatientProfile,
  CapacityConfig,
} from '../types'

export {
  SESSION_KEY,
  CAPACITY_KEY,
} from '../types'

export type { Severity } from '../types'
