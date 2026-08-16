/**
 * Scenario Sandbox — /sandbox
 *
 * Side-by-side governance scenario comparison.
 * Run two scenarios with different parameter configurations
 * and compare their institutional outcomes.
 */

import ScenarioSandbox from '@/components/ScenarioSandbox'
import Link from 'next/link'
import AssumptionsPanel from '@/components/AssumptionsPanel'

export const metadata = {
  title: 'Scenario Studio — Institutional Mirror v2',
  description: 'Compare two governance scenarios side-by-side with configurable parameters.',
}

export default function SandboxPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* ── Top navigation bar ─────────────────────────────────────────────── */}
      <div className="border-b border-slate-200/60 bg-slate-50/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/home" className="text-[10px] font-mono text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest">
              ← Home
            </Link>
            <span className="text-slate-800">|</span>
            <span className="text-xs font-mono text-slate-600 tracking-wider">Scenario Studio</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/results"
              className="text-[10px] font-mono text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest"
            >
              Results
            </Link>
            <Link
              href="/governance"
              className="text-[10px] font-mono text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest"
            >
              Governance Console
            </Link>
            <Link
              href="/inspector"
              className="text-[10px] font-mono text-slate-500 hover:text-slate-700 transition-colors uppercase tracking-widest"
            >
              Inspector
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* ── Ontological disclaimer ─────────────────────────────────────────── */}
        <div className="border border-slate-200 bg-white/40 rounded-lg px-4 py-2.5 mb-8 flex items-center gap-3">
          <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest shrink-0">Notice</span>
          <p className="text-xs text-slate-500 leading-relaxed">
            This is a scenario-based governance simulation. It does not predict reality.
          </p>
        </div>

        {/* ── Page header ────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-2">
            Institutional Mirror v2 · Phase 4
          </p>
          <h1 className="text-2xl font-light text-slate-900 mb-3">
            Scenario Studio
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
            Configure two independent simulation slots, run different governance scenarios
            with adjusted parameters, and compare institutional outcomes across all five
            governance signals.
          </p>
        </div>

        {/* ── How to use ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            {
              step: '01',
              title: 'Select scenarios',
              description: 'Pick a governance stress-test scenario for each slot. You can run the same scenario with different parameters.',
            },
            {
              step: '02',
              title: 'Adjust parameters',
              description: 'Override staffing level, patient load, AI autonomy, and governance maturity independently per slot.',
            },
            {
              step: '03',
              title: 'Compare outcomes',
              description: 'Run both slots and read the comparative governance analysis — PSS, PES, SSS, EIC, and STI side by side.',
            },
          ].map(item => (
            <div key={item.step} className="border border-slate-200 rounded-lg p-4 bg-white/20">
              <p className="text-[10px] font-mono text-slate-700 mb-1">{item.step}</p>
              <p className="text-xs font-medium text-slate-700 mb-1.5">{item.title}</p>
              <p className="text-[11px] text-slate-500 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        {/* ── Sandbox component ──────────────────────────────────────────────── */}
        <ScenarioSandbox />

        {/* ── Assumptions ───────────────────────────────────────────────────── */}
        <div className="mt-10">
          <AssumptionsPanel compact />
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <div className="mt-12 pt-6 border-t border-slate-200/50 flex items-center justify-between">
          <p className="text-[10px] font-mono text-slate-700">
            Institutional Mirror v2 · Governance Stress-Test Environment
          </p>
          <div className="flex items-center gap-4">
            <Link href="/export" className="text-[10px] font-mono text-slate-600 hover:text-slate-600 transition-colors">
              Export →
            </Link>
            <Link href="/inspector" className="text-[10px] font-mono text-slate-600 hover:text-slate-600 transition-colors">
              Inspector →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
