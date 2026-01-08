"use client"

import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import type { AuditLogEntry } from "@/lib/supabase/audit-logs"
import { getActionDisplayName, getActionSeverity } from "@/lib/supabase/audit-logs"

interface AuditLogTableProps {
  logs: AuditLogEntry[]
  onRowClick?: (log: AuditLogEntry) => void
}

export function AuditLogTable({ logs, onRowClick }: AuditLogTableProps) {
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

  const columns = [
    {
      key: "created_at",
      header: "Date & Time",
      render: (log: AuditLogEntry) => (
        <div className="text-sm">
          <div className="font-medium">
            {new Date(log.created_at).toLocaleDateString()}
          </div>
          <div className="text-muted-foreground text-xs">
            {new Date(log.created_at).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: "name",
      header: "User",
      render: (log: AuditLogEntry) => (
        <div className="text-sm">
          <div className="font-medium">{log.name || "Unknown"}</div>
          <div className="text-muted-foreground text-xs">{log.email || "N/A"}</div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (log: AuditLogEntry) => (
        <Badge variant="outline" className="capitalize">
          {log.role || "N/A"}
        </Badge>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (log: AuditLogEntry) => {
        const severity = getActionSeverity(log.action)
        return (
          <Badge variant={getSeverityVariant(severity)}>
            {getActionDisplayName(log.action)}
          </Badge>
        )
      },
    },
    {
      key: "ip_address",
      header: "IP Address",
      render: (log: AuditLogEntry) => (
        <span className="text-sm font-mono">
          {log.ip_address && log.ip_address.trim() !== "" ? log.ip_address : "N/A"}
        </span>
      ),
    },
  ]

  return <DataTable columns={columns} data={logs} onRowClick={onRowClick} />
}
