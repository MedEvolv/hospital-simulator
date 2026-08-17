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
    response: 'The Mirror processes no personal data. It operates on synthetic institutional data generated for governance rehearsal, so no consent basis is required: a structural compliance posture rather than a workflow. The ontological disclaimer visible on every screen encodes the single, fixed purpose (governance rehearsal, not clinical work), so there is no purpose-drift liability. Where a hospital wants to pilot an AI tool on live data, the consent audit is step one of its Monday-Morning Protocol; the Mirror rehearses that audit under stress, ahead of any real deployment. Section 6 is the unbundled-consent hook for AI training. Diagnostic consent does not cover training.',
  },
  {
    sec: '8', label: 'General obligations of Data Fiduciary',
    quote: 'Section 8 is headed General obligations of Data Fiduciary. Where personal data is likely to be used to make a decision that affects the Data Principal, or disclosed to another Data Fiduciary, the fiduciary shall ensure its completeness, accuracy, and consistency.',
    response: 'That is 8(3): a data-quality duty on the records that feed a decision. It is not a patient right to inspect model internals, and it is not a statutory human-review workflow. The Mirror processes no personal data. What it rehearses is whether the inputs that would feed a decision stay complete, accurate, and consistent under strain. Section 8 creates no automated-decision right, no explainability right, and no right to human review. The string "human review" does not appear in the Act or in the DPDP Rules, 2025. Data Principal rights in the Act are exhaustively ss.11 (access), 12 (correction and erasure), 13 (grievance redressal), and 14 (nomination).',
  },
  {
    sec: '8(5) & 8(6)', label: 'Safeguards · Breach intimation',
    quote: 'The Data Fiduciary shall protect personal data by taking reasonable security safeguards to prevent a personal data breach, and shall intimate the Board and each affected Data Principal of a personal data breach in the prescribed form and manner.',
    response: '8(5) is the safeguard duty. 8(6) is breach intimation to the Board and to affected Data Principals. The Rs 250 crore ceiling sits on Schedule item 1, which attaches to an 8(5) failure. The Mirror does not file those notices. It rehearses the governance cascade before 8(6) or the CERT-In 6-hour clock starts on live systems.',
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
    body: 'DPDP lets institutions audit data flows and consent chains, but it cannot rehearse algorithmic-governance failure under strain. The Mirror stress-tests whether a human look stays live: overrides, escalation, the point at which trust should refuse, before real patient data ever touches the system. That human look is not a DPDP Section 8 right. It is NABL ISO 15189:2022 clause 7.3, NABH Digital Health Standards 2nd Edition, SAHI Rec 6 and Rec 22 (advisory), and professional duty. DPDP detects after breach; the Mirror rehearses before failure.',
  },
  {
    title: 'Synthetic-data compliance posture',
    body: 'Institutions hesitate to pilot because liability attaches to real patient data. The Mirror rehearses on synthetic institutional data: the governance posture is proven without the consent audit, the anonymisation trap, or the breach-liability surface that blocks piloting on live data. The anonymisation trap (de-identification does not equal legal anonymisation once metadata links to patient IDs) is eliminated by design.',
  },
  {
    title: 'Institutional accountability, not just data accountability',
    body: 'DPDP remedies are data-centric. When an AI system causes harm, the data fiduciary is liable, but institutional behaviour drift is invisible to DPDP. The Mirror makes that drift legible: value-drift score, refusal count, stress under load. It is the breach-detection layer for behaviour the way DPDP 8(6) is for data.',
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
    gives: 'The legal floor: non-negotiable accountability for consent, Data Principal rights (ss.11-14), data quality under 8(3), security safeguards under 8(5), and breach intimation under 8(6).',
    lacks: 'Silent on AI governance itself: no algorithmic impact assessment, no model-audit requirement, no behavioural monitoring under stress, and no GDPR Article 22 equivalent. No human-review right in the Act or Rules 2025.',
  },
  {
    name: 'SAHI',
    tag: 'Direction',
    nature: 'National strategy · MoHFW, Feb 2026',
    nameClass: 'text-sky-700',
    tagClass: 'bg-sky-900/40 text-sky-700 border-sky-200/60',
    gives: 'The direction: five pillars, seven guiding principles, priority actions for trustworthy AI in healthcare. Rec 6 (communication of use, limits, and risk) and Rec 22 (escalation path) are advisory strategy. They bind no one.',
    lacks: 'No implementation tool for institutions with no IT staff, no governance committee, and no budget for either.',
  },
  {
    name: 'NABH Digital Health Standards',
    tag: 'Bar',
    nature: 'Accreditation standard · 2nd Ed, Sep 2025',
    nameClass: 'text-emerald-300',
    tagClass: 'bg-emerald-900/30 text-emerald-300 border-emerald-800/60',
    gives: 'The bar: 182 objective elements defining a digital-maturity baseline, including CDSS adoption and information management.',
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
        <Link href="/home" className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded transition-colors">
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
          and the Data Protection Rules, 2025: India&rsquo;s data-protection floor for healthcare AI.
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
          The Digital Personal Data Protection Act, 2023, with the 2025 Rules, governs the
          processing of digital personal data. It establishes the data fiduciary, the data principal,
          explicit consent, Data Principal rights (access, correction and erasure, grievance,
          nomination), general obligations of the Data Fiduciary including data quality and
          safeguards, breach intimation, and a penalty regime reaching{' '}
          <span className="text-slate-800 font-medium">up to &#8376;250 crore</span> on Schedule
          item 1 (an 8(5) failure). It is a generic privacy law: it governs personal-data processing,
          regardless of whether the processor is an AI system. It does not create a right to human
          review of automated decisions.
        </p>
        <div className="border border-slate-200 rounded-lg p-4 bg-white/40">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">What it governs</p>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>Consent architecture (Sections 5 &amp; 6: unbundled, granular, purpose-limited)</li>
            <li>Data Principal rights (ss.11-14: access, correction and erasure, grievance, nomination)</li>
            <li>General obligations of Data Fiduciary (Section 8): 8(3) data quality; 8(5) safeguards; 8(6) breach intimation</li>
            <li>Joint data fiduciary liability (Rules, 2025)</li>
          </ul>
        </div>
      </section>

      {/* ── Where DPDP is strong, and where it is silent ───────────── */}
      <section className="mb-10 border border-slate-200 rounded-lg p-6 bg-white/40">
        <h2 className="text-sm font-medium text-slate-800 mb-3">Where DPDP is strong, and where it is silent</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-3">
          DPDP is authoritative on <span className="text-slate-800">data-processing accountability:</span>
          the consent architecture, the Data Principal rights, the 8(5) safeguard and 8(6) breach-intimation surface.
          Institutions that get 8(5) wrong face penalties up to &#8376;250 crore (Schedule item 1).
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          It is <span className="text-slate-800">silent on AI governance itself:</span> no definition of AI, no
          model-audit requirement, no algorithmic impact assessment, no obligation to monitor
          algorithmic behaviour post-deployment, and no notion of institutional value drift or
          behavioural governance under stress. Section 8 is not an automated-decision bridge. It is
          a fiduciary-obligations section. The closest the DPDP family comes to an algorithm duty is
          Rules 2025, r.13(3): a Significant Data Fiduciary must observe due diligence to verify that
          technical measures, including algorithmic software, are not likely to pose a risk to the
          rights of Data Principals. That is still not human review. The gap between what DPDP
          protects and what AI governance requires is precisely the gap the Mirror fills.
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

      {/* ── Human look lives outside DPDP s.8 ────────────────────── */}
      <section className="mb-10 border border-slate-200 rounded-lg p-5 bg-white/30">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="text-xs font-mono text-slate-600">Human look</span>
          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-300">
            Not Section 8
          </span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          A qualified human must inspect the clinical evidence before sign-off. The practice is
          right. The DPDP citation was wrong. Cite{' '}
          <span className="text-slate-800">NABL ISO 15189:2022 clause 7.3</span> (an AI aid is a
          non-standard examination method requiring validation; final report authorisation is
          reserved to a qualified medical doctor);{' '}
          <span className="text-slate-800">NABH Digital Health Standards, 2nd Edition (September 2025)</span>;{' '}
          <span className="text-slate-800">SAHI Rec 6</span> (communication of use, limits, and risk)
          and <span className="text-slate-800">Rec 22</span> (escalation path), which are advisory
          strategy and bind no one; and the signing clinician&rsquo;s professional and medical-council
          duty. Never cite DPDP Section 8 for human review.
        </p>
      </section>

      {/* ── GDPR Article 22 is EU ─────────────────────────────────── */}
      <section className="mb-10 border border-slate-200 rounded-lg p-5 bg-white/30">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="text-xs font-mono text-slate-600">GDPR Article 22</span>
          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-300">
            EU law
          </span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          The right commonly attributed to DPDP Section 8 is GDPR Article 22. That is EU law. It
          gives a data subject the right not to be subject to a decision based solely on automated
          processing and, where such processing is permitted, the right to obtain human intervention.
          India has not legislated an equivalent. Teach the gap. Do not import the duty.
        </p>
      </section>

      {/* ── CERT-In dual clock (chip, not a new route) ───────────── */}
      <section className="mb-10 border border-slate-200 rounded-lg p-5 bg-white/30">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="text-xs font-mono text-slate-600">Section 8(6) · dual clock</span>
          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-300">
            CERT-In 6-hour
          </span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          DPDP 8(6) is intimation to the Board and to affected Data Principals after a personal-data
          breach. CERT-In Directions of 28 April 2022 (IT Act s.70B) are a separate
          binding clock: listed cyber incidents, including attacks on AI/ML systems in
          Annexure I, must be reported to CERT-In within 6 hours. A hospital ransomware
          event can hit both. The Mirror does not file those notices. It rehearses the
          governance cascade (see The Credential Cascade) before either clock starts on
          live systems. CERT-In has no Mirror route of its own.
        </p>
      </section>

      {/* ── Section 13 grievance (chip, not a new route) ─────────── */}
      <section className="mb-10 border border-slate-200 rounded-lg p-5 bg-white/30">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="text-xs font-mono text-slate-600">Section 13</span>
          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-300">
            Grievance
          </span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          DPDP §13 gives the Data Principal a right to readily available grievance
          redressal with the Data Fiduciary. The Mirror is not that channel: it
          processes no personal data. Where a hospital&rsquo;s AI will create complaints,
          the rehearsal is whether a human path still answers when the queue is full.
          This page does not dump the 2025 Rules&rsquo; timelines.
        </p>
      </section>

      {/* ── UHI + NHCX (chips; exchange floor lives on /abdm) ───── */}
      <section className="mb-10 border border-slate-200 rounded-lg p-5 bg-white/30">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="text-xs font-mono text-slate-600">Consent substrate · exchange</span>
          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-300">
            UHI
          </span>
          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-300">
            NHCX
          </span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed mb-3">
          Consent Monday stays this page&rsquo;s spine. UHI is NHA&rsquo;s open health-service
          network on ABHA and health-information exchange, not a single app.{' '}
          <a
            href="https://abdm.gov.in/uhi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-800 underline decoration-slate-300 hover:decoration-slate-800 transition-colors"
          >
            abdm.gov.in/uhi
          </a>
          {' '}lists live services. The NHA GitHub UHI spec last moved September 2024; the
          gateway is more alive than the public repo. This page does not treat protocol
          0.0.1 as current.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          NHCX is FHIR claims exchange between providers and payers (
          <a
            href="https://nhcx.abdm.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-800 underline decoration-slate-300 hover:decoration-slate-800 transition-colors"
          >
            nhcx.abdm.gov.in
          </a>
          ). It sits on health data. It is not DPDP law. Hub counts move; we do not republish
          them as a census. The Mirror does not file claims. Consent Monday stays this
          page. The exchange floor is on{' '}
          <Link href="/abdm" className="text-slate-800 underline decoration-slate-300 hover:decoration-slate-800 transition-colors">
            /abdm
          </Link>
          .
        </p>
      </section>

      {/* ── The gap DPDP cannot reach ────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
          What DPDP cannot rehearse, and what the Mirror provides
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
          at once, and the same gap runs through all of them.
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
            2025), and the data-protection floor (DPDP, 2023-25). Together they tell hospitals to adopt
            clinical AI, mature their digital operations, and protect patient data. What none of them
            provides is a way to rehearse governance failure: to watch trust erode, ethical debt
            accumulate, and the human look degrade under a deterministic, repeatable stress test, before any
            of it happens to real patients. Institutional Mirror is that rehearsal layer: it operationalises
            SAHI&rsquo;s oversight and accountability principles, stress-tests the digital maturity NABH
            certifies, and rehearses the data-protection obligations DPDP imposes, all on synthetic
            data, before a single patient datum enters the equation.
          </p>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed mt-3">
          A scenario-based governance simulation on synthetic data. It does not predict reality, make clinical
          decisions, or evaluate real patients: itself an expression of the safety and data-protection
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

      {/* ── Related ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 mt-8 mb-2">
        <Link
          href="/sahi"
          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded transition-colors"
        >
          ← SAHI alignment
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
    </main>
  )
}
