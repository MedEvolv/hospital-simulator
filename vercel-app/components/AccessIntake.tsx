'use client'

import { FormEvent, useMemo, useState } from 'react'
import {
  ACCESS_COPY,
  ACCESS_LABELS,
  FIELD_LIMITS,
  MIRROR_FOR_CHIPS,
  ORG_TYPE_LABELS,
  ORG_TYPES,
  type MirrorForChip,
  type OrgType,
} from '@/lib/auth/access-types'

const fieldClass =
  'w-full bg-black/35 border border-white/25 text-white placeholder:text-white/35 rounded-md px-3 py-2.5 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-white/40'
const labelClass = 'block text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mb-2'

export function AccessIntake({
  onSwitchToOtp,
}: {
  onSwitchToOtp: () => void
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [organisation, setOrganisation] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [orgType, setOrgType] = useState<OrgType | ''>('')
  const [orgTypeOther, setOrgTypeOther] = useState('')
  const [city, setCity] = useState('')
  const [chips, setChips] = useState<MirrorForChip[]>([])
  const [chipOther, setChipOther] = useState('')
  const [useSentence, setUseSentence] = useState('')
  const [tickRecords, setTickRecords] = useState(false)
  const [tickCert, setTickCert] = useState(false)
  const [tickAuthorised, setTickAuthorised] = useState(false)
  const [tickContact, setTickContact] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [received, setReceived] = useState(false)

  const canSubmit = useMemo(() => {
    return (
      fullName.trim().length > 0 &&
      email.trim().length > 3 &&
      role.trim().length > 0 &&
      organisation.trim().length > 0 &&
      linkedin.trim().length > 8 &&
      orgType !== '' &&
      city.trim().length > 0 &&
      chips.length > 0 &&
      useSentence.trim().length > 0 &&
      tickRecords &&
      tickCert &&
      tickAuthorised &&
      tickContact &&
      !busy
    )
  }, [
    fullName,
    email,
    role,
    organisation,
    linkedin,
    orgType,
    city,
    chips,
    useSentence,
    tickRecords,
    tickCert,
    tickAuthorised,
    tickContact,
    busy,
  ])

  function toggleChip(chip: MirrorForChip) {
    setChips((current) => (current.includes(chip) ? current.filter((item) => item !== chip) : [...current, chip]))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/access/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          work_email: email,
          role,
          organisation,
          organisation_type: orgType,
          organisation_type_other: orgTypeOther,
          city,
          linkedin_url: linkedin,
          mirror_for: chips,
          mirror_for_other: chipOther,
          use_sentence: useSentence,
          attest_rehearsal_only: tickRecords,
          attest_not_certification: tickCert,
          attest_authorised: tickAuthorised,
          contact_ok: tickContact,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 409) {
        setError(typeof data.error === 'string' ? data.error : ACCESS_COPY.alreadyOpened)
        return
      }
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not save this request.')
        return
      }
      setReceived(true)
    } catch {
      setError('Could not save this request.')
    } finally {
      setBusy(false)
    }
  }

  if (received) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-white/85 leading-relaxed">{ACCESS_COPY.received}</p>
        <button
          type="button"
          onClick={onSwitchToOtp}
          className="w-full text-[10px] font-bold uppercase tracking-widest text-white/70 hover:text-white"
        >
          {ACCESS_COPY.alreadyApproved}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-xs text-white/70 leading-relaxed">{ACCESS_COPY.intro}</p>

      <div>
        <label htmlFor="im-intake-name" className={labelClass}>
          {ACCESS_LABELS.full_name}
        </label>
        <input
          id="im-intake-name"
          name="full_name"
          type="text"
          autoComplete="name"
          required
          maxLength={FIELD_LIMITS.full_name}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="im-intake-org" className={labelClass}>
          {ACCESS_LABELS.organisation}
        </label>
        <input
          id="im-intake-org"
          name="organisation"
          type="text"
          autoComplete="organization"
          required
          maxLength={FIELD_LIMITS.organisation}
          value={organisation}
          onChange={(e) => setOrganisation(e.target.value)}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="im-intake-role" className={labelClass}>
          {ACCESS_LABELS.role}
        </label>
        <input
          id="im-intake-role"
          name="role"
          type="text"
          required
          maxLength={FIELD_LIMITS.role}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Pathologist, lab owner, DPO, founder"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="im-intake-email" className={labelClass}>
          {ACCESS_LABELS.work_email}
        </label>
        <input
          id="im-intake-email"
          name="work_email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@institution.in"
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="im-intake-linkedin" className={labelClass}>
          {ACCESS_LABELS.linkedin_url}
        </label>
        <input
          id="im-intake-linkedin"
          name="linkedin_url"
          type="text"
          inputMode="url"
          autoComplete="url"
          required
          maxLength={FIELD_LIMITS.linkedin_url}
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
          placeholder="https://www.linkedin.com/in/you"
          className={fieldClass}
        />
      </div>

      <fieldset>
        <legend className={labelClass}>{ACCESS_LABELS.organisation_type}</legend>
        <div className="grid grid-cols-2 gap-2">
          {ORG_TYPES.map((type) => (
            <label
              key={type}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs ${
                orgType === type ? 'border-white/70 bg-white/10 text-white' : 'border-white/20 text-white/75'
              }`}
            >
              <input
                type="radio"
                name="organisation_type"
                value={type}
                checked={orgType === type}
                onChange={() => setOrgType(type)}
                required
              />
              {ORG_TYPE_LABELS[type]}
            </label>
          ))}
        </div>
      </fieldset>

      {orgType === 'other' && (
        <div>
          <label htmlFor="im-intake-org-other" className={labelClass}>
            {ACCESS_LABELS.organisation_type_other}
          </label>
          <input
            id="im-intake-org-other"
            name="organisation_type_other"
            type="text"
            required
            maxLength={FIELD_LIMITS.other_specify}
            value={orgTypeOther}
            onChange={(e) => setOrgTypeOther(e.target.value)}
            className={fieldClass}
          />
        </div>
      )}

      <div>
        <label htmlFor="im-intake-city" className={labelClass}>
          {ACCESS_LABELS.city}
        </label>
        <input
          id="im-intake-city"
          name="city"
          type="text"
          required
          maxLength={FIELD_LIMITS.city}
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className={fieldClass}
        />
      </div>

      <fieldset>
        <legend className={labelClass}>{ACCESS_LABELS.mirror_for}</legend>
        <div className="flex flex-wrap gap-2">
          {MIRROR_FOR_CHIPS.map((chip) => {
            const on = chips.includes(chip)
            return (
              <button
                key={chip}
                type="button"
                onClick={() => toggleChip(chip)}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
                  on ? 'border-white bg-white text-slate-950' : 'border-white/30 text-white/80'
                }`}
              >
                {chip === 'other' ? 'Other' : chip}
              </button>
            )
          })}
        </div>
      </fieldset>

      {chips.includes('other') && (
        <div>
          <label htmlFor="im-intake-chip-other" className={labelClass}>
            {ACCESS_LABELS.mirror_for_other}
          </label>
          <input
            id="im-intake-chip-other"
            name="mirror_for_other"
            type="text"
            required
            maxLength={FIELD_LIMITS.other_specify}
            value={chipOther}
            onChange={(e) => setChipOther(e.target.value)}
            className={fieldClass}
          />
        </div>
      )}

      <div>
        <label htmlFor="im-intake-use" className={labelClass}>
          {ACCESS_LABELS.use_sentence}
        </label>
        <textarea
          id="im-intake-use"
          name="use_sentence"
          required
          maxLength={FIELD_LIMITS.use_sentence}
          rows={3}
          value={useSentence}
          onChange={(e) => setUseSentence(e.target.value)}
          className={`${fieldClass} resize-none`}
        />
      </div>

      <div className="space-y-3">
        <label className="flex gap-3 text-xs text-white/80 leading-relaxed">
          <input
            type="checkbox"
            checked={tickRecords}
            onChange={(e) => setTickRecords(e.target.checked)}
            required
            className="mt-0.5"
          />
          <span>{ACCESS_COPY.tickRecords}</span>
        </label>
        <label className="flex gap-3 text-xs text-white/80 leading-relaxed">
          <input
            type="checkbox"
            checked={tickCert}
            onChange={(e) => setTickCert(e.target.checked)}
            required
            className="mt-0.5"
          />
          <span>{ACCESS_COPY.tickCert}</span>
        </label>
        <label className="flex gap-3 text-xs text-white/80 leading-relaxed">
          <input
            type="checkbox"
            checked={tickAuthorised}
            onChange={(e) => setTickAuthorised(e.target.checked)}
            required
            className="mt-0.5"
          />
          <span>{ACCESS_COPY.tickAuthorised}</span>
        </label>
        <label className="flex gap-3 text-xs text-white/80 leading-relaxed">
          <input
            type="checkbox"
            checked={tickContact}
            onChange={(e) => setTickContact(e.target.checked)}
            required
            className="mt-0.5"
          />
          <span>{ACCESS_COPY.tickContact}</span>
        </label>
      </div>

      <p className="text-[10px] text-white/45 leading-relaxed">{ACCESS_COPY.noticePurpose}</p>
      <p className="text-[10px] text-white/45 leading-relaxed">{ACCESS_COPY.noticeDoorMail}</p>
      <p className="text-[10px] text-white/45 leading-relaxed">{ACCESS_COPY.erasure}</p>

      {error && <p className="text-xs text-rose-200 leading-relaxed">{error}</p>}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-white text-slate-950 font-bold uppercase tracking-wider text-xs py-3 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-40"
      >
        {busy ? 'Working…' : 'Request access'}
      </button>

      <button
        type="button"
        onClick={onSwitchToOtp}
        className="w-full text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-white"
      >
        {ACCESS_COPY.alreadyApproved}
      </button>
    </form>
  )
}
