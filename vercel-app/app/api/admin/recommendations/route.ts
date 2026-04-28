/**
 * GET /api/admin/recommendations?status=pending|approved|rejected
 * Returns recommendations, joined with their learning cycle.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function supabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  )
}

function requireAdmin(req: Request): boolean {
  const auth = req.headers.get('Authorization') ?? ''
  return auth === `Bearer ${process.env.ADMIN_PASSWORD ?? ''}`
}

export async function GET(req: Request) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'pending'

  const sb = supabase()
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ recommendations: data })
}
