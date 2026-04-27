/**
 * GET /api/admin/applied
 * Returns the immutable audit log of applied changes, newest first.
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
    .from('applied_changes')
    .select(`
      id, category, target, old_value, new_value,
      applied_by, review_note, applied_at,
      pending_recommendations ( target, reasoning, sahi_anchor )
    `)
    .order('applied_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ changes: data })
}
