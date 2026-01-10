/**
 * Zoom API Types
 */

export type ZoomMeetingType = 'instant' | 'scheduled' | 'recurring'
export type ZoomMeetingStatus = 'scheduled' | 'started' | 'ended' | 'cancelled'
export type ZoomParticipantStatus = 'invited' | 'joined' | 'left'

export interface ZoomMeeting {
  id: string
  zoom_meeting_id: string
  host_id: string
  title: string
  description?: string
  meeting_type: ZoomMeetingType
  start_time: string
  duration: number
  timezone: string
  join_url: string
  start_url?: string
  password?: string
  status: ZoomMeetingStatus
  class_id?: string
  target_audience: 'all' | 'students' | 'teachers' | 'class' | 'personal'
  settings: ZoomMeetingSettings
  created_at: string
  updated_at: string
  // Joined data
  host?: { id: string; name: string; email: string; avatar?: string }
  class?: { id: string; name: string }
}

export interface ZoomParticipant {
  id: string
  meeting_id: string
  user_id?: string
  zoom_participant_id?: string
  name?: string
  email?: string
  join_time?: string
  leave_time?: string
  duration?: number
  status: ZoomParticipantStatus
  created_at: string
  // Joined data
  user?: { id: string; name: string; email: string; avatar?: string }
}

export interface ZoomMeetingSettings {
  host_video?: boolean
  participant_video?: boolean
  join_before_host?: boolean
  mute_upon_entry?: boolean
  waiting_room?: boolean
  auto_recording?: 'none' | 'local' | 'cloud'
  meeting_authentication?: boolean
}

// Zoom API Response Types
export interface ZoomApiMeeting {
  id: number | string
  uuid: string
  host_id: string
  topic: string
  type: number
  start_time: string
  duration: number
  timezone: string
  created_at: string
  join_url: string
  start_url: string
  password: string
  settings: {
    host_video: boolean
    participant_video: boolean
    join_before_host: boolean
    mute_upon_entry: boolean
    waiting_room: boolean
    auto_recording: string
  }
}

export interface ZoomApiParticipant {
  id: string
  user_id: string
  name: string
  user_email: string
  join_time: string
  leave_time: string
  duration: number
}

// Create Meeting Request
export interface CreateZoomMeetingRequest {
  title: string
  description?: string
  startTime: string
  duration: number
  timezone?: string
  classId?: string
  targetAudience?: 'all' | 'students' | 'teachers' | 'class' | 'personal'
  settings?: Partial<ZoomMeetingSettings>
}

// Webhook Event Types
export interface ZoomWebhookEvent {
  event: string
  event_ts: number
  payload: {
    account_id: string
    object: ZoomWebhookMeetingObject
  }
}

export interface ZoomWebhookMeetingObject {
  id: string
  uuid: string
  host_id: string
  topic: string
  type: number
  start_time: string
  duration: number
  timezone: string
  participant?: {
    user_id: string
    user_name: string
    email: string
    join_time: string
    leave_time?: string
  }
}

// SDK Signature Response
export interface ZoomSdkSignature {
  signature: string
  sdkKey: string
  meetingNumber: string
  role: number
  userName: string
  userEmail: string
  password?: string
}
