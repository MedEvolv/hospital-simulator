'use client'

import Link from 'next/link'
import Disclaimer from '@/components/Disclaimer'

// ── The two models ────────────────────────────────────────────────────────────

const MODELS = [
  {
    id: 'advisor',
    name: 'Governance Advisor',
    role: 'H-module · slow planning',
    tagline: 'Situation → instruments → pillars → gaps → plan that lands at Monday.',
    explanation:
      'The Advisor is the H-module of the estate\u2019s hierarchical reasoning pair. Given a healthcare-AI situation — a deployment, a policy question, a governance failure — it produces the applicable Indian instruments by name (DPDP, CDSCO, SAHI, ICMR, NHRP, ABDM, BODH, NABH, MeitY), maps them to the five consensus pillars (C1 lifecycle, C2 data governance, C3 validation, C4 oversight realism, C5 outcomes), names which of the four governance gaps applies, and composes a 3–5 step plan that ends in one concrete Monday action.',
    discipline:
      'It never executes. It plans in 3–5 steps and hands each step to the Auditor. It advances only after the Auditor reports equilibrium — the HRM convergence condition, enforced as code, not habit.',
    sampleLabel: 'Sample output — a tier-2 hospital deploys an LLM that screens chest X-rays for TB (validated on a Delhi dataset):',
    sample: [
      'Instruments: BODH · DPDP · NHRP · SAHI',
      'Pillars: C1 lifecycle · C2 data · C3 validation · C4 oversight · C5 outcomes',
      'Gaps: implementation cliff · generative blind spot · participation deficit · agentic horizon',
      'Plan: (1) audit the consent basis (DPDP: unbundled consent) → (2) name a governance owner and escalation path (SAHI Rec 19 + 22) → (3) establish local validation evidence (NHRP 4.6.4 / BODH) → (4) land at Monday: one owner, one action, one logged decision.',
    ],
  },
  {
    id: 'auditor',
    name: 'Decision Auditor',
    role: 'L-module · fast classification',
    tagline: 'Action → tier → instrument checklist → one atomic verification.',
    explanation:
      'The Auditor is the L-module. Given an action in a healthcare-AI context, it classifies it into the decision lattice — T0 autonomous, T1 confirmable, T2 human-required, T3 prohibited — using the same lattice that enforces the estate\u2019s own operations. It then produces the instrument checklist the action must satisfy (what DPDP, CDSCO, SAHI, NABH demand of it) and defines exactly ONE atomic verification step. It never plans beyond one action.',
    discipline:
      'The tier is deterministic — never an LLM call. When the classification is ambiguous, the Auditor escalates to the Advisor rather than guessing. Every audit ends with the equilibrium report that lets the H-module advance.',
    sampleLabel: 'Sample output — "publish the Four Gaps analysis publicly on LinkedIn":',
    sample: [
      'Tier: T2 — Human-required (bhai approval queues before any action).',
      'Checklist: SAHI Rec 6 — communication of use, limits, risk.',
      'Verify: the publication text cites only instruments present in the curriculum (citation guard).',
      'Equilibrium: reported.',
    ],
  },
]

// ── The guardrails ────────────────────────────────────────────────────────────

const GUARDRAILS = [
  {
    title: 'Citation guard',
    body: 'Every instrument name and clause number the models cite must exist in the curriculum. Anything invented is rejected at runtime — the hallucination gate, enforced in production, not just in evaluation. Held-out test score: 1.0 citation validity, zero fabricated instruments.',
  },
  {
    title: 'Decision-support, not auto-action',
    body: 'The models propose and classify. They never act. The decision lattice remains the enforcer; the Builder decides. A T2 classification queues for human approval; a T3 classification is structurally blocked.',
  },
  {
    title: 'Two layers, one floor',
    body: 'The knowledge layer (curriculum signals + instrument cards) runs always and costs nothing. The optional DeepSeek layer adds prose refinement when enabled — but the tier classification never touches an LLM.',
  },
  {
    title: 'No overfitting',
    body: 'Trained against a held-out eval set that never entered the curriculum. Final scores: instrument recall 0.85, novelty recall 1.0, tier accuracy 0.90. The fitting loop stops when two consecutive rounds show no movement — stability, not chasing the training set.',
  },
]

