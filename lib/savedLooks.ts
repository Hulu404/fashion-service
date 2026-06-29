// Browser-side helpers for the saved_looks table (favourites).
// The DB is the single source of truth so results + favourites stay in sync.

import type { SupabaseClient } from '@supabase/supabase-js'
import { lookKey, type Look } from './looks'

export type SavedLook = { look_key: string; look: Look; created_at: string }

/** Set of content keys the user has saved — used to drive the heart toggle. */
export async function fetchSavedKeys(
  supabase: SupabaseClient,
  userId: string
): Promise<Set<string>> {
  const { data } = await supabase.from('saved_looks').select('look_key').eq('user_id', userId)
  return new Set((data ?? []).map((r: { look_key: string }) => r.look_key))
}

/** Full saved looks, newest first, for the Favourites list. */
export async function fetchSavedLooks(
  supabase: SupabaseClient,
  userId: string
): Promise<SavedLook[]> {
  const { data } = await supabase
    .from('saved_looks')
    .select('look_key, look, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return (data ?? []) as SavedLook[]
}

export async function saveLook(supabase: SupabaseClient, userId: string, look: Look) {
  return supabase
    .from('saved_looks')
    .upsert(
      { user_id: userId, look_key: lookKey(look), look },
      { onConflict: 'user_id,look_key', ignoreDuplicates: true }
    )
}

export async function removeLook(supabase: SupabaseClient, userId: string, key: string) {
  return supabase.from('saved_looks').delete().eq('user_id', userId).eq('look_key', key)
}
