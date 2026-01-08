/**
 * Audit Logs utilities for querying Supabase auth audit logs
 */

import { createClient } from "./client"
import type { SupabaseClient } from "@supabase/supabase-js"

export interface AuditLogEntry {
  id: string
  user_id: string | null
  action: string
  ip_address: string | null
  created_at: string
  payload: any
  email?: string
  name?: string
  role?: string
}

export interface AuditLogFilters {
  userId?: string
  action?: string
  startDate?: string
  endDate?: string
  ipAddress?: string
  page?: number
  pageSize?: number
}

export interface AuditLogStats {
  totalLogins: number
  failedLogins: number
  successRate: number
  uniqueUsers: number
  recentActions: { action: string; count: number }[]
}

/**
 * Fetch audit logs with filters and pagination
 */
export async function getAuditLogs(filters: AuditLogFilters = {}) {
  const {
    userId,
    action,
    startDate,
    endDate,
    ipAddress,
    page = 1,
    pageSize = 50,
  } = filters

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const supabase = createClient()

  let query = supabase
    .from("audit_logs_with_users")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (userId) query = query.eq("user_id", userId)
  if (action) query = query.eq("action", action)
  if (startDate) query = query.gte("created_at", startDate)
  if (endDate) query = query.lte("created_at", endDate)
  if (ipAddress) query = query.eq("ip_address", ipAddress)

  const { data, error, count } = await query

  if (error) throw error

  return {
    data: data as AuditLogEntry[],
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
  }
}

/**
 * Get audit logs for a specific user (for profile page)
 */
export async function getUserAuditLogs(userId: string, limit = 10) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("audit_logs_with_users")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as AuditLogEntry[]
}

/**
 * Get audit log statistics for dashboard
 */
export async function getAuditLogStats(days = 30): Promise<AuditLogStats> {
  const supabase = createClient()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data, error } = await supabase
    .from("audit_logs_with_users")
    .select("action, user_id")
    .gte("created_at", startDate.toISOString())

  if (error) throw error

  const logs = data || []
  const totalLogins = logs.filter((l) => l.action === "login").length
  const failedLogins = logs.filter((l) => 
    l.action === "user_signedup" || l.action === "user_repeated_signup"
  ).length
  const successRate = totalLogins > 0 
    ? Math.round(((totalLogins - failedLogins) / totalLogins) * 100) 
    : 0

  const uniqueUsers = new Set(logs.map((l) => l.user_id).filter(Boolean)).size

  // Count actions
  const actionCounts: Record<string, number> = {}
  logs.forEach((log) => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
  })

  const recentActions = Object.entries(actionCounts)
    .map(([action, count]) => ({ action, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalLogins,
    failedLogins,
    successRate,
    uniqueUsers,
    recentActions,
  }
}

/**
 * Detect suspicious activity patterns
 */
export async function detectSuspiciousActivity(userId?: string) {
  const supabase = createClient()
  const fiveMinutesAgo = new Date()
  fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)

  let query = supabase
    .from("audit_logs_with_users")
    .select("*")
    .gte("created_at", fiveMinutesAgo.toISOString())

  if (userId) query = query.eq("user_id", userId)

  const { data, error } = await query

  if (error) throw error

  const logs = data || []
  const alerts: Array<{
    type: string
    message: string
    userId: string | null
    count: number
  }> = []

  // Group by user
  const userLogs: Record<string, AuditLogEntry[]> = {}
  logs.forEach((log) => {
    if (log.user_id) {
      if (!userLogs[log.user_id]) userLogs[log.user_id] = []
      userLogs[log.user_id].push(log)
    }
  })

  // Check for multiple failed attempts
  Object.entries(userLogs).forEach(([uid, userLogEntries]) => {
    const failedAttempts = userLogEntries.filter((l) =>
      l.action.includes("failed") || l.action.includes("repeated")
    )

    if (failedAttempts.length >= 3) {
      alerts.push({
        type: "multiple_failed_logins",
        message: `${failedAttempts.length} failed login attempts in 5 minutes`,
        userId: uid,
        count: failedAttempts.length,
      })
    }

    // Check for password changes
    const passwordChanges = userLogEntries.filter((l) =>
      l.action === "user_updated_password"
    )
    if (passwordChanges.length > 0) {
      alerts.push({
        type: "password_change",
        message: "Password was changed",
        userId: uid,
        count: passwordChanges.length,
      })
    }

    // Check for MFA changes
    const mfaChanges = userLogEntries.filter((l) =>
      l.action.includes("factor") || l.action.includes("mfa")
    )
    if (mfaChanges.length > 0) {
      alerts.push({
        type: "mfa_change",
        message: "MFA settings were modified",
        userId: uid,
        count: mfaChanges.length,
      })
    }
  })

  return alerts
}

/**
 * Export audit logs to CSV
 */
export function exportAuditLogsToCSV(logs: AuditLogEntry[]): string {
  const headers = ["Date", "User", "Email", "Role", "Action", "IP Address"]
  const rows = logs.map((log) => [
    new Date(log.created_at).toLocaleString(),
    log.name || "Unknown",
    log.email || "N/A",
    log.role || "N/A",
    log.action,
    log.ip_address || "N/A",
  ])

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n")

  return csvContent
}

/**
 * Get action display name
 */
export function getActionDisplayName(action: string): string {
  const actionMap: Record<string, string> = {
    login: "Login",
    logout: "Logout",
    invite_accepted: "Invitation Accepted",
    user_signedup: "User Signed Up",
    user_invited: "User Invited",
    user_deleted: "User Deleted",
    user_modified: "User Modified",
    user_recovery_requested: "Password Reset Requested",
    user_reauthenticate_requested: "Reauthentication Requested",
    user_confirmation_requested: "Confirmation Requested",
    user_repeated_signup: "Duplicate Signup Attempt",
    user_updated_password: "Password Changed",
    token_revoked: "Session Refreshed", // Changed from "Token Revoked" to be more user-friendly
    token_refreshed: "Token Refreshed",
    generate_recovery_codes: "MFA Recovery Codes Generated",
    factor_in_progress: "MFA Enrollment Started",
    factor_unenrolled: "MFA Factor Removed",
    challenge_created: "MFA Challenge Created",
    verification_attempted: "MFA Verification Attempted",
    factor_deleted: "MFA Factor Deleted",
    recovery_codes_deleted: "MFA Recovery Codes Deleted",
    factor_updated: "MFA Factor Updated",
    mfa_code_login: "Login with MFA Code",
    identity_unlinked: "Identity Unlinked",
  }

  return actionMap[action] || action
}

/**
 * Get action severity level
 */
export function getActionSeverity(action: string): "low" | "medium" | "high" {
  const highSeverity = [
    "user_deleted",
    "user_updated_password",
    "factor_deleted",
    "identity_unlinked",
    "user_repeated_signup",
  ]

  const mediumSeverity = [
    "user_modified",
    "user_recovery_requested",
    "factor_in_progress",
    "factor_unenrolled",
    "generate_recovery_codes",
  ]

  if (highSeverity.includes(action)) return "high"
  if (mediumSeverity.includes(action)) return "medium"
  return "low"
}
