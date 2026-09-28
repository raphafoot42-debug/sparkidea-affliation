import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const { newAffiliateId, inviteCode, newRefCode } = req.body
  if (!newAffiliateId || !inviteCode) {
    return res.status(400).json({ error: 'Champs manquants' })
  }

  const supabase = createClient(req, res)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== newAffiliateId) {
    return res.status(401).json({ error: 'Non authentifié, ou id différent de la session en cours' })
  }

  const admin = createAdminClient()

  // 1. Trouver le parent via son referral_code
  const { data: parent, error: parentError } = await admin
    .from('affiliates')
    .select('id, cpa_amount_cents')
    .eq('referral_code', inviteCode)
    .single()

  if (parentError || !parent) {
    return res.status(404).json({ error: 'Affilié parent introuvable' })
  }

  // 2. Maj de parent_affiliate_id + cap du cpa
  const { data: newAffiliate } = await admin
    .from('affiliates')
    .select('cpa_amount_cents, email')
    .eq('id', newAffiliateId)
    .single()

  const affiliateUpdates: { parent_affiliate_id: string; cpa_amount_cents?: number } = {
    parent_affiliate_id: parent.id,
  }

  if (newAffiliate && newAffiliate.cpa_amount_cents > parent.cpa_amount_cents) {
    affiliateUpdates.cpa_amount_cents = parent.cpa_amount_cents
  }

  const { error: updateAffError } = await admin
    .from('affiliates')
    .update(affiliateUpdates)
    .eq('id', newAffiliateId)

  if (updateAffError) {
    return res.status(500).json({ error: updateAffError.message })
  }

  // 3. Insérer dans sub_affiliates pour que le parent le voie dans son tableau
  const codeToUse = newRefCode || (newAffiliate ? newAffiliate.email.split('@')[0].toUpperCase() : 'SUB')
  const subName = newAffiliate ? newAffiliate.email.split('@')[0] : null

  const { error: insertSubError } = await admin.from('sub_affiliates').insert({
    affiliate_id: parent.id,
    code: codeToUse,
    name: subName,
    linked_affiliate_id: newAffiliateId,
    active: true,
  })

  if (insertSubError) {
    console.error('Erreur insertion sub_affiliates serveur:', insertSubError)
  }

  return res.status(200).json({ success: true })
}
