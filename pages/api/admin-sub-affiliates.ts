import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase-admin'

// ⚠️ Même limitation de sécurité que packs.ts / affiliate-cpa.ts : pas de
// vraie vérification d'identité pour l'instant (voir ces fichiers pour le
// détail). À corriger avant mise en ligne publique.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const admin = createAdminClient()

  // On récupère les sous-affiliés ET l'email de l'affilié parent qui les a
  // créés (jointure manuelle : sub_affiliates.affiliate_id -> affiliates.id).
  const { data: subAffiliates, error } = await admin
    .from('sub_affiliates')
    .select('id, code, name, active, clients_count, revenue_generated_cents, linked_affiliate_id, affiliate_id, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  const parentIds = [...new Set((subAffiliates ?? []).map((s) => s.affiliate_id).filter(Boolean))]
  const { data: parents } = await admin
    .from('affiliates')
    .select('id, email')
    .in('id', parentIds.length ? parentIds : ['00000000-0000-0000-0000-000000000000'])

  const parentEmailById = new Map((parents ?? []).map((p) => [p.id, p.email]))

  const enriched = (subAffiliates ?? []).map((s) => ({
    ...s,
    parent_email: s.affiliate_id ? parentEmailById.get(s.affiliate_id) ?? '—' : '—',
  }))

  return res.status(200).json({ subAffiliates: enriched })
}
