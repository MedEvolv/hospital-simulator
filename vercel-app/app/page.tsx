'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Disclaimer from '@/components/Disclaimer'
import ScenarioSelector from '@/components/ScenarioSelector'
import ContextSurvey from '@/components/ContextSurvey'
import { HospitalFloorLoading } from '@/components/HospitalFloor'
import { SESSION_KEY, CAPACITY_KEY, type SimulationParams } from '@/lib/types'

type Profile = SimulationParams['profile']
type Mode = 'scenarios' | 'custom'

const PROFILES: { value: Profile; label: string; blurb: string }[] = [
  {
    value: 'Government Hospital',
    label: 'Government Hospital',
    blurb: 'High volume, constrained capacity, equity-weighted values.',
  },
  {
    value: 'Private Hospital',
    label: 'Private Hospital',
    blurb: 'Lower volume, throughput and experience weighted.',
  },
  {
    value: 'Balanced',
    label: 'Balanced',
    blurb: 'Mid-sized institution with even value weights.',
  },
]

export default function ConfigureScreen() {
  const router = useRouter()

  // ── Mode toggle ────────────────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>('scenarios')

  // ── Custom run state ───────────────────────────────────────────────────
  const [profile, setProfile] = useState<Profile>('Government Hospital')
  const [duration, setDuration] = useState<number>(120)
  const [seed, setSeed] = useState<number>(42)
  const [patientsPerHour, setPatientsPerHour] = useState<number>(6)
  const [erCapacity, setErCapacity] = useState<number>(2)
  const [opdCapacity, setOpdCapacity] = useState<number>(4)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingSample, setLoadingSample] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load a pre-computed example run so first-time users can read a real
  // report before committing to running their own scenario.
  async function viewSampleReport() {
    setLoadingSample(true)
    setError(null)
    try {
      const res = await fetch('/sample-run.json')
      if (!res.ok) throw new Error('Could not load sample report')
      const report = await res.json()
      report._sample = true
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(report))
      router.push('/results')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load sample')
      setLoadingSample(false)
    }
  }

  async function runCustomSimulation() {
    setLoading(true)
    setError(null)
    try {
      const surveyData = sessionStorage.getItem('im_survey')

      sessionStorage.setItem(CAPACITY_KEY, JSON.stringify({
        patients_per_hour: patientsPerHour,
        er_capacity: erCapacity,
        opd_capacity: opdCapacity,
      }))

      const res = await fetch('/api/run_simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          duration_ticks: duration,
          seed,
          patients_per_hour: patientsPerHour,
          er_capacity: erCapacity,
          opd_capacity: opdCapacity,
          survey_data: surveyData ? JSON.parse(surveyData) : null,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Simulation failed (${res.status}): ${text.slice(0, 200)}`)
      }
      const report = await res.json()
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(report))
      router.push('/results')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-16 bg-white min-h-screen text-slate-900 font-sans selection:bg-rose-100">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="mb-12 border-b border-slate-200 pb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 rounded-sm bg-rose-600"></div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Institutional Mirror v2
            </p>
          </div>
          <nav aria-label="Main navigation" className="flex items-center gap-3">
            <a
              href="https://archlife.in/institutional-mirror"
              className="text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-md transition-colors"
            >
              ArchLife
            </a>
            <Link
              href="/sahi"
              className="text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-md transition-colors"
            >
              SAHI alignment
            </Link>
            <Link
              href="/history"
              className="text-[11px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-md transition-colors"
            >
              Audit History
            </Link>
            <Link
              href="/sandbox"
              className="text-[11px] font-bold uppercase tracking-wider text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 px-4 py-1.5 rounded-md transition-colors shadow-sm"
            >
              Scenario Studio →
            </Link>
          </nav>
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-slate-950 mb-4">
          What did this cost us?
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed font-serif max-w-2xl">
          A systemic governance stress-test environment for clinical AI systems.
        </p>
        <p className="mt-3 max-w-2xl text-xs font-medium uppercase tracking-wider text-slate-500">
          Synthetic governance scenarios. No patient data, clinical advice, or predictive output.
        </p>
      </header>

      {/* ── Framing ─────────────────────────────────────────────────── */}
      <section className="border border-slate-200 rounded-xl p-8 mb-10 bg-slate-50 shadow-sm relative overflow-hidden">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-[100px]"></div>
        
        <div className="relative z-10">
          <p className="text-sm font-medium text-slate-700 leading-relaxed mb-4">
            Most hospital performance tools tell you how well you&rsquo;re doing. This one tells
            you what it cost you to get there &mdash; the harms absorbed, values drifted from,
            and governance structures that failed before the failure became visible.
          </p>
          <p className="text-sm text-slate-500 leading-relaxed">
            <strong className="text-slate-900 font-semibold">Governance scenarios</strong> are structured stress tests
            with deterministic failure sequences &mdash; designed to surface specific institutional
            vulnerabilities. <strong className="text-slate-900 font-semibold">Custom runs</strong> let you vary
            parameters freely for ad-hoc risk modeling.
          </p>

          {/* First-time orientation: open a real example report without running anything */}
          <div className="mt-6 pt-6 border-t border-slate-200 flex items-center justify-between gap-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
              New here? Review a baseline audit report.
            </p>
            <button
              type="button"
              onClick={viewSampleReport}
              disabled={loadingSample}
              className="shrink-0 text-xs font-bold uppercase tracking-wider text-slate-700 border border-slate-300 bg-white hover:bg-slate-100 px-4 py-2 rounded-md transition-all shadow-sm disabled:opacity-50"
            >
              {loadingSample ? 'Loading Audit…' : 'See Sample Audit →'}
            </button>
          </div>
        </div>
      </section>

      {/* ── Context survey (optional pre-scenario step) ─────────────── */}
      <div className="mb-10">
        <ContextSurvey />
      </div>

      {/* ── Mode tabs ───────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-8 bg-slate-100 border border-slate-200 rounded-xl p-1.5 shadow-inner">
        <button
          type="button"
          onClick={() => setMode('scenarios')}
          aria-pressed={mode === 'scenarios'}
          className={`flex-1 py-3 text-sm rounded-lg transition-all font-bold tracking-wide ${
            mode === 'scenarios'
              ? 'bg-white text-slate-900 border border-slate-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          Governance Scenarios
          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">Recommended</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('custom')}
          aria-pressed={mode === 'custom'}
          className={`flex-1 py-3 text-sm rounded-lg transition-all font-bold tracking-wide ${
            mode === 'custom'
              ? 'bg-white text-slate-900 border border-slate-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
          }`}
        >
          Custom Run
        </button>
      </div>

      {/* ── Scenario mode ───────────────────────────────────────────── */}
      {mode === 'scenarios' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <ScenarioSelector
            onRunStart={() => setError(null)}
            onError={(msg) => setError(msg)}
          />
        </div>
      )}

      {/* ── Custom run mode ─────────────────────────────────────────── */}
      {mode === 'custom' && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          <section className="space-y-10 mb-10">
            {/* Institutional profile */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 bg-white rounded-sm"></div>
                <label className="block text-xs font-bold text-slate-900 tracking-widest uppercase">
                  Institutional Profile
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PROFILES.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setProfile(p.value)}
                    className={`text-left border rounded-xl p-5 transition-all ${
                      profile === p.value
                        ? 'border-slate-900 bg-white shadow-md ring-2 ring-slate-900/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <p className={`text-sm font-bold ${profile === p.value ? 'text-white' : 'text-slate-900'}`}>{p.label}</p>
                    <p className={`text-xs mt-2 leading-relaxed ${profile === p.value ? 'text-slate-700' : 'text-slate-500'}`}>{p.blurb}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full h-px bg-slate-100"></div>

            {/* Capacity */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 bg-rose-600 rounded-sm"></div>
                <label className="block text-xs font-bold text-slate-900 tracking-widest uppercase">
                  Department Capacity Constraints
                </label>
              </div>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed max-w-2xl">
                Higher patient volume with constrained beds mathematically guarantees triage rationing, forcing the simulation to generate severe moral trade-offs.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <CapacityInput label="Patients / hr" value={patientsPerHour} min={1} max={20} onChange={setPatientsPerHour} />
                <CapacityInput label="ER beds" value={erCapacity} min={1} max={8} onChange={setErCapacity} />
                <CapacityInput label="OPD beds" value={opdCapacity} min={1} max={12} onChange={setOpdCapacity} />
              </div>
            </div>

            <div className="w-full h-px bg-slate-100"></div>

            {/* Duration */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 bg-blue-600 rounded-sm"></div>
                <label className="block text-xs font-bold text-slate-900 tracking-widest uppercase">
                  Audit Duration
                </label>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <div className="flex items-baseline justify-between mb-4">
                  <span className="text-sm font-bold text-slate-900 font-mono">
                    {duration} ticks
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    ~{Math.round(duration / 6)} simulated hours
                  </span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={200}
                  step={5}
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full accent-slate-900 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Advanced / seed */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(v => !v)}
                className="text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-2"
              >
                {showAdvanced ? '− Hide Advanced Parameters' : '+ Show Advanced Parameters'}
              </button>
              {showAdvanced && (
                <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-6">
                  <label className="block text-xs font-bold text-slate-700 tracking-widest uppercase mb-3">
                    Deterministic Seed
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      value={seed}
                      onChange={e => setSeed(Number(e.target.value))}
                      className="w-32 bg-white border border-slate-300 rounded-md px-4 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                    />
                    <p className="text-xs text-slate-500">
                      Same seed + same profile produces mathematically identical runs.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Run button */}
          <button
            onClick={runCustomSimulation}
            disabled={loading}
            className="w-full bg-white text-white font-bold tracking-wide uppercase py-5 rounded-xl hover:bg-slate-100 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border border-slate-950"
          >
            {loading ? 'Executing Clinical Audit…' : 'Execute Simulation Run'}
          </button>

          {loading && (
            <div className="mt-10 p-8 border border-slate-200 rounded-xl bg-slate-50">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 text-center mb-6">
                Simulating patient arrivals, triage decisions, and institutional responses...
              </p>
              <HospitalFloorLoading />
            </div>
          )}
        </div>
      )}

      {/* ── Shared error display ─────────────────────────────────────── */}
      {error && (
        <div className="mt-8 border-l-4 border-rose-600 bg-rose-50 rounded-r-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-4 w-4 rounded-full bg-rose-200 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-rose-600"></div>
            </div>
            <p className="text-sm font-bold text-rose-900 uppercase tracking-widest">Simulation Failed</p>
          </div>
          <p className="text-sm text-rose-700 font-mono ml-7">{error}</p>
        </div>
      )}

      <div className="mt-16 pt-8 border-t border-slate-200">
        <Disclaimer />
      </div>
    </main>
  )
}

// ── Capacity stepper input ─────────────────────────────────────────────────────

function CapacityInput({
  label, value, min, max, onChange,
}: {
  label: string; value: number; min: number; max: number
  onChange: (v: number) => void
}) {
  return (
    <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">{label}</p>
      <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-100 rounded-lg p-1.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-md text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-colors text-lg font-mono font-bold shadow-sm"
        >−</button>
        <span className="text-xl font-bold font-mono text-slate-900 tabular-nums w-10 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-md text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-colors text-lg font-mono font-bold shadow-sm"
        >+</button>
      </div>
    </div>
  )
}
