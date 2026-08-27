import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

// Appelé depuis la fiche détail d'un affilié, espace admin.
// Route renommée : affiliate-rate.ts -> affiliate-cpa.ts (modèle CPA fixe,
// il n'y a plus de "taux" mais un montant en euros).
// ⚠️ TODO avant mise en prod : vérifier que l'utilisateur connecté est bien
// l'admin (ex: colonne is_admin sur son profil), pas juste "connecté".
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const supabase = createClient(req, res)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return res.status(401).json({ error: 'Non authentifié' })
  }
  // TODO: remplacer par une vraie vérification is_admin
  // if (!(await isAdmin(user.id))) return res.status(403).json({ error: 'Interdit' })

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
