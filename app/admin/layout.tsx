"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; avatar?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        router.push("/login")
        return
      }

      const { data: userData } = await supabase
        .from("users")
        .select("name, avatar, role")
        .eq("id", authUser.id)
        .single()

      if (!userData || userData.role !== "admin") {
        router.push("/login")
        return
      }

      setUser({ name: userData.name, avatar: userData.avatar })
      setLoading(false)
    }

    checkAuth()
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
      <DashboardSidebar role="admin" userName={user?.name || "Admin"} userAvatar={user?.avatar} />
      <div className="pl-64">
        <main>{children}</main>
      </div>
    </div>
  )
}
