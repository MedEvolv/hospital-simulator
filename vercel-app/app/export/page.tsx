'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  generateReport,
  getReportFilename,
  type ReportType,
} from '@/lib/export/reportGenerator'
import Disclaimer from '@/components/Disclaimer'
import AssumptionsPanel from '@/components/AssumptionsPanel'
import { SESSION_KEY } from '@/lib/types'
import type { SignalMetric } from '@/lib/types/simulation'
import type { ReflectiveInsight, GovernanceSnapshot } from '@/lib/scenarios/schema'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScenarioRunBlock {
  scenario: {
    id: string
    name: string
    description: string
    packId: string
    expectedRiskPathways: string[]
    learningObjectives: string[]
    simulationProfile: string
    durationTicks: number
    stressors?: Array<{ triggerTick: number; type: string; narrative: string }>
  }
  run_id: string
  seed: number
  timestamp: string
  base_event_count: number
  injected_event_count: number
  five_signals: {
    PSS: SignalMetric
    PES: SignalMetric
    SSS: SignalMetric
    EIC: SignalMetric
    STI: SignalMetric
  }
  governance_timeline: GovernanceSnapshot[]
  reflective_insights: ReflectiveInsight[]
  governance_state?: {
    human_state?: {
      averageFatigue?: number
      averageCognitiveLoad?: number
      alertFatigue?: number
      moraleScore?: number
      escalationWillingness?: number
      reviewCapacity?: number
    }
  }
}

// ── Report types ──────────────────────────────────────────────────────────────

const REPORT_DEFS: Array<{
  type: ReportType
  label: string
  description: string
  icon: string
  requiresScenario: boolean
}> = [
  {
    type: 'governance_stress_test',
    label: 'Governance Stress-Test Report',
    description: 'Full scenario analysis: metrics, timeline, stressor sequence, reflective insights, learning objectives. Primary governance artifact.',
    icon: '📋',
    requiresScenario: true,
  },
  {
    type: 'committee_briefing',
    label: 'Committee Briefing',
    description: 'Short executive summary of critical findings and discussion questions. Formatted for governance committee presentation.',
    icon: '📊',
    requiresScenario: true,
  },
  {
    type: 'ethical_debt',
    label: 'Ethical Debt Report',
    description: 'Debt source breakdown, affected groups, debt-generating findings, and debt reduction pathway.',
    icon: '⚖️',
    requiresScenario: true,
  },
  {
    type: 'raw_json',
    label: 'Raw JSON Run Record',
    description: 'Complete serialised scenario run for external analysis, archiving, or import into other governance tools.',
    icon: '{ }',
    requiresScenario: true,
  },
]

// ── Preview panel ─────────────────────────────────────────────────────────────

