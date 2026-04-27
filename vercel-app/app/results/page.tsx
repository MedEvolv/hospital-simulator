'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MetricCard from '@/components/MetricCard'
import SeverityBadge from '@/components/SeverityBadge'
import Disclaimer from '@/components/Disclaimer'
import HospitalFloor from '@/components/HospitalFloor'
import {
  SESSION_KEY, CAPACITY_KEY,
  type SimulationReport, type PatientProfile, type CapacityConfig,
} from '@/lib/types'

export default function ResultsScreen() {
  const router = useRouter()
  const [report, setReport]               = useState<SimulationReport | null>(null)
  const [patientProfiles, setPatientProfiles] = useState<Record<string, PatientProfile> | undefined>(undefined)
  const [capacity, setCapacity]           = useState<CapacityConfig | null>(null)

  // ── Load report + capacity from sessionStorage ────────────────────────
  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) { router.replace('/'); return }
    const parsed: SimulationReport = JSON.parse(raw)
    setReport(parsed)

    // Capacity — prefer value stored by page.tsx (user-set), fall back to report echo
    const capRaw = sessionStorage.getItem(CAPACITY_KEY)
    const cap: CapacityConfig = capRaw
      ? JSON.parse(capRaw)
      : (parsed.capacity ?? { patients_per_hour: 6, er_capacity: 2, opd_capacity: 4 })
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

  return (
    <main className="max-w-6xl mx-auto px-6 py-14">
      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="mb-10">
        <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">
          {report.institutional_profile} · seed {report.seed} · {report.timestamp.slice(0, 10)}
        </p>
        <h1 className="text-5xl font-light text-slate-50 tracking-tight mb-4">
          What did this cost us?
        </h1>
        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
          {ps.interpretation}
        </p>
      </header>

      {/* ── Patient Flow Replay — CENTERPIECE ────────────────────── */}
      <section className="mb-14">
        <div className="mb-5">
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-2">
            Patient flow replay
          </p>
          <h2 className="text-2xl font-light text-slate-100 tracking-tight mb-2">
            Watch what happened, tick by tick.
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
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

      {/* ── Cost Accounting ───────────────────────────────────────── */}
      <section className="border border-amber-900/60 bg-amber-950/20 rounded-lg p-6 mb-10">
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
            <div key={i} className="border border-slate-800 rounded-lg p-4 bg-slate-900">
              <div className="flex items-start gap-3">
                <SeverityBadge severity={insight.severity} />
                <p className="text-sm text-slate-300 leading-relaxed">{insight.message}</p>
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
        <p className="text-base text-slate-200 leading-relaxed italic">
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
        <div className="border border-slate-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left">
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
                    <td className="px-4 py-3 text-slate-200 capitalize">
                      {val}{isPrimary && <span className="ml-2 text-xs text-amber-500">primary drift</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400 tabular-nums">{(weight as number).toFixed(2)}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {driftNum !== null ? (
                        <span className={driftNum > 0.3 ? 'text-red-400' : driftNum > 0.15 ? 'text-amber-400' : 'text-slate-400'}>
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
            <p className="text-4xl font-light text-slate-50 tabular-nums mb-1">
              {mr.ethical_debt.current_debt.toFixed(0)}
            </p>
            <p className="text-xs text-slate-500">units accrued this run</p>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">{mr.ethical_debt.interpretation}</p>
          </div>
          <div className="space-y-2">
            {Object.entries(mr.ethical_debt.category_breakdown).map(([cat, val]) => (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span className="text-slate-400 capitalize">{cat.replace(/_/g, ' ')}</span>
                <span className="text-slate-300 tabular-nums">{(val as number).toFixed(0)}</span>
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
          <span className="text-slate-400">
            Total: <span className="text-slate-100 font-medium">{mr.harm_classifications.summary.total_harms_classified}</span>
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
            <div key={i} className="border border-slate-800 rounded p-3 bg-slate-900">
              <div className="flex items-start justify-between gap-3 mb-1">
                <span className="text-xs font-mono text-slate-400 capitalize">{h.harm_type.replace(/_/g, ' ')}</span>
                {h.tick !== undefined && <span className="text-xs text-slate-600">tick {h.tick}</span>}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{h.justification}</p>
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
            <div key={i} className="border border-slate-800 rounded p-3 bg-slate-900">
              <div className="flex items-start justify-between gap-3 mb-1">
                <span className="text-xs font-mono text-slate-400 capitalize">{r.reason.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-2">
                  {r.requires_human && (
                    <span className="text-xs text-blue-400 border border-blue-900 px-1.5 py-0.5 rounded">
                      human required
                    </span>
                  )}
                  {r.tick !== undefined && <span className="text-xs text-slate-600">tick {r.tick}</span>}
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{r.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Unavoidable Harm Summary ─────────────────────────────── */}
      <section className="mb-10">
        <SectionHeading>Capacity-constrained harm summary</SectionHeading>
        {mr.unavoidable_harm_summary.summary && (
          <p className="text-sm text-slate-300 leading-relaxed mb-5">{mr.unavoidable_harm_summary.summary}</p>
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
          <div className="border border-slate-800 rounded-lg p-5 bg-slate-900 text-sm text-slate-400">
            <p className="text-slate-300 mb-2 font-medium">GLP panel unavailable</p>
            <p className="leading-relaxed">{glp.placeholder ?? glp.reason}</p>
          </div>
        )}
      </section>

      {/* ── Recommendation ───────────────────────────────────────── */}
      <section className="mb-10 bg-slate-900 border border-slate-800 rounded-lg p-6">
        <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">
          Simulation recommendation
        </p>
        <p className="text-sm text-slate-200 leading-relaxed">{sy.recommendation}</p>
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
        <button
          onClick={() => router.push('/report')}
          className="flex-1 bg-slate-50 text-slate-950 font-medium py-3 rounded-lg hover:bg-white transition-colors text-sm"
        >
          Role-specific report →
        </button>
        <button
          onClick={() => router.push('/inspector')}
          className="flex-1 border border-slate-700 text-slate-200 py-3 rounded-lg hover:bg-slate-800 transition-colors text-sm"
        >
          Decision Inspector →
        </button>
        <button
          onClick={() => router.replace('/')}
          className="border border-slate-800 text-slate-500 px-5 py-3 rounded-lg hover:text-slate-300 hover:border-slate-700 transition-colors text-sm"
        >
          New simulation
        </button>
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
      <p className="text-2xl font-light text-slate-50 tabular-nums">
        {value}{unit && <span className="text-sm text-slate-400 ml-1">{unit}</span>}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

function NamedList({ title, items, accent }: { title: string; items: string[]; accent?: 'amber' | 'red' }) {
  const color = accent === 'amber' ? 'text-amber-500' : accent === 'red' ? 'text-red-400' : 'text-slate-400'
  return (
    <div>
      <p className={`font-mono tracking-widest uppercase text-xs mb-2 ${color}`}>{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-slate-400 leading-relaxed before:content-['—'] before:mr-2 before:text-slate-700">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function GlpPanel({ glp }: { glp: NonNullable<SimulationReport['glp_optimal']> }) {
  if (glp.status !== 'optimal' || !glp.deviations) return null
  return (
    <div className="space-y-4">
      <div className="border border-slate-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
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
                  <td className="px-4 py-3 font-mono text-slate-200">{name}</td>
                  <td className="px-4 py-3 text-right text-slate-400 tabular-nums">{row.target.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-slate-400 tabular-nums">{row.actual.toFixed(2)}</td>
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
          <ul className="space-y-1 text-xs text-slate-400">
            {glp.forced_deviations.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      )}
      {glp.avoidable_deviations && glp.avoidable_deviations.length > 0 && (
        <div>
          <p className="text-xs font-mono text-amber-500 tracking-widest uppercase mb-2">Avoidable deviations</p>
          <ul className="space-y-1 text-xs text-slate-400">
            {glp.avoidable_deviations.map((d, i) => <li key={i}>{d}</li>)}
          </ul>
        </div>
      )}
      {glp.eic_note && (
        <p className="text-xs text-slate-500 border-t border-slate-800 pt-3">{glp.eic_note}</p>
      )}
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
          <p className="text-sm text-slate-300 leading-relaxed">{q}</p>
        </li>
      ))}
    </ol>
  )
}
