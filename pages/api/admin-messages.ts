import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase-admin'

// ⚠️ TODO avant mise en prod : vérifier is_admin (voir admin-affiliates.ts)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = createAdminClient()

  if (req.method === 'GET') {
    const { data: messages, error } = await admin
      .from('messages')
      .select('id, affiliate_id, sender, body, read, created_at')
      .order('created_at', { ascending: true })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    const { data: affiliates } = await admin.from('affiliates').select('id, email')

    return res.status(200).json({ messages, affiliates })
  }

  if (req.method === 'POST') {
    const { affiliateId, body } = req.body

    if (!affiliateId || !body) {
      return res.status(400).json({ error: 'Champs manquants' })
    }

    const { data, error } = await admin
      .from('messages')
      .insert({ affiliate_id: affiliateId, sender: 'admin', body })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ message: data })
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}
