import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

// Stripe redirige ici après que l'affilié a autorisé la connexion.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const affiliateId = searchParams.get('state') // l'id qu'on avait passé dans /connect

  if (!code || !affiliateId) {
    return NextResponse.redirect(
      new URL('/dashboard/parametres?stripe_error=1', process.env.NEXT_PUBLIC_APP_URL)
    )
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

    return NextResponse.redirect(
      new URL('/dashboard?stripe_connected=1', process.env.NEXT_PUBLIC_APP_URL)
    )
  } catch (err) {
    console.error('Erreur connexion Stripe:', err)
    return NextResponse.redirect(
      new URL('/dashboard/parametres?stripe_error=1', process.env.NEXT_PUBLIC_APP_URL)
    )
  }
}
