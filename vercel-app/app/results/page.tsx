'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MetricCard from '@/components/MetricCard'
import SeverityBadge from '@/components/SeverityBadge'
import Disclaimer from '@/components/Disclaimer'
import HospitalFloor from '@/components/HospitalFloor'
import InstitutionalVitalSigns, { type FiveSignals, type GovernanceStateSnapshot } from '@/components/InstitutionalVitalSigns'
import ReflectiveInsightFeed, { type ReflectiveInsight } from '@/components/ReflectiveInsightFeed'
import InstitutionalMap from '@/components/InstitutionalMap'
import AssumptionsPanel from '@/components/AssumptionsPanel'
import ExpertFeedbackForm from '@/components/ExpertFeedbackForm'

// InstitutionalMap eventLog prop type (inline, not exported from component)
type MapEventEntry = { event_type: string; timestamp: number; payload: Record<string, unknown> }
import { isResultsPayload } from '@/lib/domain/saved-run'
import {
  SESSION_KEY, CAPACITY_KEY,
  type SimulationReport, type PatientProfile, type CapacityConfig,
} from '@/lib/types'

// ── Scenario run extension types (mirrors route.ts response shape) ─────────────

interface ScenarioRunBlock {
  scenario: { id: string; name: string; packId: string; durationTicks: number; stressorCount?: number }
  run_id: string
  seed: number
  timestamp: string
  base_event_count: number
  injected_event_count: number
  governance_state: {
    trust: unknown
    hidden_strain: unknown
    ethical_debt: unknown
    governance_drift: unknown
    automation_drift: unknown
    human_state: GovernanceStateSnapshot['human_state']
  }
  five_signals: {
    PSS: { value: number; delta: number; explanation: string }
    PES: { value: number; delta: number; explanation: string }
    SSS: { value: number; delta: number; explanation: string }
    EIC: { value: number; delta: number; explanation: string }
    STI: { value: number; delta: number; explanation: string }
  }
  governance_timeline: unknown[]
  reflective_insights: ReflectiveInsight[]
  governance_pair?: {
    advisor: {
      audited: boolean
      instruments: string[]
      pillars: string[]
      gaps: string[]
      plan: string[]
      engine: string
    }
    audited_steps: Array<{
      step: number
      action: string
      tier: string
      verify: string
      equilibrium: boolean
    }>
  }
}

type SimulationReportV2 = SimulationReport & { scenario_run?: ScenarioRunBlock; _sample?: boolean }

