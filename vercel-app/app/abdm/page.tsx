'use client'

import Link from 'next/link'

const FLOOR = [
  {
    name: 'UHI',
    tag: 'Open network',
    body: 'Unified Health Interface is NHA\'s open health-service network on ABHA and health-information exchange, not a single app. abdm.gov.in/uhi lists live services: blood bank, PM-JAY hospital search, Jan Aushadhi, ambulance, and teleconsult. Physical consult, labs, and U-WIN are still marked coming soon. Sandbox and Swagger are linked from that page.',
  },
  {
    name: 'NHCX',
    tag: 'FHIR claims',
    body: 'National Health Claims Exchange is FHIR claims traffic between providers and payers (nhcx.abdm.gov.in). It sits on health data. It is not DPDP law and not a Mirror claims engine. Hub counts on that host move; this page does not republish them as a census. A live scrape of the public host returned 403; a local page save is the witness.',
  },
  {
    name: 'Drug Registry',
    tag: 'Medicine identity',
    body: 'Standardised drug codification across apps (drugregistry.abdm.gov.in). Not a CDSCO licence path and not medical-device software. The public host returned 403 on scrape; treat the registry as launched, not independently counted here.',
  },
  {
    name: 'CLCI / BHTS',
    tag: 'Terminology',
    body: 'Common LOINC Codes for India and the Bharat Health Terminology Service are NRCeS objects: a nationally curated lab-code subset and a FHIR terminology server (nrces.in/bhts). Vocabulary floor, not a new ethics code, not a BODH benchmark. Academic host names stay off this page.',
  },
  {
    name: 'Insurance Plan FHIR',
    tag: 'Named utility',
    body: 'PIB names a utility that converts payer plans into FHIR bundles. No public implementer URL was held in the 16 August 2026 extract. Brochure until a spec or repo is on file.',
  },
  {
    name: 'e-Sushrut / HMIS lite',
    tag: 'NHA product',
    body: 'e-Sushrut Clinic is C-DAC SaaS HMIS on ABDM M1-M4 (abdm.gov.in/hmis-lite; live login ehmis-lite.in). It is a product NHA is shipping, not a NABH objective element and not a Mirror module. The clinic brochure names a CDSS developed at AIIMS Delhi. That is a product plug-in. The Mirror does not become an HMIS.',
  },
]

const LIMITS = [
  {
    title: 'Not a behaviour rule',
    body: 'ABDM moves records, claims, and codes. It does not tell a hospital how to govern a clinical model on a Tuesday afternoon. Exchange is not oversight.',
  },
  {
    title: 'Not a current public protocol dump',
    body: 'github.com/NHA-ABDM is a User account with eleven public repositories. The UHI repo last pushed 5 September 2024; its README still names protocol 0.0.1. The gateway is more alive than that public spec. This page does not treat 0.0.1 as current.',
  },
  {
    title: 'Not the consent Monday',
    body: 'Unbundled consent, purpose limitation, and the dual CERT-In clock stay on the DPDP page. This page is the interoperability floor those consent chains sit on.',
  },
]

const CITIZEN = [
  {
    name: 'Aarogya Setu 2.0',
    body: 'ABDM-powered PHR. PIB copy includes AI-powered health insights. That is a citizen surface on ABHA, not an AI-behaviour statute.',
  },
  {
    name: 'Ayushman App',
    body: 'PM-JAY beneficiary surface. Discovery, not rehearsal.',
  },
  {
    name: 'Ayushman Sarathi',
    body: 'WhatsApp chatbot. Same layer: access to scheme information, not institutional governance under stress.',
  },
]

