/**
 * PATCH /api/admin/recommendations/[id]
 * Body: { action: "approve" | "reject", review_note?: string }
 *
 * On approve:
 *   - Sets pending_recommendations.status = 'approved'
 *   - If category = 'metric_threshold': upserts simulation_config with recommended_value
 *   - Writes an applied_changes row (immutable audit log)
 *
 * On reject:
 *   - Sets pending_recommendations.status = 'rejected'
 *   - Stores review_note so future LLM prompts know not to repeat this rec
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

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const action: string = body.action
  const reviewNote: string = body.review_note ?? ''

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
  }

  const sb = supabase()

  // Fetch the recommendation
  const { data: rec, error: fetchErr } = await sb
    .from('pending_recommendations')
    .select('*')
    .eq('id', params.id)
    .single()

  if (fetchErr || !rec) {
    return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 })
  }

  if (rec.status !== 'pending') {
    return NextResponse.json({ error: `Already ${rec.status}` }, { status: 409 })
  }

  const now = new Date().toISOString()

  if (action === 'reject') {
    await sb
      .from('pending_recommendations')
      .update({ status: 'rejected', review_note: reviewNote, reviewed_at: now })
      .eq('id', params.id)

    return NextResponse.json({ ok: true, action: 'rejected' })
  }

  // ---- approve ----

  // 1. Mark recommendation approved
  await sb
    .from('pending_recommendations')
    .update({ status: 'approved', review_note: reviewNote, reviewed_at: now })
    .eq('id', params.id)

  // 2. If metric_threshold: apply to simulation_config
  if (rec.category === 'metric_threshold') {
    const configKey: string = rec.target
    // recommended_value is stored as JSON-encoded string; unwrap if needed
    let newVal = rec.recommended_value
    try { newVal = JSON.parse(rec.recommended_value) } catch { /* already primitive */ }

    await sb.from('simulation_config').upsert(
      { key: configKey, value: newVal, updated_at: now },
      { onConflict: 'key' },
    )
  }

  // 3. Immutable audit log
  await sb.from('applied_changes').insert({
    recommendation_id: params.id,
    category: rec.category,
    target: rec.target,
    old_value: rec.current_value,
    new_value: rec.recommended_value,
    applied_by: 'admin',
    review_note: reviewNote,
  })

  return NextResponse.json({ ok: true, action: 'approved' })
}
