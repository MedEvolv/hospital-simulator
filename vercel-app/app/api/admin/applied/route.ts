/**
 * GET /api/admin/applied
 * Returns the immutable audit log of applied changes, newest first.
 */

import { NextRequest, NextResponse } from 'next/server'
import { adminServiceClient, requireLearningAdmin } from '@/lib/auth/admin-gate'

export async function GET(req: NextRequest) {
  const denied = await requireLearningAdmin(req)
  if (denied) return denied

  const sb = adminServiceClient()
  if (!sb) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const { data, error } = await sb
    .from('applied_changes')
    .select(`
      id, category, target, old_value, new_value,
      applied_by, review_note, applied_at,
      pending_recommendations ( target, reasoning, sahi_anchor )
    `)
    .order('applied_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  return NextResponse.json({ changes: data })
}
