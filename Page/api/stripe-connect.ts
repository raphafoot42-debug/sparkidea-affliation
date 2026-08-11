import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase-server'

// Retire un éventuel "/" final pour éviter les doubles slashs si la variable
// d'environnement NEXT_PUBLIC_APP_URL est saisie avec un slash à la fin.
function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL!.replace(/\/+$/, '')
}

// Appelé quand l'affilié clique "Connecter avec Stripe" (étape 2 de l'inscription,
// ou bouton "Reconnecter" dans Paramètres).
// On ne demande JAMAIS un identifiant Stripe à la main — uniquement l'OAuth officiel.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createClient(req, res)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return res.redirect(`${appUrl()}/login`)
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.STRIPE_CONNECT_CLIENT_ID!,
    scope: 'read_write',
    redirect_uri: `${appUrl()}/api/stripe-connect-callback`,
    state: user.id, // permet de retrouver l'affilié au retour, sans rien stocker en session
  })

  return res.redirect(`https://connect.stripe.com/oauth/authorize?${params.toString()}`)
}