export default function ResultsScreen() {
  const router = useRouter()
  const [report, setReport]               = useState<SimulationReportV2 | null>(null)
  const [patientProfiles, setPatientProfiles] = useState<Record<string, PatientProfile> | undefined>(undefined)
  const [capacity, setCapacity]           = useState<CapacityConfig | null>(null)
  const [contextLabel, setContextLabel]   = useState<string | null>(null)

  // ── Read optional governance context (set on home page) ───────────────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('im_survey')
      if (!raw) return
      const c = JSON.parse(raw) as { role?: string; institutionType?: string }
      const ROLE: Record<string, string> = {
        ethics: 'Ethics & Governance Lead', qi: 'Quality & Patient Safety',
        cmo: 'Clinical Leadership', ceo: 'Administration / Leadership',
        frontline: 'Frontline Clinician', other: 'Reviewer',
      }
      const INST: Record<string, string> = {
        government_tertiary: 'Government tertiary hospital',
        private_multispecialty: 'Private multi-specialty',
        district_hospital: 'District / secondary hospital',
        nursing_home: 'Nursing home', clinic: 'Clinic / day-care', other: '',
      }
      const parts = [c.role ? ROLE[c.role] : null, c.institutionType ? INST[c.institutionType] : null].filter(Boolean)
      if (parts.length) setContextLabel(parts.join(' · '))
    } catch { /* optional */ }
  }, [])

  // ── Load report + capacity from sessionStorage ────────────────────────
  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) { router.replace('/'); return }
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      router.replace('/')
      return
    }
    // Defense for leftover sessionStorage from the old `{ events }` persist.
    // The fix is one saved-run shape, not optional-chaining interpretation.
    if (!isResultsPayload(parsed)) {
      router.replace('/history')
      return
    }
    setReport(parsed as SimulationReportV2)

    // Capacity — prefer value stored by page.tsx (user-set), fall back to report echo
    const capRaw = sessionStorage.getItem(CAPACITY_KEY)
    let cap: CapacityConfig
    try {
      cap = capRaw ? JSON.parse(capRaw) : (parsed.capacity ?? { patients_per_hour: 6, er_capacity: 2, opd_capacity: 4 })
    } catch {
      cap = parsed.capacity ?? { patients_per_hour: 6, er_capacity: 2, opd_capacity: 4 }
    }
    setCapacity(cap)

    // ── Fetch enriched patient profiles via DeepSeek ───────────────────
    const events = parsed.event_log ?? []
    const norm = (t: string) => t.toUpperCase().replace(/[-\s]/g, '_')

    // Collect unique patient IDs from arrival events
    const patientIds: string[] = []
    const seen = new Set<string>()
    for (const ev of events) {
      if (norm(ev.event_type) === 'PATIENT_ARRIVAL') {
        const id = String(ev.payload.patient_id ?? ev.event_id)
        if (!seen.has(id)) { seen.add(id); patientIds.push(id) }
      }
    }

    // Build triage map from triage events
    const triageMap: Record<string, string> = {}
    for (const ev of events) {
      const t = norm(ev.event_type)
      if (t.includes('TRIAGE') || t === 'TRIAGE_DECISION') {
        const id  = String(ev.payload.patient_id ?? '')
        const tri = String(ev.payload.triage ?? '').toUpperCase()
        if (id && (tri === 'RED' || tri === 'YELLOW' || tri === 'BLUE')) {
          triageMap[id] = tri
        }
      }
    }

    if (patientIds.length === 0) return

    fetch('/api/patient-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_ids: patientIds,
        triage_map: triageMap,
        profile: parsed.institutional_profile,
      }),
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        if (data?.profiles) setPatientProfiles(data.profiles)
      })
      .catch(() => { /* profiles optional — floor still works without them */ })
  }, [router])

  if (!report) return null

  const ps  = report.performance_scores
  const mr  = report.moral_reckoning
  const sy  = report.synthesis
  const glp = report.glp_optimal
  const cap = capacity ?? report.capacity
  const sr  = report.scenario_run  // null for custom runs

  // Adapt FiveSignalMetrics (uppercase) → FiveSignals (lowercase numbers)
  const fiveSignals: FiveSignals | null = sr?.five_signals
    ? {
        pss: sr.five_signals.PSS.value,
        pes: sr.five_signals.PES.value,
        sss: sr.five_signals.SSS.value,
        eic: sr.five_signals.EIC.value,
        sti: sr.five_signals.STI.value,
      }
    : null

  // Reflective governance extension (the V2 layer — distinct from the five signals).
  // The map reads trust / strain / debt from HERE, never by misusing the signals
  // (RULE-A2 + the docs-as-types reconciliation, 2026-06-13).
  const govExt = sr?.governance_state as {
    trust?: { overall?: number }
    hidden_strain?: { overall?: number }
    ethical_debt?: { totalDebt?: number }
  } | undefined
  const trustOverall = govExt?.trust?.overall ?? 0
  const strainOverall = govExt?.hidden_strain?.overall ?? 0
  // Normalise total debt to the map's 0–100 staining scale (engine convention: ~500 debt ≈ 100,
  // i.e. totalDebt/5). The map clamps at 100; passing raw total (0–500+) would over-saturate.
  const ethicalDebtScaled = Math.min(100, (govExt?.ethical_debt?.totalDebt ?? 0) / 5)

  const govState: GovernanceStateSnapshot | null = sr?.governance_state?.human_state
    ? { human_state: sr.governance_state.human_state }
    : null

  return (
    <main className="max-w-6xl mx-auto px-6 py-14">
      {/* ── Sample banner ─────────────────────────────────────────── */}
      {report._sample && (
        <div className="mb-6 border border-sky-200/60 bg-sky-50/30 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-sky-600 uppercase tracking-widest mb-0.5">Sample report</p>
            <p className="text-sm text-slate-700">
              This is a pre-computed example run, shown so you can read the output before running your own.
              Every number below comes from a real deterministic scenario.
            </p>
          </div>
          <button
            onClick={() => router.push('/home')}
            className="shrink-0 text-xs font-medium text-sky-700 border border-sky-700 hover:bg-sky-900/40 px-3 py-1.5 rounded transition-colors"
          >
            Run your own →
          </button>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="mb-10">
        {contextLabel && (
          <p className="text-xs text-slate-600 mb-3 inline-flex items-center gap-2 border border-slate-200 bg-white/40 rounded px-3 py-1.5">
            <span className="font-mono text-slate-600 uppercase tracking-widest">Reviewing as</span>
            {contextLabel}
          </p>
        )}
        {sr ? (
          <>
            <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">
              Governance scenario · {sr.scenario.packId} · seed {sr.seed} · {sr.timestamp.slice(0, 10)}
            </p>
            <h1 className="text-5xl font-light text-slate-900 tracking-tight mb-4">
              {sr.scenario.name}
            </h1>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>{sr.base_event_count} organic events</span>
              <span>+</span>
              <span className="text-slate-600">{sr.injected_event_count} injected stressors</span>
              <span>·</span>
              <span>run {sr.run_id.slice(0, 8)}</span>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">
              {report.institutional_profile} · seed {report.seed} · {report.timestamp.slice(0, 10)}
            </p>
            <h1 className="text-5xl font-light text-slate-900 tracking-tight mb-4">
              What did this cost us?
            </h1>
            <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
              {ps.interpretation}
            </p>
          </>
        )}
      </header>

      {sr?.governance_pair && (
        <section className="border border-slate-200 rounded-lg p-5 mb-10 bg-white">
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-2">
            HRM pair · Advisor then Auditor
          </p>
          <p className="text-sm text-slate-700 mb-3">
            {sr.governance_pair.advisor.audited
              ? 'Audited. Each plan step was classified by the Auditor. Knowledge layer only.'
              : 'Advisor plan was not audited. Do not treat this as a governed run.'}
          </p>
          <p className="text-xs text-slate-600 mb-2">
            Instruments: {sr.governance_pair.advisor.instruments.join(' · ') || 'none selected'}
          </p>
          <p className="text-xs text-slate-600 mb-4">
            Pillars {sr.governance_pair.advisor.pillars.join(', ') || 'none'}
            {' · '}
            Gaps {sr.governance_pair.advisor.gaps.join(', ') || 'none'}
          </p>
          <ol className="space-y-2">
            {sr.governance_pair.audited_steps.map((step) => (
              <li key={step.step} className="text-xs text-slate-700 font-mono leading-relaxed">
                {step.step}. [{step.tier}] {step.action}
                <span className="block text-slate-500 font-sans mt-0.5">{step.verify}</span>
              </li>
            ))}
          </ol>
          <p className="text-[10px] text-slate-500 mt-4">
            PIB is not gazette. NHRP 4.6.4.1 is a DHR draft SHALL, not a funded centre.
            BODH is a voluntary SAHI/PIB benchmark, not a gate. Axis scores are not in these signals.
          </p>
        </section>
      )}

      {/* ── Command Center — scenario runs only ───────────────────── */}
      {sr && fiveSignals && (
        <div className="mb-14 space-y-10">
          {/* Ontological disclaimer — hard gate invariant */}
          <div className="border border-slate-200/60 rounded p-3 bg-slate-50/60">
            <p className="text-[10px] font-mono text-slate-600 text-center tracking-wider">
              This is a scenario-based governance simulation. It does not predict reality.
            </p>
          </div>

          <InstitutionalVitalSigns
            signals={fiveSignals}
            governanceState={govState ?? undefined}
            scenarioName={sr.scenario.name}
            runId={sr.run_id}
          />

          <InstitutionalMap
            eventLog={report.event_log as MapEventEntry[] | undefined}
            trustLevel={trustOverall}
            ethicalDebtTotal={ethicalDebtScaled}
            hiddenStrain={strainOverall}
          />

          <ReflectiveInsightFeed
            insights={sr.reflective_insights}
            scenarioName={sr.scenario.name}
          />

          {/* ── Governance timeline (sparkline) ──────────────────── */}
          {Array.isArray(sr.governance_timeline) && sr.governance_timeline.length > 1 && (
            <GovernanceTimeline timeline={sr.governance_timeline as GovernanceTimelinePoint[]} />
          )}

          {/* Divider before v1 content */}
          <div className="border-t border-slate-200 pt-6">
            <p className="text-xs font-mono text-slate-600 tracking-widest uppercase">
              Patient flow detail — v1 analysis
            </p>
          </div>
        </div>
      )}

      {/* ── Patient Flow Replay — CENTERPIECE ────────────────────── */}
      <section className="mb-14">
        <div className="mb-5">
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-2">
            Patient flow replay
          </p>
          <h2 className="text-2xl font-light text-slate-900 tracking-tight mb-2">
            Watch what happened, tick by tick.
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Every dot is a patient. Colour is triage urgency. Pulsing rings are ethical events —
            refusals, harm classifications, value conflicts. The numbers below are summaries of what
            you&apos;re watching here.
          </p>
        </div>
        <HospitalFloor
          report={report}
          patientProfiles={patientProfiles}
          erCapacity={cap?.er_capacity}
          opdCapacity={cap?.opd_capacity}
          patientsPerHour={cap?.patients_per_hour}
        />
      </section>

      {/* ── Reflective State: Phase 1 Substrate ─────────────────── */}
      <ReflectiveStatePanel report={report} />

      {/* ── Cost Accounting ───────────────────────────────────────── */}
      <section className="border border-amber-200/60 bg-amber-50/20 rounded-lg p-6 mb-10">
        <p className="text-xs font-mono text-amber-500 tracking-widest uppercase mb-4">
          What did this cost us, and why?
        </p>
        <p className="text-xs text-amber-700 mb-4 leading-relaxed">
          These figures are observations from a simulation, not a performance grade.
          They are a starting point for internal review — their value depends entirely
          on what your institution does with them.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <CostItem label="Ethical debt" value={sy.cost_accounting.ethical_debt.toFixed(0)} unit="units" />
          <CostItem label="Forced harms" value={String(sy.cost_accounting.forced_harms)} />
          <CostItem label="Avoidable harms" value={String(sy.cost_accounting.avoidable_harms)} />
          <CostItem label="Avg value drift" value={sy.cost_accounting.value_drift_average.toFixed(2)} />
          <CostItem label="Max value drift" value={sy.cost_accounting.value_drift_maximum.toFixed(2)} />
          <CostItem label="Active tensions" value={String(sy.cost_accounting.active_tensions)} />
        </div>
      </section>

      {/* ── Five Performance Metrics ──────────────────────────────── */}
      <section className="mb-10">
        <SectionHeading>Performance metrics</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetricCard
            abbrev="PSS"
            fullName="Patient Safety Score"
            value={ps.patient_safety_score}
            unit="/ 100"
            description="Measures how consistently safe care was delivered across all patients in this run."
            expandedNote="PSS captures harm avoidance, correct triage sequencing, and absence of safety-compromising shortcuts. A lower score under high load often signals a structural capacity problem, not a staffing failure."
          />
          <MetricCard
            abbrev="PES"
            fullName="Patient Experience Score"
            value={ps.patient_experience_score}
            unit="/ 100"
            description="Reflects waiting times, communication quality, and dignity preserved throughout care."
            expandedNote="PES degrades when corridor waits become invisible to the system — the visibility paradox. Patients who are 'handled' without dignity interaction are not registered as experiencing poor care until a complaint surfaces."
          />
          <MetricCard
            abbrev="SSS"
            fullName="Staff Stress Score"
            value={ps.staff_stress_score}
            unit="/ 100"
            description="Tracks cumulative cognitive and moral load on clinical staff across the simulation."
            expandedNote="Sustained moral injury — being forced to make decisions that violate one's own values — compounds over time. SSS below 50 correlates with higher refusal rates in subsequent ticks as staff disengage from difficult calls. This is a leading indicator, not a lagging one."
          />
          <MetricCard
            abbrev="EIC"
            fullName="Ethics Intervention Count"
            value={ps.ethics_intervention_count}
            isCount
            description="Number of times the system triggered an ethical override or deferred to human judgement."
            expandedNote="EIC is not a penalty. A higher count means the governance layer was active and escalating correctly. Zero EIC in a high-acuity run may indicate the moral reckoning layer was suppressed — or that the institution has normalised harms that should still be flagged."
          />
          <MetricCard
            abbrev="STI"
            fullName="System Throughput Index"
            value={ps.system_throughput_index}
            unit="/ 100"
            description="Measures how efficiently the emergency department processed patient volume."
            expandedNote="STI above 70 is operationally healthy. When STI is high and PES/PSS are low, it usually means throughput was purchased through care shortcuts. This trade-off should be named explicitly in governance reporting."
          />
        </div>
      </section>

      {/* ── Synthesis Insights ───────────────────────────────────── */}
      <section className="mb-10">
        <SectionHeading>What the simulation observed</SectionHeading>
        <div className="space-y-3">
          {sy.insights.map((insight, i) => (
            <div key={i} className="border border-slate-200 rounded-lg p-4 bg-white">
              <div className="flex items-start gap-3">
                <SeverityBadge severity={insight.severity} />
                <p className="text-sm text-slate-700 leading-relaxed">{insight.message}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Critical Question ────────────────────────────────────── */}
      <section className="mb-10 border-l-2 border-amber-700 pl-5">
        <p className="text-xs font-mono text-amber-500 tracking-widest uppercase mb-2">
          For governance review
        </p>
        <p className="text-base text-slate-800 leading-relaxed italic">
          &ldquo;{sy.critical_question}&rdquo;
        </p>
      </section>

      {/* ── Moral Reckoning: Value Drift ─────────────────────────── */}
      <section className="mb-10">
        <SectionHeading>Value drift</SectionHeading>
        <p className="text-xs text-slate-500 mb-4">
          How far did actual institutional behaviour drift from declared values under pressure?
          Value drift is a structural signal — it reflects resourcing and protocol, not individuals.
          These figures are observations, not verdicts.
        </p>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-widest">Value</th>
                <th className="px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-widest">Declared weight</th>
                <th className="px-4 py-3 text-xs font-mono text-slate-500 uppercase tracking-widest">Drift</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(mr.declared_values).map(([val, weight]) => {
                const driftKey = `${val}_drift`
                const drift = (mr.value_drift as Record<string, number | string>)[driftKey]
                const driftNum = typeof drift === 'number' ? drift : null
                const isPrimary = mr.value_drift.primary_misalignment === val
                return (
                  <tr key={val} className="border-b border-slate-900 last:border-0">
                    <td className="px-4 py-3 text-slate-800 capitalize">
                      {val}{isPrimary && <span className="ml-2 text-xs text-amber-500">primary drift</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 tabular-nums">{(weight as number).toFixed(2)}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {driftNum !== null ? (
                        <span className={driftNum > 0.3 ? 'text-red-400' : driftNum > 0.15 ? 'text-amber-400' : 'text-slate-600'}>
                          {driftNum.toFixed(2)}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-3 leading-relaxed">{mr.value_drift.interpretation}</p>
      </section>

      {/* ── Ethical Debt ─────────────────────────────────────────── */}
      <section className="mb-10">
        <SectionHeading>Ethical debt</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-4xl font-light text-slate-900 tabular-nums mb-1">
              {mr.ethical_debt.current_debt.toFixed(0)}
            </p>
            <p className="text-xs text-slate-500">units accrued this run</p>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed">{mr.ethical_debt.interpretation}</p>
          </div>
          <div className="space-y-2">
            {Object.entries(mr.ethical_debt.category_breakdown).map(([cat, val]) => (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span className="text-slate-600 capitalize">{cat.replace(/_/g, ' ')}</span>
                <span className="text-slate-700 tabular-nums">{(val as number).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Harm Classification ──────────────────────────────────── */}
      <section className="mb-10">
        <SectionHeading>Harm classification</SectionHeading>
        <p className="text-xs text-slate-500 mb-4">
          Forced harms had no feasible alternative given actual capacity — they are structural signals.
          Avoidable harms are instances where alternatives existed; only these are within governance reach.
        </p>
        <div className="flex gap-6 mb-5 text-sm">
          <span className="text-slate-600">
            Total: <span className="text-slate-900 font-medium">{mr.harm_classifications.summary.total_harms_classified}</span>
          </span>
          <span className="text-red-400">
            Forced (capacity-constrained): <span className="font-medium">{mr.harm_classifications.summary.forced_count}</span>
          </span>
          <span className="text-amber-400">
            Avoidable (alternatives existed): <span className="font-medium">{mr.harm_classifications.summary.avoidable_count}</span>
          </span>
        </div>
        <div className="space-y-2">
          {mr.harm_classifications.details.map((h, i) => (
            <div key={i} className="border border-slate-200 rounded p-3 bg-white">
              <div className="flex items-start justify-between gap-3 mb-1">
                <span className="text-xs font-mono text-slate-600 capitalize">{h.harm_type.replace(/_/g, ' ')}</span>
                {h.tick !== undefined && <span className="text-xs text-slate-600">tick {h.tick}</span>}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{h.justification}</p>
              {h.avoidable_with && (
                <p className="text-xs text-amber-500 mt-1">Avoidable with: {h.avoidable_with}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Refusals ─────────────────────────────────────────────── */}
      <section className="mb-10">
        <SectionHeading>Escalations to human oversight</SectionHeading>
        <p className="text-xs text-slate-500 mb-4">
          Decisions the system declined to make autonomously and escalated to human oversight.
          Each escalation is a governance signal, not a failure — the system recognised the limits
          of its own competence. A zero count in a high-acuity run is the warning sign.
        </p>
        <div className="space-y-2">
          {mr.refusals.details.map((r, i) => (
            <div key={i} className="border border-slate-200 rounded p-3 bg-white">
              <div className="flex items-start justify-between gap-3 mb-1">
                <span className="text-xs font-mono text-slate-600 capitalize">{r.reason.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-2">
                  {r.requires_human && (
                    <span className="text-xs text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded">
                      human required
                    </span>
                  )}
                  {r.tick !== undefined && <span className="text-xs text-slate-600">tick {r.tick}</span>}
                </div>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{r.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Unavoidable Harm Summary ─────────────────────────────── */}
      <section className="mb-10">
        <SectionHeading>Capacity-constrained harm summary</SectionHeading>
        {mr.unavoidable_harm_summary.summary && (
          <p className="text-sm text-slate-700 leading-relaxed mb-5">{mr.unavoidable_harm_summary.summary}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <NamedList title="Harms that occurred" items={mr.unavoidable_harm_summary.harms_that_occurred} />
          <NamedList title="Values not honored" items={mr.unavoidable_harm_summary.values_not_honored} accent="amber" />
          <NamedList title="Trade-offs unresolved" items={mr.unavoidable_harm_summary.trade_offs_unresolved} accent="red" />
        </div>
      </section>

      {/* ── GLP Optimal Panel ────────────────────────────────────── */}
      <section className="mb-10">
        <SectionHeading>Goal linear programming — optimal vs actual</SectionHeading>
        {glp.status === 'optimal' ? (
          <GlpPanel glp={glp} />
        ) : (
          <div className="border border-slate-200 rounded-lg p-5 bg-white text-sm text-slate-600">
            <p className="text-slate-700 mb-2 font-medium">GLP panel unavailable</p>
            <p className="leading-relaxed">{glp.placeholder ?? glp.reason}</p>
          </div>
        )}
      </section>

      {/* ── Recommendation ───────────────────────────────────────── */}
      <section className="mb-10 bg-white border border-slate-200 rounded-lg p-6">
        <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">
          Simulation recommendation
        </p>
        <p className="text-sm text-slate-800 leading-relaxed">{sy.recommendation}</p>
      </section>

      {/* ── Governance Action Questions ──────────────────────────── */}
      <section className="mb-10">
        <SectionHeading>Governance action questions</SectionHeading>
        <p className="text-xs text-slate-500 mb-5">
          These questions are generated from simulation observations. They are prompts for
          institutional reflection, not verdicts. The answers require human judgement.
        </p>
        <GovernanceQuestions report={report} />
      </section>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <div className="flex gap-3 mb-12 flex-wrap">
        {sr && (
          <button
            onClick={() => router.push('/governance')}
            className="flex-1 bg-slate-50 text-slate-950 font-medium py-3 rounded-lg hover:bg-white transition-colors text-sm"
          >
            Governance Console →
          </button>
        )}
        <button
          onClick={() => router.push('/report')}
          className={`flex-1 ${sr ? 'border border-slate-300 text-slate-800 hover:bg-slate-100' : 'bg-slate-50 text-slate-950 hover:bg-white'} font-medium py-3 rounded-lg transition-colors text-sm`}
        >
          Role-specific report →
        </button>
        <button
          onClick={() => router.push('/inspector')}
          className="flex-1 border border-slate-300 text-slate-800 py-3 rounded-lg hover:bg-slate-100 transition-colors text-sm"
        >
          Decision Inspector →
        </button>
        <button
          onClick={() => router.push('/export')}
          className="border border-slate-300 text-slate-700 px-5 py-3 rounded-lg hover:bg-slate-100 transition-colors text-sm"
        >
          Export →
        </button>
        <button
          onClick={() => router.replace('/')}
          className="border border-slate-200 text-slate-500 px-5 py-3 rounded-lg hover:text-slate-700 hover:border-slate-300 transition-colors text-sm"
        >
          New simulation
        </button>
      </div>

      {/* ── Expert feedback ──────────────────────────────────────── */}
      <div className="mb-6">
        <ExpertFeedbackForm
          scenarioId={sr?.scenario?.id}
          runId={sr?.run_id ?? report.run_id}
        />
      </div>

      {/* ── Model assumptions ────────────────────────────────────── */}
      <div className="mb-8">
        <AssumptionsPanel />
      </div>

      <Disclaimer />
    </main>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-4">
      {children}
    </h2>
  )
}

function CostItem({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <p className="text-2xl font-light text-slate-900 tabular-nums">
        {value}{unit && <span className="text-sm text-slate-600 ml-1">{unit}</span>}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

function ReflectiveStatePanel({ report }: { report: SimulationReport }) {
  const rs = report.reflective_state
  if (!rs || rs.status === 'unavailable') {
    return null
  }

  const trust = rs.trust_state
  const strain = rs.hidden_strain_state
  const gov = rs.governance_state
  const operational = rs.operational_state

  if (!trust || !strain || !gov || !operational) {
    return null
  }

  const observations = (rs.observations ?? []).slice(0, 3)

  return (
    <section className="mb-10 border border-blue-200/50 bg-blue-50/10 rounded-lg p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-xs font-mono text-blue-600 tracking-widest uppercase mb-2">
            Institutional state
          </p>
          <h2 className="text-2xl font-light text-slate-900 tracking-tight">
            Trust, strain, and governance under pressure.
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-600 shrink-0">
          tick {rs.tick ?? operational.current_tick}
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-5 max-w-3xl leading-relaxed">
        This is the Phase 1 reflective substrate: a read-only interpretation of the same event log.
        It does not change the simulation result. It shows whether the institution remained reliable,
        whether invisible pressure accumulated, and whether governance pathways held up.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <StateVital
          label="Operational Trust"
          value={trust.institutional_trust}
          detail={`${Math.round(trust.escalation_willingness * 100)}% escalation willingness`}
          goodHigh
        />
        <StateVital
          label="Hidden Strain"
          value={strain.delayed_failure_risk}
          detail={`${Math.round(strain.silent_overload * 100)}% silent overload`}
        />
        <StateVital
          label="Governance Drift"
          value={gov.governance_drift}
          detail={`${operational.escalation_queue_depth} unresolved escalations`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <StateDetail
          title="Trust effects"
          rows={[
            ['Compliance probability', trust.compliance_probability],
            ['Abandonment risk', trust.patient_abandonment_risk],
            ['Workflow bypass risk', trust.workflow_bypass_probability],
          ]}
        />
        <StateDetail
          title="Hidden strain"
          rows={[
            ['Latent stress', strain.latent_stress],
            ['Normalized dysfunction', strain.normalized_dysfunction],
            ['Fatigue memory', strain.fatigue_memory],
          ]}
        />
        <StateDetail
          title="Governance"
          rows={[
            ['Policy adherence', gov.policy_adherence],
            ['Escalation congestion', gov.escalation_congestion],
            ['Trace completeness', gov.accountability_trace_completeness],
          ]}
          goodHighRows={['Policy adherence', 'Trace completeness']}
        />
      </div>

      {observations.length > 0 && (
        <div className="mt-5 border-t border-blue-200/40 pt-4 space-y-3">
          {observations.map((obs, i) => (
            <div key={`${obs.type}-${i}`} className="flex items-start gap-3">
              <SeverityBadge severity={normalizeSeverity(obs.severity)} />
              <div>
                <p className="text-sm text-slate-700 leading-relaxed">{obs.message}</p>
                {obs.governance_implication && (
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {obs.governance_implication}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function StateVital({
  label, value, detail, goodHigh = false,
}: {
  label: string
  value: number
  detail: string
  goodHigh?: boolean
}) {
  const pct = Math.round(value * 100)
  const color = goodHigh
    ? pct >= 70 ? 'text-emerald-400' : pct >= 45 ? 'text-amber-400' : 'text-red-400'
    : pct >= 65 ? 'text-red-400' : pct >= 35 ? 'text-amber-400' : 'text-emerald-400'
  return (
    <div className="bg-slate-50/60 border border-slate-200 rounded-lg p-4">
      <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-4xl font-light tabular-nums ${color}`}>{pct}%</p>
      <p className="text-xs text-slate-500 mt-2">{detail}</p>
      <div className="h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
        <div className={`h-full ${color.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StateDetail({
  title, rows, goodHighRows = [],
}: {
  title: string
  rows: Array<[string, number]>
  goodHighRows?: string[]
}) {
  return (
    <div className="bg-slate-50/40 border border-slate-200 rounded-lg p-4">
      <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">{title}</p>
      <div className="space-y-2">
        {rows.map(([label, value]) => {
          const pct = Math.round(value * 100)
          const goodHigh = goodHighRows.includes(label)
          const color = goodHigh
            ? pct >= 70 ? 'text-emerald-400' : pct >= 45 ? 'text-amber-400' : 'text-red-400'
            : pct >= 65 ? 'text-red-400' : pct >= 35 ? 'text-amber-400' : 'text-slate-600'
          return (
            <div key={label} className="flex items-center justify-between gap-3">
              <span className="text-slate-500">{label}</span>
              <span className={`tabular-nums ${color}`}>{pct}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function normalizeSeverity(severity: string | undefined): 'INFO' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  if (severity === 'CRITICAL') return 'CRITICAL'
  if (severity === 'HIGH') return 'HIGH'
  if (severity === 'MEDIUM') return 'MEDIUM'
  return 'INFO'
}

function NamedList({ title, items, accent }: { title: string; items: string[]; accent?: 'amber' | 'red' }) {
  const color = accent === 'amber' ? 'text-amber-500' : accent === 'red' ? 'text-red-400' : 'text-slate-600'
  return (
    <div>
      <p className={`font-mono tracking-widest uppercase text-xs mb-2 ${color}`}>{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-slate-600 leading-relaxed before:content-['—'] before:mr-2 before:text-slate-700">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function GlpPanel({ glp }: { glp: NonNullable<SimulationReport['glp_optimal']> }) {
  // RULE-A1 / HGR I6: never render glp.objective_value as a grade. Table of d+/d- only.
  if (glp.status !== 'optimal' || !glp.deviations) return null
  return (
    <div className="space-y-4">
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-mono text-slate-500 uppercase tracking-widest">Goal</th>
              <th className="px-4 py-3 text-right text-xs font-mono text-slate-500 uppercase tracking-widest">Target</th>
              <th className="px-4 py-3 text-right text-xs font-mono text-slate-500 uppercase tracking-widest">Actual</th>
              <th className="px-4 py-3 text-right text-xs font-mono text-slate-500 uppercase tracking-widest">Gap</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(glp.deviations).map(([name, row]) => {
              const gap = row.d_minus + row.d_plus
              return (
                <tr key={name} className="border-b border-slate-900 last:border-0">
                  <td className="px-4 py-3 font-mono text-slate-800">{name}</td>
                  <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{row.target.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-slate-600 tabular-nums">{row.actual.toFixed(2)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${gap > 0.2 ? 'text-amber-400' : 'text-slate-500'}`}>
                    {gap > 0.001 ? (row.d_minus > 0 ? `−${row.d_minus.toFixed(2)}` : `+${row.d_plus.toFixed(2)}`) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {glp.forced_deviations && glp.forced_deviations.length > 0 && (
        <div>
          <p className="text-xs font-mono text-red-500 tracking-widest uppercase mb-2">Forced deviations</p>
          <ul className="space-y-1 text-xs text-slate-600">
            {glp.forced_deviations.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      )}
      {glp.avoidable_deviations && glp.avoidable_deviations.length > 0 && (
        <div>
          <p className="text-xs font-mono text-amber-500 tracking-widest uppercase mb-2">Avoidable deviations</p>
          <ul className="space-y-1 text-xs text-slate-600">
            {glp.avoidable_deviations.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      )}
      {glp.eic_note && (
        <p className="text-xs text-slate-500 border-t border-slate-200 pt-3">{glp.eic_note}</p>
      )}
    </div>
  )
}

// ── Governance Timeline ───────────────────────────────────────────────────────

interface GovernanceTimelinePoint {
  tick: number
  trust: number
  hiddenStrain: number
  ethicalDebt: number
  reviewCapacity: number
  escalationWillingness: number
}

function GovernanceTimeline({ timeline }: { timeline: GovernanceTimelinePoint[] }) {
  const ticks = timeline.map(p => p.tick)
  const maxTick = Math.max(...ticks)

  // Normalize a series to 0–100
  const maxDebt = Math.max(...timeline.map(p => p.ethicalDebt), 1)

  const series: Array<{
    key: keyof GovernanceTimelinePoint
    label: string
    color: string
    normalize?: (v: number) => number
    invert?: boolean
  }> = [
    { key: 'trust',                label: 'Trust',               color: '#64748b' },
    { key: 'reviewCapacity',       label: 'Review capacity',     color: '#475569' },
    { key: 'hiddenStrain',         label: 'Hidden strain',       color: '#d97706', invert: true },
    {
      key: 'ethicalDebt',
      label: 'Ethical debt',
      color: '#dc2626',
      normalize: (v) => Math.min(100, (v / maxDebt) * 100),
    },
  ]

  const W = 600
  const H = 80
  const pad = { left: 4, right: 4, top: 4, bottom: 4 }
  const innerW = W - pad.left - pad.right
  const innerH = H - pad.top - pad.bottom

  function toX(tick: number) {
    return pad.left + (tick / maxTick) * innerW
  }

  function toY(value: number) {
    return pad.top + (1 - value / 100) * innerH
  }

  function buildPath(s: typeof series[0]) {
    const points = timeline.map(p => {
      let v = p[s.key] as number
      if (s.normalize) v = s.normalize(v)
      if (s.invert) v = 100 - v
      return `${toX(p.tick).toFixed(1)},${toY(v).toFixed(1)}`
    })
    return `M ${points.join(' L ')}`
  }

  return (
    <div>
      <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-3">
        Governance timeline — {timeline.length} snapshots
      </p>
      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/60 overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minWidth: 240 }}>
          {/* Zero line at y=50% */}
          <line
            x1={pad.left} y1={pad.top + innerH / 2}
            x2={W - pad.right} y2={pad.top + innerH / 2}
            stroke="#1e293b" strokeWidth="1"
          />
          {series.map(s => (
            <path
              key={s.key}
              d={buildPath(s)}
              fill="none"
              stroke={s.color}
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.85}
            />
          ))}
        </svg>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-2">
          {series.map(s => (
            <div key={s.key} className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: s.color }} />
              <span className="text-[10px] font-mono text-slate-600">{s.label}</span>
            </div>
          ))}
          <span className="text-[10px] text-slate-700 ml-auto">tick 0 → {maxTick}</span>
        </div>
      </div>
    </div>
  )
}

function GovernanceQuestions({ report }: { report: SimulationReport }) {
  const mr = report.moral_reckoning
  const sy = report.synthesis

  const questions: string[] = []

  if (mr.value_drift.maximum_drift > 0.3) {
    questions.push(
      `A gap was detected between the institution's declared commitment to "${mr.value_drift.primary_misalignment}" and its observed operational behaviour — drift reached ${mr.value_drift.maximum_drift.toFixed(2)}, the highest in this run. What structural pressure — resourcing, workload, protocol — is driving this gap? This is information for governance review, not attribution of fault.`
    )
  }
  if (sy.cost_accounting.avoidable_harms > 0) {
    questions.push(
      `${sy.cost_accounting.avoidable_harms} of ${sy.cost_accounting.forced_harms + sy.cost_accounting.avoidable_harms} instances were classified as potentially avoidable — meaning alternatives existed. What governance mechanism would have identified these before they accrued? Does that mechanism currently exist?`
    )
  }
  if (mr.refusals.summary.total_refusals > 0) {
    questions.push(
      `The system escalated ${mr.refusals.summary.total_refusals} decision(s) to human oversight rather than acting autonomously. Were human reviewers available and equipped to act on these escalations in the simulation window? What is the real-world equivalent of that capacity?`
    )
  }
  if (sy.cost_accounting.active_tensions > 1) {
    questions.push(
      `${sy.cost_accounting.active_tensions} unresolved structural conflicts were active at end-of-run — trade-offs between institutional values that the simulation could not resolve. Does the institution have a named process for addressing these, or do they accumulate silently?`
    )
  }

  const fallback = [
    'What would it mean to run this simulation again with more staff and fewer beds — and get a worse score?',
    'Which of these harms would appear in a standard audit report, and which would not?',
    'If this simulation ran on real patient data, what would you want the governance board to see first?',
  ]

  const finalQuestions = questions.length > 0 ? questions : fallback

  return (
    <ol className="space-y-4">
      {finalQuestions.map((q, i) => (
        <li key={i} className="flex gap-4">
          <span className="text-xs font-mono text-slate-600 mt-0.5 shrink-0">0{i + 1}</span>
          <p className="text-sm text-slate-700 leading-relaxed">{q}</p>
        </li>
      ))}
    </ol>
  )
}
