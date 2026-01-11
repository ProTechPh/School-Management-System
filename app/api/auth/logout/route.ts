import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { invalidateSession, SESSION_CONFIG } from "@/lib/session-security"
import { cookies } from "next/headers"

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get session token from cookie
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get(SESSION_CONFIG.SESSION_BINDING_COOKIE)?.value

    // Invalidate the session in database
    if (sessionToken) {
      await invalidateSession(sessionToken, 'user_logout')
    }

    // Sign out from Supabase
    await supabase.auth.signOut()

    // Create response and clear session binding cookie
    const response = NextResponse.json({ success: true })
    response.cookies.delete(SESSION_CONFIG.SESSION_BINDING_COOKIE)

    return response
  } catch (error) {
    console.error('Logout error:', error)
    // Still return success - client will clear local state
    const response = NextResponse.json({ success: true })
    response.cookies.delete(SESSION_CONFIG.SESSION_BINDING_COOKIE)
    return response
  }
}
