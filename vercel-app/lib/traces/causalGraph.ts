/**
 * Causal Graph Engine — v2 Phase 6
 *
 * Builds a directed causal graph over the event log:
 * event → [downstream events it contributed to]
 *
 * Uses heuristic causal rules rather than full probabilistic inference.
 * The rules encode governance domain knowledge: which event types typically
 * precede and amplify which others.
 *
 * Design principle: causal chains should be explainable in plain language.
 * If a chain cannot be summarised in three sentences, the rules are wrong.
 */

import type { SimEvent } from '@/lib/types'
import type { ReflexiveTrace } from './reflexiveTrace'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CausalEdge {
  fromEventId: string
  toEventId: string
  relationship: string  // e.g. "Credential share made lateral movement possible"
  strength: 'weak' | 'moderate' | 'strong'
}

export interface CausalChain {
  rootEventId: string
  chain: Array<{
    eventId: string
    eventType: string
    tick: number
    explanation: string
    depth: number
  }>
  summary: string
  firstFailureId?: string
}

export interface CausalGraph {
  edges: CausalEdge[]
  /** eventId → list of eventIds this event causally contributes to */
  forwardMap: Map<string, string[]>
  /** eventId → list of eventIds that contributed to this event */
  backwardMap: Map<string, string[]>
}

// ── Causal rules ──────────────────────────────────────────────────────────────
// Each rule: if event A of type X appears before event B of type Y within
// a time window, add a causal edge A→B with given relationship and strength.

interface CausalRule {
  fromType: string | string[]
  toType: string | string[]
  maxTickGap: number    // max ticks between cause and effect
  relationship: string
  strength: 'weak' | 'moderate' | 'strong'
}

