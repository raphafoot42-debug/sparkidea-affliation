import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Utilisé dans les Server Components et Route Handlers.
// Respecte les policies RLS — un affilié ne peut lire que ses propres données.
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
