'use client'

import Link from 'next/link'

const CHAPTERS = [
  { n: '1', code: 'AAC', label: 'Access, Assessment and Continuity of Care' },
  { n: '2', code: 'COP', label: 'Care of Patients' },
  { n: '3', code: 'MOM', label: 'Management of Medication' },
  { n: '4', code: 'DIS', label: 'Digital Infrastructure' },
  { n: '5', code: 'DOM', label: 'Digital Operations Management' },
  { n: '6', code: 'FPM', label: 'Finance and Procurement Management' },
  { n: '7', code: 'HRM', label: 'Human Resource Management' },
  { n: '8', code: 'IMS', label: 'Information Management System' },
]

const SCENARIOS = [
  {
    name: 'The Hallucinated Discharge Summary',
    map: 'IMS.2.c tells a hospital to use a clinical decision support system to create customized care plans. The standard does not ask whether a tired resident still reads the output. The Mirror rehearses that review collapsing under Friday bed-pressure.',
  },
  {
    name: 'Triage AI Under Mass Casualty Conditions',
    map: 'DOM and IMS assume digital operations and decision support are standing. They do not score what happens when Level-2 triage suggestions become de-facto Level-3 under a 40-patient surge. The Mirror does.',
  },
  {
    name: 'The Invisible Queue',
    map: 'Throughput dashboards sit inside IMS excellence language. Equity of who is delayed is not an AI-governance objective element. The scheduling-optimiser scenario makes that harm visible without pretending NABH already scores it.',
  },
  {
    name: 'The Credential Cascade',
    map: 'The public Digital Health Accreditation page names cybersecurity and patient-data privacy as programme scope. It is still a maturity bar, not a 6-hour incident clock. CERT-In lives on the DPDP page as the dual clock. The Mirror rehearses credential failure under clinical load.',
  },
]

const LIMITS = [
  {
    title: 'Not an accreditation tool',
    body: 'Institutional Mirror does not certify NABH conformance, does not score objective elements, and is not a substitute for a Programme on Implementation. It is a rehearsal environment on synthetic data.',
  },
  {
    title: 'No AI-governance OE today',
    body: 'The 2nd Edition is a digital-maturity standard. CDSS appears as an instruction to adopt (IMS.2.c). There is no objective element that requires an institutional AI governance unit, an override log, or a failure-mode rehearsal.',
  },
  {
    title: 'Two instruments, not one',
    body: 'Hospital Digital Health Standards 2nd Ed (September 2025) is not the HIS/EMR product certification (1st Ed September 2024; 2nd Ed still a July 2026 draft for comments). The Mirror maps to the hospital bar. It does not certify vendors.',
  },
]

