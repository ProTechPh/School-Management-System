"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Video, ExternalLink, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface ZoomMeetingRoomProps {
  meetingId: string
  onLeave?: () => void
}

interface JoinInfo {
  joinUrl: string
  startUrl?: string
  password?: string
  meetingNumber: string
  isHost: boolean
  sdkSignature?: string
  sdkKey?: string
  userName: string
  userEmail: string
}

export function ZoomMeetingRoom({ meetingId, onLeave }: ZoomMeetingRoomProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [joinInfo, setJoinInfo] = useState<JoinInfo | null>(null)
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<unknown>(null)

  // Fetch join info
  useEffect(() => {
    async function fetchJoinInfo() {
      try {
        const response = await fetch(`/api/zoom/meetings/${meetingId}/join`)
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to get meeting info")
        }
        const data = await response.json()
        setJoinInfo(data)

        // Record join
        await fetch(`/api/zoom/meetings/${meetingId}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "join" }),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load meeting")
      } finally {
        setLoading(false)
      }
    }

    fetchJoinInfo()
  }, [meetingId])

  // Load Zoom SDK
  useEffect(() => {
    if (!joinInfo?.sdkKey || !joinInfo?.sdkSignature) return

    // Check if SDK is already loaded
    if (typeof window !== "undefined" && (window as unknown as { ZoomMtgEmbedded?: unknown }).ZoomMtgEmbedded) {
      setSdkLoaded(true)
      return
    }

    // Load SDK script
    const script = document.createElement("script")
    script.src = "https://source.zoom.us/2.18.0/lib/vendor/react.min.js"
    script.async = true

    const script2 = document.createElement("script")
    script2.src = "https://source.zoom.us/2.18.0/lib/vendor/react-dom.min.js"
    script2.async = true

    const script3 = document.createElement("script")
    script3.src = "https://source.zoom.us/2.18.0/lib/vendor/redux.min.js"
    script3.async = true

    const script4 = document.createElement("script")
    script4.src = "https://source.zoom.us/2.18.0/lib/vendor/redux-thunk.min.js"
    script4.async = true

    const script5 = document.createElement("script")
    script5.src = "https://source.zoom.us/2.18.0/lib/vendor/lodash.min.js"
    script5.async = true

    const mainScript = document.createElement("script")
    mainScript.src = "https://source.zoom.us/zoom-meeting-2.18.0.min.js"
    mainScript.async = true
    mainScript.onload = () => setSdkLoaded(true)
    mainScript.onerror = () => setError("Failed to load Zoom SDK")

    document.body.appendChild(script)
    document.body.appendChild(script2)
    document.body.appendChild(script3)
    document.body.appendChild(script4)
    document.body.appendChild(script5)
    
    setTimeout(() => {
      document.body.appendChild(mainScript)
    }, 1000)

    return () => {
      [script, script2, script3, script4, script5, mainScript].forEach(s => {
        if (s.parentNode) s.parentNode.removeChild(s)
      })
    }
  }, [joinInfo])

  // Initialize meeting when SDK is loaded
  useEffect(() => {
    if (!sdkLoaded || !joinInfo?.sdkKey || !containerRef.current) return

    const initMeeting = async () => {
      try {
        const ZoomMtgEmbedded = (window as unknown as { ZoomMtgEmbedded: { createClient: () => unknown } }).ZoomMtgEmbedded
        const client = ZoomMtgEmbedded.createClient()
        clientRef.current = client

        const meetingSDKElement = containerRef.current
        if (!meetingSDKElement) return

        await (client as { init: (config: unknown) => Promise<void> }).init({
          zoomAppRoot: meetingSDKElement,
          language: "en-US",
          customize: {
            video: {
              isResizable: true,
              viewSizes: {
                default: { width: 1000, height: 600 },
              },
            },
          },
        })

        await (client as { join: (config: unknown) => Promise<void> }).join({
          sdkKey: joinInfo.sdkKey,
          signature: joinInfo.sdkSignature,
          meetingNumber: joinInfo.meetingNumber,
          password: joinInfo.password || "",
          userName: joinInfo.userName,
          userEmail: joinInfo.userEmail,
        })
      } catch (err) {
        console.error("Failed to join meeting:", err)
        setError("Failed to join meeting. Try opening in Zoom app instead.")
      }
    }

    initMeeting()

    return () => {
      // Record leave
      fetch(`/api/zoom/meetings/${meetingId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "leave" }),
      })
    }
  }, [sdkLoaded, joinInfo, meetingId])

  const openInZoom = () => {
    if (!joinInfo) return
    const url = joinInfo.isHost && joinInfo.startUrl ? joinInfo.startUrl : joinInfo.joinUrl
    window.open(url, "_blank")
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
          <p className="text-muted-foreground">Loading meeting...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !joinInfo) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <p className="text-destructive mb-4">{error || "Failed to load meeting"}</p>
          {joinInfo && (
            <Button onClick={openInZoom}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Zoom
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // If SDK not available, show fallback
  if (!joinInfo.sdkKey || !joinInfo.sdkSignature) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <Video className="h-12 w-12 text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Join Meeting</h3>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            Click below to join the meeting in the Zoom app or web client.
          </p>
          <div className="flex gap-3">
            <Button onClick={openInZoom}>
              <ExternalLink className="h-4 w-4 mr-2" />
              {joinInfo.isHost ? "Start Meeting" : "Join Meeting"}
            </Button>
            {onLeave && (
              <Button variant="outline" onClick={onLeave}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Video className="h-5 w-5 text-blue-500" />
          <span className="font-medium">Zoom Meeting</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openInZoom}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in Zoom
          </Button>
          {onLeave && (
            <Button variant="outline" size="sm" onClick={onLeave}>
              Leave
            </Button>
          )}
        </div>
      </div>
      <div
        ref={containerRef}
        className="w-full min-h-[600px] bg-black rounded-lg overflow-hidden"
      />
    </div>
  )
}
