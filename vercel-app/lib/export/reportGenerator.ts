/**
 * Governance Artifact Report Generator — v2 Phase 7
 *
 * Generates governance stress-test reports from a scenario run result.
 * Output formats: Markdown (primary) and plain-text committee summary.
 *
 * Hard gate: every run must be exportable. This module satisfies that invariant.
 * Ontological disclaimer is injected on every exported document.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

// Import canonical types — do NOT redeclare locally; local copies silently
// diverge from upstream whenever fields are added or renamed.
import type { SignalMetric } from '@/lib/types/simulation'
import { SIGNAL_DEFINITIONS } from '@/lib/domain' // canonical names + kind (score vs count)
import type {
  ReflectiveInsight,
  GovernanceSnapshot as GovernanceTimelinePoint,
} from '@/lib/scenarios/schema'

export type ReportType =
  | 'governance_stress_test'   // Full scenario analysis
  | 'ethical_debt'             // Ethical debt breakdown
  | 'accountability_trace'     // Responsibility map per event
  | 'committee_briefing'       // Short executive summary
  | 'raw_json'                 // Complete run record

interface ScenarioRunSnapshot {
  scenario: {
    id: string
    name: string
    description: string
    packId: string
    expectedRiskPathways: string[]
    learningObjectives: string[]
    simulationProfile: string
    durationTicks: number
    stressorCount?: number
    stressors?: Array<{ triggerTick: number; type: string; narrative: string }>
  }
  run_id: string
  seed: number
  timestamp: string
  base_event_count: number
  injected_event_count: number
  five_signals: {
    PSS: SignalMetric
    PES: SignalMetric
    SSS: SignalMetric
    EIC: SignalMetric
    STI: SignalMetric
  }
  governance_timeline: GovernanceTimelinePoint[]
  reflective_insights: ReflectiveInsight[]
  governance_state?: {
    human_state?: {
      averageFatigue?: number
      averageCognitiveLoad?: number
      alertFatigue?: number
      moraleScore?: number
      escalationWillingness?: number
      reviewCapacity?: number
    }
  }
  expert_feedback?: {
    scenarioRealism?: number
    variableAccuracy?: number
    insightUsefulness?: number
    escalationRealism?: number
    missingFactors?: string
    strongestInsight?: string
    wouldUseForTraining?: string
    professionalRole?: string
    additionalNotes?: string
    submittedAt?: string
  }
}

// ── Formatting helpers ────────────────────────────────────────────────────────

const DISCLAIMER = `> ⚠️ **Ontological disclaimer**: This is a scenario-based governance simulation.
> It does not predict reality, evaluate specific institutions, or constitute clinical advice.
> All findings are observations from a synthetic governance stress test.`

function severityEmoji(severity: string): string {
  if (severity === 'critical') return '🔴'
  if (severity === 'concern') return '🟡'
  return '⚪'
}

function signalBar(value: number, width = 20): string {
  const filled = Math.round((value / 100) * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

function signalStatus(value: number, highMeansGood: boolean): string {
  const effective = highMeansGood ? value : (100 - value)
  if (effective >= 70) return 'nominal'
  if (effective >= 45) return 'degraded'
  return 'critical'
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  } catch {
    return iso.slice(0, 10)
  }
}

// ── Governance Stress-Test Report (Markdown) ──────────────────────────────────

export function generateGovernanceStressTestReport(run: ScenarioRunSnapshot): string {
  const { scenario, five_signals: signals, reflective_insights: insights, governance_timeline: timeline } = run

  const lines: string[] = []

  // ── Title block ─────────────────────────────────────────────
  lines.push(`# Governance Stress-Test Report`)
  lines.push(``)
  lines.push(`**Scenario:** ${scenario.name}`)
  lines.push(`**Pack:** ${scenario.packId}`)
  lines.push(`**Profile:** ${scenario.simulationProfile}`)
  lines.push(`**Run date:** ${formatDate(run.timestamp)}`)
  lines.push(`**Run ID:** \`${run.run_id}\``)
  lines.push(`**Seed:** ${run.seed} _(deterministic — same seed reproduces identical results)_`)
  lines.push(``)
  lines.push(DISCLAIMER)
  lines.push(``)
  lines.push(`---`)
  lines.push(``)

  // ── Scenario description ─────────────────────────────────────
  lines.push(`## Scenario`)
  lines.push(``)
  lines.push(scenario.description)
  lines.push(``)
  lines.push(`**Duration:** ${scenario.durationTicks} simulation ticks · `)
  lines.push(`**Events:** ${run.base_event_count} organic + ${run.injected_event_count} injected stressors`)
  lines.push(``)

  // ── Expected risk pathways ───────────────────────────────────
  lines.push(`### Expected risk pathways`)
  lines.push(``)
  for (const pathway of scenario.expectedRiskPathways) {
    lines.push(`- ${pathway}`)
  }
  lines.push(``)

  // ── Five signal metrics ──────────────────────────────────────
  lines.push(`## Five Signal Metrics`)
  lines.push(``)
  lines.push(`PSS, PES, SSS, STI are 0–100 — higher means the value was better honoured (NOT "faster"). EIC is a COUNT of governance interventions, never a penalty: a zero in a high-acuity run is the warning sign (RULE-M4).`)
  lines.push(``)
  lines.push(`| Signal | Value | Status | Explanation |`)
  lines.push(`|--------|-------|--------|-------------|`)

  const signalKeys: Array<keyof typeof signals> = ['PSS', 'PES', 'SSS', 'EIC', 'STI']
  for (const key of signalKeys) {
    const s = signals[key]
    const def = SIGNAL_DEFINITIONS[key]
    if (def.kind === 'count') {
      // EIC is a COUNT — never scored good/bad (RULE-M4). No status bar.
      lines.push(`| **${key}** ${def.name} | **${s.value}** (count) | ⚪ engaged | ${s.explanation} |`)
    } else {
      // All score signals: higher = the value was better honoured.
      const status = signalStatus(s.value, true)
      const statusMark = status === 'critical' ? '🔴' : status === 'degraded' ? '🟡' : '⚪'
      lines.push(`| **${key}** ${def.name} | **${s.value}** | ${statusMark} ${status} | ${s.explanation} |`)
    }
  }
  lines.push(``)

  // ── Governance timeline summary ──────────────────────────────
  if (timeline && timeline.length > 1) {
    lines.push(`## Governance Timeline`)
    lines.push(``)
    lines.push(`Key state evolution over ${timeline.length} snapshots (every ~30 ticks):`)
    lines.push(``)
    lines.push(`| Tick | Trust | Hidden Strain | Ethical Debt | Review Capacity |`)
    lines.push(`|------|-------|---------------|--------------|-----------------|`)
    // Show first, last, and any point where trust dropped by >10 in one step
    const keyPoints = [0, Math.floor(timeline.length / 2), timeline.length - 1]
    const shown = new Set(keyPoints)
    for (let i = 1; i < timeline.length; i++) {
      if (timeline[i].trust < timeline[i-1].trust - 10) shown.add(i)
    }
    for (const idx of Array.from(shown).sort((a, b) => a - b)) {
      const p = timeline[idx]
      lines.push(`| ${p.tick} | ${p.trust} | ${p.hiddenStrain} | ${p.ethicalDebt.toFixed(0)} | ${p.reviewCapacity} |`)
    }
    lines.push(``)
  }

  // ── Stressor sequence (if available) ────────────────────────
  if (scenario.stressors && scenario.stressors.length > 0) {
    lines.push(`## Stressor Sequence`)
    lines.push(``)
    lines.push(`Governance events injected in deterministic order:`)
    lines.push(``)
    for (const stressor of scenario.stressors) {
      lines.push(`**Tick ${stressor.triggerTick} — \`${stressor.type}\`**`)
      lines.push(``)
      lines.push(`${stressor.narrative}`)
      lines.push(``)
    }
  }

  // ── Reflective insights ──────────────────────────────────────
  lines.push(`## Reflective Governance Insights`)
  lines.push(``)
  lines.push(`Generated from governance engine replay over the augmented event log.`)
  lines.push(``)

  const critical = insights.filter(i => i.severity === 'critical')
  const concerns = insights.filter(i => i.severity === 'concern')
  const info     = insights.filter(i => i.severity === 'info')

  if (critical.length > 0) {
    lines.push(`### Critical findings`)
    lines.push(``)
    for (const insight of critical) {
      lines.push(`#### ${severityEmoji(insight.severity)} ${insight.title}`)
      lines.push(``)
      lines.push(insight.explanation)
      lines.push(``)
      lines.push(`**Governance implication:** ${insight.governanceImplication}`)
      lines.push(``)
      if (insight.suggestedIntervention) {
        lines.push(`**Suggested intervention:** ${insight.suggestedIntervention}`)
        lines.push(``)
      }
      if (insight.affectedConcepts?.length > 0) {
        lines.push(`_Affected concepts: ${insight.affectedConcepts.join(', ')}_`)
        lines.push(``)
      }
    }
  }

  if (concerns.length > 0) {
    lines.push(`### Concerns`)
    lines.push(``)
    for (const insight of concerns) {
      lines.push(`#### ${severityEmoji(insight.severity)} ${insight.title}`)
      lines.push(``)
      lines.push(insight.explanation)
      lines.push(``)
      lines.push(`**Governance implication:** ${insight.governanceImplication}`)
      lines.push(``)
      if (insight.suggestedIntervention) {
        lines.push(`**Suggested intervention:** ${insight.suggestedIntervention}`)
        lines.push(``)
      }
    }
  }

  if (info.length > 0) {
    lines.push(`### Informational`)
    lines.push(``)
    for (const insight of info) {
      lines.push(`#### ${severityEmoji(insight.severity)} ${insight.title}`)
      lines.push(``)
      lines.push(insight.explanation)
      lines.push(``)
      lines.push(`**Governance implication:** ${insight.governanceImplication}`)
      lines.push(``)
    }
  }

  // ── Learning objectives ──────────────────────────────────────
  lines.push(`## Learning Objectives`)
  lines.push(``)
  lines.push(`After completing this scenario, participants should be able to:`)
  lines.push(``)
  for (const obj of scenario.learningObjectives) {
    lines.push(`1. ${obj}`)
  }
  lines.push(``)

  // ── Human state summary ──────────────────────────────────────
  const hs = run.governance_state?.human_state
  if (hs) {
    lines.push(`## Human State at End of Scenario`)
    lines.push(``)
    lines.push(`| Dimension | Value |`)
    lines.push(`|-----------|-------|`)
    if (hs.averageFatigue !== undefined)        lines.push(`| Fatigue | ${hs.averageFatigue} / 100 |`)
    if (hs.averageCognitiveLoad !== undefined)  lines.push(`| Cognitive load | ${hs.averageCognitiveLoad} / 100 |`)
    if (hs.alertFatigue !== undefined)          lines.push(`| Alert fatigue | ${hs.alertFatigue} / 100 |`)
    if (hs.moraleScore !== undefined)           lines.push(`| Morale | ${hs.moraleScore} / 100 |`)
    if (hs.reviewCapacity !== undefined)        lines.push(`| Review capacity | ${hs.reviewCapacity} / 100 |`)
    if (hs.escalationWillingness !== undefined) lines.push(`| Escalation willingness | ${hs.escalationWillingness} / 100 |`)
    lines.push(``)
    lines.push(`_Human state is not a performance verdict. It is the institutional cost of operating_`)
    lines.push(`_under the conditions this scenario created._`)
    lines.push(``)
  }

  // ── Expert feedback (if captured) ───────────────────────────
  const fb = run.expert_feedback
  if (fb && (fb.scenarioRealism || fb.missingFactors || fb.strongestInsight)) {
    lines.push(`## Expert feedback`)
    lines.push(``)
    if (fb.professionalRole) {
      lines.push(`**Reviewer:** ${fb.professionalRole}`)
      lines.push(``)
    }
    const stars = (n?: number) => n ? '★'.repeat(n) + '☆'.repeat(5 - n) : '—'
    lines.push(`| Dimension | Rating |`)
    lines.push(`|-----------|--------|`)
    lines.push(`| Scenario realism       | ${stars(fb.scenarioRealism)} |`)
    lines.push(`| Variable accuracy      | ${stars(fb.variableAccuracy)} |`)
    lines.push(`| Insight usefulness     | ${stars(fb.insightUsefulness)} |`)
    lines.push(`| Escalation realism     | ${stars(fb.escalationRealism)} |`)
    lines.push(``)
    if (fb.wouldUseForTraining) {
      lines.push(`**Would use for training:** ${fb.wouldUseForTraining}`)
      lines.push(``)
    }
    if (fb.strongestInsight) {
      lines.push(`**Strongest insight:** ${fb.strongestInsight}`)
      lines.push(``)
    }
    if (fb.missingFactors) {
      lines.push(`**Missing factors:** ${fb.missingFactors}`)
      lines.push(``)
    }
    if (fb.additionalNotes) {
      lines.push(`**Additional notes:** ${fb.additionalNotes}`)
      lines.push(``)
    }
    lines.push(`---`)
    lines.push(``)
  }

  // ── Footer ──────────────────────────────────────────────────
  lines.push(`---`)
  lines.push(``)
  lines.push(`_Generated by Institutional Mirror v2 · ${formatDate(run.timestamp)}_`)
  lines.push(``)
  lines.push(DISCLAIMER)
  lines.push(``)

  return lines.join('\n')
}

// ── Committee Briefing (short format) ────────────────────────────────────────

export function generateCommitteeBriefing(run: ScenarioRunSnapshot): string {
  const { scenario, five_signals: signals, reflective_insights: insights } = run

  const critical = insights.filter(i => i.severity === 'critical')
  const concerns = insights.filter(i => i.severity === 'concern')

  const lines: string[] = []

  lines.push(`# Governance Committee Briefing`)
  lines.push(``)
  lines.push(`**Scenario:** ${scenario.name}`)
  lines.push(`**Date:** ${formatDate(run.timestamp)}`)
  lines.push(``)
  lines.push(DISCLAIMER)
  lines.push(``)
  lines.push(`---`)
  lines.push(``)
  lines.push(`## Summary`)
  lines.push(``)
  lines.push(`This governance stress-test simulated: ${scenario.description}`)
  lines.push(``)

  // Signal dashboard
  lines.push(`## Signal Dashboard`)
  lines.push(``)
  const signalSummary = [
    { key: 'PSS', label: 'Patient safety',       value: signals.PSS.value, kind: 'score' as const },
    { key: 'PES', label: 'Patient experience',   value: signals.PES.value, kind: 'score' as const },
    { key: 'SSS', label: 'Staff stress',         value: signals.SSS.value, kind: 'score' as const },
    { key: 'EIC', label: 'Ethics interventions', value: signals.EIC.value, kind: 'count' as const },
    { key: 'STI', label: 'System throughput',    value: signals.STI.value, kind: 'score' as const },
  ]

  for (const s of signalSummary) {
    if (s.kind === 'count') {
      // EIC: a count, never good/bad (RULE-M4); zero in a high-acuity run is the warning.
      lines.push(`⚪ **${s.label}:** ${s.value} interventions (count)`)
    } else {
      const status = signalStatus(s.value, true) // higher = the value was better honoured
      const mark = status === 'critical' ? '🔴' : status === 'degraded' ? '🟡' : '✅'
      lines.push(`${mark} **${s.label}:** ${s.value}/100 (${status})`)
    }
  }
  lines.push(``)

  if (critical.length > 0) {
    lines.push(`## Critical Findings Requiring Committee Action`)
    lines.push(``)
    for (const insight of critical) {
      lines.push(`### ${insight.title}`)
      lines.push(``)
      lines.push(insight.explanation)
      lines.push(``)
      lines.push(`> **Governance implication:** ${insight.governanceImplication}`)
      lines.push(``)
      if (insight.suggestedIntervention) {
        lines.push(`> **Recommended action:** ${insight.suggestedIntervention}`)
        lines.push(``)
      }
    }
  }

  if (concerns.length > 0) {
    lines.push(`## Concerns for Review`)
    lines.push(``)
    for (const insight of concerns) {
      lines.push(`- **${insight.title}**: ${insight.explanation}`)
    }
    lines.push(``)
  }

  lines.push(`## Discussion Questions`)
  lines.push(``)
  lines.push(`1. Which of these findings would appear in a standard clinical audit — and which would not?`)
  lines.push(`2. Does our institution have a named process for addressing the governance gaps this scenario exposed?`)
  lines.push(`3. What is the real-world equivalent of the governance failures surfaced here?`)
  lines.push(``)
  lines.push(`---`)
  lines.push(`_For full scenario analysis, see the Governance Stress-Test Report._`)
  lines.push(``)
  lines.push(DISCLAIMER)

  return lines.join('\n')
}

// ── Ethical Debt Report ───────────────────────────────────────────────────────

export function generateEthicalDebtReport(run: ScenarioRunSnapshot): string {
  const { scenario, five_signals: signals, reflective_insights: insights } = run

  const debtInsights = insights.filter(i =>
    i.type === 'trust_debt' || i.affectedConcepts?.includes('ethical_debt')
  )

  const lines: string[] = []

  lines.push(`# Ethical Debt Report`)
  lines.push(``)
  lines.push(`**Scenario:** ${scenario.name}`)
  lines.push(`**Date:** ${formatDate(run.timestamp)}`)
  lines.push(``)
  lines.push(DISCLAIMER)
  lines.push(``)
  lines.push(`---`)
  lines.push(``)
  lines.push(`## What is ethical debt?`)
  lines.push(``)
  lines.push(`Ethical debt is the accumulated cost of operating under constraint without resolving the`)
  lines.push(`underlying tension. It is not blame. It is the institutional cost of not having better`)
  lines.push(`systems, better resourcing, or better governance processes. It demands institutional`)
  lines.push(`action, not individual punishment.`)
  lines.push(``)
  lines.push(`## Ethics Intervention Count`)
  lines.push(``)
  lines.push(`**EIC: ${signals.EIC.value} interventions** (a count, not a score)`)
  lines.push(``)
  lines.push(`A higher count means the governance layer was actively engaged — it is **not** a penalty. A zero in a high-acuity run is the warning sign, not a success (RULE-M4).`)
  lines.push(``)
  lines.push(signals.EIC.explanation)
  lines.push(``)

  if (debtInsights.length > 0) {
    lines.push(`## Debt-generating findings`)
    lines.push(``)
    for (const insight of debtInsights) {
      lines.push(`### ${severityEmoji(insight.severity)} ${insight.title}`)
      lines.push(``)
      lines.push(insight.explanation)
      lines.push(``)
      lines.push(`**Governance implication:** ${insight.governanceImplication}`)
      if (insight.suggestedIntervention) {
        lines.push(``)
        lines.push(`**To reduce this debt:** ${insight.suggestedIntervention}`)
      }
      lines.push(``)
    }
  }

  lines.push(`## Debt reduction pathway`)
  lines.push(``)
  lines.push(`Ethical debt accrued in this scenario can be reduced through:`)
  lines.push(``)
  lines.push(`1. Conducting a fairness audit of decisions affecting vulnerable groups`)
  lines.push(`2. Documenting all AI-generated clinical content with review justification`)
  lines.push(`3. Convening a frontline participation session to surface hidden concerns`)
  lines.push(`4. Escalating the highest-severity findings to the governance committee`)
  lines.push(``)
  lines.push(`---`)
  lines.push(``)
  lines.push(DISCLAIMER)

  return lines.join('\n')
}

// ── Filename helpers ──────────────────────────────────────────────────────────

export function getReportFilename(run: ScenarioRunSnapshot, type: ReportType): string {
  const date = run.timestamp.slice(0, 10)
  const slug = run.scenario.id.slice(0, 20)
  const id   = run.run_id.slice(0, 8)
  const ext  = type === 'raw_json' ? 'json' : 'md'
  return `im2-${type.replace(/_/g, '-')}-${slug}-${date}-${id}.${ext}`
}

// ── Dispatch ──────────────────────────────────────────────────────────────────

export function generateReport(run: ScenarioRunSnapshot, type: ReportType): string {
  switch (type) {
    case 'governance_stress_test': return generateGovernanceStressTestReport(run)
    case 'committee_briefing':     return generateCommitteeBriefing(run)
    case 'ethical_debt':           return generateEthicalDebtReport(run)
    case 'accountability_trace':
      return generateCommitteeBriefing(run)  // stub — Phase 6 will extend
    case 'raw_json':
      return JSON.stringify(run, null, 2)
    default:
      return generateGovernanceStressTestReport(run)
  }
}
