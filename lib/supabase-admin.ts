import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { NextApiRequest } from 'next'

export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const DEFAULT_ADMIN_CODE = '2909.42'

export function verifyAdminAccess(req: NextApiRequest): boolean {
  const secret = process.env.ADMIN_SECRET_KEY || DEFAULT_ADMIN_CODE
  const authHeader = req.headers['x-admin-secret'] || req.headers['authorization']
  if (!authHeader) return false
  const token = typeof authHeader === 'string' ? authHeader.replace('Bearer ', '') : ''
  return token === secret
}
