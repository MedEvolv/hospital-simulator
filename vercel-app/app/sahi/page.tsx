'use client'

import Link from 'next/link'

// ── SAHI pillars ────────────────────────────────────────────────────────────────
const PILLARS = [
  { n: 'I',   label: 'Governance, Regulation, and Trust' },
  { n: 'II',  label: 'Health Data and Digital Infrastructure' },
  { n: 'III', label: 'Workforce, Institutional Capacity, and Change Management' },
  { n: 'IV',  label: 'Research, Innovation, and Evidence Generation' },
  { n: 'V',   label: 'Ecosystem Enablement and Global Leadership' },
]

/** Inherited from IndiaAI Governance Guidelines 2025, as printed in the SAHI PDF. */
const SUTRAS = [
  'Trust is the foundation',
  'People first',
  'Innovation over Restraint',
  'Fairness and Equity',
  'Accountability',
  'Understandable by design',
  'Safety, Resilience and Sustainability',
]

// ── Recommendation-by-recommendation alignment (from SAHI_ALIGNMENT.md) ─────────
interface Rec {
  n: number
  pillar: string
  quote: string
  response: string
  status?: 'future'
  highlight?: boolean
}

const RECS: Rec[] = [
  {
    n: 1, pillar: 'I · §4.1.1',
    quote: 'AI solutions in healthcare must be classified based on their likelihood to cause harm and made subject to appropriate regulatory and operational obligations commensurate to the level of risk they pose.',
    response: 'Institutional Mirror positions itself as a governance and self-reflection tool — not a clinical decision system, triage tool, or diagnostic aid. The moral reckoning layer classifies events by harm type and severity (INFO / MEDIUM / HIGH / CRITICAL). The forced-vs-avoidable harm distinction operationalises risk-proportionate thinking: it separates capacity-constrained harm (structural risk) from allocation-driven harm (operational risk, within governance reach). The tool is risk-classified by design — it makes no clinical recommendations and produces no patient-level outputs.',
  },
  {
    n: 2, pillar: 'I · §4.1.1',
    quote: 'Measures should be put in place to ascertain the accountability of different actors in the AI healthcare ecosystem so that liability for harms caused can be appropriately allocated.',
    response: 'The Legal Counsel lens of the role-aware report reframes every output in accountability language: who made which decision, what escalated to human oversight, what was documented. Every refusal event is a documented instance of the system declining to act autonomously and escalating to review. The Separation of Powers architecture — the engine does not score itself, the scoring layer does not modify the simulation — models the clear actor separation SAHI calls for.',
  },
  {
    n: 3, pillar: 'I · §4.1.1',
    quote: 'Safety should be embedded across all stages of the AI lifecycle, with clear metrics developed and adopted to assess safety, bias, interoperability, and real-world use.',
    response: 'The five-metric framework (PSS · PES · SSS · EIC · STI) is designed to prevent single-metric optimisation — the most common failure mode of safety metrics in healthcare AI. Metrics are always displayed separately, never collapsed into a composite. Value drift detection measures the gap between declared safety commitments and observed operational behaviour — the "real-world use" monitoring SAHI calls for but provides no mechanism to achieve.',
  },
  {
    n: 5, pillar: 'I · §4.1.2',
    quote: 'High-impact AI applications should assess and address potential inequity impact as part of design, evaluation, and deployment decisions.',
    response: 'The Equity dimension is embedded in the declared-values framework of every institutional profile. Equity drift — the gap between declared commitment to equitable care and observed behaviour — is tracked separately. The harm classification layer detects equity breaches explicitly (e.g. admission declined on insurance-status grounds when clinical urgency was equivalent). The Government Hospital profile models equity-first allocation under constraint, demonstrating what genuine equity commitment costs operationally.',
  },
  {
    n: 6, pillar: 'I · §4.1.3',
    quote: 'AI applications should be transparent and explicitly communicate use, limitations, and risk in a form that intended users can understand.',
    response: 'The ontological disclaimer — visible on every screen — states what the tool is and is not, as a non-negotiable design constraint. The role-aware report translates technical outputs into language appropriate for each reader (Medical Superintendent, Legal Counsel, Quality Lead, COO). The plain-English summary at the top of every results screen ensures the most important findings are communicated without requiring technical literacy.',
  },
  {
    n: 7, pillar: 'I · §4.1.3',
    quote: 'AI applications should be monitored post-deployment for performance changes, model drift, bias, and other unintended consequences.',
    response: 'Value drift detection implements SAHI’s post-deployment monitoring — applied to institutional behaviour rather than model performance. SAHI’s monitoring recommendation is typically read as technical (model accuracy over time); the deeper governance problem is institutional — whether the humans and institutions deploying AI continue to behave consistently with declared values as systems scale. This is the governance monitoring layer SAHI calls for but does not specify how to build.',
  },
  {
    n: 13, pillar: 'II · §4.2.3', status: 'future',
    quote: 'Appropriate cybersecurity standards, incident response protocols, and continuity planning for health data should be defined.',
    response: 'The same moral reckoning layer that detects value drift in clinical governance can detect drift in security governance: the gap between declared security policy and actual staff behaviour under cognitive load (the Staff Stress Score is a known predictor of security vulnerability). This alignment is recorded as the national-policy anchor for the cybersecurity human-risk module on the roadmap. SAHI Recommendation 13 provides the justification for building it.',
  },
  {
    n: 16, pillar: 'III · §4.3.1',
    quote: 'A role-based AI competency framework for the health sector should be promoted, defining expected levels of AI understanding and responsibility across clinical, administrative, frontline, and leadership roles.',
    response: 'SAHI’s FRAC approach (Roles, Activities, Competencies) is operationalised in the role-aware report: five reader roles receive differentiated narratives — Medical Superintendent (clinical governance), Quality Lead (patient safety), Legal Counsel (accountability), COO (operational/resource), Research & Governance (methodology). Different competency levels receive information pitched at their level of authority and responsibility.',
  },
  {
    n: 19, pillar: 'III · §4.3.2', highlight: true,
    quote: 'Designated AI units or nodal cells should be created within health departments and health institutions to lead AI strategy, use-case prioritisation, tool assessment, deployment oversight, and lifecycle management.',
    response: 'For a 120-bed district hospital with no IT department, this is currently an unfunded, unstaffed mandate. The AI Collective Healthcare Governance Cohort is a civil-society mechanism for bootstrapping this capacity: it embeds a cross-disciplinary team alongside a hospital, produces a governance artefact (charter, risk register, or SOP) that can found the institution’s AI governance function, and builds the competency that makes a future designated AI unit viable. Institutional Mirror is the tooling that makes that unit’s work legible and actionable.',
  },
  {
    n: 20, pillar: 'III · §4.3.2',
    quote: 'Structured collaboration and knowledge-exchange mechanisms should be established to enable continuous learning, research, and cross-jurisdictional sharing in support of ethical, context-appropriate AI adoption.',
    response: 'The AI Collective Delhi Chapter is the peer-learning community SAHI calls for. Cohort output artefacts are reusable and shareable — governance frameworks adapted to Indian resource constraints, not imported wholesale from Western models. Institutional Mirror’s public deployment (no institutional relationship required to run a simulation) directly enables cross-jurisdictional learning.',
  },
  {
    n: 21, pillar: 'III · §4.3.3',
    quote: 'AI tools should be embedded within existing clinical and public-health workflows to support decision-making without increasing burden or fragmentation. Roles and responsibilities for human and AI in workflows should be clearly defined, including oversight and escalation mechanisms.',
    response: 'The refusal mechanism is a direct implementation of SAHI’s escalation requirement: the system identifies decisions it cannot make within declared values and escalates them to human review, each documented with its reason. The Decision Inspector’s default view — showing only HIGH and CRITICAL events — integrates into existing governance workflows without creating alert fatigue.',
  },
]

