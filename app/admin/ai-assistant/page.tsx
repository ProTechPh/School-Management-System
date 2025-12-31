"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { AIChat } from "@/components/ai-chat"

export default function AdminAIAssistantPage() {
  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        title="AI Assistant"
        subtitle="Get help with school management tasks"
        userId="admin"
      />
      <AIChat userRole="admin" userName="Administrator" />
    </div>
  )
}