import 'server-only'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { hashIpAddress } from './security'

// Admin client for session management (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

/**
 * Session security configuration
 */
export const SESSION_CONFIG = {
  // How much fingerprint can change before flagging (0-1, 1 = must match exactly)
  FINGERPRINT_STRICTNESS: 0.8,
  // Allow IP changes (for mobile users)
  ALLOW_IP_CHANGE: true,
  // Log security events
  LOG_EVENTS: true,
  // Cookie name for session binding
  SESSION_BINDING_COOKIE: 'sb-session-bind',
}

/**
 * Fingerprint data collected from client
 */
export interface ClientFingerprint {
  userAgent: string
  language: string
  timezone: string
  screenResolution: string
  colorDepth: number
  platform: string
  cookiesEnabled: boolean
  doNotTrack: string | null
}

/**
 * Generate a hash from fingerprint data
 */
export function hashFingerprint(fingerprint: ClientFingerprint): string {
  const salt = process.env.FINGERPRINT_SALT || process.env.QR_SECRET || 'fp-salt'
  const data = JSON.stringify({
    ua: fingerprint.userAgent,
    lang: fingerprint.language,
    tz: fingerprint.timezone,
    screen: fingerprint.screenResolution,
    color: fingerprint.colorDepth,
    platform: fingerprint.platform,
  })
  return crypto.createHash('sha256').update(data + salt).digest('hex')
}

/**
 * Generate a unique session binding token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create a new session record when user logs in
 */
export async function createSession(
  userId: string,
  fingerprint: ClientFingerprint,
  ip: string
): Promise<{ sessionToken: string; isNewDevice: boolean } | null> {
  try {
    const fingerprintHash = hashFingerprint(fingerprint)
    const ipHash = hashIpAddress(ip)
    const sessionToken = generateSessionToken()

    // Check if this is a known device
    const { data: existingDevice } = await supabaseAdmin
      .from('user_devices')
      .select('id, login_count, is_trusted')
      .eq('user_id', userId)
      .eq('fingerprint_hash', fingerprintHash)
      .single()

    const isNewDevice = !existingDevice

    // Invalidate all previous sessions for this user (single session enforcement)
    await supabaseAdmin.rpc('invalidate_user_sessions', {
      target_user_id: userId,
      reason: 'new_login'
    })

    // Create new session
    const { error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_token: sessionToken,
        fingerprint_hash: fingerprintHash,
        ip_hash: ipHash,
        user_agent: fingerprint.userAgent,
      })

    if (sessionError) {
      console.error('Failed to create session:', sessionError)
      return null
    }

    // Update or create device record
    if (existingDevice) {
      await supabaseAdmin
        .from('user_devices')
        .update({
          last_seen: new Date().toISOString(),
          login_count: existingDevice.login_count + 1,
          ip_hash: ipHash,
        })
        .eq('id', existingDevice.id)
    } else {
      // Parse user agent for device name
      const deviceName = parseDeviceName(fingerprint.userAgent)
      
      await supabaseAdmin
        .from('user_devices')
        .insert({
          user_id: userId,
          device_name: deviceName,
          fingerprint_hash: fingerprintHash,
          ip_hash: ipHash,
        })

      // Log new device event
      if (SESSION_CONFIG.LOG_EVENTS) {
        await logSecurityEvent(userId, 'new_device', {
          device_name: deviceName,
          user_agent: fingerprint.userAgent,
        }, ipHash, fingerprint.userAgent)
      }
    }

    return { sessionToken, isNewDevice }
  } catch (error) {
    console.error('Session creation error:', error)
    return null
  }
}


/**
 * Validate session against stored fingerprint
 * Returns true if session is valid, false if hijack detected
 */
