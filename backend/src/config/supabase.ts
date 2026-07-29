import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export const getSupabaseClient = (authToken: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  })
}
