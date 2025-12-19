"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { ChatPage } from "@/components/chat-page"

export default function AdminChatPage() {
  return (
    <div className="min-h-screen">
      <DashboardHeader title="Messages" subtitle="Communicate with teachers and students" />
      <ChatPage searchPlaceholder="Search users to chat..." />
    </div>
  )
}
