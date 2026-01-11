import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getUserSessions, getUserDevices, invalidateAllUserSessions, SESSION_CONFIG } from "@/lib/session-security"
import { cookies } from "next/headers"

// GET: Fetch user's active sessions and devices
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [sessions, devices] = await Promise.all([
      getUserSessions(user.id),
      getUserDevices(user.id),
    ])

    // Get current session token to mark it
    const cookieStore = await cookies()
    const currentSessionToken = cookieStore.get(SESSION_CONFIG.SESSION_BINDING_COOKIE)?.value

    // Mark current session
    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      isCurrent: false, // We don't expose the token, so we can't compare directly
    }))

    return NextResponse.json({
      sessions: sessionsWithCurrent,
      devices,
      sessionCount: sessions.length,
      deviceCount: devices.length,
    })
  } catch (error) {
    console.error('Get sessions error:', error)
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
  }
}

// DELETE: Logout from all devices
export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Invalidate all sessions
    const invalidatedCount = await invalidateAllUserSessions(user.id, 'logout_all_devices')

    // Sign out current session
    await supabase.auth.signOut()

    const response = NextResponse.json({ 
      success: true, 
      invalidatedSessions: invalidatedCount 
    })
    
    response.cookies.delete(SESSION_CONFIG.SESSION_BINDING_COOKIE)
    
    return response
  } catch (error) {
    console.error('Logout all error:', error)
    return NextResponse.json({ error: "Failed to logout from all devices" }, { status: 500 })
  }
}
