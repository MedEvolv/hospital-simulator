'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'identifier' | 'verify'

export function OtpLogin({ nextPath = '/home' }: { nextPath?: string }) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('identifier')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [configured, setConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/request')
      .then((res) => res.json())
      .then((data: { configured?: boolean }) => {
        if (!cancelled) setConfigured(data.configured !== false)
      })
      .catch(() => {
        if (!cancelled) setConfigured(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const canSend = useMemo(() => email.trim().length > 3 && !busy, [email, busy])
  const canVerify = useMemo(() => /^\d{6}$/.test(otp) && !busy, [otp, busy])

  async function requestCode(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch('/api/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 503 || data.configured === false) {
        setConfigured(false)
        setError('OTP not configured')
        return
      }
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not send a code.')
        return
      }
      setStep('verify')
      setNotice(typeof data.message === 'string' ? data.message : 'Enter the six-digit code.')
    } catch {
      setError('Could not send a code.')
    } finally {
      setBusy(false)
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, next: nextPath }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 503 || data.configured === false) {
        setConfigured(false)
        setError('OTP not configured')
        return
      }
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'That code did not match.')
        return
      }
      router.push(typeof data.next === 'string' ? data.next : '/home')
      router.refresh()
    } catch {
      setError('Could not verify that code.')
    } finally {
      setBusy(false)
    }
  }

  if (configured === false) {
    return (
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">OTP not configured</p>
        <p className="text-sm text-white/80 leading-relaxed">
          The door is here. Production still needs the email OTP keys before a code can be sent.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={step === 'identifier' ? requestCode : verifyCode} className="space-y-4">
      <div>
        <label htmlFor="im-otp-email" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">
          Work email
        </label>
        <input
          id="im-otp-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@institution.in"
          className="w-full bg-black/35 border border-white/25 text-white placeholder:text-white/35 rounded-md px-3 py-2.5 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-white/40"
        />
      </div>

      {step === 'verify' && (
        <div>
          <label htmlFor="im-otp-code" className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">
            One-time code
          </label>
          <input
            id="im-otp-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full bg-black/35 border border-white/25 text-white placeholder:text-white/35 rounded-md px-3 py-2.5 text-sm font-mono tracking-[0.4em] text-center focus:outline-none focus:ring-2 focus:ring-white/40"
          />
        </div>
      )}

      {notice && <p className="text-xs text-white/75 leading-relaxed">{notice}</p>}
      {error && <p className="text-xs text-rose-200 leading-relaxed">{error}</p>}

      <button
        type="submit"
        disabled={step === 'identifier' ? !canSend : !canVerify}
        className="w-full bg-white text-slate-950 font-bold uppercase tracking-wider text-xs py-3 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-40"
      >
        {busy ? 'Working…' : step === 'identifier' ? 'Send OTP' : 'Verify'}
      </button>

      {step === 'verify' && (
        <button
          type="button"
          onClick={() => {
            setStep('identifier')
            setOtp('')
            setError(null)
            setNotice(null)
          }}
          className="w-full text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white"
        >
          Use a different email
        </button>
      )}
    </form>
  )
}
