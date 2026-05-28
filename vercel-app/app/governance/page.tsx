'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import GovernanceConsole from '@/components/GovernanceConsole'
import Disclaimer from '@/components/Disclaimer'
import AssumptionsPanel from '@/components/AssumptionsPanel'
import { SESSION_KEY } from '@/lib/types'

interface ScenarioRunBlock {
  scenario: { id: string; name: string }
  run_id: string
  five_signals: {
    PSS: { value: number }
    PES: { value: number }
    SSS: { value: number }
    EIC: { value: number }
    STI: { value: number }
  }
  governance_state: {
    human_state: {
      reviewCapacity: number
      escalationWillingness: number
    }
  }
}

export default function GovernancePage() {
  const router = useRouter()
  const [scenarioRun, setScenarioRun] = useState<ScenarioRunBlock | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw) {
      try {
        const report = JSON.parse(raw)
        if (report?.scenario_run) {
          setScenarioRun(report.scenario_run)
        }
      } catch {
        // ignore parse errors — console works without a scenario
      }
    }
    setLoaded(true)
  }, [])

  // Adapt five_signals to the console's metrics format
  const metrics = scenarioRun
    ? {
        trust: scenarioRun.five_signals.STI.value,
        hiddenStrain: 100 - scenarioRun.five_signals.SSS.value,
        ethicalDebt: 100 - scenarioRun.five_signals.EIC.value,
        governanceDrift: 100 - scenarioRun.five_signals.STI.value,
        automationDrift: Math.max(0, 100 - scenarioRun.five_signals.PES.value - 20),
        reviewCapacity: scenarioRun.governance_state.human_state.reviewCapacity,
        escalationWillingness: scenarioRun.governance_state.human_state.escalationWillingness,
      }
    : undefined

  if (!loaded) return null

  return (
    <main className="max-w-6xl mx-auto px-6 py-14">
      {/* ── Header nav ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-2">
            Institutional Mirror v2
          </p>
          <h1 className="text-4xl font-light text-slate-50 tracking-tight">
            Governance Console
          </h1>
        </div>
        <div className="flex gap-3">
          {scenarioRun && (
            <button
              onClick={() => router.push('/results')}
              className="text-xs text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded transition-colors"
            >
              ← Results
            </button>
          )}
          <button
            onClick={() => router.push('/')}
            className="text-xs text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded transition-colors"
          >
            New scenario
          </button>
        </div>
      </div>

      {/* ── Context banner ────────────────────────────────────────── */}
      {!scenarioRun && (
        <div className="border border-slate-800 rounded-lg p-4 mb-8 bg-slate-950/40">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-2">
            No scenario loaded
          </p>
          <p className="text-sm text-slate-400 leading-relaxed">
            The governance console is most useful after running a scenario — it loads the governance
            state from that run and shows you the projected effect of each intervention.
            You can also use it standalone with default metrics as a training exercise.
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-3 text-xs text-slate-400 border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded transition-colors"
          >
            Run a scenario first →
          </button>
        </div>
      )}

      {scenarioRun && (
        <div className="border border-slate-800 rounded-lg p-4 mb-8 bg-slate-950/40">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">
            Loaded from scenario run
          </p>
          <p className="text-sm text-slate-300">
            {scenarioRun.scenario.name}
          </p>
          <p className="text-[10px] font-mono text-slate-600 mt-1">
            run {scenarioRun.run_id.slice(0, 8)}
          </p>
        </div>
      )}

      {/* ── Console ───────────────────────────────────────────────── */}
      <GovernanceConsole
        metrics={metrics}
        runId={scenarioRun?.run_id}
        scenarioName={scenarioRun?.scenario.name}
      />

      <div className="mt-6 mb-2">
        <AssumptionsPanel compact />
      </div>

      <Disclaimer />
    </main>
  )
}
