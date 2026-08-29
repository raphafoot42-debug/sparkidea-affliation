import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '@/lib/stripe'  
import { createAdminClient } from '@/lib/supabase-admin'
import Stripe from 'stripe' 
 
// Stripe appelle cette URL automatiquement à chaque évènement de paiement.
// C'est ce qui rend TOUT le système automatique — aucune action manuelle.
//
// ⚠️ MODÈLE CPA (à partir de cette version) : le sous-affilié touche un
// montant FIXE une seule fois par client validé — plus de commission
// récurrente mensuelle. Voir supabase-migration-cpa.sql pour le détail
// du changement de schéma.

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
    // Nouveau client payant : on regarde s'il vient d'un lien d'affiliation.
    // C'est ICI que le CPA est déclenché — une seule fois, à la création
    // du client. Aucun autre évènement Stripe ne redéclenche un paiement
    // pour ce même client (voir invoice.paid, volontairement absent).
    // -----------------------------------------------------------
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const referralCode = session.client_reference_id // le ?ref= passé au moment du checkout

      if (referralCode) {
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('id, cpa_amount_cents, stripe_account_id')
          .eq('referral_code', referralCode)
          .single()

        if (affiliate) {
          // Le CPA appliqué à CE client est figé maintenant, avec le
          // cpa_amount_cents de l'affilié TEL QU'IL EST À CET INSTANT.
          // Si le manager change son CPA plus tard, cette ligne ne bouge
          // plus — seuls les FUTURS clients prendront le nouveau montant.
          const cpaApplied = affiliate.cpa_amount_cents

          const { data: referral, error: referralError } = await supabase
            .from('referrals')
            .insert({
              affiliate_id: affiliate.id,
              customer_email: session.customer_details?.email,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              plan: session.metadata?.plan ?? 'inconnu',
              status: 'active',
              cpa_applied_cents: cpaApplied,
              referred_via_code: referralCode,
            })
            .select()
            .single()

          if (referralError) {
            console.error('Erreur création referral:', referralError)
            break
          }

          await supabase.rpc('increment_active_clients', { affiliate_id: affiliate.id })

          // Virement Stripe Connect immédiat et unique du CPA.
          if (affiliate.stripe_account_id) {
            try {
              const transfer = await stripe.transfers.create({
                amount: cpaApplied,
                currency: 'eur',
                destination: affiliate.stripe_account_id,
                metadata: {
                  referral_id: referral.id,
                  type: 'cpa',
                },
              })

              await supabase.from('commission_payouts').insert({
                affiliate_id: affiliate.id,
                referral_id: referral.id,
                amount_cents: cpaApplied,
                stripe_transfer_id: transfer.id,
                period: new Date().toISOString().slice(0, 7), // '2026-08', gardé pour cohérence historique
                status: 'paid',
                payout_type: 'cpa',
              })
            } catch (transferErr) {
              console.error('Erreur virement Stripe Connect CPA:', transferErr)
              // On enregistre quand même le referral et le montant dû, en
              // 'failed', pour pouvoir le repayer manuellement si besoin.
              await supabase.from('commission_payouts').insert({
                affiliate_id: affiliate.id,
                referral_id: referral.id,
                amount_cents: cpaApplied,
                period: new Date().toISOString().slice(0, 7),
                status: 'failed',
                payout_type: 'cpa',
              })
            }
          }
        }
      }
      break
    }

    // -----------------------------------------------------------
    // Un filleul se désabonne : l'affilié perd ce client du décompte.
    // Le CPA déjà versé n'est PAS repris — il était payé pour
    // l'ACQUISITION du client, pas pour sa durée d'abonnement.
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
      }
      break
    }

    // Note : l'évènement 'invoice.paid' n'est plus traité ici. Sous
    // l'ancien modèle, il déclenchait un virement à chaque facture payée
    // (commission mensuelle récurrente). Sous le modèle CPA, le paiement
    // de l'affilié est unique et a déjà eu lieu sur checkout.session.completed
    // — les renouvellements mensuels du client ne génèrent plus rien pour lui.
  }

  return res.status(200).json({ received: true })
}
