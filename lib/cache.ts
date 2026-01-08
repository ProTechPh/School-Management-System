/**
 * Caching utilities for API responses and database queries
 * Implements both in-memory and Next.js cache strategies
 */

import { unstable_cache } from 'next/cache'

// In-memory cache for client-side queries
const queryCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 30000 // 30 seconds

/**
 * Client-side query cache with TTL
 * Prevents duplicate API calls within the TTL window
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl = CACHE_TTL
): Promise<T> {
  const cached = queryCache.get(key)
  const now = Date.now()
  
  if (cached && now - cached.timestamp < ttl) {
    return cached.data as T
  }
  
  const data = await queryFn()
  queryCache.set(key, { data, timestamp: now })
  
  // Cleanup old entries
  if (queryCache.size > 100) {
    const entries = Array.from(queryCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    entries.slice(0, 50).forEach(([key]) => queryCache.delete(key))
  }
  
  return data
}

/**
 * Server-side cache alias for API routes
 * Same as cachedQuery but with a more descriptive name for server context
 */
export const serverCache = cachedQuery

/**
 * Clear specific cache entry
 */
export function invalidateCache(key: string) {
  queryCache.delete(key)
}

/**
 * Clear all cache entries
 */
export function clearCache() {
  queryCache.clear()
}

/**
 * Server-side cache for dashboard data
 * Uses Next.js unstable_cache for automatic revalidation
 */
export const getCachedDashboardData = (userId: string, role: string) => {
  return unstable_cache(
    async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/${role}/dashboard`, {
        headers: { 'x-user-id': userId }
      })
      return response.json()
    },
    [`dashboard-${role}-${userId}`],
    { 
      revalidate: 60, // Cache for 60 seconds
      tags: [`dashboard-${role}`, `user-${userId}`]
    }
  )()
}

/**
 * Cache for student list with pagination
 */
export const getCachedStudents = (page: number, pageSize: number) => {
  return unstable_cache(
    async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/students?page=${page}&pageSize=${pageSize}`
      )
      return response.json()
    },
    [`students-page-${page}-${pageSize}`],
    { 
      revalidate: 120, // Cache for 2 minutes
      tags: ['students']
    }
  )()
}

/**
 * Cache for class list
 */
export const getCachedClasses = () => {
  return unstable_cache(
    async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/classes`)
      return response.json()
    },
    ['classes-list'],
    { 
      revalidate: 180, // Cache for 3 minutes
      tags: ['classes']
    }
  )()
}

/**
 * Invalidate cache by tag
 * Use this when data is updated
 */
export async function revalidateByTag(tag: string) {
  if (typeof window === 'undefined') {
    const { revalidateTag } = await import('next/cache')
    // @ts-expect-error - Next.js 16 requires profile parameter but types may not be updated
    await revalidateTag(tag, { profile: 'max' })
  }
}
