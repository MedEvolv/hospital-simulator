import type { Severity } from '@/lib/types'

const styles: Record<Severity, string> = {
  INFO:     'bg-blue-950 text-blue-300 border border-blue-800',
  MEDIUM:   'bg-amber-950 text-amber-300 border border-amber-800',
  HIGH:     'bg-orange-950 text-orange-300 border border-orange-800',
  CRITICAL: 'bg-red-950 text-red-300 border border-red-800',
}

const labels: Record<Severity, string> = {
  INFO:     'Signal',
  MEDIUM:   'Moderate',
  HIGH:     'High',
  CRITICAL: 'Critical',
}

export default function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium tracking-wide ${styles[severity]}`}>
      {labels[severity]}
    </span>
  )
}
