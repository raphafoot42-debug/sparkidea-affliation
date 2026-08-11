import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

// Appelé depuis la fiche détail d'un affilié, espace admin.
// Avant : l'id de l'affilié était dans l'URL (/api/affiliates/[id]/rate).
// Maintenant : il est envoyé dans le corps de la requête (JSON), plus simple à structurer côté fichiers.
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

  const { id, rate, locked } = req.body

  if (!id) {
    return res.status(400).json({ error: "id de l'affilié manquant" })
  }
  if (typeof rate !== 'number' || rate < 0 || rate > 100) {
    return res.status(400).json({ error: 'Taux invalide' })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('affiliates')
    .update({ commission_rate: rate, rate_locked: !!locked })
    .eq('id', id)

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ success: true, rate, locked: !!locked })
}
