"use client"

import { useState, useEffect } from "react"
import {
  Bell,
  Check,
  CheckCheck,
  X,
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  Info,
  AlertTriangle,
  FileText,
  MessageCircle,
  Megaphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useNotificationStore } from "@/lib/notification-store"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface NotificationCenterProps {
  userId: string
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: Check,
  warning: AlertTriangle,
  assignment: FileText,
  grade: GraduationCap,
  attendance: ClipboardCheck,
  quiz: BookOpen,
  lesson: FileText,
  announcement: Megaphone,
  chat: MessageCircle,
}

const typeColors: Record<string, string> = {
  info: "text-blue-500",
  success: "text-green-500",
  warning: "text-amber-500",
  assignment: "text-purple-500",
  grade: "text-teal-500",
  attendance: "text-orange-500",
  quiz: "text-indigo-500",
  lesson: "text-cyan-500",
  announcement: "text-pink-500",
  chat: "text-violet-500",
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "Just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  return `${Math.floor(diffInSeconds / 86400)}d ago`
}

export function NotificationCenter({ userId }: NotificationCenterProps) {
  const [open, setOpen] = useState(false)
  const { 
    fetchNotifications, 
    getUserNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    getUnreadCount,
    loading,
    initialized 
  } = useNotificationStore()

  useEffect(() => {
    if (userId && !initialized) {
      fetchNotifications(userId)
    }
  }, [userId, initialized, fetchNotifications])

  const notifications = getUserNotifications()
  const unreadCount = getUnreadCount()

  const handleNotificationClick = (notification: { id: string; read: boolean; link?: string }) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    if (notification.link) {
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h4 className="font-semibold text-foreground">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllAsRead(userId)}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Info
                const content = (
                  <div
                    className={cn(
                      "flex gap-3 p-4 transition-colors hover:bg-muted/50 cursor-pointer",
                      !notification.read && "bg-primary/5",
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={cn("mt-0.5", typeColors[notification.type] || "text-blue-500")}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm",
                            !notification.read ? "font-medium text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {notification.title}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground/60">{formatTimeAgo(notification.createdAt)}</p>
                    </div>
                    {!notification.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />}
                  </div>
                )

                return notification.link ? (
                  <Link key={notification.id} href={notification.link}>
                    {content}
                  </Link>
                ) : (
                  <div key={notification.id}>{content}</div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No notifications</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
