'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { AccessIntake } from '@/components/AccessIntake'
import { OtpLogin } from '@/components/OtpLogin'
import { ACCESS_COPY } from '@/lib/auth/access-types'
import { safeNextPath } from '@/lib/auth/config'

function SplashInner() {
  const params = useSearchParams()
  const nextPath = safeNextPath(params.get('next'))
  const [inside, setInside] = useState(false)
  const [door, setDoor] = useState<'intake' | 'otp'>('intake')

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/session')
      .then((res) => {
        if (!cancelled && res.ok) setInside(true)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="im-splash relative min-h-[100dvh] w-full bg-black text-white overflow-hidden">
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <img
          src="/mirror-door.webp"
          alt="A hospital corridor split by a glass pane. This side is a worn Indian ward. The reflection is a cared-for hospital."
          className="im-splash-bg absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/70 sm:bg-gradient-to-r sm:from-amber-950/45 sm:via-black/15 sm:to-cyan-950/40" />
        <div className="im-glass-seam pointer-events-none absolute top-0 bottom-0 left-1/2 hidden sm:block w-[3px] -translate-x-1/2 bg-gradient-to-b from-white/5 via-white/80 to-white/5 shadow-[0_0_28px_rgba(255,255,255,0.35)]" />
        <div className="im-glass-bevel pointer-events-none absolute top-0 bottom-0 left-1/2 hidden sm:block w-8 -translate-x-1/2 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
      </div>

      <div className="relative z-10 min-h-[100dvh] flex flex-col">
        <header className="px-5 pt-6 sm:px-8 sm:pt-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-sm bg-rose-600 shadow-[0_0_12px_rgba(225,29,72,0.55)]" />
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.22em] text-white/80">
              Institutional Mirror
            </p>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
            Practitioners
          </p>
        </header>

        <div className="flex-1 grid grid-rows-[auto_1fr_auto] sm:grid-rows-1 sm:grid-cols-2 gap-4 px-5 sm:px-8 py-6 sm:py-10">
          <p className="sm:self-end sm:pb-8 max-w-[16rem] text-sm sm:text-base font-serif text-white/85 leading-snug">
            This side is the ward.
          </p>
          <p className="hidden sm:block sm:self-end sm:justify-self-end sm:pb-8 sm:text-right max-w-[18rem] text-base font-serif text-cyan-50/90 leading-snug">
            The reflection is the rehearsal.
          </p>
        </div>
      </div>

      <div className="relative z-20 px-4 pb-6 sm:absolute sm:inset-0 sm:flex sm:items-center sm:justify-center sm:px-4 sm:pb-0">
        <section
          aria-label="Access intake"
          className="im-glass-card w-full max-w-sm mx-auto rounded-2xl border border-white/30 bg-black/35 backdrop-blur-md shadow-[0_24px_80px_rgba(0,0,0,0.55)] p-6 sm:p-7 max-h-[min(90dvh,46rem)] overflow-y-auto"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60 mb-3">
            Institutional Mirror
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
            Step through the glass.
          </h1>
          <p className="text-sm text-white/80 leading-relaxed mb-2">
            This side is the ward. The reflection is the rehearsal.
          </p>
          <p className="text-xs text-white/65 leading-relaxed mb-6">
            Practitioner door for a real institution. Alignment work is not a public brief. Not NABH certification. Not a claim that the Mirror certifies a lab.
          </p>
          {inside ? (
            <Link
              href={nextPath}
              className="block w-full text-center bg-white text-slate-950 font-bold uppercase tracking-wider text-xs py-3 rounded-md hover:bg-slate-100 transition-colors"
            >
              Enter the work
            </Link>
          ) : door === 'intake' ? (
            <AccessIntake onSwitchToOtp={() => setDoor('otp')} />
          ) : (
            <div className="space-y-4">
              <OtpLogin nextPath={nextPath} />
              <button
                type="button"
                onClick={() => setDoor('intake')}
                className="w-full text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white"
              >
                {ACCESS_COPY.backToIntake}
              </button>
            </div>
          )}
          <p className="mt-5 text-[10px] leading-relaxed text-white/45">
            {ACCESS_COPY.otpPrivacy}
          </p>
        </section>
      </div>
    </main>
  )
}

export function SplashDoor() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-black" />}>
      <SplashInner />
    </Suspense>
  )
}
