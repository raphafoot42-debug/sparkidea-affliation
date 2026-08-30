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

  const { data: packs, error } = await admin
    .from('packs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ packs: packs ?? [] })
}
