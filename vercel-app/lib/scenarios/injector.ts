/**
 * Scenario Stressor Injector
 *
 * Takes the base event log from the Python simulation and inserts
 * scenario stressor events at the specified tick positions.
 *
 * Design principle: injected events are structurally identical to organic
 * events — the governance engines cannot and should not distinguish between
 * them. The only marking is `payload.scenario_injected: true`, used only
 * for audit trail purposes in the event inspector.
 */

import type { SimEvent } from '@/lib/types'
import type { ScenarioStressor } from './schema'

/**
 * Inject scenario stressors into a base event log.
 *
 * - Stressor events are stamped with `tick * 5` seconds (matching Python engine convention)
 * - When multiple events share a timestamp, organic events come first (scenario events
 *   represent the institutional response to what just happened)
 * - Sequences are reassigned monotonically after sorting
 */
export function injectStressors(
  baseEvents: SimEvent[],
  runId: string,
  stressors: ScenarioStressor[],
): {
  events: SimEvent[]
  injectedCount: number
} {
  if (stressors.length === 0) {
    return { events: [...baseEvents], injectedCount: 0 }
  }

  const injected: SimEvent[] = stressors.map((stressor, idx) => ({
    run_id: runId,
    event_id: `scenario-${idx}-${stressor.type}-t${stressor.triggerTick}`,
    timestamp: stressor.triggerTick * 5,   // 1 tick = 5 simulated seconds
    sequence: -1,                          // reassigned after sort
    event_type: stressor.type,
    payload: {
      scenario_injected: true,
      magnitude: stressor.magnitude,
      narrative: stressor.narrative,
      affected_systems: stressor.affectedSystems ?? [],
      trigger_tick: stressor.triggerTick,
    },
  }))

  // Merge and sort: by timestamp asc, then organic events before injected at same timestamp
  const merged = [...baseEvents, ...injected].sort((a, b) => {
    if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp
    // At the same timestamp, injected (scenario consequence) comes after organic
    const aIsInjected = (a.payload as Record<string, unknown>).scenario_injected === true
    const bIsInjected = (b.payload as Record<string, unknown>).scenario_injected === true
    if (!aIsInjected && bIsInjected) return -1
    if (aIsInjected && !bIsInjected) return 1
    return (a.sequence ?? 0) - (b.sequence ?? 0)
  })

  // Reassign monotonic sequence numbers
  const resequenced = merged.map((e, i) => ({ ...e, sequence: i }))

  return {
    events: resequenced,
    injectedCount: injected.length,
  }
}

/**
 * Filter an event log to only scenario-injected events.
 * Used by the inspector to highlight stressor injection points.
 */
export function getInjectedEvents(events: SimEvent[]): SimEvent[] {
  return events.filter(
    e => (e.payload as Record<string, unknown>).scenario_injected === true,
  )
}

/**
 * Get a timeline summary of when each stressor was injected.
 * Used in the pre-run briefing and post-run replay.
 */
export function getInjectionTimeline(
  stressors: ScenarioStressor[],
): Array<{ tick: number; eventType: string; narrative: string }> {
  return stressors
    .slice()
    .sort((a, b) => a.triggerTick - b.triggerTick)
    .map(s => ({
      tick: s.triggerTick,
      eventType: s.type,
      narrative: s.narrative,
    }))
}
