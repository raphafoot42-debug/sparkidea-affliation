import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase-admin'

// ⚠️ TODO avant mise en prod : vérifier is_admin (voir admin-affiliates.ts)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('packs')
    .select('*')
    .order('starts_at', { ascending: false })

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ packs: data })
}
