'use client'

import Link from 'next/link'

// ── DPDP section alignment ─────────────────────────────────────────────────────
interface DSection {
  sec: string
  label: string
  quote: string
  response: string
}

const SECTIONS: DSection[] = [
  {
    sec: '5 & 6', label: 'Consent · Purpose Limitation',
    quote: 'Consent must be free, informed, specific, conditional, and capability-based. Consent must be unbundled from other matters and is limited to the purpose for which it was given.',
    response: 'The Mirror processes no personal data. It operates on synthetic institutional data generated for governance rehearsal, so no consent basis is required — a structural compliance posture rather than a workflow. The ontological disclaimer visible on every screen encodes the single, fixed purpose (governance rehearsal, not clinical work), so there is no purpose-drift liability. Where a hospital wants to pilot an AI tool on live data, the consent audit is step one of its Monday-Morning Protocol; the Mirror rehearse that audit under stress, ahead of any real deployment.',
  },
  {
    sec: '8', label: 'Automated Decision-Making & Profiling',
    quote: 'The data fiduciary shall give the data principal meaningful information about the logic involved, and at least one human intervention to obtain and convey their point of view, where a decision is taken based solely on automated processing.',
    response: 'The Mirror does not invoke §8 — it rehearses it. Its refusal mechanism produces, in simulation: a logged decision the system could not make, a stated reason (value misalignment / uncertainty band exceeded / harm threshold), and a human-review handoff. This is the audit trail §8(4) asks for, pre-deployment. Where §8 guarantees a human review path, the Mirror rehearse whether that path stays live: the value-drift signal measures whether human review is degrading into automation bias — the quality question §8(3) guarantees but does not verify.',
  },
  {
    sec: '9', label: 'Data Breach Notification',
    quote: 'The data fiduciary shall give notice to the Data Principal and the Data Protection Authority of any personal data breach.',
    response: 'The Mirror provides the institutional analogue: value-drift detection is the breach-detection layer for institutional behaviour. Where DPDP §9 detects a data breach, the Mirror detects a governance-drift breach — staff overrides quietly stopping, throughput bought with care shortcuts, trust eroding under load. The same detection-assess-respond logic DPDP uses for data the Mirror applies to behaviour. Neither law nor standard yet asks institutions to rehearse this before deployment; the Mirror does.',
  },
  {
    sec: 'Joint Data Fiduciary (Rules, 2025)', label: 'Shared Liability',
    quote: 'Where two or more data fiduciaries jointly determine the purpose and means of processing, each is liable for the entire obligation.',
    response: 'When a hospital partners with an AI vendor, they share accountability. The Mirror introduces no new fiduciary relationship with patients: it is a rehearsal tool operating on synthetic data, cleanly separable from any clinical or patient-facing deployment. The hospital remains the data fiduciary for its own operational data; the Mirror produces no data-principal touchpoints. This keeps vendor partnerships legible and bounded.',
  },
]

// ── The implementation gap DPDP cannot reach ───────────────────────────────────
const GAP_POINTS = [
  {
    title: 'Governance rehearsal under stress',
    body: 'DPDP lets institutions audit data flows and consent chains, but it cannot rehearse algorithmic-governance failure under strain. The Mirror stress-tests the human-review pathways §8 guarantees — overrides, escalation, the point at which trust should refuse — before real patient data ever touches the system. DPDP detects after breach; the Mirror rehearses before failure.',
  },
  {
    title: 'Synthetic-data compliance posture',
    body: 'Institutions hesitate to pilot because liability attaches to real patient data. The Mirror rehearses on synthetic institutional data: the governance posture is proven without the consent audit, the anonymisation trap, or the breach-liability surface that blocks piloting on live data. The anonymisation trap — de-identification does not equal legal anonymisation once metadata links to patient IDs — is eliminated by design.',
  },
  {
    title: 'Institutional accountability, not just data accountability',
    body: 'DPDP remedies are data-centric. When an AI system causes harm, the data fiduciary is liable — but institutional behaviour drift is invisible to DPDP. The Mirror makes that drift legible: value-drift score, refusal count, stress under load. It is the breach-detection layer for behaviour the way DPDP §9 is for data.',
  },
]

