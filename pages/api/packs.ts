import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient, verifyAdminAccess } from '@/lib/supabase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const admin = createAdminClient()
    const { data: packs, error } = await admin
      .from('packs')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ packs: packs ?? [] })
  }

  if (req.method === 'POST') {
    if (!verifyAdminAccess(req)) {
      return res.status(401).json({ error: 'Accès admin non autorisé' })
    }

    const { title, description, rewardEuros, targetCount, endsAt } = req.body

    if (!title || !description || typeof rewardEuros !== 'number' || rewardEuros <= 0) {
      return res.status(400).json({ error: 'Renseigne un titre, une description et un montant valide (supérieur à 0 €).' })
    }

    const rewardCents = Math.round(rewardEuros * 100)
    const admin = createAdminClient()

    const { data: pack, error } = await admin
      .from('packs')
      .insert({
        title,
        description,
        reward_cents: rewardCents,
        target_count: targetCount || null,
        ends_at: endsAt || null,
        active: true,
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ pack })
  }

  if (req.method === 'DELETE') {
    if (!verifyAdminAccess(req)) {
      return res.status(401).json({ error: 'Accès admin non autorisé' })
    }

    const id = typeof req.query.id === 'string' ? req.query.id : null
    if (!id) {
      return res.status(400).json({ error: 'ID du pack manquant' })
    }

    const admin = createAdminClient()
    const { error } = await admin.from('packs').delete().eq('id', id)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}
