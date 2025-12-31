import { z } from "zod"
import { NextRequest, NextResponse } from "next/server"

/**
 * Validates that the request originated from the same domain.
 * This adds a layer of CSRF protection for API routes.
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")
  
  // If no origin/referer (e.g. server-to-server or curl), we might block or allow based on policy.
  // For browser-based CSRF protection, these headers are usually present on POST/PUT/DELETE.
  if (!origin && !referer) return true // Allow non-browser requests (optional, adjust based on strictness)

  const host = request.headers.get("host") // e.g. localhost:3000
  
  if (origin) {
    const originUrl = new URL(origin)
    return originUrl.host === host
  }

  if (referer) {
    const refererUrl = new URL(referer)
    return refererUrl.host === host
  }

  return false
}

/**
 * Zod schema for user profile updates.
 * Prevents extremely long strings and impersonation attempts.
 */
export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(50).regex(/^[a-zA-Z0-9\s\.\-]+$/, "Name contains invalid characters").refine(val => !val.toLowerCase().includes("admin"), "Invalid name").optional(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  // Add other fields as necessary, keeping them strict
  contact_number: z.string().max(20).optional().nullable(),
  current_house_street: z.string().max(100).optional().nullable(),
  // ... allow other specific fields broadly but with length limits
}).passthrough() // Allow other fields to pass through for specific role logic, but validate common ones