export default function AbdmPage() {
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
          Alignment with ABDM
        </h1>
        <p className="text-lg text-slate-700 leading-relaxed mb-4">
          How Institutional Mirror sits against the Ayushman Bharat Digital Mission
          interoperability floor: exchange, claims, terminology, and NHA products.
          Not a national-mission poster, and not a substitute for DPDP, NABH, or CDSCO.
        </p>
        <div className="border-l-2 border-teal-700 pl-4 py-1">
          <p className="text-sm text-slate-700 leading-relaxed">
            We are not replacing ABDM. We are rehearsing governance of AI that will
            sit on this floor, on synthetic data, before any live ABHA-linked record
            enters the equation.
          </p>
        </div>
      </header>

      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">What ABDM is</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          ABDM is India&rsquo;s national digital-health mission: ABHA identity, health-facility
          and professional registries, and health-information exchange. On 29 June 2026 the
          Union Health Minister launched a stack of digital initiatives (
          <a
            href="https://abdm.gov.in/digital-initiatives"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-800 underline decoration-teal-200 hover:decoration-teal-800 transition-colors"
          >
            abdm.gov.in/digital-initiatives
          </a>
          ; PIB PRID 2278987). That card stack mixes two layers. This page holds the
          interoperability floor. Citizen apps stay a short note below.
        </p>
        <div className="border border-slate-200 rounded-lg p-4 bg-white/40">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mb-2">What this page will not do</p>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>Swallow apps, HMIS, claims, and terminology into one mission poster</li>
            <li>Treat the public UHI GitHub README as the live protocol</li>
            <li>Republish NHCX hub counts as a census</li>
            <li>Confuse e-Sushrut with a NABH objective element</li>
                <li>Move Consent Monday off the DPDP page</li>
          </ul>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
          The interoperability floor
        </h2>
        <div className="space-y-4">
          {FLOOR.map((item) => (
            <div key={item.name} className="border border-slate-200 rounded-lg p-5 bg-white/30">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="text-sm font-medium text-teal-900">{item.name}</h3>
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border bg-teal-50 text-teal-800 border-teal-200">
                  {item.tag}
                </span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 leading-relaxed mt-4">
          Official hosts:{' '}
          <a href="https://abdm.gov.in/uhi" target="_blank" rel="noopener noreferrer" className="underline decoration-slate-300 hover:decoration-slate-700">abdm.gov.in/uhi</a>
          {', '}
          <a href="https://nhcx.abdm.gov.in/" target="_blank" rel="noopener noreferrer" className="underline decoration-slate-300 hover:decoration-slate-700">nhcx.abdm.gov.in</a>
          {', '}
          <a href="https://drugregistry.abdm.gov.in/" target="_blank" rel="noopener noreferrer" className="underline decoration-slate-300 hover:decoration-slate-700">drugregistry.abdm.gov.in</a>
          {', '}
          <a href="https://www.nrces.in/bhts" target="_blank" rel="noopener noreferrer" className="underline decoration-slate-300 hover:decoration-slate-700">nrces.in/bhts</a>
          {', '}
          <a href="https://abdm.gov.in/hmis-lite" target="_blank" rel="noopener noreferrer" className="underline decoration-slate-300 hover:decoration-slate-700">abdm.gov.in/hmis-lite</a>
          .
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
          Citizen surfaces (not the spine)
        </h2>
        <div className="space-y-4">
          {CITIZEN.map((item) => (
            <div key={item.name} className="border border-slate-200 rounded-lg p-5 bg-white/30">
              <h3 className="text-sm font-medium text-slate-800 mb-2">{item.name}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-4">
          Limits
        </h2>
        <div className="space-y-4">
          {LIMITS.map((item) => (
            <div key={item.title} className="border border-slate-200 rounded-lg p-5 bg-white/30">
              <h3 className="text-sm font-medium text-slate-800 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10 border border-slate-200 rounded-lg p-6 bg-white/40">
        <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">
          The gap ABDM cannot reach
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed mb-3">
          A live claims hub and a live service network still assume deployed systems behave.
          They do not rehearse whether a tired clinician still reads a CDSS suggestion, whether
          a scheduling optimiser quietly starves a queue, or whether human review degrades under
          surge. NHCX throughput is not a governance score. UHI availability is not an
          algorithmic-impact assessment.
        </p>
        <p className="text-sm text-slate-600 leading-relaxed">
          Institutional Mirror is the rehearsal layer on synthetic institutional data. It does
          not file claims, issue ABHA, certify HMIS, or replace NHA products. It watches
          whether the people around those products still govern when the floor is live.
        </p>
      </section>

      <section className="border-t border-slate-200 pt-6">
        <p className="text-xs text-slate-600 leading-relaxed mb-2">
          National Health Authority.{' '}
          <a
            href="https://abdm.gov.in/digital-initiatives"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-800 underline decoration-teal-200 hover:decoration-teal-800 transition-colors"
          >
            <span className="italic">Launch of Digital Initiatives for Health Sector 2026.</span>
          </a>{' '}
          PIB{' '}
          <a
            href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2278987"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-800 underline decoration-teal-200 hover:decoration-teal-800 transition-colors"
          >
            PRID 2278987
          </a>
          {' '}(29 June 2026) and{' '}
          <a
            href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2278347"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-800 underline decoration-teal-200 hover:decoration-teal-800 transition-colors"
          >
            PRID 2278347
          </a>
          {' '}(27 June 2026).
        </p>
        <p className="text-xs text-slate-600 leading-relaxed mb-2">
          NHA GitHub user{' '}
          <a
            href="https://github.com/NHA-ABDM"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-800 underline decoration-teal-200 hover:decoration-teal-800 transition-colors"
          >
            github.com/NHA-ABDM
          </a>
          . UHI public spec last moved September 2024. Not cited as current protocol.
        </p>
        <p className="text-xs text-slate-600 leading-relaxed">
          This alignment record maps the ABDM floor Institutional Mirror most directly sits on.
          It is a living document. It is not legal advice, not NHA certification, and not a
          claim that ArchLife certifies an institution. Links revalidated August 2026.
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
        <Link
          href="/cdsco"
          className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded transition-colors"
        >
          ← CDSCO alignment
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
