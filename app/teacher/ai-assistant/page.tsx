"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

// Lazy load AI Chat for better initial bundle size
const AIChat = lazy(() => import("@/components/ai-chat").then(mod => ({ default: mod.AIChat })))

export default function TeacherAIAssistantPage() {
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from("users")
          .select("id, name")
          .eq("id", user.id)
          .single()
        if (data) setCurrentUser(data)
      }
      setLoading(false)
    }
    fetchUser()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        title="AI Assistant"
        subtitle="Get help with lesson planning and teaching"
        userId={currentUser?.id}
      />
      <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
        <AIChat userRole="teacher" userName={currentUser?.name || "Teacher"} />
      </Suspense>
    </div>
  )
}