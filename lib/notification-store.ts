"use client"

import { create } from "zustand"
import { createClient } from "@/lib/supabase/client"

type UserRole = "admin" | "teacher" | "student"

interface Notification {
  id: string
  user_id: string | null
  title: string
  message: string
  type: "info" | "success" | "warning" | "assignment" | "grade" | "attendance" | "quiz" | "lesson" | "announcement"
  read: boolean
  link: string | null
  created_at: string
}

// Legacy interface for compatibility
interface LegacyNotification {
  id: string
  userId: string
  userRole: UserRole
  title: string
  message: string
  type: "info" | "success" | "warning" | "assignment" | "grade" | "attendance" | "quiz" | "lesson" | "announcement"
  read: boolean
  link?: string
  createdAt: string
}

interface NotificationStore {
  notifications: Notification[]
  loading: boolean
  initialized: boolean
  fetchNotifications: (userId: string) => Promise<void>
  addNotification: (notification: { userId: string; userRole: UserRole; title: string; message: string; type: string; read: boolean; link?: string }) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: (userId: string) => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  getUnreadCount: () => number
  getUserNotifications: () => LegacyNotification[]
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  loading: false,
  initialized: false,

  fetchNotifications: async (userId: string) => {
    if (get().initialized) return
    set({ loading: true })
    
    const supabase = createClient()
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    
    if (!error && data) {
      set({ notifications: data, initialized: true })
    }
    set({ loading: false })
  },

  addNotification: async (notification) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        link: notification.link || null,
      })
      .select()
      .single()
    
    if (!error && data) {
      set((state) => ({
        notifications: [data, ...state.notifications],
      }))
    }
  },

  markAsRead: async (id: string) => {
    const supabase = createClient()
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id)
    
    set((state) => ({
      notifications: state.notifications.map((n) => 
        n.id === id ? { ...n, read: true } : n
      ),
    }))
  },

  markAllAsRead: async (userId: string) => {
    const supabase = createClient()
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
    
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }))
  },

  deleteNotification: async (id: string) => {
    const supabase = createClient()
    await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
    
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }))
  },

  getUnreadCount: () => {
    const { notifications } = get()
    return notifications.filter((n) => !n.read).length
  },

  getUserNotifications: () => {
    const { notifications } = get()
    // Convert to legacy format for compatibility
    return notifications.map((n) => ({
      id: n.id,
      userId: n.user_id || "",
      userRole: "admin" as UserRole,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      link: n.link || undefined,
      createdAt: n.created_at,
    }))
  },
}))
