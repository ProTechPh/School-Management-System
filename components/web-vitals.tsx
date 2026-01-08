'use client'

import { useReportWebVitals } from 'next/web-vitals'
import { trackPerformance } from '@/lib/analytics'

/**
 * Web Vitals monitoring component
 * Tracks Core Web Vitals and sends to analytics
 */
export function WebVitals() {
  useReportWebVitals((metric) => {
    // Track all web vitals metrics
    trackPerformance(metric.name, metric.value, {
      id: metric.id,
      rating: metric.rating,
      navigationType: metric.navigationType,
    })

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Web Vitals]', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
      })
    }
  })

  return null
}
