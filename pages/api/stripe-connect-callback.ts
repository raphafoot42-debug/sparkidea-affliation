import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase-admin'

// Stripe redirige ici après que l'affilié a autorisé la connexion.
// ⚠️ Cette URL a changé (avant : /api/stripe/connect/callback) : pense à la
// mettre à jour dans ton dashboard Stripe Connect (Settings → redirect URI).
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const code = req.query.code as string | undefined
  const affiliateId = req.query.state as string | undefined // l'id qu'on avait passé dans /stripe-connect

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!.replace(/\/+$/, '')

  if (!code || !affiliateId) {
    return res.redirect(`${appUrl}/dashboard/parametres?stripe_error=1`)
  }

  try {
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    })

    const supabase = createAdminClient()
    await supabase
      .from('affiliates')
      .update({
        stripe_account_id: response.stripe_user_id,
        stripe_connected: true,
      })
      .eq('id', affiliateId)

    // TODO: envoyer l'email de confirmation de connexion Stripe via Resend
    // (sécurité — comme convenu, à chaque changement de compte Stripe)

    return res.redirect(`${appUrl}/dashboard?stripe_connected=1`)
  } catch (err) {
    console.error('Erreur connexion Stripe:', err)
    return res.redirect(`${appUrl}/dashboard/parametres?stripe_error=1`)
  }
}
