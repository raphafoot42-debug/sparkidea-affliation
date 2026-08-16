import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { stripe } from '@/lib/stripe'

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL!.replace(/\/+$/, '')
}

// Crée le compte Stripe connecté de l'affilié (une seule fois, réutilisé
// ensuite) puis l'envoie sur le lien d'onboarding officiel Stripe (Account
// Links) pour qu'il renseigne ses infos et son RIB.
//
// Remplace l'ancien flux OAuth ("Connect with Stripe") : Stripe ne le
// propose plus en self-service aux nouvelles plateformes (le bouton
// "Activer OAuth" reste grisé côté Dashboard Stripe pour les comptes créés
// récemment). Account Links est la méthode actuellement recommandée par
// Stripe pour ce cas — pas de STRIPE_CONNECT_CLIENT_ID nécessaire ici.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient(req, res)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return res.redirect(`${appUrl()}/signup`)
  }

  const admin = createAdminClient()
  const { data: affiliate } = await admin
    .from('affiliates')
    .select('stripe_account_id')
    .eq('id', user.id)
    .single()

  let accountId = affiliate?.stripe_account_id

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'standard',
      email: user.email ?? undefined,
    })
    accountId = account.id
    await admin.from('affiliates').update({ stripe_account_id: accountId }).eq('id', user.id)
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl()}/api/stripe-connect`, // si le lien expire, on relance ici
    return_url: `${appUrl()}/api/stripe-connect-callback?aff=${user.id}`,
    type: 'account_onboarding',
  })

  return res.redirect(accountLink.url)
}
