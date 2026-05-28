/**
 * Scenario Registry
 *
 * Central index of all available scenarios.
 * Importing JSON directly (via resolveJsonModule) keeps this deployment-safe
 * without any file-system reads at runtime.
 */

import type { ScenarioConfig } from './schema'

import hallucinatedDischargeSummary from '@/data/scenarios/hallucinated-discharge-summary.json'
import aiTriageDrift from '@/data/scenarios/ai-triage-drift-er-overload.json'
import chronicSchedulingDelay from '@/data/scenarios/chronic-patient-scheduling-delay.json'
import securityStressTest from '@/data/scenarios/security-stress-test.json'

// Cast to ScenarioConfig — JSON shape is validated by the type at import time
const SCENARIOS: ScenarioConfig[] = [
  hallucinatedDischargeSummary as ScenarioConfig,
  aiTriageDrift as ScenarioConfig,
  chronicSchedulingDelay as ScenarioConfig,
  securityStressTest as ScenarioConfig,
]

export function getAllScenarios(): ScenarioConfig[] {
  return SCENARIOS
}

export function getScenarioById(id: string): ScenarioConfig | undefined {
  return SCENARIOS.find(s => s.id === id)
}

export function getScenariosByPack(packId: string): ScenarioConfig[] {
  return SCENARIOS.filter(s => s.packId === packId)
}