const CAUSAL_RULES: CausalRule[] = [
  // Phishing → credential compromise chain
  {
    fromType: 'PHISHING_ATTEMPT',
    toType: 'CREDENTIAL_SHARE',
    maxTickGap: 30,
    relationship: 'Phishing campaign created conditions for credential sharing',
    strength: 'strong',
  },
  {
    fromType: 'CREDENTIAL_SHARE',
    toType: 'DATA_ACCESS_BREACH',
    maxTickGap: 60,
    relationship: 'Shared credential enabled unauthorised data access',
    strength: 'strong',
  },
  {
    fromType: 'DATA_ACCESS_BREACH',
    toType: 'RANSOMWARE_TRIGGER',
    maxTickGap: 60,
    relationship: 'Unauthorised access provided foothold for ransomware deployment',
    strength: 'strong',
  },
  {
    fromType: 'ALERT_SUPPRESSION',
    toType: ['DATA_ACCESS_BREACH', 'RANSOMWARE_TRIGGER'],
    maxTickGap: 90,
    relationship: 'Alert suppression created blind spot that allowed attack to proceed undetected',
    strength: 'moderate',
  },
  {
    fromType: 'ESCALATION_FAILED',
    toType: 'RANSOMWARE_TRIGGER',
    maxTickGap: 60,
    relationship: 'Failed escalation meant attack response was delayed',
    strength: 'moderate',
  },

  // Overload → downstream failures
  {
    fromType: 'OVERLOAD_SURGE',
    toType: ['ALERT_SUPPRESSION', 'ESCALATION_FAILED', 'AI_HALLUCINATION_MISSED'],
    maxTickGap: 50,
    relationship: 'Overload degraded cognitive capacity, increasing likelihood of oversight failure',
    strength: 'moderate',
  },
  {
    fromType: 'OVERLOAD_SURGE',
    toType: 'CREDENTIAL_SHARE',
    maxTickGap: 40,
    relationship: 'Workload pressure drove informal credential workarounds',
    strength: 'moderate',
  },

  // Alert fatigue chain
  {
    fromType: 'ALERT_FLOOD',
    toType: 'ALERT_SUPPRESSION',
    maxTickGap: 25,
    relationship: 'Alert flood triggered suppression rule to reduce noise',
    strength: 'strong',
  },
  {
    fromType: ['ALERT_FLOOD', 'ALERT_SUPPRESSION'],
    toType: 'ESCALATION_FAILED',
    maxTickGap: 40,
    relationship: 'Alert fatigue reduced escalation willingness',
    strength: 'moderate',
  },

  // Governance decay chain
  {
    fromType: 'ESCALATION_FAILED',
    toType: 'ACCOUNTABILITY_AMBIGUOUS',
    maxTickGap: 30,
    relationship: 'Failed escalation left incident without a named responsible party',
    strength: 'strong',
  },
  {
    fromType: 'ACCOUNTABILITY_AMBIGUOUS',
    toType: ['ESCALATION_FAILED', 'AI_HALLUCINATION_MISSED'],
    maxTickGap: 40,
    relationship: 'Accountability ambiguity reduced institutional willingness to escalate subsequent events',
    strength: 'weak',
  },

  // AI hallucination chain
  {
    fromType: 'AI_HALLUCINATION_MISSED',
    toType: 'ESCALATION_FAILED',
    maxTickGap: 30,
    relationship: 'Undetected hallucination created a clinical situation requiring escalation that was not forthcoming',
    strength: 'moderate',
  },
  {
    fromType: 'STAFFING_SHORTAGE',
    toType: ['AI_HALLUCINATION_MISSED', 'ESCALATION_FAILED'],
    maxTickGap: 60,
    relationship: 'Staffing shortage reduced review quality and escalation capacity',
    strength: 'moderate',
  },

  // Queue displacement cascade
  {
    fromType: 'QUEUE_DISPLACEMENT',
    toType: 'QUEUE_DISPLACEMENT',
    maxTickGap: 30,
    relationship: 'Each displacement made subsequent displacements more likely (algorithm optimisation pathway)',
    strength: 'moderate',
  },
  {
    fromType: 'QUEUE_DISPLACEMENT',
    toType: 'ACCOUNTABILITY_AMBIGUOUS',
    maxTickGap: 50,
    relationship: 'Pattern of displacement raised the governance question: who set the algorithm parameters?',
    strength: 'weak',
  },

  // Recovery chains
  {
    fromType: 'GOVERNANCE_INTERVENTION',
    toType: 'ESCALATION_SUCCESS',
    maxTickGap: 60,
    relationship: 'Governance intervention cleared the pathway for escalation to succeed',
    strength: 'moderate',
  },
  {
    fromType: 'HUMAN_OVERRIDE_DOCUMENTED',
    toType: 'GOVERNANCE_INTERVENTION',
    maxTickGap: 50,
    relationship: 'Documented override pattern created evidence base for governance response',
    strength: 'strong',
  },
]

// ── Graph builder ─────────────────────────────────────────────────────────────

export function buildCausalGraph(events: SimEvent[]): CausalGraph {
  const edges: CausalEdge[] = []
  const forwardMap = new Map<string, string[]>()
  const backwardMap = new Map<string, string[]>()

  // Index events by id and tick
  const eventById = new Map(events.map(ev => [ev.event_id ?? '', ev]))
  const eventsByType = new Map<string, SimEvent[]>()
  for (const ev of events) {
    const t = ev.event_type.toUpperCase()
    if (!eventsByType.has(t)) eventsByType.set(t, [])
    eventsByType.get(t)!.push(ev)
  }

  function tickOf(ev: SimEvent) { return Math.floor(ev.timestamp / 5) }

  // Apply causal rules
  for (const rule of CAUSAL_RULES) {
    const fromTypes = Array.isArray(rule.fromType) ? rule.fromType : [rule.fromType]
    const toTypes   = Array.isArray(rule.toType)   ? rule.toType   : [rule.toType]

    for (const fromType of fromTypes) {
      const fromEvents = eventsByType.get(fromType.toUpperCase()) ?? []
      for (const fromEv of fromEvents) {
        const fromTick = tickOf(fromEv)
        const fromId = fromEv.event_id ?? ''

        for (const toType of toTypes) {
          const toEvents = eventsByType.get(toType.toUpperCase()) ?? []
          for (const toEv of toEvents) {
            const toTick = tickOf(toEv)
            const toId = toEv.event_id ?? ''

            if (toTick > fromTick && (toTick - fromTick) <= rule.maxTickGap) {
              // Avoid duplicate edges
              const edgeKey = `${fromId}→${toId}`
              const exists = edges.some(e => e.fromEventId === fromId && e.toEventId === toId)
              if (!exists) {
                edges.push({
                  fromEventId: fromId,
                  toEventId: toId,
                  relationship: rule.relationship,
                  strength: rule.strength,
                })

                if (!forwardMap.has(fromId)) forwardMap.set(fromId, [])
                forwardMap.get(fromId)!.push(toId)

                if (!backwardMap.has(toId)) backwardMap.set(toId, [])
                backwardMap.get(toId)!.push(fromId)
              }
            }
          }
        }
      }
    }
  }

  return { edges, forwardMap, backwardMap }
}

