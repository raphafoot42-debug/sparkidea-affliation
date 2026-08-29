import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase-admin'
 
// Appelé depuis la fiche détail d'un affilié, espace admin.
// Route renommée : affiliate-rate.ts -> affiliate-cpa.ts (modèle CPA fixe,
// il n'y a plus de "taux" mais un montant en euros).
// 
// ⚠️ SÉCURITÉ — même limitation que packs.ts : l'admin n'a pas de vraie
// session Supabase Auth (juste un code stocké en sessionStorage côté
// navigateur), donc supabase.auth.getUser() ne peut jamais réussir ici —
// c'est ce qui empêchait "Sauvegarder" de fonctionner sur le CPA. Cette
// route est donc, pour l'instant, sans vraie protection d'accès. À
// corriger avant mise en ligne publique (vraie vérification is_admin).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const { id, cpaAmountEuros } = req.body

  if (!id) {
    return res.status(400).json({ error: "id de l'affilié manquant" })
  }
  if (typeof cpaAmountEuros !== 'number' || cpaAmountEuros < 0) {
    return res.status(400).json({ error: 'CPA invalide' })
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

  // Note : ce changement ne touche QUE les futurs clients de cet affilié.
  // Les referrals déjà créés gardent leur cpa_applied_cents figé au
  // moment de leur propre création (voir stripe-webhook.ts).
  return res.status(200).json({ success: true, cpaAmountCents })
}
