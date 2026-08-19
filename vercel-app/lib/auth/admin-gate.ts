/**
 * Learning-admin APIs: OTP session + admin email + configured password.
 * Empty or short ADMIN_PASSWORD fails closed. Never treat `Bearer ` as success.
 */

import { createHash, timingSafeEqual } from 'crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceConfig } from './access-lookup'
import { isAdminEmail } from './admins'
import { SESSION_COOKIE } from './config'
import { readSessionToken } from './session'

export const ADMIN_SECRET_MIN_LENGTH = 8
export const WORKFLOW_SECRET_MIN_LENGTH = 8

export function configuredAdminPassword(): string | null {
  const value = (process.env.ADMIN_PASSWORD ?? '').trim()
  if (value.length < ADMIN_SECRET_MIN_LENGTH) return null
  return value
}

export function configuredWorkflowSecret(): string | null {
  const value = (process.env.WORKFLOW_SECRET ?? '').trim()
  if (value.length < WORKFLOW_SECRET_MIN_LENGTH) return null
  return value
}

export function adminBearerAuthorized(req: Request): boolean {
  const expected = configuredAdminPassword()
  if (!expected) return false
  const auth = req.headers.get('Authorization') ?? ''
  const supplied = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : ''
  const a = createHash('sha256').update(supplied).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

export async function requireLearningAdmin(req: NextRequest): Promise<NextResponse | null> {
  if (!configuredAdminPassword()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const session = await readSessionToken(req.cookies.get(SESSION_COOKIE)?.value)
  if (!session || !isAdminEmail(session.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!adminBearerAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export function adminServiceClient(): SupabaseClient | null {
  const cfg = supabaseServiceConfig()
  if (!cfg) return null
  return createClient(cfg.url, cfg.key, { auth: { persistSession: false } })
}
