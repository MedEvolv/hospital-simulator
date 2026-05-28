'use client'

/**
 * ExpertFeedbackForm — v2 Phase 8
 *
 * Post-simulation expert feedback capture.
 * Shown at the bottom of the results page and exportable with governance artifacts.
 *
 * Feedback is stored in sessionStorage and included in exported reports.
 * Storage key: 'im_expert_feedback'
 */

import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExpertFeedback {
  scenarioRealism: number        // 1–5
  variableAccuracy: number       // 1–5
  insightUsefulness: number      // 1–5
  escalationRealism: number      // 1–5
  missingFactors: string         // free text
  strongestInsight: string       // free text
  wouldUseForTraining: 'yes' | 'no' | 'unsure'
  professionalRole: string       // free text
  additionalNotes: string        // free text
  submittedAt: string            // ISO timestamp
  scenarioId?: string
  runId?: string
}

export const FEEDBACK_KEY = 'im_expert_feedback'

// ── Rating component ──────────────────────────────────────────────────────────

function RatingRow({
  label,
  description,
  value,
  onChange,
  lowLabel,
  highLabel,
}: {
  label: string
  description: string
  value: number
  onChange: (v: number) => void
  lowLabel?: string
  highLabel?: string
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <p className="text-xs font-medium text-slate-300">{label}</p>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{description}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`w-8 h-8 rounded text-xs font-mono border transition-all ${
                value === n
                  ? 'bg-slate-200 border-slate-300 text-slate-900'
                  : value > 0 && n <= value
                  ? 'bg-slate-700 border-slate-600 text-slate-300'
                  : 'border-slate-800 text-slate-600 hover:border-slate-600 hover:text-slate-400'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      {(lowLabel || highLabel) && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-slate-700">{lowLabel}</span>
          <span className="text-[9px] text-slate-700">{highLabel}</span>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface ExpertFeedbackFormProps {
  scenarioId?: string
  runId?: string
  onSubmit?: (feedback: ExpertFeedback) => void
}

export default function ExpertFeedbackForm({
  scenarioId,
  runId,
  onSubmit,
}: ExpertFeedbackFormProps) {
  const [expanded, setExpanded] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Check if already submitted for this run
  const existingKey = FEEDBACK_KEY + (runId ? `_${runId}` : '')

  const [scenarioRealism,    setScenarioRealism]    = useState(0)
  const [variableAccuracy,   setVariableAccuracy]   = useState(0)
  const [insightUsefulness,  setInsightUsefulness]  = useState(0)
  const [escalationRealism,  setEscalationRealism]  = useState(0)
  const [missingFactors,     setMissingFactors]     = useState('')
  const [strongestInsight,   setStrongestInsight]   = useState('')
  const [wouldUseForTraining, setWouldUseForTraining] = useState<ExpertFeedback['wouldUseForTraining'] | ''>('')
  const [professionalRole,   setProfessionalRole]   = useState('')
  const [additionalNotes,    setAdditionalNotes]    = useState('')

  const isReadyToSubmit = scenarioRealism > 0 && insightUsefulness > 0

  function handleSubmit() {
    const feedback: ExpertFeedback = {
      scenarioRealism,
      variableAccuracy,
      insightUsefulness,
      escalationRealism,
      missingFactors,
      strongestInsight,
      wouldUseForTraining: wouldUseForTraining || 'unsure',
      professionalRole,
      additionalNotes,
      submittedAt: new Date().toISOString(),
      scenarioId,
      runId,
    }

    // Persist to sessionStorage
    try {
      sessionStorage.setItem(existingKey, JSON.stringify(feedback))
      // Also keep a list of all feedback for export
      const allKey = FEEDBACK_KEY + '_all'
      const existing = JSON.parse(sessionStorage.getItem(allKey) ?? '[]') as ExpertFeedback[]
      existing.push(feedback)
      sessionStorage.setItem(allKey, JSON.stringify(existing))
    } catch {
      // sessionStorage may be full or unavailable — silently continue
    }

    onSubmit?.(feedback)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="border border-slate-800 rounded-lg px-5 py-6 bg-slate-900/30 text-center">
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Feedback received</p>
        <p className="text-sm text-slate-300 mb-1">Thank you.</p>
        <p className="text-xs text-slate-500 leading-relaxed">
          Your expert feedback has been saved and will be included in the exported governance report.
        </p>
      </div>
    )
  }

  return (
    <div className="border border-slate-800 rounded-lg overflow-hidden">
      {/* ── Toggle header ──────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-slate-900/30 hover:bg-slate-900/50 transition-colors text-left"
      >
        <div>
          <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Expert feedback</p>
          <p className="text-[11px] text-slate-600 mt-0.5">Help improve simulation validity · Optional</p>
        </div>
        <span className="text-slate-600 text-xs">{expanded ? '▲ Collapse' : '▼ Expand'}</span>
      </button>

      {/* ── Form ──────────────────────────────────────────────────────────── */}
      {expanded && (
        <div className="border-t border-slate-800 px-5 py-6 space-y-6">
          {/* Context banner */}
          <div className="bg-slate-800/30 rounded p-3">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              This feedback is used to improve the simulation&apos;s realism and calibration.
              Questions are designed for clinicians, governance professionals, and AI researchers.
              All fields are optional except scenario realism and insight usefulness.
            </p>
          </div>

          {/* Professional role */}
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">
              Your professional role (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Clinical governance lead, Emergency physician, AI researcher…"
              value={professionalRole}
              onChange={e => setProfessionalRole(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
            />
          </div>

          {/* Ratings */}
          <div className="space-y-5">
            <RatingRow
              label="Scenario realism *"
              description="How accurately does this scenario reflect the kind of governance failures you have seen or studied?"
              value={scenarioRealism}
              onChange={setScenarioRealism}
              lowLabel="1 — Not realistic"
              highLabel="5 — Very realistic"
            />
            <RatingRow
              label="Variable accuracy"
              description="How well do the metrics (PSS, PES, SSS, EIC, STI) reflect real institutional stress signals?"
              value={variableAccuracy}
              onChange={setVariableAccuracy}
              lowLabel="1 — Poorly calibrated"
              highLabel="5 — Well calibrated"
            />
            <RatingRow
              label="Insight usefulness *"
              description="How useful are the reflective governance insights for learning or decision-making?"
              value={insightUsefulness}
              onChange={setInsightUsefulness}
              lowLabel="1 — Not useful"
              highLabel="5 — Very useful"
            />
            <RatingRow
              label="Escalation realism"
              description="How well does the simulation model escalation failures, alert fatigue, and oversight breakdowns?"
              value={escalationRealism}
              onChange={setEscalationRealism}
              lowLabel="1 — Poor"
              highLabel="5 — Accurate"
            />
          </div>

          {/* Free text: missing factors */}
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">
              Missing factors
            </label>
            <textarea
              placeholder="What important variables, dynamics, or institutional factors are missing from this simulation?"
              value={missingFactors}
              onChange={e => setMissingFactors(e.target.value)}
              rows={3}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors resize-none"
            />
          </div>

          {/* Free text: strongest insight */}
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">
              Strongest insight
            </label>
            <textarea
              placeholder="Which governance insight from this run was most accurate, surprising, or clinically relevant?"
              value={strongestInsight}
              onChange={e => setStrongestInsight(e.target.value)}
              rows={2}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors resize-none"
            />
          </div>

          {/* Would use for training */}
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">
              Would you use this for clinical governance training?
            </label>
            <div className="flex gap-2">
              {(['yes', 'no', 'unsure'] as const).map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setWouldUseForTraining(opt)}
                  className={`flex-1 py-2.5 rounded border text-sm transition-all ${
                    wouldUseForTraining === opt
                      ? 'border-slate-500 bg-slate-800 text-slate-200'
                      : 'border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-400'
                  }`}
                >
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Additional notes */}
          <div>
            <label className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">
              Additional notes
            </label>
            <textarea
              placeholder="Any other feedback on the simulation design, interface, or governance model…"
              value={additionalNotes}
              onChange={e => setAdditionalNotes(e.target.value)}
              rows={2}
              className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-[10px] text-slate-600">
              * Required &nbsp;·&nbsp; Feedback stored locally and exported with governance report
            </p>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isReadyToSubmit}
              className="bg-slate-200 text-slate-900 font-medium text-sm px-5 py-2.5 rounded-lg hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit feedback
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
