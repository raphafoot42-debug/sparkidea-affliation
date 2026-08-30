import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient, verifyAdminAccess } from '@/lib/supabase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!verifyAdminAccess(req)) {
    return res.status(401).json({ error: 'Accès admin non autorisé' })
  }

  const admin = createAdminClient()

  if (req.method === 'GET') {
    const { data: subs, error } = await admin
      .from('sub_affiliates')
      .select('id, code, name, active, clients_count, revenue_generated_cents, linked_affiliate_id, affiliate_id, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    const { data: parents } = await admin
      .from('affiliates')
      .select('id, email')

    const parentMap = new Map((parents ?? []).map((p) => [p.id, p.email]))

    const result = (subs ?? []).map((s) => ({
      ...s,
      parent_email: parentMap.get(s.affiliate_id) ?? 'Inconnu',
    }))

    return res.status(200).json({ subAffiliates: result })
  }

  if (req.method === 'DELETE') {
    const id = typeof req.query.id === 'string' ? req.query.id : null
    if (!id) {
      return res.status(400).json({ error: 'ID du sous-affilié manquant' })
    }

    const { error } = await admin.from('sub_affiliates').delete().eq('id', id)
    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}
