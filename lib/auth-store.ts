import { create } from "zustand"
import { createClient } from "@/lib/supabase/client"
import { clearSessionToken } from "@/lib/fingerprint"
import { setupFingerprintInterceptor } from "@/lib/secure-fetch"
import type { User } from "@supabase/supabase-js"

interface UserProfile {
  id: string
  email: string
  name: string
  role: "admin" | "teacher" | "student"
  avatar?: string
}

interface AuthState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  initialized: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  initialize: () => Promise<void>
  signOut: () => Promise<void>
  cleanup: () => void
}

// OPTIMIZATION: Store subscription reference for cleanup
let authSubscription: { data: { subscription: { unsubscribe: () => void } } } | null = null

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  initialize: async () => {
    if (get().initialized) return

    // OPTIMIZATION: Cleanup existing subscription before creating new one
    if (authSubscription) {
      authSubscription.data.subscription.unsubscribe()
      authSubscription = null
    }

    // Setup fingerprint interceptor for session security
    setupFingerprintInterceptor()

    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()

      set({ user, profile, loading: false, initialized: true })
    } else {
      set({ user: null, profile: null, loading: false, initialized: true })
    }

    // OPTIMIZATION: Store subscription reference for cleanup
    authSubscription = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        set({ user: session.user, profile })
      } else {
        set({ user: null, profile: null })
      }
    })
  },

  signOut: async () => {
    const supabase = createClient()
    
    // Clear session binding token
    clearSessionToken()
    
    // Call logout API to invalidate server-side session
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Continue with client-side logout even if API fails
    }
    
    await supabase.auth.signOut()
    set({ user: null, profile: null })
  },

  // OPTIMIZATION: Cleanup method to prevent memory leaks
  cleanup: () => {
    if (authSubscription) {
      authSubscription.data.subscription.unsubscribe()
      authSubscription = null
    }
  }
}))
