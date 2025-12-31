import { createClient } from "@/lib/supabase/server"

export async function checkRateLimit(identifier: string, endpoint: string, limit: number, windowMs: number): Promise<boolean> {
  const supabase = await createClient()
  const windowStart = new Date(Date.now() - windowMs).toISOString()

  // 1. Clean up old records (optional optimization: move to a cron job or scheduled function)
  // We do a cleanup occasionally to prevent table bloat, or just filter in the count query
  
  // 2. Count requests in the window
  const { count, error } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("identifier", identifier)
    .eq("endpoint", endpoint)
    .gt("created_at", windowStart)

  if (error) {
    console.error("Rate limit check failed:", error)
    return true // Fail open to avoid blocking legitimate users on DB error
  }

  if ((count || 0) >= limit) {
    return false
  }

  // 3. Log this request
  // We use the service role key or ensure RLS allows insertion if using a client context
  // Here we assume the server client has permissions
  await supabase.from("rate_limits").insert({
    identifier,
    endpoint
  })

  return true
}