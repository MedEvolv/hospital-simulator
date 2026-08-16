import { NextResponse } from 'next/server'
import { CHALLENGE_COOKIE, SESSION_COOKIE } from '@/lib/auth/config'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  const expired = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  }
  res.cookies.set(SESSION_COOKIE, '', expired)
  res.cookies.set(CHALLENGE_COOKIE, '', expired)
  return res
}
