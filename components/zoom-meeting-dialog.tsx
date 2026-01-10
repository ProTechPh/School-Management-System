"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Loader2, Video } from "lucide-react"
import { toast } from "sonner"
import type { ZoomMeeting, ZoomMeetingSettings } from "@/lib/zoom/types"

interface ZoomMeetingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  meeting?: ZoomMeeting | null
  onSuccess?: (meeting: ZoomMeeting) => void
  defaultClassId?: string
}

interface ClassOption {
  id: string
  name: string
}

export function ZoomMeetingDialog({
  open,
  onOpenChange,
  meeting,
  onSuccess,
  defaultClassId,
}: ZoomMeetingDialogProps) {
  const [loading, setLoading] = useState(false)
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    duration: 60,
    classId: defaultClassId || "",
    targetAudience: "class" as "all" | "students" | "teachers" | "class" | "personal",
    settings: {
      host_video: true,
      participant_video: true,
      waiting_room: true,
      mute_upon_entry: true,
      join_before_host: false,
    } as ZoomMeetingSettings,
  })

  // Fetch classes for dropdown
  useEffect(() => {
    async function fetchClasses() {
      try {
        const response = await fetch("/api/teacher/my-classes")
        if (response.ok) {
          const data = await response.json()
          setClasses(data.classes || [])
        }
      } catch (error) {
        console.error("Failed to fetch classes:", error)
      }
    }
    if (open) fetchClasses()
  }, [open])

  // Populate form when editing
  useEffect(() => {
    if (meeting) {
      const startDate = new Date(meeting.start_time)
      setFormData({
        title: meeting.title,
        description: meeting.description || "",
        startDate: startDate.toISOString().split("T")[0],
        startTime: startDate.toTimeString().slice(0, 5),
        duration: meeting.duration,
        classId: meeting.class_id || "",
        targetAudience: meeting.target_audience,
        settings: meeting.settings,
      })
    } else {
      // Reset form for new meeting
      const now = new Date()
      now.setHours(now.getHours() + 1, 0, 0, 0)
      setFormData({
        title: "",
        description: "",
        startDate: now.toISOString().split("T")[0],
        startTime: now.toTimeString().slice(0, 5),
        duration: 60,
        classId: defaultClassId || "",
        targetAudience: "class",
        settings: {
          host_video: true,
          participant_video: true,
          waiting_room: true,
          mute_upon_entry: true,
          join_before_host: false,
        },
      })
    }
  }, [meeting, defaultClassId, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const startTime = new Date(`${formData.startDate}T${formData.startTime}`).toISOString()

      const payload = {
        title: formData.title,
        description: formData.description,
        startTime,
        duration: formData.duration,
        classId: formData.classId || undefined,
        targetAudience: formData.targetAudience,
        settings: formData.settings,
      }

      const url = meeting ? `/api/zoom/meetings/${meeting.id}` : "/api/zoom/meetings"
      const method = meeting ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save meeting")
      }

      const data = await response.json()
      toast.success(meeting ? "Meeting updated" : "Meeting created")
      onSuccess?.(data.meeting)
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save meeting")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-blue-500" />
            {meeting ? "Edit Zoom Meeting" : "Schedule Zoom Meeting"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Math Class - Chapter 5 Review"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Meeting agenda or notes..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Select
                value={formData.duration.toString()}
                onValueChange={(v) => setFormData({ ...formData, duration: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Class (optional)</Label>
              <Select
                value={formData.classId || "none"}
                onValueChange={(v) => setFormData({ ...formData, classId: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No class</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Who can join?</Label>
            <Select
              value={formData.targetAudience}
              onValueChange={(v) => setFormData({ ...formData, targetAudience: v as typeof formData.targetAudience })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="class">Class members only</SelectItem>
                <SelectItem value="students">All students</SelectItem>
                <SelectItem value="teachers">All teachers</SelectItem>
                <SelectItem value="all">Everyone</SelectItem>
                <SelectItem value="personal">Only invited</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 pt-2">
            <Label className="text-sm font-medium">Meeting Settings</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="waiting_room" className="text-sm font-normal">Enable waiting room</Label>
                <Switch
                  id="waiting_room"
                  checked={formData.settings.waiting_room}
                  onCheckedChange={(v) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, waiting_room: v }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="mute_upon_entry" className="text-sm font-normal">Mute participants on entry</Label>
                <Switch
                  id="mute_upon_entry"
                  checked={formData.settings.mute_upon_entry}
                  onCheckedChange={(v) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, mute_upon_entry: v }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="host_video" className="text-sm font-normal">Host video on</Label>
                <Switch
                  id="host_video"
                  checked={formData.settings.host_video}
                  onCheckedChange={(v) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, host_video: v }
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="participant_video" className="text-sm font-normal">Participant video on</Label>
                <Switch
                  id="participant_video"
                  checked={formData.settings.participant_video}
                  onCheckedChange={(v) => setFormData({
                    ...formData,
                    settings: { ...formData.settings, participant_video: v }
                  })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {meeting ? "Update Meeting" : "Create Meeting"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
