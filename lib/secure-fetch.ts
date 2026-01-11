"use client"

import { generateFingerprint } from "./fingerprint"

/**
 * Secure fetch wrapper that automatically includes fingerprint header
 * for session validation on protected routes
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const fingerprint = generateFingerprint()
  
  const headers = new Headers(options.headers)
  headers.set('x-fingerprint', JSON.stringify(fingerprint))
  
  return fetch(url, {
    ...options,
    headers,
  })
}

/**
 * Setup global fetch interceptor to add fingerprint to all requests
 * Call this once in your app layout or auth provider
 */
export function setupFingerprintInterceptor(): void {
  if (typeof window === 'undefined') return
  
  const originalFetch = window.fetch
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // Only add fingerprint to same-origin API requests
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    
    if (url.startsWith('/api/') || url.startsWith(window.location.origin + '/api/')) {
      const fingerprint = generateFingerprint()
      const headers = new Headers(init?.headers)
      
      // Don't override if already set
      if (!headers.has('x-fingerprint')) {
        headers.set('x-fingerprint', JSON.stringify(fingerprint))
      }
      
      return originalFetch(input, { ...init, headers })
    }
    
    return originalFetch(input, init)
  }
}
