'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SESSION_KEY } from '@/lib/types'

// ── Pack colour palette ────────────────────────────────────────────────────────

const PACK_STYLES: Record<string, {
  badge: string
  card: string
  cardSelected: string
  dot: string
}> = {
  'automation-failure': {
    badge: 'text-amber-400 border-amber-800/60 bg-amber-950/40',
    card: 'border-slate-800 hover:border-amber-900/60',
    cardSelected: 'border-amber-700/70 bg-amber-950/20',
    dot: 'bg-amber-500',
  },
  'institutional-strain': {
    badge: 'text-orange-400 border-orange-800/60 bg-orange-950/40',
    card: 'border-slate-800 hover:border-orange-900/60',
    cardSelected: 'border-orange-700/70 bg-orange-950/20',
    dot: 'bg-orange-500',
  },
  'equity-participation': {
    badge: 'text-sky-400 border-sky-800/60 bg-sky-950/40',
    card: 'border-slate-800 hover:border-sky-900/60',
    cardSelected: 'border-sky-700/70 bg-sky-950/20',
    dot: 'bg-sky-500',
  },
  'security-stress-test': {
    badge: 'text-rose-400 border-rose-800/60 bg-rose-950/40',
    card: 'border-slate-800 hover:border-rose-900/60',
    cardSelected: 'border-rose-700/70 bg-rose-950/20',
    dot: 'bg-rose-500',
  },
}

const PACK_LABELS: Record<string, string> = {
  'automation-failure': 'Automation failure',
  'institutional-strain': 'Institutional strain',
  'equity-participation': 'Equity & participation',
  'security-stress-test': 'Security stress test',
}

// ── Scenario card data type (matches GET /api/run-scenario response shape) ─────

interface ScenarioMeta {
  id: string
  name: string
  description: string
  packId: string
  expectedRiskPathways: string[]
  learningObjectives: string[]
  simulationProfile: string
  durationTicks: number
  stressorCount: number
}

// ── Hardcoded until dynamic fetch is needed ────────────────────────────────────

