/**
 * GET /api/admin/recommendations?status=pending|approved|rejected
 * Returns recommendations, joined with their learning cycle.
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

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'pending'

  const { data, error } = await sb
    .from('pending_recommendations')
    .select(`
      id, category, target, current_value, recommended_value,
      reasoning, evidence, sahi_anchor, status, review_note,
      created_at, reviewed_at,
      learning_cycles ( id, run_count, runs_analysed, created_at )
    `)
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  return NextResponse.json({ recommendations: data })
}
