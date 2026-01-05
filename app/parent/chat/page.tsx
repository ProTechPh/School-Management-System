"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { ChatPage } from "@/components/chat-page"

export default function ParentChatPage() {
  return (
    <div className="min-h-screen">
      <DashboardHeader
        title="Messages"
        subtitle="Communicate with your child's teachers"
      />
      <ChatPage searchPlaceholder="Search teachers..." searchRoleFilter={["teacher"]} />
    </div>
  )
}
