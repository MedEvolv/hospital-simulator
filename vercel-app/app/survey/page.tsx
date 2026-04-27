'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Disclaimer from '@/components/Disclaimer'
import { HospitalFloorLoading } from '@/components/HospitalFloor'
import { SESSION_KEY, CAPACITY_KEY, type SimulationParams } from '@/lib/types'

const SURVEY_KEY = 'im_survey'

// ── Types ─────────────────────────────────────────────────────────────────────

type Answers = Record<string, string | string[]>

type Option = { value: string; label: string; blurb?: string }

interface Question {
  id: string
  section: string
  question: string
  subtext?: string
  type: 'single' | 'multi' | 'scale' | 'text'
  options?: Option[]
  scaleMin?: string
  scaleMax?: string
  steps?: number
  maxSelect?: number
  optional?: boolean
  condition?: (answers: Answers) => boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function strVal(answers: Answers, key: string): string {
  const v = answers[key]
  if (Array.isArray(v)) return v[0] ?? ''
  return v ?? ''
}

function arrVal(answers: Answers, key: string): string[] {
  const v = answers[key]
  if (Array.isArray(v)) return v
  if (typeof v === 'string' && v) return [v]
  return []
}

// NABH statuses that have had real assessments (show assessor findings question)
const NABH_WITH_ASSESSMENTS = new Set(['entry_level', 'full_first', 'full_renewed', 'lapsed'])
// NABH statuses that have chapter-level context (show weakest chapters question)
const NABH_WITH_CHAPTERS = new Set(['entry_level', 'full_first', 'full_renewed', 'lapsed', 'pursuing'])

// ── Survey structure ──────────────────────────────────────────────────────────

const SECTIONS: { title: string; description: string; questions: Question[] }[] = [
  {
    title: 'Your role and institution',
    description: 'Help us frame the simulation to your context.',
    questions: [
      {
        id: 'role',
        section: '1',
        question: 'What is your primary role in the hospital?',
        type: 'single',
        options: [
          { value: 'ceo',     label: 'CEO / Hospital Director' },
          { value: 'cmo',     label: 'Chief Medical Officer / Medical Superintendent' },
          { value: 'ethics',  label: 'Ethics Committee Chair' },
          { value: 'nursing', label: 'Director of Nursing' },
          { value: 'qi',      label: 'Quality Improvement Lead / Quality Incharge' },
          { value: 'board',   label: 'Governance Board Member' },
          { value: 'other',   label: 'Other clinical or administrative role' },
        ],
      },
      {
        id: 'institution_type',
        section: '1',
        question: 'Which type of institution are you from?',
        type: 'single',
        options: [
          { value: 'government', label: 'Government / public hospital' },
          { value: 'private',    label: 'Private hospital' },
          { value: 'trust',      label: 'Trust / charitable hospital' },
          { value: 'teaching',   label: 'Teaching / academic medical centre' },
          { value: 'other',      label: 'Other' },
        ],
      },
    ],
  },
  {
    title: 'NABH and quality context',
    description:
      'Your NABH status and quality gaps shape how the simulation calibrates governance fragility.',
    questions: [
      {
        id: 'nabh_status',
        section: '2',
        question: 'What is your institution\'s current NABH status?',
        type: 'single',
        options: [
          { value: 'entry_level',   label: 'Entry Level Certification (active)' },
          { value: 'full_first',    label: 'Full NABH Accreditation – first cycle' },
          { value: 'full_renewed',  label: 'Full NABH Accreditation – renewed' },
          { value: 'lapsed',        label: 'Previously accredited, currently lapsed' },
          { value: 'pursuing',      label: 'Not accredited, actively pursuing' },
          { value: 'not_pursuing',  label: 'Not accredited, no active plan' },
        ],
      },
      {
        id: 'nabh_weakest_chapters',
        section: '2',
        question: 'Which NABH chapters are your lowest-scoring or most challenged? Select up to two.',
        subtext:
          'These tell the simulation which governance dimensions to stress-test first.',
        type: 'multi',
        maxSelect: 2,
        condition: (a) => NABH_WITH_CHAPTERS.has(strVal(a, 'nabh_status')),
        options: [
          { value: 'AAC', label: 'AAC — Access, Assessment and Continuity of Care' },
          { value: 'COP', label: 'COP — Care of Patients' },
          { value: 'MOM', label: 'MOM — Management of Medication' },
          { value: 'PRE', label: 'PRE — Patient Rights and Education' },
          { value: 'IPC', label: 'IPC — Infection Prevention and Control' },
          { value: 'PSQ', label: 'PSQ — Patient Safety and Quality Improvement' },
          { value: 'ROM', label: 'ROM — Responsibility of Management' },
          { value: 'FMS', label: 'FMS — Facility Management and Safety' },
          { value: 'HRM', label: 'HRM — Human Resource Management' },
          { value: 'IMS', label: 'IMS — Information Management System' },
        ],
      },
      {
        id: 'nabh_assessor_findings',
        section: '2',
        question: 'Which of the following reflect recent assessor or internal audit findings at your institution? Select all that apply.',
        subtext:
          'These calibrate which governance failure modes the simulation treats as baseline rather than exceptional.',
        type: 'multi',
        condition: (a) => NABH_WITH_ASSESSMENTS.has(strVal(a, 'nabh_status')),
        options: [
          {
            value: 'adverse_event_incomplete',
            label: 'Adverse event reporting incomplete — not all incidents captured or systematically reviewed',
          },
          {
            value: 'sentinel_not_analysed',
            label: 'Sentinel events not analysed or presented to the quality and safety committee',
          },
          {
            value: 'patient_rights_missing',
            label: 'Patient rights documentation missing or not acknowledged in writing by patients or guardians',
          },
          {
            value: 'consent_incomplete',
            label: 'Informed consent process not consistently followed prior to procedures',
          },
          {
            value: 'staff_training_gaps',
            label: 'Staff competency assessments and training records incomplete or not current',
          },
          {
            value: 'ipc_gaps',
            label: 'Infection prevention and control gaps — hand hygiene compliance, isolation protocols not observed',
          },
          {
            value: 'med_reconciliation_absent',
            label: 'Medication reconciliation absent at transitions of care — admission, transfer, or discharge',
          },
          {
            value: 'qi_not_actioned',
            label: 'Quality improvement data collected but corrective actions not documented or tracked',
          },
          {
            value: 'ethics_committee_nonfunctional',
            label: 'Ethics committee absent or non-functional — no regular meetings, no minuted decisions (ROM)',
          },
          {
            value: 'infosec_inadequate',
            label: 'Information security or data privacy controls inadequate for current digital systems (IMS / DPDP)',
          },
        ],
      },
      {
        id: 'digital_maturity',
        section: '2',
        question: 'Where would you place your institution on digital and AI maturity?',
        type: 'single',
        options: [
          {
            value: 'paper_only',
            label: 'Paper-based only',
            blurb: 'No HIS. All clinical records, triage, and billing are manual.',
          },
          {
            value: 'basic_his',
            label: 'Basic HIS (billing and registration)',
            blurb: 'Digital billing and patient registration. Clinical workflows still manual.',
          },
          {
            value: 'his_integrated',
            label: 'HIS with lab and pharmacy integration',
            blurb: 'Investigations and prescriptions are in-system. Triage and nursing may still be manual.',
          },
          {
            value: 'his_telemedicine',
            label: 'HIS with telemedicine or remote consultation',
            blurb: 'Significant digital footprint. AI may be used in specific modules.',
          },
          {
            value: 'ai_cdss',
            label: 'HIS with AI-enabled clinical decision support',
            blurb: 'AI tools actively used for triage, early warning, or diagnostics.',
          },
          {
            value: 'ai_integrated',
            label: 'Fully integrated AI workflows',
            blurb:
              'AI embedded across triage, medication, and documentation (e.g. Medoc or equivalent).',
          },
        ],
      },
      {
        id: 'governance_infra',
        section: '2',
        question: 'Which of these governance structures currently exist in practice at your institution — not just on paper?',
        subtext:
          'Only count structures that meet regularly, produce records, and are acted upon.',
        type: 'multi',
        options: [
          { value: 'adverse_event_register',  label: 'Adverse event register maintained and reviewed at committee level' },
          { value: 'complaint_log',           label: 'Patient complaint log with trend analysis' },
          { value: 'ethics_committee',        label: 'Ethics committee with regular minuted meetings' },
          { value: 'staff_grievance',         label: 'Staff grievance mechanism that staff actually use' },
          { value: 'ai_eval_process',         label: 'AI/digital tool evaluation process before procurement or deployment' },
          { value: 'none',                    label: 'None of the above — these do not currently exist in practice' },
        ],
      },
      {
        id: 'ai_governance_level',
        section: '2',
        question: 'For AI or digital tools that influence clinical decisions in your hospital, which statement best describes your current governance?',
        subtext: 'Select the option that honestly reflects your current state, not your aspiration.',
        type: 'single',
        options: [
          {
            value: 'level_0',
            label: 'Level 0 — We do not currently use AI-enabled tools that influence clinical decisions.',
          },
          {
            value: 'level_1',
            label: 'Level 1 — We use such tools, but there is no formal policy or oversight committee for them.',
            blurb: 'Tools are in use but governance is absent.',
          },
          {
            value: 'level_2',
            label: 'Level 2 — We have policies for selecting and using these tools, but no structured monitoring of their performance, errors, or bias.',
            blurb: 'Policy exists; surveillance does not.',
          },
          {
            value: 'level_3',
            label: 'Level 3 — We have policies, documented approval processes, and periodic review or audit of AI tools (performance, errors, clinician feedback).',
            blurb: 'Structured governance with review mechanisms in place.',
          },
        ],
      },
      {
        id: 'ai_human_disagreement',
        section: '2',
        question: 'When AI or digital tools disagree with human clinical judgement, what typically happens?',
        type: 'single',
        condition: (a) => ['level_1', 'level_2', 'level_3'].includes(strVal(a, 'ai_governance_level')),
        options: [
          {
            value: 'no_rule',
            label: 'No clear rule — it depends entirely on the individual clinician in that moment.',
          },
          {
            value: 'clinician_prevails_undoc',
            label: 'Clinician decision always prevails; disagreements with AI are rarely documented.',
            blurb: 'Human oversight exists but leaves no trace.',
          },
          {
            value: 'clinician_prevails_doc',
            label: 'Clinician decision prevails, but significant disagreements are documented and sometimes discussed in meetings.',
            blurb: 'Ad-hoc oversight with partial documentation.',
          },
          {
            value: 'committee_review',
            label: 'Significant disagreements must be documented and are periodically reviewed by a committee (ethics, quality, or digital health committee).',
            blurb: 'Structured review — the closest to NABH ROM/IMS expectations.',
          },
        ],
      },
    ],
  },
  {
    title: 'Current governance priorities',
    description: 'What is your institution focused on right now?',
    questions: [
      {
        id: 'top_concern',
        section: '3',
        question: 'Which governance challenge concerns you most at present?',
        type: 'single',
        options: [
          { value: 'patient_safety',    label: 'Patient safety and harm reduction' },
          { value: 'staff_wellbeing',   label: 'Staff wellbeing and moral injury' },
          { value: 'equity',            label: 'Equitable access and fairness' },
          { value: 'throughput',        label: 'Throughput and waiting times' },
          { value: 'transparency',      label: 'Transparency and accountability' },
          { value: 'ethics_oversight',  label: 'Ethics oversight for clinical decisions' },
        ],
      },
      {
        id: 'ai_readiness',
        section: '3',
        question:
          'Where would you place your institution on AI readiness for clinical decision support?',
        type: 'scale',
        steps: 5,
        scaleMin: 'No AI governance structure in place',
        scaleMax: 'Mature AI governance — policies, oversight, audit in place',
      },
    ],
  },
  {
    title: 'Values and trade-offs',
    description: 'There are no right answers. These questions reveal where your institution stands.',
    questions: [
      {
        id: 'values_priority',
        section: '4',
        question:
          'If your emergency department is at 95% capacity, which value should the system prioritise?',
        type: 'single',
        options: [
          {
            value: 'safety_first',
            label: 'Clinical safety — admit only who can be safely managed',
            blurb: 'Throughput drops. Dignity may suffer.',
          },
          {
            value: 'throughput_first',
            label: 'Throughput — move patients through quickly to free space',
            blurb: 'Safety risk increases. Staff stress rises.',
          },
          {
            value: 'equity_first',
            label: 'Equity — ensure no patient is deprioritised by ability to pay',
            blurb: 'Clinical efficiency may fall.',
          },
          {
            value: 'dignity_first',
            label: 'Dignity — no patient waits in a corridor without information',
            blurb: 'Requires staff diversion. Throughput falls.',
          },
        ],
      },
      {
        id: 'harm_tolerance',
        section: '4',
        question:
          'Which statement best describes your institution\'s current stance on avoidable harm?',
        type: 'single',
        options: [
          {
            value: 'zero_tolerance',
            label: 'Zero tolerance — every avoidable harm is a governance failure',
          },
          {
            value: 'structured',
            label:
              'Structured tolerance — we accept that some avoidable harm is systemic, but track and report it',
          },
          {
            value: 'operational',
            label: 'Operational realism — we focus on what is achievable given our resources',
          },
          { value: 'not_sure', label: 'We have not formally articulated a stance' },
        ],
      },
    ],
  },
  {
    title: 'AI and oversight',
    description:
      'How you think about human oversight shapes how you should read the simulation.',
    questions: [
      {
        id: 'refusal_view',
        section: '5',
        question:
          'When an AI system refuses to act and escalates to a human, what does that signal to you?',
        type: 'single',
        options: [
          {
            value: 'failure',
            label: 'A failure — the system should handle edge cases',
            blurb: 'Prioritises automation over oversight.',
          },
          {
            value: 'expected',
            label: 'Expected behaviour — this is how it should work',
            blurb: 'Human in the loop is the design goal.',
          },
          {
            value: 'depends',
            label:
              'It depends on whether humans are actually available to act',
          },
          {
            value: 'not_sure',
            label: 'I have not thought about it in these terms',
          },
        ],
      },
      {
        id: 'human_override',
        section: '5',
        question:
          'How easy is it for staff to override an AI-generated triage or admission decision in your institution today?',
        type: 'scale',
        steps: 5,
        scaleMin: 'Very difficult — system decisions are treated as final',
        scaleMax: 'Very easy — staff override routinely and without friction',
      },
    ],
  },
  {
    title: 'What you want from this simulation',
    description: 'Your answer shapes how we frame the report narrative for your role.',
    questions: [
      {
        id: 'primary_use',
        section: '6',
        question: 'What will you primarily use the simulation results for?',
        type: 'single',
        options: [
          { value: 'board_report',    label: 'Preparing a governance or board report' },
          { value: 'nabh_prep',       label: 'NABH accreditation preparation or gap analysis' },
          { value: 'policy_design',   label: 'Designing or reviewing a policy or protocol' },
          { value: 'research',        label: 'Academic or policy research' },
          { value: 'learning',        label: 'Personal learning and exploration' },
          { value: 'team_discussion', label: 'Facilitating a team or committee discussion' },
          { value: 'procurement',     label: 'Evaluating AI tools for procurement' },
        ],
      },
      {
        id: 'open_comment',
        section: '6',
        question:
          'Anything else you want the system to know before it generates your report? (Optional)',
        subtext:
          'This context is included verbatim in the prompt for your narrative section.',
        type: 'text',
        optional: true,
      },
    ],
  },
]

// ── Simulation parameter derivation ──────────────────────────────────────────

function deriveSimParams(answers: Answers): Partial<SimulationParams> {
  const overrides: Partial<SimulationParams> = {}
  const inst = strVal(answers, 'institution_type')
  if (inst === 'government') overrides.profile = 'Government Hospital'
  else if (inst === 'private') overrides.profile = 'Private Hospital'
  else overrides.profile = 'Balanced'
  return overrides
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
        <span className="font-mono">
          Question {current} of {total}
        </span>
        <span className="font-mono">{pct}%</span>
      </div>
      <div className="h-0.5 bg-slate-800 rounded">
        <div
          className="h-0.5 bg-slate-500 rounded transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── Single choice ─────────────────────────────────────────────────────────────

function SingleChoice({
  question,
  value,
  onChange,
}: {
  question: Question
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      {question.options!.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`w-full text-left border rounded-lg p-4 transition-colors ${
            value === opt.value
              ? 'border-slate-400 bg-slate-800'
              : 'border-slate-800 bg-slate-900 hover:border-slate-700'
          }`}
        >
          <p className="text-sm text-slate-100">{opt.label}</p>
          {opt.blurb && (
            <p className="text-xs text-slate-500 mt-1">{opt.blurb}</p>
          )}
        </button>
      ))}
    </div>
  )
}

