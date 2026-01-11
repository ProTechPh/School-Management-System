"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Monitor, Smartphone, LogOut, Shield } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface Session {
  id: string
  user_agent: string
  created_at: string
  last_active: string
  ip_hash: string
  isCurrent?: boolean
}

interface Device {
  id: string
  device_name: string
  fingerprint_hash: string
  first_seen: string
  last_seen: string
  login_count: number
  is_trusted: boolean
}

export function ActiveSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/auth/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
        setDevices(data.devices || [])
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const handleLogoutAll = async () => {
    setLoggingOut(true)
    try {
      const response = await fetch('/api/auth/sessions', { method: 'DELETE' })
      if (response.ok) {
        toast.success('Logged out from all devices')
        // Redirect to login
        window.location.href = '/login?reason=logout_all'
      } else {
        toast.error('Failed to logout from all devices')
      }
    } catch (error) {
      toast.error('Failed to logout from all devices')
    } finally {
      setLoggingOut(false)
    }
  }

  const getDeviceIcon = (userAgent: string) => {
    if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
      return <Smartphone className="h-4 w-4" />
    }
    return <Monitor className="h-4 w-4" />
  }

  const parseDeviceName = (userAgent: string): string => {
    let browser = 'Unknown'
    let os = 'Unknown'

    if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Edg')) browser = 'Edge'
    else if (userAgent.includes('Chrome')) browser = 'Chrome'
    else if (userAgent.includes('Safari')) browser = 'Safari'

    if (userAgent.includes('Windows')) os = 'Windows'
    else if (userAgent.includes('Mac')) os = 'macOS'
    else if (userAgent.includes('Linux')) os = 'Linux'
    else if (userAgent.includes('Android')) os = 'Android'
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS'

    return `${browser} on ${os}`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Active Sessions
            </CardTitle>
            <CardDescription>
              Manage your active login sessions across devices
            </CardDescription>
          </div>
          {sessions.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleLogoutAll}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              Logout All Devices
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">No active sessions found.</p>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div 
                key={session.id} 
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  {getDeviceIcon(session.user_agent)}
                  <div>
                    <p className="font-medium text-sm">
                      {parseDeviceName(session.user_agent)}
                      {session.isCurrent && (
                        <Badge variant="secondary" className="ml-2">Current</Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last active {formatDistanceToNow(new Date(session.last_active), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {devices.length > 0 && (
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Known Devices ({devices.length})</h4>
            <div className="space-y-2">
              {devices.map((device) => (
                <div 
                  key={device.id}
                  className="flex items-center justify-between p-2 rounded border text-sm"
                >
                  <div>
                    <p className="font-medium">{device.device_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {device.login_count} logins · First seen {formatDistanceToNow(new Date(device.first_seen), { addSuffix: true })}
                    </p>
                  </div>
                  {device.is_trusted && (
                    <Badge variant="outline">Trusted</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
