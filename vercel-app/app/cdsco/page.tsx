'use client'

import Link from 'next/link'

const GREY_ZONE = [
  {
    title: 'Medical-device software (MDSW)',
    body: 'CDSCO MDSW guidance (21 July 2026, Doc CDSCO/MD/GD/MDSW/01/2026) says software that meets the MDR-2017 medical-device definition is MDSW. Named examples include CAD image analysis, AI/ML triage or screening of lesions, IoT chronic-disease platforms with AI-driven analytics, and digital therapeutics. Classification still sits in the First Schedule of MDR-2017. The Central Licensing Authority confirms class.',
  },
  {
    title: 'Usually not MDSW',
    body: 'The same guidance keeps HIS, CIS, LIS, and IMS out unless they add medical-purpose functions (image analysis, quantification, real-time monitoring). General wellness, teaching-only software, and ERP/QMS are out. That is the grey zone: a hospital CDS tool can look clinical and still sit outside the device licence path, or cross the line the day it starts diagnosing.',
  },
  {
    title: 'Guidance, not a new Act',
    body: 'The PDF is labelled for public awareness and is not meant for legal or professional use. It says it should not be misconstrued as a new regulatory control on MDSW. Binding force remains the Medical Devices Rules, 2017, as amended. This page does not dump those rules. The CDSCO hub lists them; a consolidated gazette PDF did not download cleanly this pass.',
  },
]

const SCENARIOS = [
  {
    name: 'The Hallucinated Discharge Summary',
    map: 'An LLM that drafts a summary for a clinician to edit is often closer to documentation CDS than to MDSW. The harm is still a missed dose. CDSCO does not rehearse the review collapsing. The Mirror does, on synthetic data.',
  },
  {
    name: 'Triage AI Under Mass Casualty Conditions',
    map: 'AI/ML triage and screening of lesions is a covered MDSW example in the 2026 guidance. Licence class is a different question from whether staff still independently assess under surge. The scenario is about that second question.',
  },
  {
    name: 'The Invisible Queue',
    map: 'A scheduling optimiser that maximises OPD throughput is usually HIS/operations software, not a medical device, unless it starts making diagnostic or treatment claims. Equity harm can be real while CDSCO has nothing to licence.',
  },
  {
    name: 'The Credential Cascade',
    map: 'Device law is not the cyber statute. A PACS-connected AI-DSF may be MDSW; the 6-hour CERT-In clock and DPDP §9 still fire on the hospital as a body corporate. The Mirror rehearses the cascade, not the licence form.',
  },
]

const EXPORT_CLOCKS = [
  {
    when: '2 August 2026',
    what: 'Broader EU AI Act enforcement layer that had been the high-risk start date before Omnibus VII. Still the calendar hospitals exporting into the Union watch.',
  },
  {
    when: '2 December 2027',
    what: 'Provisional Omnibus deal: stand-alone high-risk AI systems. Clinical AI that is not embedded in a medical device sits here if it is high-risk.',
  },
  {
    when: '2 August 2028',
    what: 'Provisional Omnibus deal: high-risk AI embedded in products, including MDR/IVDR devices. This is the export clock for Indian SaMD that already lives under EU device law.',
  },
]

