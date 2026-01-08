/**
 * Custom React hooks for optimized data fetching with caching and deduplication
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { cachedQuery, invalidateCache } from '@/lib/cache'

interface UseQueryOptions<T> {
  enabled?: boolean
  refetchInterval?: number
  cacheTime?: number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseQueryResult<T> {
  data: T | null
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
  invalidate: () => void
}

/**
 * Optimized query hook with automatic caching and deduplication
 * Includes retry logic for transient failures
 */
export function useOptimizedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: UseQueryOptions<T> = {}
): UseQueryResult<T> {
  const {
    enabled = true,
    refetchInterval,
    cacheTime = 30000,
    onSuccess,
    onError,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const mountedRef = useRef(true)
  const retryCountRef = useRef(0)
  const maxRetries = 3

  const fetchData = useCallback(async (isRetry = false) => {
    if (!enabled) return

    try {
      setLoading(true)
      setError(null)

      const result = await cachedQuery(key, queryFn, cacheTime)

      if (mountedRef.current) {
        setData(result)
        retryCountRef.current = 0 // Reset retry count on success
        onSuccess?.(result)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      
      // Retry logic for network errors
      const isNetworkError = error.message.includes('fetch') || 
                            error.message.includes('network') ||
                            error.message.includes('timeout')
      
      if (isNetworkError && retryCountRef.current < maxRetries && !isRetry) {
        retryCountRef.current++
        console.warn(`[useOptimizedQuery] Retry ${retryCountRef.current}/${maxRetries} for ${key}`)
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 5000)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        return fetchData(true)
      }
      
      if (mountedRef.current) {
        setError(error)
        onError?.(error)
        console.error(`[useOptimizedQuery] Error fetching ${key}:`, error)
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [key, queryFn, enabled, cacheTime, onSuccess, onError, maxRetries])

  const invalidate = useCallback(() => {
    invalidateCache(key)
    retryCountRef.current = 0
    void fetchData(false)
  }, [key, fetchData])

  useEffect(() => {
    mountedRef.current = true
    void fetchData(false)

    // Setup refetch interval if specified
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => void fetchData(false), refetchInterval)
    }

    return () => {
      mountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [fetchData, refetchInterval, enabled])

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(false),
    invalidate,
  }
}

/**
 * Hook for paginated queries with automatic caching
 */
export function usePaginatedQuery<T>(
  key: string,
  queryFn: (page: number, pageSize: number) => Promise<{ data: T[]; pagination: any }>,
  pageSize = 50
) {
  const [page, setPage] = useState(1)
  const [allData, setAllData] = useState<T[]>([])
  const [pagination, setPagination] = useState<any>(null)

  const { data, loading, error, refetch } = useOptimizedQuery(
    `${key}-page-${page}`,
    () => queryFn(page, pageSize),
    {
      onSuccess: (result) => {
        setAllData((prev) => {
          // Deduplicate by id if available
          const newItems = result.data.filter(
            (item: any) => !prev.some((p: any) => p.id === item.id)
          )
          return [...prev, ...newItems]
        })
        setPagination(result.pagination)
      },
    }
  )

  const loadMore = useCallback(() => {
    if (pagination && page < pagination.totalPages) {
      setPage((p) => p + 1)
    }
  }, [pagination, page])

  const reset = useCallback(() => {
    setPage(1)
    setAllData([])
    setPagination(null)
  }, [])

  return {
    data: allData,
    loading,
    error,
    pagination,
    loadMore,
    hasMore: pagination ? page < pagination.totalPages : false,
    refetch,
    reset,
  }
}

/**
 * Hook for infinite scroll queries
 */
export function useInfiniteQuery<T>(
  key: string,
  queryFn: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  options: { threshold?: number } = {}
) {
  const { threshold = 0.8 } = options
  const [page, setPage] = useState(1)
  const [allData, setAllData] = useState<T[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const observerRef = useRef<IntersectionObserver | undefined>(undefined)

  const fetchMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const result = await queryFn(page)
      setAllData((prev) => [...prev, ...result.data])
      setHasMore(result.hasMore)
      setPage((p) => p + 1)
    } catch (error) {
      console.error('Error fetching more data:', error)
    } finally {
      setLoading(false)
    }
  }, [page, loading, hasMore, queryFn])

  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (loading) return
      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            fetchMore()
          }
        },
        { threshold }
      )

      if (node) observerRef.current.observe(node)
    },
    [loading, hasMore, fetchMore, threshold]
  )

  useEffect(() => {
    void fetchMore()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only on mount

  return {
    data: allData,
    loading,
    hasMore,
    lastElementRef,
    refetch: () => {
      setPage(1)
      setAllData([])
      setHasMore(true)
      void fetchMore()
    },
  }
}

/**
 * Hook for debounced search queries
 */
export function useDebouncedQuery<T>(
  key: string,
  queryFn: (searchTerm: string) => Promise<T>,
  searchTerm: string,
  delay = 300
): UseQueryResult<T> {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm)
    }, delay)

    return () => clearTimeout(timer)
  }, [searchTerm, delay])

  return useOptimizedQuery(
    `${key}-${debouncedTerm}`,
    () => queryFn(debouncedTerm),
    {
      enabled: debouncedTerm.length > 0,
    }
  )
}
