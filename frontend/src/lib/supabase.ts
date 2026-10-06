import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Values come from the .env file in the project root (see VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let client: SupabaseClient | null = null

export function supabase(): SupabaseClient {
  if (!url || !key) {
    throw new Error('Supabase is not set up. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env, then restart the dev server.')
  }
  client ??= createClient(url, key)
  return client
}
