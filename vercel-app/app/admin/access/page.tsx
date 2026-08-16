'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import type { AccessRow } from '@/lib/auth/access-types'
import { ACCESS_COPY, ORG_TYPE_LABELS } from '@/lib/auth/access-types'
import { normalizeLinkedInUrl } from '@/lib/auth/intake'

function hoursPending(createdAt: string): string {
  const then = Date.parse(createdAt)
  if (!Number.isFinite(then)) return ''
  const hours = Math.max(0, Math.round((Date.now() - then) / 36e5))
  return hours < 1 ? 'pending <1h' : `pending ${hours}h`
}

function OutreachLinks({ row }: { row: AccessRow }) {
  const linkedin = normalizeLinkedInUrl(row.linkedin_url)
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      <a href={`mailto:${row.work_email}`} className="font-mono text-cyan-100 underline underline-offset-2">
        {row.work_email}
      </a>
      {linkedin && (
        <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-cyan-100 underline underline-offset-2">
          LinkedIn
        </a>
      )}
    </div>
  )
}

export default function AccessQueuePage() {
  const [rows, setRows] = useState<AccessRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [setup, setSetup] = useState(false)
  const [denyFor, setDenyFor] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/access')
    const data = await res.json().catch(() => ({}))
    if (res.status === 401 || res.status === 403) {
      setError(typeof data.error === 'string' ? data.error : 'This queue is not opened for this email.')
      return
    }
    if (!res.ok) {
      setSetup(data.setup === true)
      setError(typeof data.error === 'string' ? data.error : 'Could not load the queue.')
      return
    }
    setRows(Array.isArray(data.rows) ? data.rows : [])
    setError(null)
    setSetup(false)
  }, [])

  useEffect(() => {
    load().catch(() => setError('Could not load the queue.'))
  }, [load])

  async function act(workEmail: string, action: 'approve' | 'deny' | 'revoke', denyReason?: string) {
    setBusy(`${action}:${workEmail}`)
    try {
      const res = await fetch('/api/admin/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ work_email: workEmail, action, reason: denyReason }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not update that request.')
        return
      }
      setDenyFor(null)
      setReason('')
      await load()
    } finally {
      setBusy(null)
    }
  }

  const pending = rows.filter((row) => row.status === 'pending')
  const rest = rows.filter((row) => row.status !== 'pending')

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-8">
      <div className="max-w-xl mx-auto space-y-6">
        <header>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">Institutional Mirror</p>
          <h1 className="text-2xl font-bold mt-2">Access queue</h1>
          <p className="text-sm text-white/65 mt-2">Outreach card, then yes or no. Reaching out does not open the door. Not certification.</p>
        </header>

        {error && (
          <p className={`text-sm leading-relaxed ${setup ? 'text-amber-200' : 'text-rose-200'}`}>{error}</p>
        )}

        {pending.length === 0 && !error && (
          <p className="text-sm text-white/60">No pending requests.</p>
        )}

        {pending.map((row) => (
          <article key={row.id} className="rounded-xl border border-white/15 bg-white/5 p-4 space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold">{row.full_name}</h2>
              <p className="text-[10px] uppercase tracking-widest text-white/50">{hoursPending(row.created_at)}</p>
            </div>
            <p className="text-xs text-white/70">
              {row.role} · {row.organisation} · {ORG_TYPE_LABELS[row.organisation_type]}
              {row.organisation_type_other ? ` (${row.organisation_type_other})` : ''} · {row.city}
            </p>
            <OutreachLinks row={row} />
            <p className="text-[10px] text-white/45 leading-relaxed">{ACCESS_COPY.outreachNote}</p>
            <div className="flex flex-wrap gap-1">
              {row.mirror_for.map((chip) => (
                <span key={chip} className="text-[10px] uppercase tracking-wider border border-white/25 px-2 py-0.5 rounded-full">
                  {chip === 'other' ? row.mirror_for_other || 'Other' : chip}
                </span>
              ))}
            </div>
            <p className="text-sm text-white/85 leading-relaxed">&ldquo;{row.use_sentence}&rdquo;</p>
            <p className="text-[10px] uppercase tracking-widest text-white/45">
              ticks: {row.attest_rehearsal_only ? 'records' : 'missing'} / {row.attest_not_certification ? 'not cert' : 'missing'} / {row.attest_authorised ? 'authorised' : 'missing'} / {row.contact_ok ? 'contact' : 'missing'}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => act(row.work_email, 'approve')}
                className="flex-1 bg-white text-slate-950 text-xs font-bold uppercase tracking-wider py-2 rounded-md"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => setDenyFor(row.work_email)}
                className="flex-1 border border-white/30 text-xs font-bold uppercase tracking-wider py-2 rounded-md"
              >
                Deny
              </button>
            </div>
            {denyFor === row.work_email && (
              <form
                className="space-y-2"
                onSubmit={(event: FormEvent) => {
                  event.preventDefault()
                  act(row.work_email, 'deny', reason)
                }}
              >
                <label className="block text-[10px] uppercase tracking-widest text-white/50">
                  Internal reason (optional)
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="mt-1 w-full bg-black/40 border border-white/20 rounded-md px-3 py-2 text-sm"
                  />
                </label>
                <button type="submit" className="text-xs uppercase tracking-widest text-rose-200">
                  Confirm deny
                </button>
              </form>
            )}
          </article>
        ))}

        {rest.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/50">Decided</h2>
            {rest.map((row) => (
              <article key={row.id} className="rounded-lg border border-white/10 p-3 space-y-2">
                <p className="text-sm">
                  {row.full_name} · <span className="uppercase tracking-wider text-white/50">{row.status}</span>
                </p>
                <OutreachLinks row={row} />
                {row.status === 'approved' && (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => act(row.work_email, 'revoke')}
                    className="text-[10px] uppercase tracking-widest text-amber-200"
                  >
                    Revoke
                  </button>
                )}
              </article>
            ))}
          </section>
        )}

        <p className="text-[10px] text-white/35 leading-relaxed">{ACCESS_COPY.erasure}</p>
      </div>
    </main>
  )
}