export default function CdscoPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-14">
      <div className="flex items-center justify-between mb-10">
        <p className="text-xs font-mono text-slate-500 tracking-widest uppercase">
          Institutional Mirror v2 · Policy Alignment
        </p>
        <Link href="/home" className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded transition-colors">
          ← Home
        </Link>
      </div>

      <header className="mb-10">
        <h1 className="text-4xl font-light text-slate-900 tracking-tight mb-4">
          Alignment with CDSCO device rules
        </h1>
        <p className="text-lg text-slate-700 leading-relaxed mb-4">
          How Institutional Mirror sits against the Medical Devices Rules, 2017, as amended,
          the July 2026 medical-device software guidance, and the National Medical Devices
          Policy, 2023.
        </p>
        <div className="border-l-2 border-amber-700 pl-4 py-1">
          <p className="text-sm text-slate-700 leading-relaxed">
            CDSCO is the only Indian device-law hook for clinical AI. It licences software
            that meets the medical-device definition. It does not rehearse whether a hospital
            still governs that software on a Tuesday afternoon.
          </p>
        </div>
      </header>

      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">What MDR-2017 is</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          The Medical Devices Rules, 2017, remain the CDSCO base for classification, licence,
          manufacture, import, and post-market duties for devices in India, including software
          intended to diagnose, prevent, monitor, or treat. The live hub is on cdsco.gov.in.
          Jan Vishwas recast some Drugs and Cosmetics penalties. That rewrite is not AI-specific.
        </p>
        <div className="border border-slate-200 rounded-lg p-4 bg-white/40">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">What this page will not do</p>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>Dump the 2017 rules or later G.S.R. amendments</li>
            <li>Treat the July 2026 MDSW PDF as a new Act</li>
            <li>Claim a CDSCO AI-specific statute exists as of August 2026</li>
          </ul>
        </div>
      </section>

      <section className="mb-10 border border-slate-200 rounded-lg p-5 bg-white/30">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="text-xs font-mono text-slate-600">Medicine identity · not MDSW</span>
          <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-200">
            Drug Registry
          </span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          The ABDM Drug Registry (
          <a
            href="https://drugregistry.abdm.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-800 underline decoration-amber-200 hover:decoration-amber-800 transition-colors"
          >
            drugregistry.abdm.gov.in
          </a>
          ) is standardised drug codification across apps. We did not scrape a live
          registry dump (the public host returned 403; a local page scrape is the witness).
          This is not a CDSCO licence path and not MDSW.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
          Device vs CDS: the grey zone
        </h2>
        <div className="space-y-4">
          {GREY_ZONE.map(g => (
            <div key={g.title} className="border border-slate-200 rounded-lg p-5 bg-white/30">
              <h3 className="text-sm font-medium text-slate-800 mb-2">{g.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{g.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10 border border-slate-200 rounded-lg p-6 bg-white/40">
        <h2 className="text-sm font-medium text-slate-800 mb-3">National Medical Devices Policy, 2023</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-3">
          Gazette notification 2 May 2023 (CG-DL-E-03052023-245630). Department of
          Pharmaceuticals. Industrial strategy, not a second licensing statute. Retrieved
          gazette text names IoT and AI among R&amp;D themes (clauses 3.2.7 / 4.3).
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          Policy can streamline manufacturing and regulatory-process language. It does not
          tell a district hospital how to escalate a drifted triage model on Monday morning.
        </p>
      </section>

      <section className="mb-10 border border-amber-200 rounded-lg p-6 bg-amber-50/40">
        <p className="text-[10px] font-mono uppercase tracking-wider text-amber-800 mb-2">ICMR–CDSCO desert</p>
        <h2 className="text-sm font-medium text-slate-800 mb-3">Research ethics is not a commercial licence</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-3">
          ICMR Ethical Guidelines for AI in biomedical research and healthcare (2023) bind
          through institutional ethics committees when the work is research. CDSCO MDSW
          guidance (2026) is a written path for software that meets the device definition.
          Between those two sits live hospital deployment that is neither a protocol nor,
          often, a licensed device: the desert. The 2026 guidance weakens the claim that
          &ldquo;no SaMD path exists.&rdquo; It does not fill the desert for HIS-shaped tools.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          The Mirror is not a CDSCO dossier and not an IEC submission. It is rehearsal for
          the institution that has to govern anyway.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
          Export clock (EU AI Act dates, on this page only)
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Indian vendors who place clinical AI in the Union inherit EU high-risk clocks.
          These chips are not Indian law. They are the calendar a CDSCO-class device faces
          on the way out. Dates below mix the Act (Regulation (EU) 2024/1689, EUR-Lex PDF
          held) with the Council–Parliament Omnibus VII <span className="text-slate-800">provisional</span> agreement
          of 7 May 2026. That deal still needed endorsement when scraped.
        </p>
        <div className="space-y-3">
          {EXPORT_CLOCKS.map(c => (
            <div key={c.when} className="border border-slate-200 rounded-lg p-5 bg-white/30">
              <p className="text-xs font-mono text-amber-800 mb-1">{c.when}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{c.what}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
          Four live scenarios
        </h2>
        <div className="space-y-4">
          {SCENARIOS.map(s => (
            <div key={s.name} className="border border-slate-200 rounded-lg p-5 bg-white/30">
              <h3 className="text-sm font-medium text-slate-800 mb-2">{s.name}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{s.map}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
          Honest limits
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-3">
          Institutional Mirror does not file a CDSCO licence, does not classify your software,
          and does not replace notified-body or CLA judgement. Synthetic scenarios. No patient
          data. No clinical advice.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          DPDP remains the data-protection floor. NABH remains the digital-maturity bar.
          SAHI remains non-binding direction. CDSCO is the device hook when the software
          crosses the medical-purpose line.
        </p>
      </section>

      <section className="border-t border-slate-200 pt-6">
        <p className="text-xs text-slate-600 leading-relaxed mb-2">
          Central Drugs Standard Control Organisation.{' '}
          <a
            href="https://cdsco.gov.in/opencms/opencms/en/Acts-and-rules/Medical-Devices-Rules/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-800 underline decoration-amber-200 hover:decoration-amber-800 transition-colors"
          >
            <span className="italic">Medical Devices Rules, 2017</span>
          </a>
          {' '}hub. MDSW guidance PDF dated 21 July 2026 held in the estate.
        </p>
        <p className="text-xs text-slate-600 leading-relaxed mb-2">
          Department of Pharmaceuticals.{' '}
          <span className="italic">National Medical Devices Policy, 2023</span>
          {' '}(gazette 2–3 May 2023).
        </p>
        <p className="text-xs text-slate-600 leading-relaxed mb-2">
          EUR-Lex, Regulation (EU) 2024/1689. Council press, 7 May 2026, Omnibus VII
          provisional dates. EHDS (Regulation (EU) 2025/327) is held as a PDF and is not
          given its own Mirror route.
        </p>
        <p className="text-xs text-slate-600 leading-relaxed">
          This alignment record is a living document. It is not legal advice. Links
          revalidated August 2026.
        </p>
      </section>

      <div className="flex flex-wrap gap-4 mt-8 mb-2">
        <Link
          href="/dpdp"
          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded transition-colors"
        >
          ← DPDP alignment
        </Link>
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
      </div>
    </main>
  )
}
