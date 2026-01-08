"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { AuditLogTable } from "@/components/audit-log-table"
import { AuditLogFilters } from "@/components/audit-log-filters"
import { AuditLogAnalytics } from "@/components/audit-log-analytics"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Download, Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import type { AuditLogEntry, AuditLogStats } from "@/lib/supabase/audit-logs"
import { getActionDisplayName } from "@/lib/supabase/audit-logs"

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [stats, setStats] = useState<AuditLogStats | null>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
  })
  const [filters, setFilters] = useState<any>({})

  useEffect(() => {
    fetchLogs()
    fetchStats()
    checkSuspiciousActivity()
  }, [filters, pagination.page])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        ...filters,
      })

      const response = await fetch(`/api/audit-logs?${params}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch audit logs" }))
        throw new Error(errorData.error || "Failed to fetch audit logs")
      }

      const result = await response.json()
      setLogs(result.data || [])
      setPagination(result.pagination || {
        page: 1,
        pageSize: 50,
        total: 0,
        totalPages: 0,
      })
    } catch (error: any) {
      console.error("Fetch logs error:", error)
      toast.error(error.message || "Failed to fetch audit logs. Please ensure the database migration has been run.")
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/audit-logs/stats")
      if (!response.ok) {
        console.error("Failed to fetch stats:", response.statusText)
        return
      }

      const data = await response.json()
      setStats(data)
    } catch (error: any) {
      console.error("Failed to fetch stats:", error)
      // Set default stats if fetch fails
      setStats({
        totalLogins: 0,
        failedLogins: 0,
        successRate: 0,
        uniqueUsers: 0,
        recentActions: [],
      })
    }
  }

  const checkSuspiciousActivity = async () => {
    try {
      const response = await fetch("/api/audit-logs?detectSuspicious=true")
      if (!response.ok) {
        console.error("Failed to check suspicious activity:", response.statusText)
        return
      }

      const data = await response.json()
      setAlerts(data.alerts || [])
    } catch (error) {
      console.error("Failed to check suspicious activity:", error)
      setAlerts([])
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams(filters)
      const response = await fetch(`/api/audit-logs/export?${params}`)
      if (!response.ok) throw new Error("Failed to export logs")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Audit logs exported successfully")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setExporting(false)
    }
  }

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters)
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleRefresh = () => {
    fetchLogs()
    fetchStats()
    checkSuspiciousActivity()
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Audit Logs"
        subtitle="Monitor authentication events and security activities"
      />

      <div className="p-4 lg:p-6 space-y-6">
        {/* Database Setup Notice */}
        {logs.length === 0 && !loading && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Database Setup Required</AlertTitle>
            <AlertDescription>
              <p className="mb-2">
                The audit logs feature requires a database migration to be run first.
              </p>
              <p className="text-sm">
                Run: <code className="bg-muted px-2 py-1 rounded">supabase db push</code>
              </p>
              <p className="text-sm mt-1">
                Or manually apply: <code className="bg-muted px-2 py-1 rounded">supabase/migrations/20260108_audit_logs_indexes.sql</code>
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Security Alerts */}
        {alerts.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Security Alerts Detected</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 space-y-1">
                {alerts.map((alert, idx) => (
                  <li key={idx}>
                    {alert.message} ({alert.count} occurrences)
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Analytics */}
        {stats && <AuditLogAnalytics stats={stats} />}

        {/* Filters */}
        <AuditLogFilters onFilterChange={handleFilterChange} />

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Authentication Events</CardTitle>
                <CardDescription>
                  Showing {logs.length} of {pagination.total} events
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={exporting}
                >
                  {exporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : logs.length > 0 ? (
              <>
                <AuditLogTable logs={logs} onRowClick={setSelectedLog} />

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                      }
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                      }
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No audit logs found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this authentication event
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Action</p>
                <p className="text-sm text-muted-foreground">
                  {getActionDisplayName(selectedLog.action)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">User</p>
                <p className="text-sm text-muted-foreground">
                  {selectedLog.name || "Unknown"} ({selectedLog.email || "N/A"})
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Role</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {selectedLog.role || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Date & Time</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedLog.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">IP Address</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {selectedLog.ip_address || "N/A"}
                </p>
              </div>
              {selectedLog.payload && (
                <div>
                  <p className="text-sm font-medium">Additional Data</p>
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
