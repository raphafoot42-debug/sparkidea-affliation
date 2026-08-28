import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

// Contrairement à affiliate-cpa.ts (réservé à l'admin, pour les affiliés de
// niveau 1), cette route permet à un sous-affilié de modifier LUI-MÊME son
// propre CPA — mais jamais au-dessus de celui de son parent. Si le parent a
// 20€, le sous-affilié peut se mettre n'importe où entre 0 et 20€, jamais plus.
//
// Vraie vérification d'identité possible ici (contrairement à l'admin) :
// vraie session Supabase Auth du sous-affilié connecté.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const supabase = createClient(req, res)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return res.status(401).json({ error: 'Non authentifié' })
  }

  const { cpaAmountEuros } = req.body
  if (typeof cpaAmountEuros !== 'number' || cpaAmountEuros <= 0) {
    return res.status(400).json({ error: 'CPA invalide' })
  }

  const admin = createAdminClient()

  const { data: self, error: selfError } = await admin
    .from('affiliates')
    .select('id, parent_affiliate_id')
    .eq('id', user.id)
    .single()

  if (selfError || !self) {
    return res.status(404).json({ error: 'Compte affilié introuvable' })
  }

  if (!self.parent_affiliate_id) {
    // Cette personne est un affilié de niveau 1 (recruté directement par
    // Spark Idea, pas par un autre affilié) — son CPA reste géré uniquement
    // par l'admin, via /api/affiliate-cpa. Pas de self-service pour eux.
    return res.status(403).json({
      error: "Seuls les sous-affiliés (niveau 2) peuvent ajuster leur propre CPA. Le tien est géré par l'équipe Spark Idea.",
    })
  }

  const { data: parent, error: parentError } = await admin
    .from('affiliates')
    .select('cpa_amount_cents')
    .eq('id', self.parent_affiliate_id)
    .single()

  if (parentError || !parent) {
    return res.status(404).json({ error: 'Affilié parent introuvable' })
  }

  const cpaAmountCents = Math.round(cpaAmountEuros * 100)

  if (cpaAmountCents > parent.cpa_amount_cents) {
    return res.status(400).json({
      error: `Ton CPA ne peut pas dépasser celui de la personne qui t'a recruté (${(parent.cpa_amount_cents / 100).toFixed(2)} €).`,
      maxCpaAmountCents: parent.cpa_amount_cents,
    })
  }

  const { error: updateError } = await admin
    .from('affiliates')
    .update({ cpa_amount_cents: cpaAmountCents })
    .eq('id', user.id)

  if (updateError) {
    return res.status(500).json({ error: updateError.message })
  }

  // Comme pour l'admin : ce changement ne touche que les FUTURS clients de
  // ce sous-affilié. Les referrals déjà créés gardent leur cpa_applied_cents
  // figé au moment de leur propre création (voir stripe-webhook.ts).
  return res.status(200).json({ success: true, cpaAmountCents })
}
