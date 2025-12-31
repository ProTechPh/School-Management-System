"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { ChatPage } from "@/components/chat-page"

export default function TeacherChatPage() {
  return (
    <div className="min-h-screen">
      <DashboardHeader title="Messages" subtitle="Communicate with students and staff" />
      <ChatPage searchPlaceholder="Search users to chat..." />
    </div>
  )
}
