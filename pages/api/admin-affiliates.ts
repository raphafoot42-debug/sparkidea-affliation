import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient, verifyAdminAccess } from '@/lib/supabase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  if (!verifyAdminAccess(req)) {
    return res.status(401).json({ error: 'Accès admin non autorisé' })
  }

  const admin = createAdminClient()

  const { data: affiliates, error } = await admin
    .from('affiliates')
    .select('id, email, referral_code, cpa_amount_cents, active_clients_count, clicks_count, stripe_connected, created_at')
    .order('active_clients_count', { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

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