// ── How they run ──────────────────────────────────────────────────────────────

export default function GovernanceModelsPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-14">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-10">
        <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-2">
          Institutional Mirror v2 · Governance Models
        </p>
        <h1 className="text-4xl font-light text-slate-900 tracking-tight mb-4">
          Two Governance Models, Trained on the Estate\u2019s Own Policy
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          The Mirror simulates governance under strain. These two models reason about it.
          Trained on the healthcare-AI policy corpus — the instrument stack, the four gaps,
          the five consensus pillars, the decision lattice — they form a hierarchical pair:
          one plans, one verifies, neither acts. They are the estate\u2019s answer to the
          question the Mirror poses: <span className="text-slate-800">who thinks about the
          system while the system is thinking?</span>
        </p>
      </div>

      {/* ── The H/L split ──────────────────────────────────────────────── */}
      <div className="border border-slate-200 rounded-lg bg-slate-50 p-5 mb-12">
        <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">
          The HRM split
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-slate-800 mb-1">H-module — slow</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Abstract reasoning. Plans 3–5 steps maximum. Never touches execution.
              Advances only when the L-module reports equilibrium.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800 mb-1">L-module — fast</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              One atomic action per cycle: classify, checklist, verify, close.
              Escalates ambiguity to the H-module instead of guessing.
            </p>
          </div>
        </div>
      </div>

      {/* ── The two models ─────────────────────────────────────────────── */}
      <div className="space-y-10 mb-14">
        {MODELS.map(m => (
          <section key={m.id} className="border-b border-slate-200 pb-10">
            <div className="flex items-baseline gap-3 mb-2">
              <h2 className="text-2xl font-light text-slate-900">{m.name}</h2>
              <span className="text-xs font-mono text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                {m.role}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-700 mb-3">{m.tagline}</p>
            <p className="text-sm text-slate-600 leading-relaxed mb-3">{m.explanation}</p>
            <p className="text-sm text-slate-600 leading-relaxed mb-5">
              <span className="text-slate-800 font-medium">Discipline: </span>{m.discipline}
            </p>
            <div className="border border-slate-200 rounded-lg p-4 bg-white">
              <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">
                {m.sampleLabel}
              </p>
              <ul className="space-y-2">
                {m.sample.map((line, i) => (
                  <li key={i} className="text-xs text-slate-700 font-mono leading-relaxed">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>

      {/* ── Guardrails ─────────────────────────────────────────────────── */}
      <div className="mb-14">
        <h2 className="text-2xl font-light text-slate-900 mb-6">The guardrails</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {GUARDRAILS.map(g => (
            <div key={g.title} className="border border-slate-200 rounded-lg p-5">
              <p className="text-sm font-medium text-slate-800 mb-2">{g.title}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{g.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── How they run ───────────────────────────────────────────────── */}
      <div className="border border-slate-200 rounded-lg p-6 mb-12">
        <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-4">
          How they run
        </p>
        <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
          The models run on the estate&rsquo;s own runtime — the same code that
          produced the sample outputs above. The tier classification is
          deterministic and never an LLM call; every decision is logged to an
          append-only record; and T2 actions queue for human approval. The full
          documentation set, training report, and instrument cards live in the
          governance curriculum. When the live console is up, it is reachable
          through a cloudflared tunnel from the estate — the tunnel lives only
          while the host machine is on, by design.
        </p>
      </div>

      {/* ── Related ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Link
          href="/sahi"
          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded transition-colors"
        >
          ← SAHI alignment
        </Link>
        <Link
          href="/dpdp"
          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded transition-colors"
        >
          ← DPDP alignment
        </Link>
        <Link
          href="/"
          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded transition-colors"
        >
          ← Run a scenario
        </Link>
        <Link
          href="/governance"
          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded transition-colors"
        >
          ← Governance console
        </Link>
      </div>

      <Disclaimer />
    </main>
  )
}
