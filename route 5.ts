import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  // TODO: vérifier is_admin, comme sur la route rate/

  const { title, description, rewardEuros, targetCount, targetPlan, endsAt } =
    await request.json()

  if (!title || !description || !rewardEuros) {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('packs')
    .insert({
      title,
      description,
      reward_cents: Math.round(rewardEuros * 100),
      target_count: targetCount ?? null,
      target_plan: targetPlan ?? null,
      ends_at: endsAt ?? null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // TODO: notifier les affiliés du nouveau pack (email Resend ou notification in-app)

  return NextResponse.json({ pack: data })
}
