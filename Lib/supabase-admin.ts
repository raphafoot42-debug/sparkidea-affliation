import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// ⚠️ N'IMPORTER CE FICHIER QUE DANS DES ROUTES API SERVEUR (pages/api/**).
// Ne jamais importer dans un composant React côté navigateur — la clé service_role
// donne un accès total à la base, sans passer par RLS.
// Sert pour : webhook Stripe, actions admin (changer un taux, créer un pack).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