export async function validateSession(
  sessionToken: string,
  fingerprint: ClientFingerprint,
  ip: string
): Promise<{ valid: boolean; reason?: string; userId?: string }> {
  try {
    const fingerprintHash = hashFingerprint(fingerprint)
    const ipHash = hashIpAddress(ip)

    // Get session from database
    const { data: session, error } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('session_token', sessionToken)
      .eq('is_valid', true)
      .single()

    if (error || !session) {
      return { valid: false, reason: 'session_not_found' }
    }

    // Check fingerprint match
    if (session.fingerprint_hash !== fingerprintHash) {
      // Fingerprint mismatch - potential hijack!
      await invalidateSession(sessionToken, 'fingerprint_mismatch')
      
      // Log security event
      if (SESSION_CONFIG.LOG_EVENTS) {
        await logSecurityEvent(
          session.user_id,
          'session_hijack_attempt',
          {
            original_fingerprint: session.fingerprint_hash.slice(0, 8) + '...',
            attempted_fingerprint: fingerprintHash.slice(0, 8) + '...',
            original_ip: session.ip_hash.slice(0, 8) + '...',
            attempted_ip: ipHash.slice(0, 8) + '...',
          },
          ipHash,
          fingerprint.userAgent
        )
      }

      return { valid: false, reason: 'fingerprint_mismatch', userId: session.user_id }
    }

    // Check IP change (warning only if configured)
    if (!SESSION_CONFIG.ALLOW_IP_CHANGE && session.ip_hash !== ipHash) {
      await invalidateSession(sessionToken, 'ip_change')
      
      if (SESSION_CONFIG.LOG_EVENTS) {
        await logSecurityEvent(
          session.user_id,
          'ip_change_detected',
          { original_ip: session.ip_hash.slice(0, 8) + '...', new_ip: ipHash.slice(0, 8) + '...' },
          ipHash,
          fingerprint.userAgent
        )
      }

      return { valid: false, reason: 'ip_change', userId: session.user_id }
    }

    // Update last active timestamp
    await supabaseAdmin
      .from('user_sessions')
      .update({ last_active: new Date().toISOString() })
      .eq('session_token', sessionToken)

    return { valid: true, userId: session.user_id }
  } catch (error) {
    console.error('Session validation error:', error)
    // Fail closed - if we can't validate, reject
    return { valid: false, reason: 'validation_error' }
  }
}

/**
 * Invalidate a specific session
 */
export async function invalidateSession(
  sessionToken: string,
  reason: string = 'manual_logout'
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('user_sessions')
      .update({ is_valid: false, invalidation_reason: reason })
      .eq('session_token', sessionToken)

    return !error
  } catch (error) {
    console.error('Session invalidation error:', error)
    return false
  }
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateAllUserSessions(
  userId: string,
  reason: string = 'logout_all'
): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin.rpc('invalidate_user_sessions', {
      target_user_id: userId,
      reason: reason
    })

    if (error) {
      console.error('Failed to invalidate sessions:', error)
      return 0
    }

    return data || 0
  } catch (error) {
    console.error('Invalidate all sessions error:', error)
    return 0
  }
}

/**
 * Log a security event
 */
export async function logSecurityEvent(
  userId: string | null,
  eventType: string,
  details: Record<string, any>,
  ipHash: string,
  userAgent: string
): Promise<void> {
  try {
    await supabaseAdmin
      .from('security_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        details,
        ip_hash: ipHash,
        user_agent: userAgent,
      })
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

/**
 * Get active sessions for a user
 */
export async function getUserSessions(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_sessions')
    .select('id, user_agent, created_at, last_active, ip_hash')
    .eq('user_id', userId)
    .eq('is_valid', true)
    .order('last_active', { ascending: false })

  if (error) {
    console.error('Failed to get user sessions:', error)
    return []
  }

  return data || []
}

/**
 * Get devices for a user
 */
export async function getUserDevices(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_devices')
    .select('*')
    .eq('user_id', userId)
    .order('last_seen', { ascending: false })

  if (error) {
    console.error('Failed to get user devices:', error)
    return []
  }

  return data || []
}

/**
 * Parse user agent to get friendly device name
 */
function parseDeviceName(userAgent: string): string {
  // Simple parsing - can be enhanced with a library like ua-parser-js
  let browser = 'Unknown Browser'
  let os = 'Unknown OS'

  // Detect browser
  if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Edg')) browser = 'Edge'
  else if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Opera')) browser = 'Opera'

  // Detect OS
  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS'

  return `${browser} on ${os}`
}

/**
 * Get session token from cookies
 */
export async function getSessionTokenFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get(SESSION_CONFIG.SESSION_BINDING_COOKIE)?.value || null
  } catch {
    return null
  }
}