// ── The wider governance stack: DPDP · SAHI · NABH (floor · direction · bar) ────
const STACK = [
  {
    name: 'DPDP',
    tag: 'Floor',
    nature: 'Data-protection law · Govt. of India',
    nameClass: 'text-slate-800',
    tagClass: 'bg-slate-100 text-slate-600 border-slate-300',
    gives: 'The legal floor — non-negotiable accountability for consent, data principal rights, automated decision-making with human review, and breach liability.',
    lacks: 'Silent on AI governance itself: no algorithmic impact assessment, no model-audit requirement, no behavioural monitoring under stress.',
  },
  {
    name: 'SAHI',
    tag: 'Direction',
    nature: 'National strategy · MoHFW, Feb 2026',
    nameClass: 'text-sky-700',
    tagClass: 'bg-sky-900/40 text-sky-700 border-sky-200/60',
    gives: 'The direction — five pillars, seven guiding principles, priority actions for trustworthy AI in healthcare.',
    lacks: 'No implementation tool for institutions with no IT staff, no governance committee, and no budget for either.',
  },
  {
    name: 'NABH Digital Health Standards',
    tag: 'Bar',
    nature: 'Accreditation standard · 2nd Ed, Sep 2025',
    nameClass: 'text-emerald-300',
    tagClass: 'bg-emerald-900/30 text-emerald-300 border-emerald-800/60',
    gives: 'The bar — 182 objective elements defining a digital-maturity baseline, including CDSS adoption and information management.',
    lacks: 'Assumes deployed systems behave. No failure-mode rehearsal under stress.',
  },
]

