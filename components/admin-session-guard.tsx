"use client"

import { useSessionTimeout } from "@/lib/hooks/use-session-timeout"
import { SessionTimeoutModal } from "@/components/session-timeout-modal"

// Configuration constants
const THIRTY_MINUTES = 30 * 60 * 1000 // 30 minutes in ms
const EIGHT_HOURS = 8 * 60 * 60 * 1000 // 8 hours in ms
const TWO_MINUTES = 2 * 60 * 1000 // 2 minutes warning before timeout

interface AdminSessionGuardProps {
  children: React.ReactNode
}

export function AdminSessionGuard({ children }: AdminSessionGuardProps) {
  const { showWarning, remainingTime, extendSession, logout } = useSessionTimeout({
    inactivityTimeout: THIRTY_MINUTES,
    absoluteTimeout: EIGHT_HOURS,
    warningTime: TWO_MINUTES,
  })

  return (
    <>
      {children}
      <SessionTimeoutModal
        open={showWarning}
        remainingTime={remainingTime}
        onExtend={extendSession}
        onLogout={logout}
      />
    </>
  )
}
