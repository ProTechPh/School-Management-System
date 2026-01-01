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

/**
 * Rate limits requests based on an identifier (IP or User ID).
 * @param identifier - The unique key to rate limit against (e.g., User ID or IP)
 * @param endpoint - The action being performed (e.g., 'login', 'submit-quiz')
 * @param limit - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export async function checkRateLimit(identifier: string, endpoint: string, limit: number, windowMs: number): Promise<boolean> {
  const key = `${identifier}:${endpoint}`
  
  try {
    // Use atomic RPC to prevent race conditions
    const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
      identifier: key,
      max_requests: limit,
      window_ms: windowMs
    })

    if (error) {
      console.error("Rate limit RPC error:", error)
      // SECURITY FIX: Fail OPEN on DB error to prevent outage amplification
      return true 
    }

    return !!data

  } catch (err) {
    console.error("Rate limit unexpected error:", err)
    // SECURITY FIX: Fail OPEN on unexpected errors
    return true 
  }
}