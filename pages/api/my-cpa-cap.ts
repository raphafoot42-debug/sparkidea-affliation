import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

// Un sous-affilié ne peut pas lire la fiche complète de son parent (RLS 
// l'en empêche, à raison — il ne doit voir ni son email ni ses stats). 
// Cette route ne renvoie donc QUE le montant du plafond, rien d'autre,
// pour que le dashboard puisse afficher "Maximum : X €" et valider avant
// même d'appeler affiliate-self-cpa.ts.
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

  const { data: self } = await admin
    .from('affiliates')
    .select('parent_affiliate_id')
    .eq('id', user.id)
    .single()

  if (!self?.parent_affiliate_id) {
    return res.status(200).json({ maxCpaAmountCents: null })
  }

  const { data: parent } = await admin
    .from('affiliates')
    .select('cpa_amount_cents')
    .eq('id', self.parent_affiliate_id)
    .single()

  return res.status(200).json({ maxCpaAmountCents: parent?.cpa_amount_cents ?? null })
}
