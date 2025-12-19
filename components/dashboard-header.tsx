"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NotificationCenter } from "@/components/notification-center"

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  userId?: string
}

export function DashboardHeader({ title, subtitle, userId = "" }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 lg:h-16 items-center justify-between border-b border-border bg-background/95 px-4 lg:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="min-w-0 flex-1">
        <h1 className="text-lg lg:text-xl font-semibold text-foreground truncate">{title}</h1>
        {subtitle && <p className="text-xs lg:text-sm text-muted-foreground truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 lg:gap-4 ml-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="w-48 lg:w-64 bg-muted pl-9" />
        </div>
        {userId && <NotificationCenter userId={userId} />}
      </div>
    </header>
  )
}
