import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

// Permet à un affilié de modifier le CPA de l'un de ses sous-affiliés directs
// (sa recrue). Le montant ne peut pas dépasser le propre CPA de l'affilié connecté.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const supabase = createClient(req, res)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const { subAffiliateId, cpaAmountEuros } = req.body
  if (!subAffiliateId || typeof cpaAmountEuros !== 'number' || cpaAmountEuros < 0) {
    return res.status(400).json({ error: 'Données invalides' })
  }

  const admin = createAdminClient()

  // Récupérer le CPA de l'affilié parent connecté
  const { data: parent, error: parentError } = await admin
    .from('affiliates')
    .select('cpa_amount_cents')
    .eq('id', user.id)
    .single()

  if (parentError || !parent) {
    return res.status(404).json({ error: 'Compte affilié introuvable' })
  }

  // Vérifier que la cible est bien une recrue directe de cet affilié
  const { data: target, error: targetError } = await admin
    .from('affiliates')
    .select('id, parent_affiliate_id')
    .eq('id', subAffiliateId)
    .single()

  if (targetError || !target || target.parent_affiliate_id !== user.id) {
    return res.status(403).json({ error: 'Tu ne peux modifier le CPA que de tes propres recrues directes.' })
  }

  const newCpaCents = Math.round(cpaAmountEuros * 100)
  if (newCpaCents > parent.cpa_amount_cents) {
    return res.status(400).json({
      error: `Le CPA attribué (${cpaAmountEuros.toFixed(2)} €) ne peut pas dépasser ton propre CPA (${(parent.cpa_amount_cents / 100).toFixed(2)} €).`,
      maxCpaAmountCents: parent.cpa_amount_cents,
    })
  }

  const { error: updateError } = await admin
    .from('affiliates')
    .update({ cpa_amount_cents: newCpaCents })
    .eq('id', subAffiliateId)

  if (updateError) {
    return res.status(500).json({ error: updateError.message })
  }

  return res.status(200).json({ success: true, cpaAmountCents: newCpaCents })
}
