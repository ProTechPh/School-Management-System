/**
 * Audit Log Monitoring Service
 * Monitors authentication events and sends notifications for suspicious activities
 */

import { createClient } from "./supabase/client"
import { detectSuspiciousActivity } from "./supabase/audit-logs"

let monitoringInterval: NodeJS.Timeout | null = null

/**
 * Start monitoring audit logs for suspicious activity
 */
export function startAuditMonitoring(userId: string, userRole: string) {
  // Only monitor for admins or if explicitly enabled
  if (userRole !== "admin") return

  // Clear existing interval
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
  }

  // Check every 5 minutes
  monitoringInterval = setInterval(async () => {
    try {
      const alerts = await detectSuspiciousActivity()

      if (alerts.length > 0) {
        // Send notifications for each alert
        const supabase = createClient()
        
        for (const alert of alerts) {
          await supabase.from("notifications").insert({
            user_id: userId,
            title: "Security Alert",
            message: alert.message,
            type: "warning",
            read: false,
            link: "/admin/audit-logs",
          })
        }
      }
    } catch (error) {
      console.error("Audit monitoring error:", error)
    }
  }, 5 * 60 * 1000) // 5 minutes
}

/**
 * Stop monitoring audit logs
 */
export function stopAuditMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
    monitoringInterval = null
  }
}

/**
 * Send notification for specific audit event
 */
export async function notifyAuditEvent(
  userId: string,
  action: string,
  details: string
) {
  const supabase = createClient()

  // Determine if this action requires notification
  const criticalActions = [
    "user_updated_password",
    "user_deleted",
    "token_revoked",
    "factor_deleted",
    "identity_unlinked",
  ]

  if (criticalActions.includes(action)) {
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "Security Activity",
      message: details,
      type: "warning",
      read: false,
      link: "/profile",
    })
  }
}
