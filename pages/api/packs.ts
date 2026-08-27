import type { NextApiRequest, NextApiResponse } from 'next' 
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const supabase = createClient(req, res) 
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return res.status(401).json({ error: 'Non authentifié' })
  }
  // TODO: vérifier is_admin, comme sur la route affiliate-cpa

  const { title, description, rewardEuros, targetCount, targetPlan, endsAt } = req.body

  if (!title || !description || !rewardEuros) {
    return res.status(400).json({ error: 'Champs manquants' })
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
    return res.status(500).json({ error: error.message })
  }

  // TODO: notifier les affiliés du nouveau pack (email Resend ou notification in-app)

  return res.status(200).json({ pack: data })
}
