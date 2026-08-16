/**
 * Email OTP send path.
 *
 * Priority:
 * 1. AUTH_OTP_STUB=1  (CI / local tests, never hits live mail)
 * 2. RESEND_API_KEY   (Vercel-friendly email)
 * 3. Supabase Auth email OTP when NEXT_PUBLIC_SUPABASE_* are set
 *    (already in this stack; phone OTP is the next provider)
 * 4. none             (fail closed)
 */

export type OtpProviderMode = 'stub' | 'resend' | 'supabase' | 'none'

export function getOtpProvider(): OtpProviderMode {
  if (process.env.AUTH_OTP_STUB === '1') return 'stub'
  if (process.env.RESEND_API_KEY) return 'resend'
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return 'supabase'
  }
  return 'none'
}

export function otpSendConfigured(): boolean {
  return getOtpProvider() !== 'none'
}

const FROM_EMAIL = process.env.OTP_FROM_EMAIL || 'Institutional Mirror <noreply@archlife.in>'

export async function sendOtpEmail(email: string, otp: string): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false, error: 'OTP not configured' }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [email],
      subject: 'Your Institutional Mirror access code',
      text: [
        `Your access code is ${otp}.`,
        'It expires in 10 minutes.',
        'This code opens the alignment work for practitioners. It is not NABH identity proofing.',
        'If you did not request this, ignore the email.',
      ].join('\n'),
    }),
  })

  if (!res.ok) {
    return { ok: false, error: 'OTP not configured' }
  }
  return { ok: true }
}

export async function sendSupabaseOtp(email: string): Promise<{ ok: boolean; error?: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return { ok: false, error: 'OTP not configured' }

  const res = await fetch(`${url}/auth/v1/otp`, {
    method: 'POST',
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      create_user: true,
    }),
  })

  if (!res.ok) {
    return { ok: false, error: 'OTP not configured' }
  }
  return { ok: true }
}

export async function verifySupabaseOtp(email: string, token: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return false

  const res = await fetch(`${url}/auth/v1/verify`, {
    method: 'POST',
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'email',
      email,
      token,
    }),
  })

  return res.ok
}
