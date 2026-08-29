import { createAdminClient } from './supabase-admin'

/**
 * Calcule et met à jour le taux de commission d'un affilié.
 * Règles (validées avec Raphaël) :
 *  - Le taux suit automatiquement les paliers selon active_clients_count
 *  - SAUF si rate_locked = true → l'admin a forcé un taux manuellement, 
 *    il reste figé tant qu'il ne le change pas lui-même  
 *  - Le changement de palier ne s'applique qu'aux NOUVEAUX clients à partir
 *    de ce moment (le taux appliqué à un filleul existant est figé dans
 *    referrals.commission_rate_at_signup au moment de sa création)
 */
export async function recalculateAffiliateRate(affiliateId: string) {
  const supabase = createAdminClient()

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('active_clients_count, rate_locked, commission_rate')
    .eq('id', affiliateId)
    .single()

  if (!affiliate || affiliate.rate_locked) {
    // Taux verrouillé manuellement par l'admin : on ne touche à rien
    return affiliate?.commission_rate ?? 10
  }

  const { data: tiers } = await supabase
    .from('commission_tiers')
    .select('min_clients, rate')
    .order('min_clients', { ascending: true })

  let newRate = 10
  for (const tier of tiers ?? []) {
    if (affiliate.active_clients_count >= tier.min_clients) {
      newRate = tier.rate
    }
  }

  if (newRate !== affiliate.commission_rate) {
    await supabase
      .from('affiliates')
      .update({ commission_rate: newRate })
      .eq('id', affiliateId)
    // TODO: déclencher l'email "Palier débloqué !" ici via Resend si newRate a augmenté
  }

  return newRate
}
