import { z } from "zod"
import { NextRequest, NextResponse } from "next/server"

/**
 * Validates that the request originated from the same domain.
 * This adds a layer of CSRF protection for API routes.
 */
export function validateOrigin(request: NextRequest | Request): boolean {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")
  
  // STRICT MODE: Block requests with missing headers for state-changing methods.
  if (!origin && !referer) return false 

  const host = request.headers.get("host") // e.g. localhost:3000
  
  if (origin) {
    try {
      const originUrl = new URL(origin)
      return originUrl.host === host
    } catch {
      return false
    }
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer)
      return refererUrl.host === host
    } catch {
      return false
    }
  }

  return false
}

/**
 * Securely extracts the client IP address.
 * Prevents spoofing by prioritizing the platform-provided IP (request.ip).
 * When falling back to headers, we treat the input carefully.
 */
export function getClientIp(request: NextRequest | Request): string {
  // 1. Prefer the platform-provided IP (Available in Next.js/Vercel)
  // This is the most secure method as it is set by the edge infrastructure
  if ((request as any).ip) return (request as any).ip

  // 2. Fallback: x-real-ip (Commonly set by trusted reverse proxies)
  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp.trim()

  // 3. Fallback: x-forwarded-for
  // WARNING: If the load balancer *appends* the real IP to the end of a user-supplied header,
  // taking the first element is dangerous (Spoofing).
  // Taking the *last* element is generally safer in "append" scenarios, though relying on headers
  // without knowing the specific proxy topology is always slightly risky.
  const forwardedFor = request.headers.get("x-forwarded-for")
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim())
    // Return the last IP in the chain (usually the one connecting to the load balancer)
    return ips[ips.length - 1]
  }

  return "127.0.0.1"
}

/**
 * Zod schema for user profile updates.
 */
export const profileUpdateSchema = z.object({
  // Base User Fields
  name: z.string().min(2).max(100).regex(/^[a-zA-Z0-9\s\.\-]+$/, "Name contains invalid characters").refine(val => !val.toLowerCase().includes("admin"), "Invalid name").optional(),
  phone: z.string().max(20).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  // Prevent Stored XSS by enforcing valid URL protocol
  avatar: z.string().url().max(500).refine((val) => val.startsWith("http://") || val.startsWith("https://"), {
    message: "Avatar URL must start with http:// or https://"
  }).optional().nullable(),

  // Student Fields
  contact_number: z.string().max(20).optional().nullable(),
  email: z.string().email().max(100).optional().nullable(),
  current_house_street: z.string().max(150).optional().nullable(),
  current_barangay: z.string().max(100).optional().nullable(),
  current_city: z.string().max(100).optional().nullable(),
  current_province: z.string().max(100).optional().nullable(),
  current_region: z.string().max(100).optional().nullable(),
  permanent_same_as_current: z.boolean().optional(),
  permanent_house_street: z.string().max(150).optional().nullable(),
  permanent_barangay: z.string().max(100).optional().nullable(),
  permanent_city: z.string().max(100).optional().nullable(),
  permanent_province: z.string().max(100).optional().nullable(),
  permanent_region: z.string().max(100).optional().nullable(),
  father_contact: z.string().max(20).optional().nullable(),
  mother_contact: z.string().max(20).optional().nullable(),
  guardian_contact: z.string().max(20).optional().nullable(),
  emergency_contact_name: z.string().max(100).optional().nullable(),
  emergency_contact_number: z.string().max(20).optional().nullable(),
  medical_conditions: z.string().max(500).optional().nullable(),
  blood_type: z.string().max(10).optional().nullable(),

  // Teacher Fields
  subject: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
})