export default function NabhPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-14">
      <div className="flex items-center justify-between mb-10">
        <p className="text-xs font-mono text-slate-500 tracking-widest uppercase">
          Institutional Mirror v2 · Policy Alignment
        </p>
        <Link href="/" className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded transition-colors">
          ← Home
        </Link>
      </div>

      <header className="mb-10">
        <h1 className="text-4xl font-light text-slate-900 tracking-tight mb-4">
          Alignment with NABH Digital Health Standards
        </h1>
        <p className="text-lg text-slate-700 leading-relaxed mb-4">
          How Institutional Mirror sits against NABH Digital Health Standards for Hospitals,
          2nd Edition (September 2025), with Hospital Accreditation Standards, 6th Edition
          (January 2025), as the wider quality bar.
        </p>
        <div className="border-l-2 border-emerald-700 pl-4 py-1">
          <p className="text-sm text-slate-700 leading-relaxed">
            NABH is the bar. SAHI is the direction. DPDP is the floor. The Mirror does not
            replace accreditation. It rehearses what a checklist cannot: governance drift
            after the digital tools are already standing.
          </p>
        </div>
      </header>

      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">What NABH Digital Health is</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          A voluntary QCI/NABH accreditation and certification programme for hospital digital
          maturity. The public programme page describes a four-year accreditation cycle with
          Silver, Gold, and Platinum levels, covering HIS, EMR, digital infrastructure,
          cybersecurity, patient-data privacy, and decision support. It is commercially
          consequential for many payers. It is not a penalty statute.
        </p>
        <div className="border border-slate-200 rounded-lg p-4 bg-white/40 mb-4">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">2nd Edition, September 2025 (hospital standard)</p>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>Eight chapters: three clinical, five non-clinical</li>
            <li>182 objective elements: 17 Core, 57 Commitment, 53 Achievement, 55 Excellence</li>
            <li>Core elements are mandatorily assessed each cycle</li>
          </ul>
        </div>
        <div className="border border-slate-200 rounded-lg p-4 bg-white/40">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">Hospital Standards, 6th Edition, January 2025</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            Ten chapters, 639 objective elements (105 Core). Patient-centric AAC through IPC,
            then organisation-centric ROM through IMS. This is the general hospital bar the
            Digital Health programme sits beside. It is not an AI statute.
          </p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
          Eight chapters of the Digital Health 2nd Edition
        </h2>
        <div className="grid grid-cols-1 gap-1.5 mb-4">
          {CHAPTERS.map(c => (
            <div key={c.code} className="flex items-center gap-3 text-sm">
              <span className="font-mono text-xs text-slate-600 w-16 shrink-0">Ch {c.n}</span>
              <span className="font-mono text-xs text-emerald-800 w-12 shrink-0">{c.code}</span>
              <span className="text-slate-700">{c.label}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Chapter titles and OE counts are from the table of contents and foreword of the
          2nd Edition already held in the estate. Individual objective-element text is not
          republished here. The printed/full standard is listed at Rs 1,000 on nabh.co.
        </p>
      </section>

      <section className="mb-10 border border-slate-200 rounded-lg p-6 bg-white/40">
        <h2 className="text-sm font-medium text-slate-800 mb-3">Where NABH is strong, and where it is silent</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-3">
          NABH Digital Health is authoritative on <span className="text-slate-800">whether the hospital has
          standing digital operations:</span> infrastructure, HIS/EMR use, a named DPO under DPDP,
          dashboards, and CDSS adoption.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          It is <span className="text-slate-800">silent on AI governance itself:</span> no requirement to
          name an AI owner, keep an override log, or rehearse automation bias under surge.
          IMS.2.c (held local copy) asks the hospital to use a CDSS for customized care plans.
          Examples given include drug-interaction alerts, clinical guidelines, and diagnostic
          decision support. That is an adopt instruction, not a failure-mode rehearsal.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
          Four live scenarios, mapped to the bar
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
        <div className="space-y-3">
          {LIMITS.map((g, i) => (
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

      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
          The wider governance stack
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed mb-6">
          <span className="text-slate-800">DPDP is the floor.</span>{' '}
          <span className="text-sky-700">SAHI is the direction.</span>{' '}
          <span className="text-emerald-800">NABH Digital Health is the bar.</span>{' '}
          CDSCO is the device-law hook when software diagnoses, treats, or monitors.
          None of them is a rehearsal of governance failure under stress.
        </p>
        <div className="border-l-2 border-emerald-700 pl-4 py-1">
          <p className="text-sm text-slate-700 leading-relaxed">
            The Mirror stress-tests the digital maturity NABH certifies: overrides going
            quiet, throughput bought with care shortcuts, dashboards that look excellent
            while chronic patients wait. Complementary, not compliance.
          </p>
        </div>
      </section>

      <section className="border-t border-slate-200 pt-6">
        <p className="text-xs text-slate-600 leading-relaxed mb-2">
          National Accreditation Board for Hospitals &amp; Healthcare Providers.{' '}
          <a
            href="https://nabh.co/programmes/digital-health-accreditation-programme/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-800 underline decoration-emerald-200 hover:decoration-emerald-800 transition-colors"
          >
            <span className="italic">Digital Health Accreditation Programme for Hospitals.</span>
          </a>{' '}
          Public explainer, not the full OE list.
        </p>
        <p className="text-xs text-slate-600 leading-relaxed mb-2">
          NABH.{' '}
          <a
            href="https://nabh.co/digital-health-standards/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-800 underline decoration-emerald-200 hover:decoration-emerald-800 transition-colors"
          >
            <span className="italic">Digital Health Standards shop page.</span>
          </a>{' '}
          2nd Edition for hospitals listed at Rs 1,000 (scraped 16 August 2026). Full OE
          text is behind that purchase. This page does not dump it.
        </p>
        <p className="text-xs text-slate-600 leading-relaxed">
          HIS/EMR product certification is a separate instrument (1st Edition September 2024;
          2nd Edition draft public notice 22 July 2026). Chapter titles cited above come from
          an estate-held copy of the hospital 2nd Edition, not from a new shop download.
          Links revalidated August 2026.
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
          href="/cdsco"
          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded transition-colors"
        >
          ← CDSCO alignment
        </Link>
      </div>
    </main>
  )
}
