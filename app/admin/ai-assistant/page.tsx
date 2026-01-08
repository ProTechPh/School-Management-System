"use client"

import { lazy, Suspense } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Loader2 } from "lucide-react"

// Lazy load AI Chat for better initial bundle size
const AIChat = lazy(() => import("@/components/ai-chat").then(mod => ({ default: mod.AIChat })))

export default function AdminAIAssistantPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        title="AI Assistant"
        subtitle="Get help with school management tasks"
        userId="admin"
      />
      <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
        <AIChat userRole="admin" userName="Administrator" />
      </Suspense>
    </div>
  )
}