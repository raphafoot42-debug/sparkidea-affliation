import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient, verifyAdminAccess } from '@/lib/supabase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!verifyAdminAccess(req)) {
    return res.status(401).json({ error: 'Accès admin non autorisé' })
  }

  const admin = createAdminClient()

  if (req.method === 'GET') {
    const { data: messages, error } = await admin
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    const { data: affiliates } = await admin.from('affiliates').select('id, email')

    return res.status(200).json({ messages: messages ?? [], affiliates: affiliates ?? [] })
  }

  if (req.method === 'POST') {
    const { affiliateId, body } = req.body
    if (!affiliateId || !body || typeof body !== 'string') {
      return res.status(400).json({ error: 'Champs invalides' })
    }

    const { data: message, error } = await admin
      .from('messages')
      .insert({ affiliate_id: affiliateId, sender: 'admin', body: body.trim() })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ message })
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}
