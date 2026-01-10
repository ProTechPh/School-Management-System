/**
 * Zoom API Client - Server-to-Server OAuth
 * 
 * Uses Zoom's Server-to-Server OAuth for backend operations.
 * Requires ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET env vars.
 */

import type { ZoomApiMeeting, ZoomMeetingSettings, ZoomApiParticipant, ZoomRegistrantResponse } from './types'

const ZOOM_API_BASE = 'https://api.zoom.us/v2'
const ZOOM_OAUTH_URL = 'https://zoom.us/oauth/token'

// Token cache
let accessToken: string | null = null
let tokenExpiry: number = 0

/**
 * Get OAuth access token using Server-to-Server OAuth
 */
async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (accessToken && Date.now() < tokenExpiry - 300000) {
    return accessToken
  }

  const accountId = process.env.ZOOM_ACCOUNT_ID
  const clientId = process.env.ZOOM_CLIENT_ID
  const clientSecret = process.env.ZOOM_CLIENT_SECRET

  if (!accountId || !clientId || !clientSecret) {
    throw new Error('Missing Zoom API credentials. Set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(`${ZOOM_OAUTH_URL}?grant_type=account_credentials&account_id=${accountId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get Zoom access token: ${error}`)
  }

  const data = await response.json()
  accessToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in * 1000)

  return accessToken!
}

/**
 * Make authenticated request to Zoom API
 */
