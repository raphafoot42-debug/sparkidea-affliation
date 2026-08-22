import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe' 
import { createAdminClient } from '@/lib/supabase-admin'
import { recalculateAffiliateRate } from '@/lib/commission' 
import Stripe from 'stripe'

// Stripe appelle cette URL automatiquement à chaque évènement de paiement. 
// C'est ce qui rend TOUT le système automatique — aucune action manuelle.
// ⚠️ Cette URL a changé (avant : /api/stripe/webhook) : pense à la mettre à
// jour dans ton dashboard Stripe (Developers → Webhooks).

// Stripe a besoin du corps BRUT de la requête pour vérifier la signature,
// donc on désactive le parsing JSON automatique de Next.js.
export const config = {
  api: {
    bodyParser: false,
  },
}

async function buffer(req: NextApiRequest) {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const body = await buffer(req)
  const signature = req.headers['stripe-signature'] as string

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Signature webhook invalide:', err)
    return res.status(400).json({ error: 'Signature invalide' })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    // -----------------------------------------------------------
    // Nouveau client payant : on regarde s'il vient d'un lien d'affiliation
    // -----------------------------------------------------------
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const referralCode = session.client_reference_id // le ?ref= passé au moment du checkout

      if (referralCode) {
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('id, commission_rate')
          .eq('referral_code', referralCode)
          .single()

        if (affiliate) {
          await supabase.from('referrals').insert({
            affiliate_id: affiliate.id,
            customer_email: session.customer_details?.email,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plan: session.metadata?.plan ?? 'inconnu',
            status: 'active',
            commission_rate_at_signup: affiliate.commission_rate,
            referred_via_code: referralCode,
          })

          await supabase.rpc('increment_active_clients', { affiliate_id: affiliate.id })
          await recalculateAffiliateRate(affiliate.id)
        }
      }
      break
    }

    // -----------------------------------------------------------
    // Paiement mensuel récurrent encaissé : on verse la commission
    // -----------------------------------------------------------
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.subscription as string

      const { data: referral } = await supabase
        .from('referrals')
        .select('id, affiliate_id, commission_rate_at_signup')
        .eq('stripe_subscription_id', subscriptionId)
        .eq('status', 'active')
        .single()

      if (referral) {
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('stripe_account_id')
          .eq('id', referral.affiliate_id)
          .single()

        const commissionAmount = Math.round(
          (invoice.amount_paid * referral.commission_rate_at_signup) / 100
        )

        if (affiliate?.stripe_account_id) {
          // Transfert automatique vers le compte Stripe Connect de l'affilié
          const transfer = await stripe.transfers.create({
            amount: commissionAmount,
            currency: 'eur',
            destination: affiliate.stripe_account_id,
          })

          await supabase.from('commission_payouts').insert({
            affiliate_id: referral.affiliate_id,
            referral_id: referral.id,
            amount_cents: commissionAmount,
            stripe_transfer_id: transfer.id,
            period: new Date().toISOString().slice(0, 7), // '2026-08'
            status: 'paid',
          })
        }
      }
      break
    }

    // -----------------------------------------------------------
    // Un filleul se désabonne : l'affilié perd ce client du décompte
    // -----------------------------------------------------------
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription

      const { data: referral } = await supabase
        .from('referrals')
        .select('id, affiliate_id')
        .eq('stripe_subscription_id', subscription.id)
        .single()

      if (referral) {
        await supabase
          .from('referrals')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
          .eq('id', referral.id)

        await supabase.rpc('decrement_active_clients', { affiliate_id: referral.affiliate_id })
        // Pas de recalculateAffiliateRate ici : comme convenu, un client perdu
        // ne fait pas redescendre le taux déjà appliqué aux clients existants,
        // seulement le compteur pour les FUTURS seuils.
      }
      break
    }
  }

  return res.status(200).json({ received: true })
}
