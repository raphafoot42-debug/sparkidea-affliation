import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Appelé depuis la fiche détail d'un affilié, espace admin.
// ⚠️ TODO avant mise en prod : vérifier que l'utilisateur connecté est bien
// l'admin (ex: colonne is_admin sur son profil), pas juste "connecté".
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  // TODO: remplacer par une vraie vérification is_admin
  // if (!(await isAdmin(user.id))) return NextResponse.json({ error: 'Interdit' }, { status: 403 })

  const { rate, locked } = await request.json()

  if (typeof rate !== 'number' || rate < 0 || rate > 100) {
    return NextResponse.json({ error: 'Taux invalide' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('affiliates')
    .update({ commission_rate: rate, rate_locked: !!locked })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, rate, locked: !!locked })
}
