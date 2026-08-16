import { CHALLENGE_COOKIE, SESSION_COOKIE } from './config'

export function cookieBase() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  }
}

export function expiredAuthCookies() {
  return { ...cookieBase(), maxAge: 0 }
}

export function clearAuthCookies(res: { cookies: { set: (name: string, value: string, opts: object) => void } }) {
  const expired = expiredAuthCookies()
  res.cookies.set(SESSION_COOKIE, '', expired)
  res.cookies.set(CHALLENGE_COOKIE, '', expired)
}