// ── Causal chain finder ───────────────────────────────────────────────────────

/**
 * Find the causal chain leading up to a given event (backwards from it).
 * Returns ancestors in chronological order, up to maxDepth.
 */
export function findCausalChain(
  targetEventId: string,
  events: SimEvent[],
  graph: CausalGraph,
  maxDepth = 3,
): CausalChain {
  const eventById = new Map(events.map(ev => [ev.event_id ?? '', ev]))
  const targetEvent = eventById.get(targetEventId)

  if (!targetEvent) {
    return {
      rootEventId: targetEventId,
      chain: [],
      summary: 'Event not found in log.',
    }
  }

  const chain: CausalChain['chain'] = []
  const visited = new Set<string>()

  function traverse(eventId: string, depth: number) {
    if (depth > maxDepth || visited.has(eventId)) return
    visited.add(eventId)

    const ev = eventById.get(eventId)
    if (!ev) return

    const predecessors = graph.backwardMap.get(eventId) ?? []
    for (const predId of predecessors) {
      traverse(predId, depth + 1)
    }

    if (eventId !== targetEventId) {
      const edge = graph.edges.find(e => e.toEventId === targetEventId && e.fromEventId === eventId)
        || graph.edges.find(e => e.fromEventId === eventId)

      chain.push({
        eventId,
        eventType: ev.event_type,
        tick: Math.floor(ev.timestamp / 5),
        explanation: edge?.relationship ?? `${ev.event_type} contributed to this event`,
        depth,
      })
    }
  }

  traverse(targetEventId, 0)

  // Add the target event itself at the end
  chain.push({
    eventId: targetEventId,
    eventType: targetEvent.event_type,
    tick: Math.floor(targetEvent.timestamp / 5),
    explanation: 'This is the event you are investigating',
    depth: 0,
  })

  // Sort by tick
  chain.sort((a, b) => a.tick - b.tick)

  // Build summary
  const rootEvent = chain[0]
  const summary = chain.length > 1
    ? `This event was preceded by ${chain.length - 1} contributing event(s). The earliest contributor was ${rootEvent?.eventType} at tick ${rootEvent?.tick}.`
    : 'No causal predecessors found within the traced depth.'

  const firstFailureId = chain.find(c => c.eventType.includes('FAILED') || c.eventType.includes('BREACH') || c.eventType.includes('MISSED'))?.eventId

  return {
    rootEventId: targetEventId,
    chain,
    summary,
    firstFailureId,
  }
}

/**
 * Find the first governance failure in a run — the earliest event that
 * began a failure cascade (has the most downstream consequences).
 */
export function findFirstFailure(events: SimEvent[], graph: CausalGraph): SimEvent | null {
  let maxDownstream = 0
  let firstFailure: SimEvent | null = null

  const FAILURE_TYPES = new Set([
    'ESCALATION_FAILED',
    'ALERT_SUPPRESSION',
    'ACCOUNTABILITY_AMBIGUOUS',
    'AI_HALLUCINATION_MISSED',
    'CREDENTIAL_SHARE',
    'PHISHING_ATTEMPT',
    'STAFFING_SHORTAGE',
  ])

  for (const ev of events) {
    if (!FAILURE_TYPES.has(ev.event_type.toUpperCase())) continue
    const downstream = graph.forwardMap.get(ev.event_id ?? '')?.length ?? 0
    if (downstream > maxDownstream) {
      maxDownstream = downstream
      firstFailure = ev
    }
  }

  return firstFailure
}
