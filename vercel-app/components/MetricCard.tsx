'use client'

import { useState } from 'react'

interface MetricCardProps {
  abbrev: string
  fullName: string
  value: number | string
  unit?: string
  description: string
  expandedNote?: string
  isCount?: boolean
}

export default function MetricCard({
  abbrev,
  fullName,
  value,
  unit = '',
  description,
  expandedNote,
  isCount = false,
}: MetricCardProps) {
  const [expanded, setExpanded] = useState(false)

  const displayValue = typeof value === 'number' && !isCount
    ? value.toFixed(1)
    : String(value)

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-mono text-slate-500 tracking-widest uppercase">{abbrev}</span>
          <p className="text-sm text-slate-300 mt-0.5">{fullName}</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-light text-slate-50 tabular-nums">{displayValue}</span>
          {unit && <span className="text-sm text-slate-400 ml-1">{unit}</span>}
        </div>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-800 pt-3">
        {description}
      </p>

      {expandedNote && (
        <>
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-slate-500 hover:text-slate-300 text-left transition-colors"
          >
            {expanded ? '▲ Less context' : '▼ Why this metric matters'}
          </button>
          {expanded && (
            <p className="text-xs text-slate-400 leading-relaxed bg-slate-800 rounded p-3">
              {expandedNote}
            </p>
          )}
        </>
      )}
    </div>
  )
}