const GAP_POINTS = [
  {
    title: 'Governance before AI is deployed',
    body: 'Institutional Mirror works for hospitals that have not yet deployed AI. It builds governance literacy and surfaces structural trade-offs before institutions face the consequences of ungoverned AI. SAHI calls for this but provides no tool for it.',
  },
  {
    title: 'Accessible without infrastructure',
    body: 'The tool requires a browser. No installation, no IT department, no API key, no institutional registration. We design for the institution as it is, not as policy assumes it to be.',
  },
  {
    title: 'Civil society as implementation mechanism',
    body: 'The cohort program demonstrates that SAHI Recommendation 19 — designated AI governance capacity — can be bootstrapped through structured civil-society programming rather than waiting for government mandate or institutional budget. Documented, replicable, and fundable.',
  },
]

// ── The wider governance stack: SAHI · NABH · DPDP ──────────────────────────────
// Static class strings (not interpolated) so Tailwind keeps them in the build.
const STACK = [
  {
    name: 'SAHI',
    tag: 'Direction',
    nature: 'National strategy · MoHFW, Feb 2026',
    nameClass: 'text-sky-700',
    tagClass: 'bg-sky-900/40 text-sky-700 border-sky-200/60',
    gives: 'The direction — five pillars, seven guiding principles, and priority actions for trustworthy AI in healthcare.',
    lacks: 'A way to test whether your institution actually lives those principles under stress.',
  },
  {
    name: 'NABH Digital Health Standards',
    tag: 'Bar',
    nature: 'Accreditation standard · 2nd Ed, Sep 2025',
    nameClass: 'text-emerald-300',
    tagClass: 'bg-emerald-900/30 text-emerald-300 border-emerald-800/60',
    gives: 'The bar — eight chapters and 182 objective elements defining a digital-maturity baseline, including CDSS adoption and information management.',
    lacks: 'Failure-mode rehearsal; it assumes the digital tools, once deployed, behave.',
  },
  {
    name: 'DPDP',
    tag: 'Floor',
    nature: 'Data-protection law · Govt. of India',
    nameClass: 'text-slate-800',
    tagClass: 'bg-slate-100 text-slate-600 border-slate-300',
    gives: 'The floor — the legal baseline for consent, personal-data handling, and the rights of the Data Principal.',
    lacks: 'Anything about clinical-AI safety, trust, or oversight quality.',
  },
]

