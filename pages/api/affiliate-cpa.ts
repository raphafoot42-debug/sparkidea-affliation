import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient, verifyAdminAccess } from '@/lib/supabase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  if (!verifyAdminAccess(req)) {
    return res.status(401).json({ error: 'Accès admin non autorisé' })
  }

  const { id, cpaAmountEuros } = req.body

  if (!id || typeof cpaAmountEuros !== 'number' || cpaAmountEuros <= 0) {
    return res.status(400).json({ error: 'Données invalides' })
  }

  const cpaAmountCents = Math.round(cpaAmountEuros * 100)
  const admin = createAdminClient()

  const { error } = await admin
    .from('affiliates')
    .update({ cpa_amount_cents: cpaAmountCents })
    .eq('id', id)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ success: true, cpaAmountCents })
}
