'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Disclaimer from '@/components/Disclaimer'
import { SESSION_KEY, type SimulationReport } from '@/lib/types'

const SURVEY_KEY = 'im_survey'

// ── Role definitions ──────────────────────────────────────────────────────────

const ROLES = [
  { key: 'cmo',     label: 'Medical Superintendent',        icon: '⚕',  nabh: false },
  { key: 'qi',      label: 'Quality & Safety Lead',         icon: '📊', nabh: false },
  { key: 'ethics',  label: 'Ethics Committee Chair',        icon: '⚖',  nabh: false },
  { key: 'nursing', label: 'Director of Nursing',           icon: '🩺', nabh: false },
  { key: 'ceo',     label: 'COO / Hospital Administrator',  icon: '🏛', nabh: false },
  { key: 'board',   label: 'Legal Counsel',                 icon: '📋', nabh: false },
  { key: 'nabh',    label: 'NABH Preparation Report',       icon: '🏥', nabh: true  },
]

// ── Markdown-lite renderer (## headings, - bullets, | tables) ────────────────

function SimpleMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Table: group consecutive lines starting and ending with |
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      // Filter out separator rows (|---|---|)
      const isSep = (l: string) => /^\|[\s|:-]+\|$/.test(l.trim())
      const rows = tableLines
        .filter(l => !isSep(l))
        .map(l => l.trim().slice(1, -1).split('|').map(cell => cell.trim()))

      if (rows.length === 0) continue

      const [header, ...body] = rows
      nodes.push(
        <div key={`tbl-${i}`} className="overflow-x-auto my-4">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                {header.map((cell, j) => (
                  <th key={j} className="text-left border-b border-slate-700 py-2 px-3 text-[10px] font-mono text-slate-400 uppercase tracking-wide whitespace-nowrap">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri} className="border-b border-slate-800/60 last:border-0 hover:bg-slate-800/20 transition-colors">
                  {row.map((cell, ci) => (
                    <td key={ci} className="py-2 px-3 text-slate-300 align-top leading-relaxed">
                      {cell || <span className="text-slate-700 italic text-[10px]">for committee</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
      continue
    }

    // ## heading
    if (line.startsWith('## ')) {
      nodes.push(
        <h3 key={i} className="text-xs font-mono text-slate-500 uppercase tracking-widest mt-6 mb-2 first:mt-0">
          {line.slice(3)}
        </h3>
      )
      i++; continue
    }

    // - bullet
    if (line.startsWith('- ')) {
      nodes.push(
        <div key={i} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
          <span className="text-slate-600 shrink-0 mt-0.5">—</span>
          <span>{line.slice(2)}</span>
        </div>
      )
      i++; continue
    }

    // blank line
    if (line.trim() === '') {
      nodes.push(<div key={i} className="h-1" />)
      i++; continue
    }

    // regular paragraph
    nodes.push(
      <p key={i} className="text-sm text-slate-300 leading-relaxed">{line}</p>
    )
    i++
  }

  return <div className="space-y-1">{nodes}</div>
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
      <span className="text-xs text-slate-500 ml-1 font-mono">Generating…</span>
    </div>
  )
}

// ── Glossary entry ────────────────────────────────────────────────────────────

function GlossaryEntry({
  term, definition, standard, sahi,
}: {
  term: string
  definition: string
  standard?: string
  sahi?: string
}) {
  return (
    <div className="border-b border-slate-800 last:border-0 pb-4 last:pb-0">
      <p className="text-xs font-mono text-slate-300 mb-1">{term}</p>
      <p className="text-xs text-slate-400 leading-relaxed mb-1">{definition}</p>
      {standard && (
        <p className="text-[10px] text-slate-600 leading-relaxed italic">
          {standard}
        </p>
      )}
      {sahi && (
        <p className="text-[10px] text-slate-600 leading-relaxed mt-0.5">
          {sahi}
        </p>
      )}
    </div>
  )
}

// ── Key metrics snapshot (static — not LLM generated) ────────────────────────

function MetricsSnapshot({ report }: { report: SimulationReport }) {
  const ps = report.performance_scores
  const mr = report.moral_reckoning
  const sy = report.synthesis

  return (
    <div className="border border-slate-800 rounded-lg p-5 bg-slate-900/40 mb-6">
      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4">
        Simulation metrics — {report.institutional_profile} · seed {report.seed}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
        <Metric label="Patient Safety"    value={`${ps.patient_safety_score.toFixed(1)} / 100`} />
        <Metric label="Patient Experience" value={`${ps.patient_experience_score.toFixed(1)} / 100`} />
        <Metric label="Staff Stress"      value={`${ps.staff_stress_score.toFixed(1)} / 100`} />
        <Metric label="Ethics Interventions" value={String(ps.ethics_intervention_count)} />
        <Metric label="Throughput"        value={`${ps.system_throughput_index.toFixed(1)} / 100`} />
        <Metric label="Ethical Debt"      value={`${mr.ethical_debt.current_debt.toFixed(0)} units`} warn />
        <Metric label="Value Drift (max)" value={mr.value_drift.maximum_drift.toFixed(2)}
          warn={mr.value_drift.maximum_drift > 0.25} />
        <Metric label="Forced Harms"      value={String(mr.harm_classifications.summary.forced_count)} />
        <Metric label="Avoidable Harms"   value={String(mr.harm_classifications.summary.avoidable_count)} warn />
      </div>
      <p className="text-xs text-slate-500 mt-4 border-t border-slate-800 pt-3 italic">
        &ldquo;{sy.critical_question}&rdquo;
      </p>
    </div>
  )
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <p className={`text-base font-light tabular-nums ${warn ? 'text-amber-400' : 'text-slate-100'}`}>{value}</p>
      <p className="text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const router = useRouter()
  const [report, setReport] = useState<SimulationReport | null>(null)
  const [survey, setSurvey] = useState<Record<string, string | string[]>>({})
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [generatedCache, setGeneratedCache] = useState<Record<string, string>>({})
  const [glossaryOpen, setGlossaryOpen] = useState(false)
  const narrativeRef = useRef<HTMLDivElement>(null)
  const pendingRoleRef = useRef<string | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) { router.replace('/'); return }
    setReport(JSON.parse(raw))
    const surveyRaw = sessionStorage.getItem(SURVEY_KEY)
    if (surveyRaw) {
      try { setSurvey(JSON.parse(surveyRaw)) } catch { /* ignore */ }
    }
  }, [router])

  const [isLoading, setIsLoading] = useState(false)

  async function handleRoleSelect(roleKey: string) {
    setSelectedRole(roleKey)
    pendingRoleRef.current = roleKey

    // Record role selection for learning cycle analysis — fire-and-forget
    const runIdDb = (report as SimulationReport & { run_id_db?: string })?.run_id_db
    if (runIdDb) {
      fetch('/api/update_run', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ run_id: runIdDb, user_role_selected: roleKey }),
      }).catch(() => { /* non-critical */ })
    }

    // If cached, don't re-generate
    if (generatedCache[roleKey]) return

    if (!report) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: roleKey,
          result: report,
          survey: Object.keys(survey).length > 0 ? survey : undefined,
        }),
      })
      const data = await res.json()
      const narrative: string = data.narrative ?? ''
      const role = pendingRoleRef.current
      if (role) {
        setGeneratedCache(prev => ({ ...prev, [role]: narrative }))
      }
    } finally {
      setIsLoading(false)
      // Scroll to narrative
      setTimeout(() => {
        narrativeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }

  if (!report) return null

  const activeText = selectedRole ? (generatedCache[selectedRole] ?? '') : ''

  const selectedRoleMeta = ROLES.find(r => r.key === selectedRole)

  return (
    <main className="max-w-3xl mx-auto px-6 py-14">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="mb-8">
        <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">
          Role-specific report
        </p>
        <h1 className="text-4xl font-light text-slate-50 tracking-tight mb-3">
          Who is reading this?
        </h1>
        <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
          The same simulation findings read differently depending on your role.
          Select who you are — the system generates a narrative and recommended next steps
          framed specifically for your authority and concerns.
        </p>
      </header>

      {/* ── Static metrics snapshot ───────────────────────────────────── */}
      <MetricsSnapshot report={report} />

      {/* ── Role selector ─────────────────────────────────────────────── */}
      <section className="mb-8">
        <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">
          Select your role
        </p>
        {/* Standard roles — 2×3 grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {ROLES.filter(r => !r.nabh).map(role => (
            <button
              key={role.key}
              onClick={() => handleRoleSelect(role.key)}
              disabled={isLoading && selectedRole === role.key}
              className={`text-left border rounded-lg p-3 transition-colors ${
                selectedRole === role.key
                  ? 'border-slate-400 bg-slate-800'
                  : 'border-slate-800 bg-slate-900 hover:border-slate-700'
              }`}
            >
              <span className="text-base mr-2">{role.icon}</span>
              <span className="text-sm text-slate-200">{role.label}</span>
              {generatedCache[role.key] && (
                <span className="ml-1.5 text-[10px] text-slate-500">✓</span>
              )}
            </button>
          ))}
        </div>

        {/* NABH mode — full-width, visually distinct */}
        {ROLES.filter(r => r.nabh).map(role => (
          <button
            key={role.key}
            onClick={() => handleRoleSelect(role.key)}
            disabled={isLoading && selectedRole === role.key}
            className={`w-full text-left border rounded-lg px-4 py-3 transition-colors ${
              selectedRole === role.key
                ? 'border-sky-600 bg-sky-950/50'
                : 'border-sky-900/60 bg-sky-950/20 hover:border-sky-700/60 hover:bg-sky-950/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{role.icon}</span>
                <div>
                  <p className="text-sm text-sky-200 font-medium">{role.label}</p>
                  <p className="text-[10px] text-sky-400/70 mt-0.5">
                    Chapter-mapped · Action log · SAHI alignment · DPDP note
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {generatedCache[role.key] && (
                  <span className="text-[10px] text-sky-500">✓</span>
                )}
                <span className="text-[10px] font-mono text-sky-600 border border-sky-800 px-1.5 py-0.5 rounded">
                  NABH
                </span>
              </div>
            </div>
          </button>
        ))}
      </section>

      {/* ── Generated narrative / NABH report ────────────────────────── */}
      {selectedRole && (
        <section
          ref={narrativeRef}
          className={`border rounded-lg overflow-hidden mb-8 ${
            selectedRole === 'nabh'
              ? 'border-sky-800/60 bg-sky-950/20'
              : 'border-slate-800 bg-slate-900/40'
          }`}
        >
          <div className={`px-5 py-3 border-b flex items-center justify-between ${
            selectedRole === 'nabh' ? 'border-sky-800/60' : 'border-slate-800'
          }`}>
            <div>
              <p className={`text-[10px] font-mono uppercase tracking-widest ${
                selectedRole === 'nabh' ? 'text-sky-500' : 'text-slate-500'
              }`}>
                {selectedRole === 'nabh' ? 'NABH preparation report' : 'Narrative for'}
              </p>
              <p className={`text-sm font-medium mt-0.5 ${
                selectedRole === 'nabh' ? 'text-sky-200' : 'text-slate-200'
              }`}>
                {selectedRoleMeta?.icon} {selectedRoleMeta?.label}
              </p>
            </div>
            {!isLoading && activeText && (
              <button
                onClick={() => handleRoleSelect(selectedRole)}
                className={`text-xs border px-2 py-1 rounded transition-colors ${
                  selectedRole === 'nabh'
                    ? 'text-sky-500 hover:text-sky-300 border-sky-800'
                    : 'text-slate-500 hover:text-slate-300 border-slate-800'
                }`}
              >
                ↺ Regenerate
              </button>
            )}
          </div>

          <div className="px-5 py-5">
            {isLoading && <TypingIndicator />}
            {!isLoading && activeText && <SimpleMarkdown text={activeText} />}
            {!isLoading && !activeText && (
              <p className="text-xs text-slate-500">Select a role above to generate.</p>
            )}
          </div>

          <div className={`px-5 py-3 border-t ${
            selectedRole === 'nabh'
              ? 'border-sky-800/60 bg-sky-950/30'
              : 'border-slate-800 bg-slate-900/60'
          }`}>
            {selectedRole === 'nabh' ? (
              <p className="text-[10px] text-sky-700/80 leading-relaxed">
                Simulation-based governance reflection only — not clinical evidence or accreditation documentation.
                For internal committee discussion. Not suitable for external submission or any NABH accreditation claim.
              </p>
            ) : (
              <p className="text-[10px] text-slate-600 leading-relaxed">
                This narrative is generated from simulation data. It reflects modelled institutional behaviour,
                not real patient outcomes. Review alongside the full results before governance use.
              </p>
            )}
          </div>
        </section>
      )}

      {/* ── Navigation ───────────────────────────────────────────────── */}
      <div className="flex gap-4 mb-12">
        <button
          onClick={() => {
            const runIdDb = (report as SimulationReport & { run_id_db?: string })?.run_id_db
            if (runIdDb) {
              fetch('/api/update_run', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ run_id: runIdDb, report_exported: true }),
              }).catch(() => { /* non-critical */ })
            }
            window.print()
          }}
          className="border border-slate-800 text-slate-500 px-5 py-3 rounded-lg hover:text-slate-300 hover:border-slate-700 transition-colors text-sm"
        >
          Export / Print
        </button>
        <button
          onClick={() => router.back()}
          className="border border-slate-700 text-slate-300 px-5 py-3 rounded-lg hover:bg-slate-800 transition-colors text-sm"
        >
          ← Back to results
        </button>
        <button
          onClick={() => router.replace('/')}
          className="border border-slate-800 text-slate-500 px-5 py-3 rounded-lg hover:text-slate-300 hover:border-slate-700 transition-colors text-sm"
        >
          New simulation
        </button>
      </div>

      {/* ── Glossary ─────────────────────────────────────────────── */}
      <section className="border border-slate-800 rounded-lg bg-slate-900/30 overflow-hidden mb-12">
        <button
          onClick={() => setGlossaryOpen(v => !v)}
          className="w-full text-left px-5 py-3 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
        >
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Terminology glossary
          </p>
          <span className="text-slate-600 text-xs">{glossaryOpen ? '▲' : '▼'}</span>
        </button>
        {glossaryOpen && (
          <div className="px-5 pb-5 border-t border-slate-800 space-y-5 pt-4">
            <GlossaryEntry
              term="Value drift"
              definition="Value drift measures the gap between the values an institution declares and the values its decisions reveal under pressure. It is a structural signal — it reflects resourcing and protocol, not individuals."
              standard="Literature equivalent: mission drift, mission deviation, value-practice gap"
              sahi="SAHI Recommendation 7: post-deployment monitoring for real-world use and unintended consequences."
            />
            <GlossaryEntry
              term="Ethical debt"
              definition="Ethical debt is the moral weight that accumulates from repeated decisions made under pressure that compromise declared values. Like technical debt, it is manageable in small amounts and dangerous when it compounds silently."
              standard="Literature equivalent: moral residue (Jameton), accumulated moral distress"
            />
            <GlossaryEntry
              term="Moral reckoning layer"
              definition="The moral reckoning layer analyses every simulation decision for ethical signals — value drift, harm classification, refusal events, and tension patterns. It runs independently of the performance scoring layer."
              standard="By role: governance review (Medical Superintendent), patient safety analysis (Quality Lead), compliance and accountability review (Legal Counsel)"
            />
            <GlossaryEntry
              term="Forced harm"
              definition="Forced harms are events where no feasible alternative existed given the institution's actual capacity at the time. They are documented for institutional awareness, not attribution of fault."
              standard="Clinical standard: unavoidable adverse event (WHO/NABH) — used in incident reporting frameworks and NABH accreditation standards"
              sahi="SAHI Recommendation 1: risk classification must distinguish capacity-constrained events from allocation-driven ones."
            />
            <GlossaryEntry
              term="Avoidable harm"
              definition="Avoidable harms are events where the simulation identified a feasible alternative that was not taken — meaning a protocol change, staffing decision, or resource allocation could have prevented the outcome. Only avoidable harms are within governance reach."
              standard="Clinical standard: preventable adverse event (WHO, 2005) — used in NABH, ICMR, and every patient safety framework in India and globally"
              sahi="SAHI Recommendation 3: safety metrics should assess real-world use, not just technical performance."
            />
            <GlossaryEntry
              term="Tension signals"
              definition="Tension signals are unresolved structural conflicts detected during the simulation — trade-offs between values that have not been consciously resolved by governance. They are leading indicators of governance stress, not errors."
              standard="Safety science equivalent: pre-incident indicators, leading indicators of governance stress"
            />
            <GlossaryEntry
              term="Refusal / escalation"
              definition="A refusal is a decision the system declined to make autonomously and escalated to human oversight. Refusals are governance signals, not failures — they demonstrate that the system recognises the boundaries of its own competence."
              standard="By role: escalation to human oversight (Medical Superintendent), safety escalation event (Quality Lead), documented escalation — decision withheld pending human review (Legal Counsel)"
              sahi="SAHI Recommendations 21–22: AI tools must have clearly defined escalation mechanisms with human oversight."
            />
            <GlossaryEntry
              term="Patient Safety Score (PSS)"
              definition="Patient Safety Score measures how consistently safe care was delivered across all patients in this simulation run. It accounts for triage breaches, escalation failures, and admission delays for critical patients."
            />
            <GlossaryEntry
              term="Patient Experience Score (PES)"
              definition="Patient Experience Score reflects waiting times, communication quality, and dignity preserved throughout care. It is distinct from clinical outcomes — a patient can be clinically safe and experientially harmed."
            />
            <GlossaryEntry
              term="Staff Stress Score (SSS)"
              definition="Staff Stress Score tracks cumulative cognitive and moral load on clinical staff across the simulation. Research links sustained high staff stress in AI-assisted environments to moral injury — psychological harm from being unable to act according to one's values. This metric exists because staff wellbeing is a governance concern, not just an HR one."
              standard="Literature: moral distress, moral injury (Jameton, 1984; Litz et al., 2009)"
            />
            <GlossaryEntry
              term="Ethics Intervention Count (EIC)"
              definition="Ethics Intervention Count records how many times the simulation triggered a governance override or deferred to human judgement. A higher count means the moral reckoning layer was actively engaged. Zero EIC in a high-pressure run may indicate that harms were absorbed silently rather than flagged."
            />
            <GlossaryEntry
              term="System Throughput Index (STI)"
              definition="System Throughput Index measures how efficiently the emergency department processed patient volume in this run. High throughput at the cost of high ethical debt or value drift is the pattern this tool is designed to surface."
            />
          </div>
        )}
      </section>

      <Disclaimer />
    </main>
  )
}
