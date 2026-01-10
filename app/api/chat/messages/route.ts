import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp, validateOrigin } from "@/lib/security"
import { handleApiError, ApiErrors } from "@/lib/api-errors"
import { z } from "zod"
import DOMPurify from "isomorphic-dompurify"

// Validation schema for chat messages
const sendMessageSchema = z.object({
  receiverId: z.string().uuid("Invalid receiver ID"),
  content: z.string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message too long"),
})

// DOMPurify configuration - allow basic formatting only
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  // Force all links to open in new tab with noopener
  ADD_ATTR: ['target', 'rel'],
}

/**
 * Sanitize chat message content to prevent XSS while allowing basic formatting
 */
function sanitizeContent(content: string): string {
  // First pass: sanitize HTML
  let sanitized = DOMPurify.sanitize(content, DOMPURIFY_CONFIG)
  
  // Force safe link attributes on any remaining anchor tags
  sanitized = sanitized.replace(
    /<a\s+href="([^"]+)"[^>]*>/gi,
    '<a href="$1" target="_blank" rel="noopener noreferrer">'
  )
  
  // Block javascript: URLs that might have slipped through
  sanitized = sanitized.replace(/href="javascript:[^"]*"/gi, 'href="#"')
  
  return sanitized
}

export async function GET(request: NextRequest) {
  try {
    // SECURITY FIX: Rate limiting to prevent abuse
    const ip = getClientIp(request)
    const isAllowed = await checkRateLimit(ip, "chat-messages", 60, 60 * 1000)
    
    if (!isAllowed) {
      return ApiErrors.rateLimited()
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiErrors.unauthorized()
    }

    // Securely fetch messages where the user is either sender or receiver
    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select(`
        id, sender_id, receiver_id, content, created_at, read,
        sender:users!chat_messages_sender_id_fkey (id, name, avatar, role),
        receiver:users!chat_messages_receiver_id_fkey (id, name, avatar, role)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ messages })
  } catch (error) {
    return handleApiError(error, "chat-messages")
  }
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: CSRF Protection
    if (!validateOrigin(request)) {
      return ApiErrors.invalidOrigin()
    }

    const ip = getClientIp(request)
    const isAllowed = await checkRateLimit(ip, "chat-send", 30, 60 * 1000)
    
    if (!isAllowed) {
      return ApiErrors.rateLimited()
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return ApiErrors.unauthorized()
    }

    const body = await request.json()
    
    // SECURITY: Validate input
    const validationResult = sendMessageSchema.safeParse(body)
    if (!validationResult.success) {
      return ApiErrors.badRequest(validationResult.error.errors[0]?.message || "Invalid input")
    }

    const { receiverId, content } = validationResult.data

    // SECURITY FIX: Sanitize content with DOMPurify to prevent XSS
    const sanitizedContent = sanitizeContent(content)

    // Verify receiver exists
    const { data: receiver } = await supabase
      .from("users")
      .select("id")
      .eq("id", receiverId)
      .single()

    if (!receiver) {
      return ApiErrors.notFound("Recipient")
    }

    const { data: message, error } = await supabase
      .from("chat_messages")
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content: sanitizedContent, // Use sanitized content
        read: false,
      })
      .select("id")
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, messageId: message.id })
  } catch (error) {
    return handleApiError(error, "chat-send")
  }
}