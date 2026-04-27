/**
 * GET /api/admin/cycles
 * Returns learning cycles ordered newest first, with recommendation counts.
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

  const sb = supabase()
  const { data, error } = await sb
    .from('learning_cycles')
    .select(`
      id, run_count, runs_analysed, llm_analysis, status, created_at,
      pending_recommendations ( id, status )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cycles: data })
}
