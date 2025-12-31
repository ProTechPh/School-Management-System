import 'server-only'
import { createClient } from "@supabase/supabase-js"

// Use Service Role Key for rate limiting to bypass RLS and ensure system-level access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function checkRateLimit(identifier: string, endpoint: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now()
  const key = `${identifier}:${endpoint}`
  
  try {
    // 1. Get current limit for this key
    const { data, error } = await supabaseAdmin
      .from('rate_limits')
      .select('count, last_request')
      .eq('key', key)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
      console.error("Rate limit fetch error:", error)
      // SECURITY FIX: Fail closed on DB error to prevent brute-force attacks during outages
      return false 
    }

    if (!data) {
      // First request
      await supabaseAdmin.from('rate_limits').insert({
        key,
        count: 1,
        last_request: now
      })
      return true
    }

    // 2. Check window
    if (now - data.last_request > windowMs) {
      // Window expired, reset
      await supabaseAdmin
        .from('rate_limits')
        .update({ count: 1, last_request: now })
        .eq('key', key)
      return true
    }

    // 3. Check limit
    if (data.count >= limit) {
      return false
    }

    // 4. Increment
    await supabaseAdmin
      .from('rate_limits')
      .update({ count: data.count + 1 })
      .eq('key', key)

    return true

  } catch (err) {
    console.error("Rate limit unexpected error:", err)
    // SECURITY FIX: Fail closed on unexpected errors
    return false 
  }
}