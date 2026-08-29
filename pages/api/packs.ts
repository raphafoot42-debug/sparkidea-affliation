import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase-admin'

// ⚠️ SÉCURITÉ — pas de vraie vérification d'identité pour l'instant.
// L'admin se connecte via un simple code tapé sur /signup, stocké dans
// sessionStorage côté navigateur (voir signup.tsx / admin.tsx) — ce n'est
// PAS une session Supabase Auth. Cette route est donc, pour l'instant,
// appelable par n'importe qui qui en devine l'URL, sans protection réelle.
// À corriger avant toute mise en ligne publique en ajoutant une vraie
// vérification (ex: colonne is_admin + vraie session Supabase pour
// l'admin, ou au minimum une clé secrète partagée envoyée en en-tête).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = createAdminClient()

  if (req.method === 'POST') {
    const { title, description, rewardEuros, targetCount, targetPlan, endsAt } = req.body

    if (!title || !description || !rewardEuros) {
      return res.status(400).json({ error: 'Champs manquants' })
    }

    const { data, error } = await admin
      .from('packs')
      .insert({
        title,
        description,
        reward_cents: Math.round(rewardEuros * 100),
        target_count: targetCount ?? null,
        target_plan: targetPlan ?? null,
        ends_at: endsAt ?? null,
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    // TODO: notifier les affiliés du nouveau pack (email Resend ou notification in-app)

    return res.status(200).json({ pack: data })
  }

  if (req.method === 'DELETE') {
    const id = (req.query.id as string) ?? req.body?.id

    if (!id) {
      return res.status(400).json({ error: 'id du pack manquant' })
    }

    const { error } = await admin.from('packs').delete().eq('id', id)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Méthode non autorisée' })
}
