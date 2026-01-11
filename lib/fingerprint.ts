"use client"

/**
 * Client-side browser fingerprint generation
 * Collects non-PII browser characteristics to create a unique device identifier
 */

export interface ClientFingerprint {
  userAgent: string
  language: string
  timezone: string
  screenResolution: string
  colorDepth: number
  platform: string
  cookiesEnabled: boolean
  doNotTrack: string | null
}

/**
 * Generate browser fingerprint from available browser APIs
 */
export function generateFingerprint(): ClientFingerprint {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    platform: navigator.platform,
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
  }
}

/**
 * Store session binding token in localStorage for validation
 */
export function storeSessionToken(token: string): void {
  try {
    localStorage.setItem('session_bind_token', token)
  } catch {
    // localStorage might be disabled
    console.warn('Could not store session token')
  }
}

/**
 * Get stored session binding token
 */
export function getStoredSessionToken(): string | null {
  try {
    return localStorage.getItem('session_bind_token')
  } catch {
    return null
  }
}

/**
 * Clear stored session token on logout
 */
export function clearSessionToken(): void {
  try {
    localStorage.removeItem('session_bind_token')
  } catch {
    // Ignore errors
  }
}