async function zoomFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken()

  const response = await fetch(`${ZOOM_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(`Zoom API error: ${error.message || response.statusText}`)
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  // Parse response as text first to preserve large integer precision
  const text = await response.text()
  // Replace large meeting IDs with strings to prevent precision loss
  const fixedText = text.replace(/"id"\s*:\s*(\d{10,})/g, '"id":"$1"')
  return JSON.parse(fixedText) as T
}


/**
 * Create a Zoom meeting
 */
export async function createZoomMeeting(params: {
  topic: string
  agenda?: string
  startTime: string
  duration: number
  timezone?: string
  settings?: Partial<ZoomMeetingSettings>
  enableRegistration?: boolean
}): Promise<ZoomApiMeeting> {
  const { topic, agenda, startTime, duration, timezone = 'UTC', settings = {}, enableRegistration = false } = params

  // Type 2 = Scheduled meeting
  const body: Record<string, unknown> = {
    topic,
    type: 2,
    start_time: startTime,
    duration,
    timezone,
    agenda,
    settings: {
      host_video: settings.host_video ?? true,
      participant_video: settings.participant_video ?? true,
      join_before_host: settings.join_before_host ?? false,
      mute_upon_entry: settings.mute_upon_entry ?? true,
      waiting_room: true, // Always enable waiting room - registered users bypass it
      auto_recording: settings.auto_recording ?? 'none',
      meeting_authentication: false,
      // Registration settings - registered users bypass waiting room
      ...(enableRegistration && {
        approval_type: 0, // Auto-approve registrants
        registration_type: 1, // Register once, attend any occurrence
      }),
    },
  }

  return zoomFetch<ZoomApiMeeting>('/users/me/meetings', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/**
 * Get a Zoom meeting by ID
 */
export async function getZoomMeeting(meetingId: string): Promise<ZoomApiMeeting> {
  return zoomFetch<ZoomApiMeeting>(`/meetings/${meetingId}`)
}

/**
 * Update a Zoom meeting
 */
export async function updateZoomMeeting(meetingId: string, params: {
  topic?: string
  agenda?: string
  startTime?: string
  duration?: number
  timezone?: string
  settings?: Partial<ZoomMeetingSettings>
}): Promise<void> {
  const body: Record<string, unknown> = {}

  if (params.topic) body.topic = params.topic
  if (params.agenda) body.agenda = params.agenda
  if (params.startTime) body.start_time = params.startTime
  if (params.duration) body.duration = params.duration
  if (params.timezone) body.timezone = params.timezone
  if (params.settings) {
    body.settings = {
      host_video: params.settings.host_video,
      participant_video: params.settings.participant_video,
      join_before_host: params.settings.join_before_host,
      mute_upon_entry: params.settings.mute_upon_entry,
      waiting_room: params.settings.waiting_room,
      auto_recording: params.settings.auto_recording,
    }
  }

  await zoomFetch(`/meetings/${meetingId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

/**
 * Delete a Zoom meeting
 */
export async function deleteZoomMeeting(meetingId: string): Promise<void> {
  await zoomFetch(`/meetings/${meetingId}`, {
    method: 'DELETE',
  })
}

/**
 * Get meeting participants (for past meetings)
 */
export async function getMeetingParticipants(meetingId: string): Promise<ZoomApiParticipant[]> {
  const response = await zoomFetch<{ participants: ZoomApiParticipant[] }>(
    `/past_meetings/${meetingId}/participants`
  )
  return response.participants || []
}

/**
 * Get meeting report (for past meetings)
 */
export async function getMeetingReport(meetingId: string): Promise<{
  uuid: string
  id: number
  topic: string
  start_time: string
  end_time: string
  duration: number
  total_minutes: number
  participants_count: number
}> {
  return zoomFetch(`/report/meetings/${meetingId}`)
}

/**
 * Generate SDK signature for client-side meeting join
 */
export function generateSdkSignature(params: {
  meetingNumber: string
  role: 0 | 1 // 0 = participant, 1 = host
}): string {
  const crypto = require('crypto')
  
  const sdkKey = process.env.ZOOM_SDK_KEY
  const sdkSecret = process.env.ZOOM_SDK_SECRET

  if (!sdkKey || !sdkSecret) {
    throw new Error('Missing Zoom SDK credentials. Set ZOOM_SDK_KEY, ZOOM_SDK_SECRET')
  }

  const timestamp = Date.now() - 30000
  const msg = Buffer.from(`${sdkKey}${params.meetingNumber}${timestamp}${params.role}`).toString('base64')
  const hash = crypto.createHmac('sha256', sdkSecret).update(msg).digest('base64')
  const signature = Buffer.from(`${sdkKey}.${params.meetingNumber}.${timestamp}.${params.role}.${hash}`).toString('base64')

  return signature
}

/**
 * Check if Zoom is configured
 */
export function isZoomConfigured(): boolean {
  return !!(
    process.env.ZOOM_ACCOUNT_ID &&
    process.env.ZOOM_CLIENT_ID &&
    process.env.ZOOM_CLIENT_SECRET
  )
}

/**
 * Check if Zoom SDK is configured (for embedded meetings)
 */
export function isZoomSdkConfigured(): boolean {
  return !!(
    process.env.ZOOM_SDK_KEY &&
    process.env.ZOOM_SDK_SECRET
  )
}

/**
 * Add a registrant to a meeting
 * Returns the registrant's unique join URL
 */
export async function addMeetingRegistrant(meetingId: string, params: {
  email: string
  firstName: string
  lastName?: string
}): Promise<ZoomRegistrantResponse> {
  const { email, firstName, lastName = '' } = params

  return zoomFetch<ZoomRegistrantResponse>(`/meetings/${meetingId}/registrants`, {
    method: 'POST',
    body: JSON.stringify({
      email,
      first_name: firstName,
      last_name: lastName,
    }),
  })
}

/**
 * Add multiple registrants to a meeting (batch)
 * Returns array of results with join URLs
 */
export async function addMeetingRegistrantsBatch(meetingId: string, registrants: Array<{
  email: string
  firstName: string
  lastName?: string
}>): Promise<ZoomRegistrantResponse[]> {
  // Zoom doesn't have a batch endpoint, so we process in parallel with rate limiting
  const results: ZoomRegistrantResponse[] = []
  const batchSize = 10 // Process 10 at a time to avoid rate limits
  
  for (let i = 0; i < registrants.length; i += batchSize) {
    const batch = registrants.slice(i, i + batchSize)
    const batchResults = await Promise.all(
      batch.map(r => 
        addMeetingRegistrant(meetingId, r).catch(err => {
          console.error(`Failed to register ${r.email}:`, err.message)
          return null
        })
      )
    )
    results.push(...batchResults.filter((r): r is ZoomRegistrantResponse => r !== null))
    
    // Small delay between batches to respect rate limits
    if (i + batchSize < registrants.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  return results
}

/**
 * Get list of registrants for a meeting
 */
export async function getMeetingRegistrants(meetingId: string): Promise<{
  registrants: Array<{
    id: string
    email: string
    first_name: string
    last_name: string
    status: 'approved' | 'pending' | 'denied'
    join_url: string
  }>
}> {
  return zoomFetch(`/meetings/${meetingId}/registrants`)
}

/**
 * Delete a registrant from a meeting
 */
export async function deleteMeetingRegistrant(meetingId: string, registrantId: string): Promise<void> {
  await zoomFetch(`/meetings/${meetingId}/registrants/${registrantId}`, {
    method: 'DELETE',
  })
}
