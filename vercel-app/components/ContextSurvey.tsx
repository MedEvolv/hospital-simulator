'use client'

/**
 * ContextSurvey — v2 pre-scenario context step
 *
 * Optional. Captures WHO is running the stress test and the institutional
 * context they bring to it. This personalizes the REFLECTION layer —
 * role-specific inspector notes, report framing, results header — without
 * altering the deterministic scenario mechanics (Hard Gate 5 preserved:
 * same scenario + seed = identical metrics, regardless of context).
 *
 * Stored under 'im_survey' so /inspector, /report, /results, /export
 * read it through the existing contract. `role` drives role-specific notes.
 */

import { useState, useEffect } from 'react'

const SURVEY_KEY = 'im_survey'

export interface MirrorContext {
  role: string
  institutionType: string
  aiMaturity: string
  primaryConcern: string
}

const ROLES: { value: string; label: string }[] = [
  { value: 'ethics',    label: 'Ethics & Governance Lead' },
  { value: 'qi',        label: 'Quality & Patient Safety' },
  { value: 'cmo',       label: 'Clinical Leadership (CMO / Medical Director)' },
  { value: 'ceo',       label: 'Administration / Leadership (CEO / COO)' },
  { value: 'frontline', label: 'Frontline Clinician' },
  { value: 'other',     label: 'Other' },
]
const INSTITUTION_TYPES: { value: string; label: string }[] = [
  { value: 'government_tertiary',    label: 'Government tertiary hospital' },
  { value: 'private_multispecialty', label: 'Private multi-specialty' },
  { value: 'district_hospital',      label: 'District / secondary hospital' },
  { value: 'nursing_home',           label: 'Nursing home' },
  { value: 'clinic',                 label: 'Clinic / day-care' },
  { value: 'other',                  label: 'Other' },
]
const AI_MATURITY: { value: string; label: string }[] = [
  { value: 'none',     label: 'No clinical AI yet' },
  { value: 'piloting', label: 'Piloting' },
  { value: 'partial',  label: 'Partial deployment' },
  { value: 'heavy',    label: 'Heavy reliance' },
]
const CONCERNS: { value: string; label: string }[] = [
  { value: 'patient_safety',   label: 'Patient safety' },
  { value: 'equity',           label: 'Equity & access' },
  { value: 'automation_drift', label: 'Automation drift' },
  { value: 'trust',            label: 'Operational trust' },
  { value: 'hidden_strain',    label: 'Hidden staff strain' },
  { value: 'cost',             label: 'Cost of care' },
]

function label(list: { value: string; label: string }[], v: string) {
  return list.find(x => x.value === v)?.label ?? v
}

export default function ContextSurvey() {
  const [ctx, setCtx] = useState<MirrorContext | null>(null)
  const [open, setOpen] = useState(false)

  // Draft state
  const [role, setRole] = useState('')
  const [institutionType, setInstitutionType] = useState('')
  const [aiMaturity, setAiMaturity] = useState('')
  const [primaryConcern, setPrimaryConcern] = useState('')

  // Hydrate from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SURVEY_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as MirrorContext
        if (parsed.role || parsed.institutionType) {
          setCtx(parsed)
          setRole(parsed.role ?? '')
          setInstitutionType(parsed.institutionType ?? '')
          setAiMaturity(parsed.aiMaturity ?? '')
          setPrimaryConcern(parsed.primaryConcern ?? '')
        }
      }
    } catch { /* optional */ }
  }, [])

  function save() {
    const next: MirrorContext = { role, institutionType, aiMaturity, primaryConcern }
    sessionStorage.setItem(SURVEY_KEY, JSON.stringify(next))
    setCtx(next)
    setOpen(false)
  }

  function clear() {
    sessionStorage.removeItem(SURVEY_KEY)
    setCtx(null)
    setRole(''); setInstitutionType(''); setAiMaturity(''); setPrimaryConcern('')
    setOpen(false)
  }

  // ── Collapsed summary chip (context is set) ─────────────────────────────────
  if (ctx && !open) {
    return (
      <div className="mb-6 flex items-center justify-between gap-4 border border-slate-800 bg-slate-900/40 rounded-lg px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-300 flex-wrap">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Reviewing as</span>
          {ctx.role && <span className="text-slate-200">{label(ROLES, ctx.role)}</span>}
          {ctx.institutionType && <><span className="text-slate-600">·</span><span className="text-slate-400">{label(INSTITUTION_TYPES, ctx.institutionType)}</span></>}
          {ctx.primaryConcern && <><span className="text-slate-600">·</span><span className="text-slate-400">focus: {label(CONCERNS, ctx.primaryConcern)}</span></>}
        </div>
        <button onClick={() => setOpen(true)}
          className="shrink-0 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded transition-colors">
          Edit context
        </button>
      </div>
    )
  }

  // ── Collapsed prompt (no context yet) ───────────────────────────────────────
  if (!ctx && !open) {
    return (
      <div className="mb-6 flex items-center justify-between gap-4 border border-slate-800 border-dashed bg-slate-900/20 rounded-lg px-4 py-3">
        <p className="text-xs text-slate-500 leading-relaxed">
          Optional: set your role and institutional context to personalize how insights and reports are framed.
        </p>
        <button onClick={() => setOpen(true)}
          className="shrink-0 text-xs font-medium text-slate-300 border border-slate-600 hover:border-slate-400 hover:bg-slate-800 px-3 py-1.5 rounded transition-colors">
          Set context →
        </button>
      </div>
    )
  }

  // ── Expanded form ───────────────────────────────────────────────────────────
  return (
    <div className="mb-6 border border-slate-700 bg-slate-900/60 rounded-lg p-5">
      <div className="flex items-start justify-between mb-1">
        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Your governance context</p>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed mb-4 max-w-2xl">
        This personalizes how the simulation frames its insights for you — it does <span className="text-slate-400">not</span> change
        the deterministic scenario. The same scenario always produces the same metrics.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Your role">
          <Select value={role} onChange={setRole} options={ROLES} placeholder="Select your role…" />
        </Field>
        <Field label="Institution type">
          <Select value={institutionType} onChange={setInstitutionType} options={INSTITUTION_TYPES} placeholder="Select type…" />
        </Field>
        <Field label="Clinical AI maturity">
          <Select value={aiMaturity} onChange={setAiMaturity} options={AI_MATURITY} placeholder="Select maturity…" />
        </Field>
        <Field label="Primary governance concern">
          <Select value={primaryConcern} onChange={setPrimaryConcern} options={CONCERNS} placeholder="Select focus…" />
        </Field>
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button onClick={save} disabled={!role && !institutionType}
          className="bg-slate-200 text-slate-900 text-sm font-medium px-4 py-2 rounded hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          Save context
        </button>
        {ctx && (
          <button onClick={clear} className="text-xs text-slate-500 hover:text-red-400 transition-colors">
            Clear
          </button>
        )}
        <button onClick={() => setOpen(false)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors ml-auto">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Tiny presentational helpers ─────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-mono text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Select({ value, onChange, options, placeholder }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-500 transition-colors">
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
