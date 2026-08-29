import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase-admin'

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const { email, type, parentReferralCode, name } = req.body

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Email invalide' })
  }

  const admin = createAdminClient()

  let parentAffiliateId: string | null = null
  if (type === 'sub') {
    if (!parentReferralCode || typeof parentReferralCode !== 'string') {
      return res.status(400).json({ error: 'Code de parrainage parent requis pour un sous-affilié' })
    }
    const { data: parent, error: parentError } = await admin
      .from('affiliates')
      .select('id')
      .eq('referral_code', parentReferralCode)
      .single()

    if (parentError || !parent) {
      return res.status(404).json({ error: 'Affilié parent introuvable' })
    }
    parentAffiliateId = parent.id
  }

  let referralCode = generateReferralCode()
  let attempts = 0
  while (attempts < 10) {
    const { data: existing } = await admin
      .from('affiliates')
      .select('id')
      .eq('referral_code', referralCode)
      .single()
    if (!existing) break
    referralCode = generateReferralCode()
    attempts++
  }

  // Création de l'utilisateur Supabase Auth sans mot de passe initial
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  })

  if (authError || !authUser.user) {
    return res.status(500).json({ error: authError?.message || 'Erreur lors de la création de l\'utilisateur' })
  }

  // Insertion dans la table affiliates (avec CPA par défaut 1000 = 10€)
  const { error: affiliateError } = await admin.from('affiliates').insert({
    id: authUser.user.id,
    email,
    referral_code: referralCode,
    cpa_amount_cents: 1000,
    parent_affiliate_id: parentAffiliateId,
  })

  if (affiliateError) {
    return res.status(500).json({ error: affiliateError.message })
  }

  const host = req.headers.host || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const inviteLink = `${protocol}://${host}/login`

  return res.status(200).json({
    success: true,
    referralCode,
    inviteLink,
    userId: authUser.user.id,
  })
}
