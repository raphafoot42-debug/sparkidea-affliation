import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

// Renvoie la liste des sous-affiliés directs (recrues) de l'utilisateur connecté avec leur CPA actuel
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const supabase = createClient(req, res)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const admin = createAdminClient()

  const { data: recruits, error } = await admin
    .from('affiliates')
    .select('id, email, referral_code, cpa_amount_cents')
    .eq('parent_affiliate_id', user.id)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ recruits: recruits ?? [] })
}