const SCENARIOS: ScenarioMeta[] = [
  {
    id: 'hallucinated-discharge-summary',
    name: 'The Hallucinated Discharge',
    description: 'A senior clinician defers to an AI-generated discharge summary that contains a fabricated drug interaction. Six governance failures make the outcome possible before the harm is detected.',
    packId: 'automation-failure',
    expectedRiskPathways: [
      'Automation drift → rubber-stamp review → missed hallucination',
      'Accountability ambiguity between AI system and clinical governance',
    ],
    learningObjectives: [
      'Recognise how review decay accumulates under workload pressure',
      'Trace accountability when harm originates in an AI-generated artefact',
    ],
    simulationProfile: 'Government Hospital',
    durationTicks: 180,
    stressorCount: 6,
  },
  {
    id: 'ai-triage-drift-er-overload',
    name: 'The Drifting Triage',
    description: 'An ER triage AI gradually increases its own autonomy during a patient surge as alert fatigue suppresses override signals. By the time the drift is visible, it has become institutional.',
    packId: 'institutional-strain',
    expectedRiskPathways: [
      'Alert fatigue → suppressed override → invisible automation drift',
      'Escalation failure during peak load accelerates governance collapse',
    ],
    learningObjectives: [
      'Identify the automation drift threshold before it becomes structural',
      'Analyse how alert fatigue and AI drift share the same cognitive mechanism',
    ],
    simulationProfile: 'Government Hospital',
    durationTicks: 200,
    stressorCount: 8,
  },
  {
    id: 'chronic-patient-scheduling-delay',
    name: 'The Invisible Queue',
    description: 'A private OPD scheduling algorithm maximises throughput by deprioritising multi-morbidity patients. Metrics look excellent. Harm is invisible until a doctor begins tracking it manually.',
    packId: 'equity-participation',
    expectedRiskPathways: [
      'Efficiency-optimised AI systematically disadvantages chronically ill patients',
      'Accountability diffusion between algorithm, operator, and vendor prevents early action',
    ],
    learningObjectives: [
      'Identify how throughput metrics can mask systematic equity erosion',
      'Evaluate the role of documented human overrides as governance evidence',
    ],
    simulationProfile: 'Private Hospital',
    durationTicks: 240,
    stressorCount: 9,
  },
  {
    id: 'security-stress-test',
    name: 'The Credential Cascade',
    description: 'A phishing campaign hits clinical staff during a patient surge. One click. Nine steps. The ransomware outcome was a governance failure before it was a technical one.',
    packId: 'security-stress-test',
    expectedRiskPathways: [
      'Clinical alert fatigue and security alert fatigue — same institutional failure',
      'Credential sharing under workload pressure → identity accountability collapses',
    ],
    learningObjectives: [
      'Recognise that cybersecurity failures are not separate from clinical governance',
      'Design an escalation pathway that remains operable when the primary contact is unavailable',
    ],
    simulationProfile: 'Private Hospital',
    durationTicks: 260,
    stressorCount: 12,
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

interface ScenarioSelectorProps {
  onRunStart?: () => void
  onRunComplete?: () => void
  onError?: (msg: string) => void
}

export default function ScenarioSelector({
  onRunStart,
  onRunComplete,
  onError,
}: ScenarioSelectorProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runScenario() {
    if (!selected) return
    setRunning(true)
    setError(null)
    onRunStart?.()

    try {
      const res = await fetch('/api/run-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: selected }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Scenario run failed (${res.status}): ${text.slice(0, 200)}`)
      }

      const report = await res.json()
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(report))
      onRunComplete?.()
      router.push('/results')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error'
      setError(message)
      onError?.(message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div>
      {/* ── Label ─────────────────────────────────────────────────────── */}
      <p className="text-xs font-mono text-slate-400 tracking-widest uppercase mb-3">
        Governance stress-test scenarios
      </p>
      <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-2xl">
        Each scenario is a structured governance stress test — not a random simulation.
        Select one to run a deterministic sequence of institutional failures and measure
        how trust, ethical debt, and human state degrade.
      </p>

      {/* ── Cards grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        {SCENARIOS.map(scenario => {
          const pack = PACK_STYLES[scenario.packId] ?? PACK_STYLES['automation-failure']
          const isSelected = selected === scenario.id

          return (
            <button
              key={scenario.id}
              type="button"
              onClick={() => setSelected(isSelected ? null : scenario.id)}
              className={`text-left border rounded-lg p-5 transition-all ${
                isSelected ? pack.cardSelected : `bg-slate-900/40 ${pack.card}`
              }`}
            >
              {/* ── Card header ────────────────────────────────────────── */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className={`inline-block w-2 h-2 rounded-full ${pack.dot} mt-0.5 shrink-0`} />
                  <h3 className="text-sm font-medium text-slate-100">{scenario.name}</h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-mono border px-2 py-0.5 rounded tracking-wider uppercase ${pack.badge}`}>
                    {PACK_LABELS[scenario.packId] ?? scenario.packId}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-mono text-slate-400 border border-slate-700 px-2 py-0.5 rounded">
                      selected
                    </span>
                  )}
                </div>
              </div>

              {/* ── Description ────────────────────────────────────────── */}
              <p className="text-xs text-slate-400 leading-relaxed mb-3 ml-4.5 pl-[18px]">
                {scenario.description}
              </p>

              {/* ── Meta row ───────────────────────────────────────────── */}
              <div className="flex items-center gap-4 text-[10px] font-mono text-slate-600 ml-4.5 pl-[18px]">
                <span>{scenario.simulationProfile}</span>
                <span>·</span>
                <span>{scenario.durationTicks} ticks</span>
                <span>·</span>
                <span>{scenario.stressorCount} stressors</span>
              </div>

              {/* ── Expanded: risk pathways ─────────────────────────────── */}
              {isSelected && (
                <div className="mt-4 pl-[18px] border-t border-slate-800 pt-4 space-y-2">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">
                    Expected risk pathways
                  </p>
                  {scenario.expectedRiskPathways.map((p, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-slate-700 text-xs shrink-0 mt-0.5">→</span>
                      <p className="text-xs text-slate-400 leading-relaxed">{p}</p>
                    </div>
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Run button ────────────────────────────────────────────────── */}
      <button
        onClick={runScenario}
        disabled={!selected || running}
        className="w-full bg-slate-50 text-slate-950 font-medium py-4 rounded-lg hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {running
          ? 'Running scenario…'
          : selected
          ? `Run: ${SCENARIOS.find(s => s.id === selected)?.name}`
          : 'Select a scenario to run'
        }
      </button>

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="mt-4 border border-red-900 bg-red-950/40 rounded p-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* ── Disclaimer note ───────────────────────────────────────────── */}
      <p className="text-xs text-slate-600 mt-4 text-center">
        Scenarios are deterministic — same scenario always produces the same institutional failure sequence.
      </p>
    </div>
  )
}
