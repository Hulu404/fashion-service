import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client for SSR reads of public data (e.g. trends).
 *
 * A single set of credentials is enough: it prefers the dedicated server vars
 * (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) but falls back to the public
 * NEXT_PUBLIC_* pair, so you only have to configure one set. The service-role
 * key is optional and only matters if you ever need to read past RLS here.
 *
 * Returns null when nothing is configured so callers can degrade gracefully
 * instead of crashing the render.
 */
export function createClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  if (!url || !key) return null
  return createSupabaseClient(url, key)
}