export default function SahiPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-14">
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-10">
        <p className="text-xs font-mono text-slate-500 tracking-widest uppercase">
          Institutional Mirror v2 · Policy Alignment
        </p>
        <Link href="/home" className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded transition-colors">
          ← Home
        </Link>
      </div>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="mb-10">
        <h1 className="text-4xl font-light text-slate-900 tracking-tight mb-4">
          Alignment with India&rsquo;s SAHI strategy
        </h1>
        <p className="text-lg text-slate-700 leading-relaxed mb-4">
          How Institutional Mirror responds to the Strategy for Artificial Intelligence
          in Healthcare (SAHI), launched by the Ministry of Health and Family Welfare
          at the India AI Impact Summit, February 2026.
        </p>
        <div className="border-l-2 border-sky-700 pl-4 py-1">
          <p className="text-sm text-slate-700 leading-relaxed">
            We are not doing something parallel to national policy. We are implementing
            what national policy asked for &mdash; and providing the tooling to make it
            actionable at the institutional level where SAHI is silent.
          </p>
        </div>
      </header>

      {/* ── What SAHI is ────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">What SAHI is</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          India&rsquo;s first national framework for AI governance in healthcare, structured
          around five pillars. SAHI functions as a guiding and enabling framework rather than
          a prescriptive mandate &mdash; explicitly designed to support institutions, not replace
          their judgment.
        </p>
        <div className="grid grid-cols-1 gap-1.5">
          {PILLARS.map(p => (
            <div key={p.n} className="flex items-center gap-3 text-sm">
              <span className="font-mono text-xs text-slate-600 w-12 shrink-0">Pillar {p.n}</span>
              <span className="text-slate-700">{p.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Seven sutras (IndiaAI wording, not a new route) ─────────── */}
      <section className="mb-10 border border-slate-200 rounded-lg p-5 bg-white/30">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="text-xs font-mono text-slate-600">Governing principles</span>
          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border bg-sky-50 text-sky-800 border-sky-200">
            7 Sutras
          </span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed mb-3">
          SAHI inherits seven guiding principles from the IndiaAI Governance Guidelines
          (2025). Worded here as in the SAHI strategy PDF. The Mirror does not reprint
          the IndiaAI document and does not give the guidelines their own route.
        </p>
        <ol className="text-sm text-slate-700 space-y-1 list-decimal list-inside">
          {SUTRAS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>

      {/* ── Pillar IV · BODH (chip, not a new route) ────────────────── */}
      <section className="mb-10 border border-slate-200 rounded-lg p-5 bg-white/30">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="text-xs font-mono text-slate-600">Pillar IV</span>
          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border bg-sky-50 text-sky-800 border-sky-200">
            BODH
          </span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Pillar IV is research, innovation, and evidence generation. PIB (PRID 2229226,
          17 February 2026) launched BODH with SAHI as a benchmarking platform for
          testing health-AI tools before scale. It is voluntary. It is not a CDSCO or
          NABH gate. The Mirror does not run BODH benchmarks and does not give BODH
          its own route. Academic host names are omitted here; estate records still
          disagree.
        </p>
      </section>

      {/* ── Pillar IV · NHRP draft (chip, not a new route) ──────────── */}
      <section className="mb-10 border border-slate-200 rounded-lg p-5 bg-white/30">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="text-xs font-mono text-slate-600">Pillar IV · draft</span>
          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border bg-sky-50 text-sky-800 border-sky-200">
            NHRP
          </span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          The Department of Health Research published a draft National Health Research
          Policy 2026 for public opinion (F. No. T.11014/01/2020-HR, 6 July 2026).{' '}
          <a
            href="https://dhr.gov.in/static/uploads/2026/07/cd80b4d9af184586ae68364fc94849ad.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-700 underline decoration-sky-200 hover:decoration-sky-700 transition-colors"
          >
            dhr.gov.in draft PDF
          </a>
          . Clause 4.6.4.1 is a SHALL: standing capability for independent validation of
          health technologies, including methods for AI-based tools, and validation
          centres to be established or strengthened. That is draft text. It is not
          gazette, not a funded centre, and not BODH. PIB PRID 2296281 is not this
          policy. No /nhrp route.
        </p>
      </section>

      {/* ── Pillar II · CLCI / BHTS (chip; full floor on /abdm) ─── */}
      <section className="mb-10 border border-slate-200 rounded-lg p-5 bg-white/30">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="text-xs font-mono text-slate-600">Pillar II</span>
          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border bg-sky-50 text-sky-800 border-sky-200">
            CLCI / BHTS
          </span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Common LOINC Codes for India and the Bharat Health Terminology Service are NRCeS
          objects for semantic interoperability: a nationally curated lab-code subset and a
          FHIR terminology server (
          <a
            href="https://www.nrces.in/bhts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-700 underline decoration-sky-200 hover:decoration-sky-700 transition-colors"
          >
            nrces.in/bhts
          </a>
          ). They are the vocabulary floor Pillar II assumes. Not a new ethics code. Not a
          BODH benchmark. This page does not name academic hosts. The exchange floor is on{' '}
          <Link href="/abdm" className="text-sky-700 underline decoration-sky-200 hover:decoration-sky-700 transition-colors">
            /abdm
          </Link>
          .
        </p>
      </section>

      {/* ── The gap ─────────────────────────────────────────────────── */}
      <section className="mb-10 border border-slate-200 rounded-lg p-6 bg-white/40">
        <h2 className="text-sm font-medium text-slate-800 mb-3">Where SAHI is strong &mdash; and where it is silent</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-3">
          SAHI is authoritative on <span className="text-slate-800">what</span> India&rsquo;s
          healthcare-AI ecosystem needs. It is almost entirely silent on{' '}
          <span className="text-slate-800">how</span> a tier-2 or tier-3 hospital with no
          dedicated IT staff, no AI governance committee, and no budget for either is supposed
          to implement these recommendations.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          This is not a criticism &mdash; SAHI is a guiding framework, not an implementation
          manual. But it creates a concrete gap, and that gap is what this work fills.
        </p>
      </section>

      {/* ── Recommendation alignment ────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
          Recommendation-by-recommendation alignment
        </h2>
        <div className="space-y-4">
          {RECS.map(rec => (
            <div key={rec.n}
              className={`border rounded-lg p-5 ${
                rec.highlight ? 'border-sky-200/60 bg-sky-50/20' : 'border-slate-200 bg-white/30'
              }`}>
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-xs font-mono px-2 py-0.5 rounded font-medium ${
                  rec.highlight ? 'bg-sky-900/50 text-sky-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  Recommendation {rec.n}
                </span>
                <span className="text-[10px] font-mono text-slate-600 uppercase tracking-wider">{rec.pillar}</span>
                {rec.status === 'future' && (
                  <span className="text-[10px] font-mono text-amber-500 border border-amber-200/60 px-1.5 py-0.5 rounded uppercase tracking-wider">
                    Roadmap
                  </span>
                )}
                {rec.highlight && (
                  <span className="text-[10px] font-mono text-sky-600 uppercase tracking-wider">Most important</span>
                )}
              </div>
              <p className="text-sm text-slate-600 italic leading-relaxed mb-3 border-l border-slate-300 pl-3">
                &ldquo;{rec.quote}&rdquo;
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{rec.response}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What we fill ────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
          The implementation gap we fill
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

      {/* ── The wider governance stack (SAHI · NABH · DPDP) ──────────── */}
      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
          The wider governance stack
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-3">
          SAHI does not stand alone. A hospital governing AI in 2026 answers to three instruments at
          once &mdash; and the same gap runs through all of them.
        </p>
        <p className="text-sm text-slate-700 leading-relaxed mb-6">
          <span className="text-sky-700">SAHI is the direction.</span>{' '}
          <span className="text-emerald-300">NABH Digital Health Standards is the bar.</span>{' '}
          <span className="text-slate-800">DPDP is the floor.</span>{' '}
          Each tells institutions to adopt, comply, and be trustworthy. None of them lets the
          institution rehearse what happens when its AI governance actually fails.
        </p>

        {/* explainer graphic — three instruments, what each gives vs. withholds */}
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

        {/* NABH anchor — secondary, honestly framed */}
        <div className="mt-6 border border-emerald-900/40 rounded-lg p-6 bg-emerald-950/10">
          <h3 className="text-sm font-medium text-slate-800 mb-3">Complementing the NABH digital-maturity bar</h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-3">
            NABH Digital Health Standards is a digital-<span className="text-slate-800">maturity</span> standard,
            not an AI-governance framework. It tells a hospital to <span className="text-slate-800">adopt</span>{' '}
            clinical decision support and stand up digital operations &mdash; anchored most directly in
            Chapter 5 (Digital Operations Management) and Chapter 8 (Information Management System / CDSS).
          </p>
          <p className="text-sm text-slate-600 leading-relaxed">
            Institutional Mirror rehearses what an accreditation checklist cannot: what happens when reliance
            on those systems drifts, when overrides quietly stop, when throughput is bought with care
            shortcuts. It <span className="text-slate-800">complements</span> the maturity NABH certifies. It
            does not certify NABH conformance and is not an accreditation tool.
          </p>
        </div>

        {/* synthesis — drop-in §6 framing */}
        <div className="mt-6 border-l-2 border-sky-700 pl-4 py-1">
          <p className="text-sm text-slate-700 leading-relaxed">
            India now has the strategy (SAHI, 2026), the accreditation bar (NABH Digital Health Standards,
            2025), and the data-protection floor (DPDP). Together they tell hospitals to adopt clinical AI,
            mature their digital operations, and protect patient data. What none of them provides is a way to
            rehearse governance failure &mdash; to watch trust erode, ethical debt accumulate, and staff strain
            build under a deterministic, repeatable stress test, before any of it happens to real patients.
            Institutional Mirror is that rehearsal layer: it operationalises SAHI&rsquo;s oversight and
            accountability principles at the level of a single institution, and stress-tests the digital
            maturity NABH certifies.
          </p>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed mt-3">
          A scenario-based governance simulation on synthetic data. It does not predict reality, make clinical
          decisions, or evaluate real patients &mdash; itself an expression of the safety and data-protection
          principles the stack is built on.
        </p>
      </section>

      {/* ── Related ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Link
          href="/dpdp"
          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded transition-colors"
        >
          ← DPDP alignment
        </Link>
        <Link
          href="/nabh"
          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded transition-colors"
        >
          ← NABH alignment
        </Link>
        <Link
          href="/cdsco"
          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded transition-colors"
        >
          ← CDSCO alignment
        </Link>
        <Link
          href="/abdm"
          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded transition-colors"
        >
          ← ABDM alignment
        </Link>
        <Link
          href="/governance-models"
          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded transition-colors"
        >
          ← Governance Models
        </Link>
      </div>

      {/* ── Citation ────────────────────────────────────────────────── */}
      <section className="border-t border-slate-200 pt-6">
        <p className="text-xs text-slate-600 leading-relaxed mb-2">
          Ministry of Health and Family Welfare, Government of India.{' '}
          <a
            href="https://abdm.gov.in/publication/strategy-documents"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-700 underline decoration-sky-200 hover:decoration-sky-700 transition-colors"
          >
            <span className="italic">Strategy for Artificial Intelligence in Healthcare for India (SAHI).</span>
          </a>{' '}
          Launched at the India AI Impact Summit, February 17, 2026. Seven guiding
          principles inherited from the IndiaAI Governance Guidelines, 2025, as printed
          in that PDF.
        </p>
        <p className="text-xs text-slate-600 leading-relaxed mb-2">
          National Accreditation Board for Hospitals &amp; Healthcare Providers (NABH).{' '}
          <a
            href="https://nabh.co/digital-health-standards/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-300 underline decoration-emerald-800/40 hover:decoration-emerald-300 transition-colors"
          >
            <span className="italic">Digital Health Standards for Hospitals, 2nd Edition.</span>
          </a>{' '}
          September 2025. Referenced as digital-maturity context only; this work claims no NABH
          accreditation, conformance, or endorsement.
        </p>
        <p className="text-xs text-slate-600 leading-relaxed mb-2">
          Government of India.{' '}
          <a
            href="https://www.meity.gov.in/content/digital-personal-data-protection-act-2023"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-800 underline decoration-slate-300 hover:decoration-slate-800 transition-colors"
          >
            <span className="italic">Digital Personal Data Protection (DPDP) Act, 2023 and Rules.</span>
          </a>{' '}
          Referenced as the data-protection floor.
        </p>
        <p className="text-xs text-slate-600 leading-relaxed mb-2">
          Department of Health Research.{' '}
          <a
            href="https://dhr.gov.in/static/uploads/2026/07/cd80b4d9af184586ae68364fc94849ad.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-700 underline decoration-sky-200 hover:decoration-sky-700 transition-colors"
          >
            <span className="italic">Draft National Health Research Policy 2026.</span>
          </a>{' '}
          Public-opinion draft (F. No. T.11014/01/2020-HR). Not gazette. Not a funded
          validation-centre programme.
        </p>
        <p className="text-xs text-slate-600 leading-relaxed">
          This alignment record covers the recommendations Institutional Mirror most directly
          responds to. It is a living document, updated as the work and SAHI guidance evolve.
          Recommendation quotes are paraphrased from the published strategy for reference.
          Links point to the official published sources and were revalidated August 2026.
        </p>
      </section>
    </main>
  )
}