export default function DpdpPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-14">
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-10">
        <p className="text-xs font-mono text-slate-500 tracking-widest uppercase">
          Institutional Mirror v2 · Policy Alignment
        </p>
        <Link href="/" className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded transition-colors">
          ← Home
        </Link>
      </div>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="mb-10">
        <h1 className="text-4xl font-light text-slate-900 tracking-tight mb-4">
          Alignment with India&rsquo;s DPDP Act
        </h1>
        <p className="text-lg text-slate-700 leading-relaxed mb-4">
          How Institutional Mirror responds to the Digital Personal Data Protection (DPDP) Act, 2023
          and the Data Protection Rules, 2025 — India&rsquo;s data-protection floor for healthcare AI.
        </p>
        <div className="border-l-2 border-slate-800 pl-4 py-1">
          <p className="text-sm text-slate-700 leading-relaxed">
            We are not replacing DPDP. We are rehearsing what DPDP protects: that a hospital&rsquo;s AI
            governance holds when the system is stressed, before any patient data ever enters the
            equation.
          </p>
        </div>
      </header>

      {/* ── What DPDP is ────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">What DPDP is</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          The Digital Personal Data Protection Act, 2023 — with the 2025 Rules — governs the
          processing of digital personal data. It establishes the data fiduciary, the data principal,
          explicit consent, data principal rights (access, correction, erasure, portability),
          automated decision-making with a right to human review, breach notification, and a penalty
          regime reaching <span className="text-slate-800 font-medium">up to &#8376;250 crore</span>.
          It is a generic privacy law: it governs personal-data processing, regardless of whether the
          processor is an AI system.
        </p>
        <div className="border border-slate-200 rounded-lg p-4 bg-white/40">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">What it governs</p>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>Consent architecture (Sections 5 &amp; 6 — unbundled, granular, purpose-limited)</li>
            <li>Data principal rights (Section 7)</li>
            <li>Automated decision-making + human review (Section 8)</li>
            <li>Breach detection and notification (Section 9)</li>
            <li>Joint data fiduciary liability (Rules, 2025)</li>
          </ul>
        </div>
      </section>

      {/* ── Where DPDP is strong — and where it is silent ───────────── */}
      <section className="mb-10 border border-slate-200 rounded-lg p-6 bg-white/40">
        <h2 className="text-sm font-medium text-slate-800 mb-3">Where DPDP is strong — and where it is silent</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-3">
          DPDP is authoritative on <span className="text-slate-800">data-processing accountability:</span>
          the consent architecture, the data-principal rights, the breach-liability surface.
          Institutions that get this wrong face penalties up to &#8376;250 crore, personally.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          It is <span className="text-slate-800">silent on AI governance itself:</span> no definition of AI, no
          model-audit requirement, no algorithmic impact assessment, no obligation to monitor
          algorithmic behaviour post-deployment, and no notion of institutional value drift or
          behavioural governance under stress. Section 8 is the one bridge — it treats automated
          decision-making as a data-processing consequence, not a system-of-systems governance
          problem. The gap between what DPDP protects and what AI governance requires is precisely
          the gap the Mirror fills.
        </p>
      </section>

      {/* ── Section-by-section alignment ────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
          Section-by-section alignment
        </h2>
        <div className="space-y-4">
          {SECTIONS.map(s => (
            <div key={s.sec} className="border border-slate-200 rounded-lg p-5 bg-white/30">
              <div className="flex items-baseline gap-3 mb-1.5">
                <span className="text-xs font-mono text-slate-600">Section {s.sec}</span>
                <h3 className="text-sm font-medium text-slate-800">{s.label}</h3>
              </div>
              <p className="text-sm text-slate-600 italic leading-relaxed mb-3 border-l border-slate-300 pl-3">
                &ldquo;{s.quote}&rdquo;
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{s.response}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The gap DPDP cannot reach ────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
          What DPDP cannot rehearse — and what the Mirror provides
        </h2>
        <div className="space-y-3">
          {GAP_POINTS.map((g, i) => (
            <div key={i} className="border border-slate-200 rounded-lg p-5 bg-white/30">
              <div className="flex items-baseline gap-3 mb-1.5">
                <span className="text-sm font-mono text-slate-600">{i + 1}</span>
                <h3 className="text-sm font-medium text-slate-800">{g.title}</h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed pl-7">{g.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The wider governance stack ───────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
          The wider governance stack
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-3">
          No single instrument governs AI in healthcare. A hospital deploying AI in 2026 answers to three
          at once &mdash; and the same gap runs through all of them.
        </p>
        <p className="text-sm text-slate-700 leading-relaxed mb-6">
          <span className="text-slate-800">DPDP is the floor.</span>{' '}
          <span className="text-sky-700">SAHI is the direction.</span>{' '}
          <span className="text-emerald-300">NABH Digital Health Standards is the bar.</span>{' '}
          Each tells institutions to adopt, comply, and be trustworthy. None of them lets the institution
          rehearse what happens when its AI governance actually fails.
        </p>

        <div className="space-y-3">
          {STACK.map(s => (
            <div key={s.name} className="border border-slate-200 rounded-lg p-5 bg-white/30">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className={`text-sm font-medium ${s.nameClass}`}>{s.name}</span>
                <span className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${s.tagClass}`}>
                  {s.tag}
                </span>
                <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">{s.nature}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">What it gives</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{s.gives}</p>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">What it does not</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.lacks}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 border-l-2 border-slate-800 pl-4 py-1">
          <p className="text-sm text-slate-700 leading-relaxed">
            India now has the strategy (SAHI, 2026), the accreditation bar (NABH Digital Health Standards,
            2025), and the data-protection floor (DPDP, 2023–25). Together they tell hospitals to adopt
            clinical AI, mature their digital operations, and protect patient data. What none of them
            provides is a way to rehearse governance failure &mdash; to watch trust erode, ethical debt
            accumulate, and human review degrade under a deterministic, repeatable stress test, before any
            of it happens to real patients. Institutional Mirror is that rehearsal layer: it operationalises
            SAHI&rsquo;s oversight and accountability principles, stress-tests the digital maturity NABH
            certifies, and rehearses the data-protection obligations DPDP imposes &mdash; all on synthetic
            data, before a single patient datum enters the equation.
          </p>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed mt-3">
          A scenario-based governance simulation on synthetic data. It does not predict reality, make clinical
          decisions, or evaluate real patients &mdash; itself an expression of the safety and data-protection
          principles the stack is built on.
        </p>
      </section>

      {/* ── Citation ────────────────────────────────────────────────── */}
      <section className="border-t border-slate-200 pt-6">
        <p className="text-xs text-slate-600 leading-relaxed mb-2">
          Government of India, Ministry of Electronics and Information Technology.{' '}
          <a
            href="https://www.meity.gov.in/content/digital-personal-data-protection-act-2023"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-800 underline decoration-slate-300 hover:decoration-slate-800 transition-colors"
          >
            <span className="italic">Digital Personal Data Protection (DPDP) Act, 2023 and Data Protection Rules, 2025.</span>
          </a>{' '}
          Referenced as the data-protection floor for healthcare AI.
        </p>
        <p className="text-xs text-slate-600 leading-relaxed">
          This alignment record maps the DPDP provisions Institutional Mirror most directly responds to.
          It is a living document, updated as the work and DPDP guidance evolve. Section quotes are
          paraphrased from the published act for reference. Links point to the official published sources
          and were revalidated August 2026.
        </p>
      </section>
    </main>
  )
}
