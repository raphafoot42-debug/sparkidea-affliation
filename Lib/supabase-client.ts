import { createBrowserClient } from '@supabase/ssr'

// Utilisé dans les composants React côté client.
// Ne connaît que la clé publique — ne peut jamais agir en admin.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
