import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin' 
  
// Appelée juste après l'inscription d'un sous-affilié invité (voir signup.tsx,
// juste après le insert dans 'affiliates'). Cette route manquait entièrement 
// du projet — c'est ce qui faisait qu'un sous-affilié invité créait bien un
// compte, mais restait invisible/non rattaché à son parent pour toujours.
//
// Fait deux choses en une seule fois :
//  1. Rattache le nouveau compte à son affilié parent (affiliates.parent_affiliate_id)
//  2. Marque, côté parent, que ce sous-affilié a activé son compte
//     (sub_affiliates.linked_affiliate_id) — c'est ce flag qui fait passer
//     son statut de "En attente" à "Activé (payé auto)" dans les dashboards.
//
// Contrairement aux routes admin (packs.ts, affiliate-cpa.ts), on PEUT
// vérifier une vraie identité ici : le sous-affilié vient de se connecter
// via un vrai compte Supabase Auth (email + mot de passe), pas un code
// mémorisé côté navigateur.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const { newAffiliateId, parentReferralCode, subCode } = req.body
  if (!newAffiliateId || !parentReferralCode || !subCode) {
    return res.status(400).json({ error: 'Champs manquants' })
  }

  const supabase = createClient(req, res)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== newAffiliateId) {
    return res.status(401).json({ error: 'Non authentifié, ou id différent de la session en cours' })
  }

  const admin = createAdminClient()

  const { data: parent, error: parentError } = await admin
    .from('affiliates')
    .select('id, cpa_amount_cents')
    .eq('referral_code', parentReferralCode)
    .single()

  if (parentError || !parent) {
    return res.status(404).json({ error: 'Affilié parent introuvable' })
  }

  const { data: subRow, error: subRowError } = await admin
    .from('sub_affiliates')
    .select('id, linked_affiliate_id')
    .eq('affiliate_id', parent.id)
    .eq('code', subCode)
    .single()

  if (subRowError || !subRow) {
    return res.status(404).json({ error: 'Sous-affilié introuvable pour ce code' })
  }

  if (subRow.linked_affiliate_id) {
    // Déjà activé (double clic, retry après coupure réseau...) — pas une
    // erreur, on confirme juste que c'est fait.
    return res.status(200).json({ success: true, alreadyActivated: true })
  }

  // Le CPA de départ du sous-affilié (10€ par défaut, colonne cpa_amount_cents
  // déjà posée par le insert dans signup.tsx) ne doit jamais dépasser celui de
  // son parent — sécurité au cas où le parent aurait lui-même un CPA < 10€.
  const { data: newAffiliate } = await admin
    .from('affiliates')
    .select('cpa_amount_cents')
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

  const { error: updateSubError } = await admin
    .from('sub_affiliates')
    .update({ linked_affiliate_id: newAffiliateId })
    .eq('id', subRow.id)

  if (updateSubError) {
    return res.status(500).json({ error: updateSubError.message })
  }

  return res.status(200).json({ success: true })
}
