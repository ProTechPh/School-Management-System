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
  const key = `${identifier}:${endpoint}`
  
  try {
    // SECURITY FIX: Use atomic RPC to prevent race conditions
    const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
      identifier: key,
      max_requests: limit,
      window_ms: windowMs
    })

    if (error) {
      console.error("Rate limit RPC error:", error)
      // SECURITY FIX: Fail closed on DB error to prevent brute-force attacks during outages
      return false 
    }

    return !!data

  } catch (err) {
    console.error("Rate limit unexpected error:", err)
    // SECURITY FIX: Fail closed on unexpected errors
    return false 
  }
}