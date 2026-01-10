"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface SessionTimeoutConfig {
  inactivityTimeout: number // in milliseconds
  absoluteTimeout: number // in milliseconds
  warningTime: number // show warning X ms before timeout
  onWarning?: () => void
  onTimeout?: () => void
}

interface UseSessionTimeoutReturn {
  showWarning: boolean
  remainingTime: number
  extendSession: () => void
  logout: () => Promise<void>
}

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
]

const LAST_ACTIVITY_KEY = "admin_last_activity"

export function useSessionTimeout(config: SessionTimeoutConfig): UseSessionTimeoutReturn {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const [remainingTime, setRemainingTime] = useState(0)
  
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null)
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null)
  const absoluteTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  const logout = useCallback(async () => {
    // Clear all timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (absoluteTimerRef.current) clearTimeout(absoluteTimerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)

    // Clear session storage
    sessionStorage.removeItem(LAST_ACTIVITY_KEY)

    // Sign out from Supabase
    const supabase = createClient()
    await supabase.auth.signOut()

    // Redirect to login with timeout message
    router.push("/login?reason=session_timeout")
  }, [router])

  const resetInactivityTimer = useCallback(() => {
    // Update last activity timestamp (client-side only for inactivity tracking)
    sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString())

    // Clear existing timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)

    // Hide warning if shown
    setShowWarning(false)

    // Set warning timer (fires before timeout)
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true)
      config.onWarning?.()
      
      // Start countdown
      let timeLeft = config.warningTime
      setRemainingTime(timeLeft)
      
      countdownRef.current = setInterval(() => {
        timeLeft -= 1000
        setRemainingTime(timeLeft)
        
        if (timeLeft <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current)
        }
      }, 1000)
    }, config.inactivityTimeout - config.warningTime)

    // Set inactivity timeout
    inactivityTimerRef.current = setTimeout(() => {
      config.onTimeout?.()
      logout()
    }, config.inactivityTimeout)
  }, [config, logout])

  const extendSession = useCallback(() => {
    setShowWarning(false)
    if (countdownRef.current) clearInterval(countdownRef.current)
    resetInactivityTimer()
  }, [resetInactivityTimer])

  // Check absolute session timeout from server-side JWT metadata
  const checkAbsoluteTimeout = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      logout()
      return 0
    }

    // Get session_start from JWT metadata (set by server on login)
    const sessionStart = user.user_metadata?.session_start as number | undefined
    
    if (!sessionStart) {
      // No session start in JWT - this shouldn't happen for new logins
      // For backwards compatibility, allow the session but log a warning
      console.warn("No session_start in user metadata")
      return config.absoluteTimeout
    }

    const elapsed = Date.now() - sessionStart
    const remaining = config.absoluteTimeout - elapsed

    if (remaining <= 0) {
      logout()
      return 0
    }

    return remaining
  }, [config.absoluteTimeout, logout])

  useEffect(() => {
    let mounted = true

    const initSession = async () => {
      // Check and set absolute timeout from server-side session_start
      const remainingAbsolute = await checkAbsoluteTimeout()
      
      if (!mounted) return
      
      if (remainingAbsolute > 0) {
        absoluteTimerRef.current = setTimeout(() => {
          logout()
        }, remainingAbsolute)
      }

      // Initialize inactivity timer
      resetInactivityTimer()
    }

    initSession()

    // Add activity listeners
    const handleActivity = () => {
      resetInactivityTimer()
    }

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // Cleanup
    return () => {
      mounted = false
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current)
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current)
      if (absoluteTimerRef.current) clearTimeout(absoluteTimerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [resetInactivityTimer, checkAbsoluteTimeout, logout])

  return {
    showWarning,
    remainingTime,
    extendSession,
    logout,
  }
}