// ── Multi-select ──────────────────────────────────────────────────────────────

function MultiChoice({
  question,
  value,
  onChange,
}: {
  question: Question
  value: string[]
  onChange: (v: string[]) => void
}) {
  const max = question.maxSelect

  function toggle(optValue: string) {
    const isNone = optValue === 'none'

    if (isNone) {
      // "None" is mutually exclusive with everything else
      onChange(value.includes('none') ? [] : ['none'])
      return
    }

    // Selecting anything real deselects "none"
    const withoutNone = value.filter((v) => v !== 'none')

    if (withoutNone.includes(optValue)) {
      onChange(withoutNone.filter((v) => v !== optValue))
    } else {
      if (max != null && withoutNone.length >= max) return
      onChange([...withoutNone, optValue])
    }
  }

  const realSelected = value.filter((v) => v !== 'none')

  return (
    <div className="space-y-2">
      {question.options!.map((opt) => {
        const selected = value.includes(opt.value)
        const atMax =
          max != null &&
          !selected &&
          opt.value !== 'none' &&
          realSelected.length >= max

        return (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            disabled={atMax}
            className={`w-full text-left border rounded-lg p-4 transition-colors ${
              selected
                ? 'border-slate-400 bg-slate-800'
                : atMax
                ? 'border-slate-800 bg-slate-950 opacity-35 cursor-not-allowed'
                : 'border-slate-800 bg-slate-900 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center ${
                  selected
                    ? 'border-slate-400 bg-slate-600 text-slate-100'
                    : 'border-slate-600'
                }`}
              >
                {selected && (
                  <svg
                    width="10"
                    height="8"
                    viewBox="0 0 10 8"
                    fill="none"
                    className="text-slate-100"
                  >
                    <path
                      d="M1 4L3.5 6.5L9 1"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <div>
                <p className="text-sm text-slate-100">{opt.label}</p>
                {opt.blurb && (
                  <p className="text-xs text-slate-500 mt-1">{opt.blurb}</p>
                )}
              </div>
            </div>
          </button>
        )
      })}
      {max != null && (
        <p className="text-xs text-slate-500 mt-2 tabular-nums">
          {realSelected.length} / {max} selected
        </p>
      )}
    </div>
  )
}

// ── Scale ─────────────────────────────────────────────────────────────────────

function ScaleChoice({
  question,
  value,
  onChange,
}: {
  question: Question
  value: string
  onChange: (v: string) => void
}) {
  const steps = question.steps ?? 5
  const numVal = value ? parseInt(value, 10) : 0

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {Array.from({ length: steps }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onChange(String(n))}
            className={`flex-1 py-3 border rounded-lg text-sm font-mono transition-colors ${
              numVal === n
                ? 'border-slate-400 bg-slate-800 text-slate-100'
                : 'border-slate-800 bg-slate-900 text-slate-500 hover:border-slate-700'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span className="max-w-[45%] leading-relaxed">{question.scaleMin}</span>
        <span className="max-w-[45%] leading-relaxed text-right">
          {question.scaleMax}
        </span>
      </div>
    </div>
  )
}

// ── Text ──────────────────────────────────────────────────────────────────────

function TextInput({
  question,
  value,
  onChange,
}: {
  question: Question
  value: string
  onChange: (v: string) => void
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Optional — leave blank to skip"
      rows={4}
      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600 resize-none leading-relaxed"
    />
  )
}

// ── NABH status pill ──────────────────────────────────────────────────────────

const NABH_STATUS_LABELS: Record<string, { short: string; colour: string }> = {
  entry_level:  { short: 'Entry Level',  colour: 'text-emerald-400 border-emerald-800 bg-emerald-950/40' },
  full_first:   { short: 'Full — first', colour: 'text-sky-400 border-sky-800 bg-sky-950/40' },
  full_renewed: { short: 'Full — renewed', colour: 'text-sky-400 border-sky-800 bg-sky-950/40' },
  lapsed:       { short: 'Lapsed',       colour: 'text-amber-400 border-amber-800 bg-amber-950/40' },
  pursuing:     { short: 'Pursuing',     colour: 'text-slate-300 border-slate-700 bg-slate-800/60' },
  not_pursuing: { short: 'Not pursuing', colour: 'text-slate-500 border-slate-800 bg-slate-900' },
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SurveyPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [done, setDone] = useState(false)
  const [simRunning, setSimRunning] = useState(false)
  const [simError, setSimError] = useState<string | null>(null)

  // Compute visible questions reactively — conditional questions disappear
  // immediately when their prerequisite changes
  const visibleQuestions = useMemo(
    () =>
      SECTIONS.flatMap((s) => s.questions).filter(
        (q) => !q.condition || q.condition(answers)
      ),
    [answers]
  )

  const TOTAL = visibleQuestions.length
  const question = visibleQuestions[step]
  const namedAnswerForQ = answers[question?.id ?? '']
  const strAnswer = typeof namedAnswerForQ === 'string' ? namedAnswerForQ : ''
  const arrAnswer = Array.isArray(namedAnswerForQ) ? namedAnswerForQ : []

  // Section header: show when we're on the first visible question in a section
  const currentSection = question
    ? SECTIONS.find((s) => s.questions.some((q) => q.id === question.id))
    : null
  const firstVisibleInSection = currentSection?.questions.find(
    (q) => !q.condition || q.condition(answers)
  )
  const showSectionHeader = question?.id === firstVisibleInSection?.id

  // NABH status pill — shown as a subtle reminder in NABH-section questions
  const nabhStatus = strVal(answers, 'nabh_status')
  const nabhPill = NABH_STATUS_LABELS[nabhStatus]
  const isNabhSection = currentSection?.title === 'NABH and quality context'

  function setAnswer(v: string | string[]) {
    setAnswers((prev) => ({ ...prev, [question.id]: v }))
  }

  function canAdvance(): boolean {
    if (!question) return false
    if (question.optional || question.type === 'text') return true
    const v = answers[question.id]
    if (Array.isArray(v)) return v.length > 0
    return typeof v === 'string' && v.trim() !== ''
  }

  function handleNext() {
    // Safety: don't exceed bounds after conditional questions disappear
    const nextStep = Math.min(step + 1, TOTAL - 1)
    if (step < TOTAL - 1) {
      setStep(nextStep)
    } else {
      finish()
    }
  }

  function handleBack() {
    if (step > 0) setStep((s) => s - 1)
  }

  async function finish() {
    sessionStorage.setItem(SURVEY_KEY, JSON.stringify(answers))
    const derived = deriveSimParams(answers)
    setDone(true)

    // If there's already a completed simulation, just update the report
    if (sessionStorage.getItem(SESSION_KEY)) {
      setTimeout(() => router.push('/report'), 800)
      return
    }

    // Store default capacity so results page can read it
    const defaultCapacity = { patients_per_hour: 6, er_capacity: 2, opd_capacity: 4 }
    sessionStorage.setItem(CAPACITY_KEY, JSON.stringify(defaultCapacity))

    // Otherwise auto-run the simulation so the user lands on /results directly
    setSimRunning(true)
    try {
      const res = await fetch('/api/run_simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: derived.profile ?? 'Balanced',
          duration_ticks: 120,
          seed: Math.floor(Math.random() * 9999) + 1,
          patients_per_hour: defaultCapacity.patients_per_hour,
          er_capacity: defaultCapacity.er_capacity,
          opd_capacity: defaultCapacity.opd_capacity,
          survey_data: answers,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Simulation failed (${res.status}): ${text.slice(0, 200)}`)
      }
      const report = await res.json()
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(report))
      router.push('/results')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error'
      setSimError(message)
      setSimRunning(false)
      // Fallback: send to main page so user can retry manually
      setTimeout(() => {
        const params = new URLSearchParams()
        if (derived.profile) params.set('profile', derived.profile)
        router.push(`/?${params.toString()}`)
      }, 3000)
    }
  }

  function skip() {
    sessionStorage.setItem(SURVEY_KEY, JSON.stringify(answers))
    router.push(!!sessionStorage.getItem(SESSION_KEY) ? '/report' : '/')
  }

  if (done) {
    return (
      <main className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="text-4xl mb-4">✓</div>
        <p className="text-lg text-slate-200 mb-2">Survey complete.</p>
        {simError ? (
          <>
            <p className="text-sm text-red-400 mb-2">{simError}</p>
            <p className="text-xs text-slate-500">Redirecting to main page so you can retry…</p>
          </>
        ) : simRunning ? (
          <>
            <p className="text-sm text-slate-400 mb-6">
              Running simulation with your institutional context…
            </p>
            <HospitalFloorLoading />
          </>
        ) : (
          <p className="text-sm text-slate-400">Preparing your report…</p>
        )}
      </main>
    )
  }

  if (!question) return null

  const isLastQuestion = step === TOTAL - 1

  return (
    <main className="max-w-2xl mx-auto px-6 py-14">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="mb-8">
        <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-3">
          Context survey
        </p>
        <h1 className="text-3xl font-light text-slate-50 tracking-tight mb-2">
          Before the simulation
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-lg">
          Six short sections. Your answers shape the simulation profile and the governance
          narrative generated for your role. No answers are stored beyond your session.
        </p>
      </header>

      <ProgressBar current={step + 1} total={TOTAL} />

      {/* ── Section heading ─────────────────────────────────────────────────── */}
      {showSectionHeader && currentSection && (
        <div className="mb-5 border-l-2 border-slate-700 pl-4">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-0.5">
            Section {currentSection.questions[0]?.section ?? ''}
          </p>
          <p className="text-sm text-slate-300 font-medium">{currentSection.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">{currentSection.description}</p>
        </div>
      )}

      {/* ── NABH status reminder pill ─────────────────────────────────────── */}
      {isNabhSection && nabhPill && question.id !== 'nabh_status' && (
        <div className="flex items-center gap-2 mb-4">
          <span className={`text-xs border rounded px-2 py-0.5 font-mono ${nabhPill.colour}`}>
            NABH: {nabhPill.short}
          </span>
        </div>
      )}

      {/* ── Question ────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-base text-slate-100 leading-relaxed mb-1">
          {question.question}
        </p>
        {question.subtext && (
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            {question.subtext}
          </p>
        )}
      </div>

      {/* ── Input ───────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        {question.type === 'single' && (
          <SingleChoice
            question={question}
            value={strAnswer}
            onChange={(v) => setAnswer(v)}
          />
        )}
        {question.type === 'multi' && (
          <MultiChoice
            question={question}
            value={arrAnswer}
            onChange={(v) => setAnswer(v)}
          />
        )}
        {question.type === 'scale' && (
          <ScaleChoice
            question={question}
            value={strAnswer}
            onChange={(v) => setAnswer(v)}
          />
        )}
        {question.type === 'text' && (
          <TextInput
            question={question}
            value={strAnswer}
            onChange={(v) => setAnswer(v)}
          />
        )}
      </div>

      {/* ── Navigation ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {step > 0 && (
          <button
            onClick={handleBack}
            className="border border-slate-800 text-slate-500 px-4 py-2.5 rounded-lg hover:text-slate-300 hover:border-slate-700 transition-colors text-sm"
          >
            ← Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canAdvance()}
          className="flex-1 bg-slate-50 text-slate-950 font-medium py-3 rounded-lg hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          {isLastQuestion ? 'Finish & generate report' : 'Continue →'}
        </button>
        {(question.optional || question.type === 'text') && !isLastQuestion && (
          <button
            onClick={handleNext}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2"
          >
            Skip
          </button>
        )}
      </div>

      {/* ── Skip survey entirely ─────────────────────────────────────────────── */}
      <div className="mt-8 text-center">
        <button
          onClick={skip}
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
        >
          Skip survey and go directly to simulation
        </button>
      </div>

      <div className="mt-12">
        <Disclaimer />
      </div>
    </main>
  )
}
