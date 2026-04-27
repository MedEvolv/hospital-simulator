'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Disclaimer from '@/components/Disclaimer'
import { HospitalFloorLoading } from '@/components/HospitalFloor'
import { SESSION_KEY, CAPACITY_KEY, type SimulationParams } from '@/lib/types'

type Profile = SimulationParams['profile']

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
  const [profile, setProfile] = useState<Profile>('Government Hospital')
  const [duration, setDuration] = useState<number>(120)
  const [seed, setSeed] = useState<number>(42)
  const [patientsPerHour, setPatientsPerHour] = useState<number>(6)
  const [erCapacity, setErCapacity] = useState<number>(2)
  const [opdCapacity, setOpdCapacity] = useState<number>(4)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runSimulation() {
    setLoading(true)
    setError(null)
    try {
      const surveyData = sessionStorage.getItem('im_survey')

      // Persist capacity config so results page & floor can read it
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
    <main className="max-w-3xl mx-auto px-6 py-16">
      <header className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase">
            Institutional Mirror
          </p>
          <button
            onClick={() => router.push('/survey')}
            className="text-xs text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded transition-colors"
          >
            Context survey →
          </button>
        </div>
        <h1 className="text-5xl font-light text-slate-50 tracking-tight mb-4">
          What did this cost us?
        </h1>
        <p className="text-lg text-slate-300 leading-relaxed">
          A governance simulator for hospital emergency departments.
        </p>
      </header>

      <section className="border border-slate-800 rounded-lg p-6 mb-8 bg-slate-900/40">
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          Most hospital performance tools tell you how well you&rsquo;re doing. This one tells
          you what it cost you to get there &mdash; the harms absorbed, values drifted from,
          and tensions left unresolved behind your throughput numbers.
        </p>
        <p className="text-sm text-slate-400 leading-relaxed">
          <span className="text-slate-200">This tool does not evaluate your hospital. It helps your hospital evaluate itself.</span>{' '}
          It runs on synthetic data and parameterised profiles, so it is useful before any AI
          system is deployed &mdash; as a rehearsal for the governance questions that deployment
          will force.
        </p>
      </section>

      <section className="space-y-6 mb-8">
        <div>
          <label className="block text-xs font-mono text-slate-400 tracking-widest uppercase mb-3">
            Institutional profile
          </label>
          <div className="grid grid-cols-1 gap-2">
            {PROFILES.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setProfile(p.value)}
                className={`text-left border rounded-lg p-4 transition-colors ${
                  profile === p.value
                    ? 'border-slate-400 bg-slate-800'
                    : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                }`}
              >
                <p className="text-sm text-slate-100 font-medium">{p.label}</p>
                <p className="text-xs text-slate-400 mt-1">{p.blurb}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between mb-3">
            <label className="text-xs font-mono text-slate-400 tracking-widest uppercase">
              Duration
            </label>
            <span className="text-sm text-slate-300 tabular-nums">
              {duration} ticks <span className="text-slate-500">&middot; ~{Math.round(duration / 6)} simulated hours</span>
            </span>
          </div>
          <input
            type="range"
            min={30}
            max={200}
            step={5}
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            className="w-full accent-slate-400"
          />
        </div>

        {/* ── Capacity inputs ─────────────────────────────────── */}
        <div>
          <label className="block text-xs font-mono text-slate-400 tracking-widest uppercase mb-3">
            Department capacity
          </label>
          <div className="grid grid-cols-3 gap-3">
            <CapacityInput
              label="Patients / hr"
              value={patientsPerHour}
              min={1} max={20}
              onChange={setPatientsPerHour}
            />
            <CapacityInput
              label="ER beds"
              value={erCapacity}
              min={1} max={8}
              onChange={setErCapacity}
            />
            <CapacityInput
              label="OPD beds"
              value={opdCapacity}
              min={1} max={12}
              onChange={setOpdCapacity}
            />
          </div>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Higher patient volume with limited beds generates more moral trade-offs.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showAdvanced ? '▲ Hide advanced' : '▼ Advanced (seed)'}
          </button>
          {showAdvanced && (
            <div className="mt-3">
              <label className="block text-xs font-mono text-slate-400 tracking-widest uppercase mb-2">
                Random seed
              </label>
              <input
                type="number"
                value={seed}
                onChange={e => setSeed(Number(e.target.value))}
                className="w-32 bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-slate-100 tabular-nums focus:outline-none focus:border-slate-600"
              />
              <p className="text-xs text-slate-500 mt-2">
                Same seed + same profile produces identical runs.
              </p>
            </div>
          )}
        </div>
      </section>

      <button
        onClick={runSimulation}
        disabled={loading}
        className="w-full bg-slate-50 text-slate-950 font-medium py-4 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Running simulation…' : 'Run simulation'}
      </button>

      {loading && (
        <div className="mt-6 space-y-3">
          <p className="text-xs text-slate-500 text-center">
            Simulating patient arrivals, triage decisions, and institutional responses.
          </p>
          <HospitalFloorLoading />
        </div>
      )}

      {error && (
        <div className="mt-4 border border-red-900 bg-red-950/40 rounded p-4">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      <Disclaimer />
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
    <div className="border border-slate-800 rounded-lg p-3 bg-slate-900/60">
      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-7 h-7 flex items-center justify-center border border-slate-700 rounded text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors text-sm font-mono"
        >−</button>
        <span className="text-xl font-light text-slate-100 tabular-nums w-8 text-center">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-7 h-7 flex items-center justify-center border border-slate-700 rounded text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors text-sm font-mono"
        >+</button>
      </div>
    </div>
  )
}
