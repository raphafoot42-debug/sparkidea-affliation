import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-admin'

// Stripe redirige ici une fois l'onboarding (Account Links) terminé — que ce
// soit complété ou juste laissé en cours de route, donc on revérifie
// toujours le statut réel du compte auprès de Stripe avant de marquer
// l'affilié comme connecté (on ne fait jamais confiance au simple fait
// d'être redirigé ici).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const affiliateId = req.query.aff as string | undefined
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!.replace(/\/+$/, '')

  if (!affiliateId) {
    return res.redirect(`${appUrl}/dashboard?stripe_error=1`)
  }

  const admin = createAdminClient()

  try {
    const { data: affiliate } = await admin
      .from('affiliates')
      .select('stripe_account_id')
      .eq('id', affiliateId)
      .single()

    if (!affiliate?.stripe_account_id) {
      return res.redirect(`${appUrl}/dashboard?stripe_error=1`)
    }

    const account = await stripe.accounts.retrieve(affiliate.stripe_account_id)
    const isReady = Boolean(account.charges_enabled && account.details_submitted)

    await admin
      .from('affiliates')
      .update({ stripe_connected: isReady })
      .eq('id', affiliateId)

    return res.redirect(
      isReady ? `${appUrl}/dashboard?stripe_connected=1` : `${appUrl}/dashboard?stripe_incomplete=1`
    )
  } catch (err) {
    console.error('Erreur callback Stripe:', err)
    return res.redirect(`${appUrl}/dashboard?stripe_error=1`)
  }
}
