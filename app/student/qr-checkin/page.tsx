"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { QRScanner } from "@/components/qr-scanner"
import { QrCode, Camera, XCircle, Clock, MapPin, Navigation, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useSchoolLocationStore } from "@/lib/school-location-store"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"

interface LocationState {
  status: "idle" | "loading" | "success" | "error" | "denied"
  latitude?: number
  longitude?: number
  error?: string
}

interface CheckinRecord {
  id: string
  session: {
    id: string
    date: string
    start_time: string
    class: { name: string }
  }
  checked_in_at: string
}

export default function StudentQRCheckinPage() {
  const { location: schoolLocation, isWithinRange, getDistanceFromSchool } = useSchoolLocationStore()
  const [showScanner, setShowScanner] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [userLocation, setUserLocation] = useState<LocationState>({ status: "idle" })
  const [isInRange, setIsInRange] = useState<boolean | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentStudent, setCurrentStudent] = useState<{ id: string; name: string } | null>(null)
  const [checkins, setCheckins] = useState<CheckinRecord[]>([])

  useEffect(() => {
    fetchUser()
    getUserLocation()
  }, [])

  const fetchUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from("users")
        .select("id, name")
        .eq("id", user.id)
        .single()
      if (data) {
        setCurrentStudent(data)
        
        // Fetch student's check-ins
        const { data: checkinData } = await supabase
          .from("qr_checkins")
          .select(`
            id, checked_in_at,
            session:qr_attendance_sessions (
              id, date, start_time,
              class:classes (name)
            )
          `)
          .eq("student_id", user.id)
          .order("checked_in_at", { ascending: false })
          .limit(10)
        
        if (checkinData) {
          setCheckins(checkinData as any)
        }
      }
    }
    setLoading(false)
  }

  const getUserLocation = () => {
    setUserLocation({ status: "loading" })
    
    if (!navigator.geolocation) {
      setUserLocation({ status: "error", error: "Geolocation is not supported by your browser" })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ status: "success", latitude, longitude })
        const dist = getDistanceFromSchool(latitude, longitude)
        setDistance(dist)
        setIsInRange(isWithinRange(latitude, longitude))
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setUserLocation({ status: "denied", error: "Location access denied. Please enable location services." })
        } else {
          setUserLocation({ status: "error", error: "Unable to get your location" })
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleScan = async (code: string) => {
    if (!currentStudent || submitting) return
    setSubmitting(true)
    setShowScanner(false)
    
    const supabase = createClient()
    
    // Find the session by QR code
    const { data: session, error: sessionError } = await supabase
      .from("qr_attendance_sessions")
      .select("id, status, require_location, class:classes (name)")
      .eq("qr_code", code)
      .single()

    if (sessionError || !session) {
      setResult({ success: false, message: "Invalid QR code. Please try again." })
      setSubmitting(false)
      return
    }

    try {
      // Use the secure API route for check-in
      const response = await fetch("/api/student/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: session.id,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to check in")
      }

      setResult({ success: true, message: `Successfully checked in to ${(session.class as any)?.name}!` })
      toast.success("Check-in successful!")
      fetchUser() // Refresh list
    } catch (error: any) {
      setResult({ success: false, message: error.message })
      toast.error("Check-in failed", { description: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode) {
      handleScan(manualCode)
      setManualCode("")
    }
  }

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)}m`
    return `${(meters / 1000).toFixed(2)}km`
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <DashboardHeader title="QR Check-in" subtitle="Scan QR codes to mark your attendance" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader title="QR Check-in" subtitle="Scan QR codes to mark your attendance" userId={currentStudent?.id} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />Location Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              {userLocation.status === "loading" && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Getting your location...</span>
                </div>
              )}
              {userLocation.status === "success" && (
                <>
                  <Badge variant={isInRange ? "default" : "destructive"} className="gap-1">
                    <Navigation className="h-3 w-3" />{isInRange ? "Within School Area" : "Outside School Area"}
                  </Badge>
                  {distance !== null && (
                    <span className="text-sm text-muted-foreground">
                      Distance: {formatDistance(distance)} (Allowed: {formatDistance(schoolLocation.radiusMeters)})
                    </span>
                  )}
                </>
              )}
              {(userLocation.status === "error" || userLocation.status === "denied") && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">{userLocation.error}</span>
                  <Button variant="outline" size="sm" onClick={getUserLocation}>Retry</Button>
                </div>
              )}
              {userLocation.status === "idle" && (
                <Button variant="outline" size="sm" onClick={getUserLocation}>
                  <MapPin className="mr-2 h-4 w-4" />Enable Location
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" />Check In</CardTitle>
            <CardDescription>Scan the QR code displayed by your teacher</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" size="lg" onClick={() => setShowScanner(true)} disabled={submitting}>
              <Camera className="mr-2 h-5 w-5" />Scan QR Code
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or enter code manually</span>
              </div>
            </div>

            <form onSubmit={handleManualCheckIn} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="code">Attendance Code</Label>
                <Input id="code" value={manualCode} onChange={(e) => setManualCode(e.target.value.toUpperCase())} placeholder="e.g., ATT-XXXXXXXX-20241219-0900" />
              </div>
              <Button type="submit" variant="outline" className="w-full" disabled={!manualCode || submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Submit Code
              </Button>
            </form>

            {result && (
              <div className={`flex items-center gap-2 rounded-lg p-3 ${result.success ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>
                {result.success ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                <span className="text-sm font-medium">{result.message}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Check-ins</CardTitle>
            <CardDescription>Recent attendance records</CardDescription>
          </CardHeader>
          <CardContent>
            {checkins.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No check-ins recorded yet</p>
            ) : (
              <div className="space-y-3">
                {checkins.map((checkin) => (
                  <div key={checkin.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{checkin.session?.class?.name || "Unknown Class"}</p>
                        <p className="text-sm text-muted-foreground">
                          {checkin.session?.date ? format(new Date(checkin.session.date), "MMM d, yyyy") : ""}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      <Clock className="mr-1 h-3 w-3" />{checkin.session?.start_time || ""}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showScanner && <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}
    </div>
  )
}