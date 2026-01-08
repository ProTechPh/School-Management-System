"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Shield } from "lucide-react"
import { getUserAuditLogs } from "@/lib/supabase/audit-logs"
import { getActionDisplayName, getActionSeverity } from "@/lib/supabase/audit-logs"
import type { AuditLogEntry } from "@/lib/supabase/audit-logs"

interface UserAuditHistoryProps {
  userId: string
  limit?: number
}

export function UserAuditHistory({ userId, limit = 10 }: UserAuditHistoryProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [userId])

  const fetchLogs = async () => {
    try {
      const data = await getUserAuditLogs(userId, limit)
      setLogs(data)
    } catch (error) {
      console.error("Failed to fetch audit logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive" as const
      case "medium":
        return "default" as const
      default:
        return "secondary" as const
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <div>
            <CardTitle>Security Activity</CardTitle>
            <CardDescription>Recent authentication events on your account</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : logs.length > 0 ? (
          <div className="space-y-4">
            {logs.map((log) => {
              const severity = getActionSeverity(log.action)
              return (
                <div
                  key={log.id}
                  className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityVariant(severity)}>
                        {getActionDisplayName(log.action)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                    {log.ip_address && (
                      <p className="text-xs text-muted-foreground font-mono">
                        IP: {log.ip_address}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            No security activity recorded
          </p>
        )}
      </CardContent>
    </Card>
  )
}
