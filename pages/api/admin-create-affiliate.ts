import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '@/lib/supabase-admin'

function generateReferralCode(email: string) {
  const cleanPrefix = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '')
  const prefix = (cleanPrefix.slice(0, 3) || 'SPK').toUpperCase()
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `${prefix}${randomStr}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const { email, type, parentReferralCode, name } = req.body

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email invalide' })
  }

  const cleanEmail = email.trim().toLowerCase()
  const admin = createAdminClient()

  try {
    // 1. Vérifier si un affilié existe déjà avec cet email
    const { data: existingAffiliate } = await admin
      .from('affiliates')
      .select('id, referral_code')
      .eq('email', cleanEmail)
      .single()

    if (existingAffiliate) {
      const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '')
      return res.status(200).json({
        success: true,
        alreadyExists: true,
        referralCode: existingAffiliate.referral_code,
        trackingLink: `https://spark-idea-two.vercel.app/?ref=${existingAffiliate.referral_code}`,
        signupUrl: `${appUrl}/affiliate/signup`,
      })
    }

    // 2. Créer l'utilisateur dans Supabase Auth s'il n'existe pas encore
    // On génère un mot de passe temporaire s'il est créé par l'admin
    const tempPassword = `Spark_${Math.random().toString(36).substring(2, 10)}!`
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password: tempPassword,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      return res.status(400).json({ error: authError?.message ?? "Erreur lors de la création de l'utilisateur" })
    }

    const userId = authData.user.id
    let parentAffiliateId: string | null = null

    if (type === 'sub' && parentReferralCode) {
      const { data: parent } = await admin
        .from('affiliates')
        .select('id')
        .eq('referral_code', parentReferralCode)
        .single()
      if (parent) {
        parentAffiliateId = parent.id
      }
    }

    // 3. Insérer dans 'affiliates'
    let inserted = false
    let attempts = 0
    let refCode = ''
    let lastError: any = null

    while (!inserted && attempts < 5) {
      attempts++
      refCode = generateReferralCode(cleanEmail)
      const { error: insertError } = await admin.from('affiliates').insert({
        id: userId,
        email: cleanEmail,
        referral_code: refCode,
        parent_affiliate_id: parentAffiliateId,
      })

      if (!insertError) {
        inserted = true
      } else {
        lastError = insertError
      }
    }

    if (!inserted) {
      return res.status(500).json({ error: lastError?.message ?? 'Erreur création affilié' })
    }

    // 4. Si type === 'sub' et qu'un parent est renseigné, insérer aussi dans sub_affiliates
    if (type === 'sub' && parentAffiliateId) {
      const { error: subErr } = await admin.from('sub_affiliates').insert({
        affiliate_id: parentAffiliateId,
        code: refCode,
        name: name || cleanEmail.split('@')[0],
        linked_affiliate_id: userId,
        active: true,
      })
      if (subErr) {
        console.error('Erreur insertion sub_affiliates admin:', subErr)
      }
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '')

    return res.status(200).json({
      success: true,
      referralCode: refCode,
      trackingLink: `https://spark-idea-two.vercel.app/?ref=${refCode}`,
      signupUrl: `${appUrl}/affiliate/signup`,
    })
  } catch (err) {
    console.error('Erreur admin-create-affiliate:', err)
    return res.status(500).json({ error: 'Erreur serveur interne' })
  }
}
