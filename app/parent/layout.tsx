"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Loader2 } from "lucide-react"

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; name: string; avatar?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // For demo purposes, we'll use mock parent data
    // In production, this would check auth like other layouts
    const mockParent = {
      id: "p1",
      name: "Parent One",
      avatar: undefined,
    }
    
    setUser(mockParent)
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar role="parent" userName={user?.name || "Parent"} userAvatar={user?.avatar} />
      <div className="pt-14 lg:pt-0 lg:pl-64">
        <main>{children}</main>
      </div>
    </div>
  )
}
