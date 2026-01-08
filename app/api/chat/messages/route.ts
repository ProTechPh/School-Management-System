import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/rate-limit"
import { getClientIp } from "@/lib/security"
import { handleApiError, ApiErrors } from "@/lib/api-errors"

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