function PreviewPanel({ content }: { content: string }) {
  return (
    <div className="border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200">
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Preview</p>
        <p className="text-[10px] font-mono text-slate-700">
          {content.split('\n').length} lines
        </p>
      </div>
      <pre className="p-4 text-xs text-slate-600 font-mono leading-relaxed whitespace-pre-wrap overflow-auto max-h-96">
        {content.slice(0, 3000)}{content.length > 3000 ? '\n\n... (preview truncated)' : ''}
      </pre>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ExportPage() {
  const router = useRouter()
  const [scenarioRun, setScenarioRun] = useState<ScenarioRunBlock | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [selectedType, setSelectedType] = useState<ReportType>('governance_stress_test')
  const [preview, setPreview] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (raw) {
      try {
        const report = JSON.parse(raw)
        if (report?.scenario_run) {
          const sr = report.scenario_run
          // Merge in expert feedback from sessionStorage if not already on the run
          if (!sr.expert_feedback) {
            const runId = sr.run_id
            const fbKey = `im_expert_feedback${runId ? `_${runId}` : ''}`
            try {
              const fbRaw = sessionStorage.getItem(fbKey)
              if (fbRaw) sr.expert_feedback = JSON.parse(fbRaw)
            } catch { /* ignore */ }
          }
          setScenarioRun(sr)
        }
      } catch { /* ignore */ }
    }
    setLoaded(true)
  }, [])

  function generatePreview() {
    if (!scenarioRun) return
    const content = generateReport(scenarioRun, selectedType)
    setPreview(content)
  }

  function downloadReport() {
    if (!scenarioRun) return
    const content = generateReport(scenarioRun, selectedType)
    const filename = getReportFilename(scenarioRun, selectedType)
    const mimeType = selectedType === 'raw_json' ? 'application/json' : 'text/markdown'

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async function copyToClipboard() {
    if (!scenarioRun) return
    const content = generateReport(scenarioRun, selectedType)
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!loaded) return null

  return (
    <main className="max-w-5xl mx-auto px-6 py-14">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="text-xs font-mono text-slate-500 tracking-widest uppercase mb-2">
            Institutional Mirror v2
          </p>
          <h1 className="text-4xl font-light text-slate-900 tracking-tight mb-2">
            Export governance artifact
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
            Every scenario run produces at least one exportable governance artifact.
            Choose a format, preview it, and download or copy it to clipboard.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          {scenarioRun && (
            <button
              onClick={() => router.push('/results')}
              className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded transition-colors"
            >
              ← Results
            </button>
          )}
          <button
            onClick={() => router.push('/home')}
            className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded transition-colors"
          >
            New scenario
          </button>
        </div>
      </div>

      {/* ── No scenario loaded ────────────────────────────────── */}
      {!scenarioRun && (
        <div className="border border-slate-200 rounded-lg p-6 mb-8 bg-slate-50/40 text-center">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-3">
            No scenario loaded
          </p>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            Export requires a completed scenario run. Run a scenario first to generate exportable artifacts.
          </p>
          <button
            onClick={() => router.push('/home')}
            className="bg-slate-50 text-slate-950 font-medium py-2.5 px-6 rounded-lg hover:bg-white transition-colors text-sm"
          >
            Run a scenario →
          </button>
        </div>
      )}

      {/* ── Scenario context ─────────────────────────────────── */}
      {scenarioRun && (
        <div className="border border-slate-200 rounded-lg p-4 mb-8 bg-slate-50/40">
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest mb-1">
            Source run
          </p>
          <p className="text-sm text-slate-800">{scenarioRun.scenario.name}</p>
          <div className="flex gap-4 mt-1 text-[10px] font-mono text-slate-600">
            <span>{scenarioRun.scenario.packId}</span>
            <span>·</span>
            <span>seed {scenarioRun.seed}</span>
            <span>·</span>
            <span>{scenarioRun.timestamp.slice(0, 10)}</span>
            <span>·</span>
            <span>run {scenarioRun.run_id.slice(0, 8)}</span>
          </div>
        </div>
      )}

      {scenarioRun && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Report type selector ───────────────────────────── */}
          <div className="lg:col-span-1 space-y-2">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">
              Artifact type
            </p>
            {REPORT_DEFS.map(def => (
              <button
                key={def.type}
                type="button"
                onClick={() => { setSelectedType(def.type); setPreview(null) }}
                className={`w-full text-left border rounded-lg p-4 transition-all ${
                  selectedType === def.type
                    ? 'border-slate-500 bg-slate-100'
                    : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-base shrink-0">{def.icon}</span>
                  <div>
                    <p className="text-xs font-medium text-slate-800 leading-snug">{def.label}</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-1">{def.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* ── Preview + download ─────────────────────────────── */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={generatePreview}
                className="text-sm border border-slate-300 text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-lg transition-colors"
              >
                Preview
              </button>
              <button
                onClick={downloadReport}
                className="text-sm bg-slate-50 text-slate-950 font-medium hover:bg-white px-4 py-2 rounded-lg transition-colors"
              >
                Download .{selectedType === 'raw_json' ? 'json' : 'md'}
              </button>
              <button
                onClick={copyToClipboard}
                className="text-sm border border-slate-300 text-slate-700 hover:bg-slate-100 px-4 py-2 rounded-lg transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy to clipboard'}
              </button>
            </div>

            {preview ? (
              <PreviewPanel content={preview} />
            ) : (
              <div className="border border-slate-200 rounded-lg p-8 text-center bg-slate-50/40">
                <p className="text-sm text-slate-600">
                  Click <span className="text-slate-600">Preview</span> to see the report,
                  or <span className="text-slate-600">Download</span> directly.
                </p>
              </div>
            )}

            {/* Filename info */}
            <p className="text-[10px] font-mono text-slate-700 mt-3">
              Filename: {getReportFilename(scenarioRun, selectedType)}
            </p>
          </div>
        </div>
      )}

      {/* ── Assumptions ───────────────────────────────────────── */}
      <div className="mb-4">
        <AssumptionsPanel compact />
      </div>

      {/* ── Disclaimer ────────────────────────────────────────── */}
      <Disclaimer />
    </main>
  )
}
