// Simple in-memory rate limiter
// Note: In a serverless environment (like Vercel), this state might reset frequently.
// For production, use Redis (e.g., @upstash/ratelimit).

type RateLimitStore = Map<string, { count: number; lastReset: number }>

const globalStore: RateLimitStore = new Map()

export const rateLimit = (limit: number, windowMs: number) => {
  return {
    check: (identifier: string) => {
      const now = Date.now()
      const record = globalStore.get(identifier)

      if (!record) {
        globalStore.set(identifier, { count: 1, lastReset: now })
        return true
      }

      if (now - record.lastReset > windowMs) {
        globalStore.set(identifier, { count: 1, lastReset: now })
        return true
      }

      if (record.count >= limit) {
        return false
      }

      record.count++
      return true
    },
    cleanup: () => {
      const now = Date.now()
      for (const [key, record] of globalStore.entries()) {
        if (now - record.lastReset > windowMs) {
          globalStore.delete(key)
        }
      }
    }
  }
}

export const loginRateLimit = rateLimit(5, 60 * 1000) // 5 attempts per minute