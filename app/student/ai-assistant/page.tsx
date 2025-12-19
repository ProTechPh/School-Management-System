"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { AIChat } from "@/components/ai-chat"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export default function StudentAIAssistantPage() {
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
        description="Get help with your studies and homework"
        role="student"
        userId={currentUser?.id}
      />
      <AIChat userRole="student" userName={currentUser?.name || "Student"} />
    </div>
  )
}
