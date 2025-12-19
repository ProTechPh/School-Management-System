"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { ChatPage } from "@/components/chat-page"

export default function StudentChatPage() {
  return (
    <div className="min-h-screen">
      <DashboardHeader title="Messages" subtitle="Communicate with your teachers" />
      <ChatPage 
        searchPlaceholder="Search teachers..." 
        searchRoleFilter={["teacher"]} 
      />
    </div>
  )
}
