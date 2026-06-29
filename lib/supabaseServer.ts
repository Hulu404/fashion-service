import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Server-side Supabase client for SSR data fetching (trends, etc.).
// Uses the service-role key — never expose this client to the browser.
export function createClient() {
  const url = process.env.SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || ''
  if (!url || !key) throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing')
  return createSupabaseClient(url, key)
}
