import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

// Client admin (backend uniquement — ne jamais exposer au frontend)upabaseUrl, supabaseServiceKey)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
// Client avec auth utilisateur
export const getSupabaseClient = (authToken: string) => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    return createClient(supabaseUrl, supabaseAnonKey, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  })
}
