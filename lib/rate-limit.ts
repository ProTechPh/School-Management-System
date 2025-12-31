import { NextResponse } from "next/server"

interface RateLimitContext {
  count: number
  resetAt: number
}

// In-memory store for rate limiting
// Note: In a serverless environment (like Vercel), this cache is per-lambda instance.
// While it doesn't provide a strict global limit, it effectively prevents
// single-source flooding attacks from exhausting database connections.
const ipCache = new Map<string, RateLimitContext>()

// Clean up expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, context] of ipCache.entries()) {
    if (now > context.resetAt) {
      ipCache.delete(key)
    }
  }
}, 5 * 60 * 1000)

export async function checkRateLimit(identifier: string, endpoint: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now()
  const key = `${identifier}:${endpoint}`
  
  const context = ipCache.get(key)

  // If no record or expired, reset
  if (!context || now > context.resetAt) {
    ipCache.set(key, {
      count: 1,
      resetAt: now + windowMs
    })
    return true
  }

  // Increment count
  context.count += 1
  
  // Check limit
  if (context.count > limit) {
    return false
  }

  return true
}