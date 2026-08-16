import { isEmailApproved } from './access-lookup'
import { isGatedPath, isPublicPath, splashRedirect } from './config'
import { readSessionToken } from './session'

export type GateDecision =
  | { type: 'next' }
  | { type: 'redirect'; location: string; clearSession?: boolean }

export async function decideAuth(input: {
  pathname: string
  sessionCookie?: string | null
  secret?: string
}): Promise<GateDecision> {
  if (isPublicPath(input.pathname)) return { type: 'next' }
  if (!isGatedPath(input.pathname)) return { type: 'next' }

  const session = await readSessionToken(input.sessionCookie, input.secret)
  if (!session) {
    return { type: 'redirect', location: splashRedirect(input.pathname) }
  }

  if (!(await isEmailApproved(session.email))) {
    return { type: 'redirect', location: splashRedirect(input.pathname), clearSession: true }
  }

  return { type: 'next' }
}
