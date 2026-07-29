import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  realtime: { transport: ws as any },
})

export const getSupabaseClient = (authToken: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    realtime: { transport: ws as any },
    global: {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  })
}
