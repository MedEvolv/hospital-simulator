/**
 * GET /api/admin/cycles
 * Returns learning cycles ordered newest first, with recommendation counts.
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
    .from('learning_cycles')
    .select(`
      id, run_count, runs_analysed, llm_analysis, status, created_at,
      pending_recommendations ( id, status )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  return NextResponse.json({ cycles: data })
}
