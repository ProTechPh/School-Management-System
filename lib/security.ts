import 'server-only'
import { z } from "zod"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

/**
 * Hash an IP address for privacy-preserving storage
 * Uses SHA-256 with a salt to prevent rainbow table attacks
 * while still allowing abuse detection via hash comparison
 */
export function hashIpAddress(ip: string): string {
  const salt = process.env.IP_HASH_SALT || process.env.QR_SECRET || 'default-ip-salt'
  return crypto.createHash('sha256').update(ip + salt).digest('hex').slice(0, 32)
}

/**
 * Validates that the request originated from the same domain.
 * This adds a layer of CSRF protection for API routes.
 */
export function validateOrigin(request: NextRequest | Request): boolean {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")
  
  // STRICT MODE: Block requests with missing headers for state-changing methods.
  if (!origin && !referer) return false 

  // FIX: Compare against strict environment variable if available
  const allowedUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
  
  if (allowedUrl) {
    try {
      const allowedHost = new URL(allowedUrl).host
      
      if (origin) {
        return new URL(origin).host === allowedHost
      }
      if (referer) {
        return new URL(referer).host === allowedHost
      }
    } catch {
      return false
    }
  }

  // Fallback to Host header check (less secure but necessary for dynamic deployments/previews without fixed ENV)
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
 */
export function getClientIp(request: NextRequest | Request): string {
  // 1. Prefer the platform-provided IP (Available in Next.js/Vercel)
  // This is the most secure method as it is set by the edge infrastructure
  if ((request as any).ip) return (request as any).ip

  // 2. FIX: Do not blindly trust x-forwarded-for or x-real-ip unless explicitly configured
  // In a Vercel environment, 'x-vercel-forwarded-for' is trustworthy if present
  const vercelIp = request.headers.get("x-vercel-forwarded-for")
  if (vercelIp) return vercelIp

  // 3. Fallback for local development or simple proxies
  // If we are strictly preventing spoofing, we should default to a safe placeholder or 
  // only read headers if we trust the upstream proxy. 
  // For this implementation, we return the last IP in x-forwarded-for if strictly needed,
  // but for critical security checks, relying on the platform IP is best.
  
  if (process.env.NODE_ENV === 'development') {
     return "127.0.0.1"
  }

  // In production without specific platform headers, we treat the request as potentially untrusted
  // or rely on the first hop.
  return "0.0.0.0" 
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