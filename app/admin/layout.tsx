"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { AdminSessionGuard } from "@/components/admin-session-guard"
import { Loader2 } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; avatar?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Use secure API route instead of direct DB query
        const response = await fetch("/api/auth/me")
        
        if (!response.ok) {
          throw new Error("Unauthorized")
        }

        const { user: userData } = await response.json()

        if (!userData || userData.role !== "admin") {
          router.push("/login")
          return
        }

        setUser({ name: userData.name, avatar: userData.avatar })
      } catch (error) {
        router.push("/login")
        return
      } finally {
        setLoading(false)
      }
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
    <AdminSessionGuard>
      <div className="min-h-screen bg-background">
        <DashboardSidebar role="admin" userName={user?.name || "Admin"} userAvatar={user?.avatar} />
        <div className="pt-14 lg:pt-0 lg:pl-64">
          <main>{children}</main>
        </div>
      </div>
    </AdminSessionGuard>
  )
}