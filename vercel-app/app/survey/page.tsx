'use client'

/**
 * /survey — Legacy v1 entry point.
 *
 * Redirected to / in v2. The scenario selector on the home page
 * replaces the survey flow entirely — scenario configs encode the
 * institutional context that the survey used to collect.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SurveyRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/') }, [router])
  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center">
      <p className="text-sm text-slate-500 font-mono">Redirecting…</p>
    </main>
  )
}
