'use client'

import { usePathname } from 'next/navigation'

export function SiteFooter() {
  const pathname = usePathname()
  if (pathname === '/') return null

  return (
    <footer className="border-t border-slate-200 bg-white py-4 px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <p>Institutional Mirror v2 — Governance Stress-Test Environment</p>
        <p>A self-reflection tool, not a clinical or predictive system.</p>
      </div>
    </footer>
  )
}
