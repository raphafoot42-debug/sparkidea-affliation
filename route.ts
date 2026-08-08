import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Appelé quand l'affilié clique "Connecter avec Stripe" (étape 2 de l'inscription,
// ou bouton "Reconnecter" dans Paramètres).
// On ne demande JAMAIS un identifiant Stripe à la main — uniquement l'OAuth officiel.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL))
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.STRIPE_CONNECT_CLIENT_ID!,
    scope: 'read_write',
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/callback`,
    state: user.id, // permet de retrouver l'affilié au retour, sans rien stocker en session
  })

  return NextResponse.redirect(
    `https://connect.stripe.com/oauth/authorize?${params.toString()}`
  )
}
