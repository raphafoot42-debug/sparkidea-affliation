import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase-admin' 
 
// ⚠️ TODO avant mise en prod : vérifier que l'appelant est bien admin 
// (même limitation que sur affiliate-cpa.ts et packs.ts — pas encore de 
// colonne is_admin dans le projet). Pour l'instant, protégé uniquement par
// le fait que l'URL /admin n'est accessible qu'via le code d'accès admin
// (voir pages/signup.tsx), ce qui n'est pas une vraie sécurité côté serveur. 
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const admin = createAdminClient()

  const { data: affiliates, error } = await admin
    .from('affiliates')
    .select('id, email, referral_code, cpa_amount_cents, active_clients_count, clicks_count, stripe_connected, created_at')
    .order('active_clients_count', { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  // Revenu généré + commission versée ce mois-ci, par affilié
  const { data: payouts } = await admin
    .from('commission_payouts')
    .select('affiliate_id, amount_cents, period')

  const thisMonth = new Date().toISOString().slice(0, 7)
  const byAffiliate: Record<string, { total_cents: number; this_month_cents: number }> = {}
  for (const p of payouts ?? []) {
    if (!byAffiliate[p.affiliate_id]) byAffiliate[p.affiliate_id] = { total_cents: 0, this_month_cents: 0 }
    byAffiliate[p.affiliate_id].total_cents += p.amount_cents
    if (p.period === thisMonth) byAffiliate[p.affiliate_id].this_month_cents += p.amount_cents
  }

  const result = (affiliates ?? []).map((a) => ({
    ...a,
    revenue_total_cents: byAffiliate[a.id]?.total_cents ?? 0,
    revenue_this_month_cents: byAffiliate[a.id]?.this_month_cents ?? 0,
  }))

  return res.status(200).json({ affiliates: result })
}
