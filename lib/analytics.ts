/**
 * Analytics utility for tracking custom events
 * Works with Vercel Analytics and can be extended for other providers
 */

import { track } from '@vercel/analytics'

export type AnalyticsEvent = 
  // Auth events
  | 'login'
  | 'logout'
  | 'register'
  | 'password_change'
  | 'mfa_enroll'
  | 'mfa_verify'
  // Attendance events
  | 'qr_attendance_start'
  | 'qr_attendance_checkin'
  | 'qr_attendance_end'
  | 'manual_attendance_mark'
  // Grade events
  | 'grade_submit'
  | 'grade_update'
  | 'grade_view'
  // Assignment events
  | 'assignment_create'
  | 'assignment_submit'
  | 'assignment_grade'
  // Student/Class management
  | 'student_create'
  | 'student_update'
  | 'class_create'
  | 'class_update'
  | 'enrollment_add'
  // AI Assistant
  | 'ai_chat_message'
  | 'ai_chat_session_start'
  // Dashboard
  | 'dashboard_view'
  | 'report_generate'

interface EventProperties {
  [key: string]: string | number | boolean | null
}

/**
 * Track a custom analytics event
 * @param event - The event name
 * @param properties - Optional event properties
 */
export function trackEvent(event: AnalyticsEvent, properties?: EventProperties) {
  try {
    // Only track in production or if explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true') {
      // Filter out null values for Vercel Analytics
      const cleanProperties = properties 
        ? Object.fromEntries(
            Object.entries(properties).filter(([_, v]) => v !== null && v !== undefined)
          )
        : undefined
      track(event, cleanProperties)
    } else {
      // Log in development for debugging
      console.log('[Analytics]', event, properties)
    }
  } catch (error) {
    // Silently fail - don't break app if analytics fails
    console.error('[Analytics Error]', error)
  }
}

/**
 * Track page view (automatic with Vercel Analytics, but can be used for custom tracking)
 */
export function trackPageView(page: string, properties?: EventProperties) {
  trackEvent('dashboard_view', { page, ...properties })
}

/**
 * Track user action with role context
 */
export function trackUserAction(
  event: AnalyticsEvent,
  userId: string,
  userRole: 'admin' | 'teacher' | 'student' | 'parent',
  properties?: EventProperties
) {
  trackEvent(event, {
    userId,
    userRole,
    ...properties,
  })
}

/**
 * Track performance metric
 */
export function trackPerformance(metric: string, value: number, properties?: EventProperties) {
  trackEvent('dashboard_view', {
    metric,
    value,
    ...properties,
  })
}

/**
 * Track error for monitoring
 */
export function trackError(error: Error, context?: EventProperties) {
  trackEvent('dashboard_view', {
    error: error.message,
    stack: error.stack ? error.stack.substring(0, 500) : null, // Limit stack trace length
    ...context,
  })
}
