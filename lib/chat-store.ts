"use client"

import { create } from "zustand"

export type UserRole = "admin" | "teacher" | "student"

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: UserRole
  senderAvatar: string
  receiverId: string
  receiverName: string
  receiverRole: UserRole
  content: string
  createdAt: string
  read: boolean
}

interface ChatStore {
  messages: ChatMessage[]
  sendMessage: (message: Omit<ChatMessage, "id" | "createdAt" | "read">) => void
  markAsRead: (messageId: string) => void
  markConversationAsRead: (userId: string, otherUserId: string) => void
  getConversation: (userId: string, otherUserId: string) => ChatMessage[]
  getConversations: (
    userId: string,
    userRole: UserRole,
  ) => {
    otherId: string
    otherName: string
    otherRole: UserRole
    otherAvatar: string
    lastMessage: string
    lastMessageAt: string
    unreadCount: number
  }[]
  getUnreadCount: (userId: string) => number
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],

  sendMessage: (message) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    }
    set((state) => ({
      messages: [...state.messages, newMessage],
    }))
  },

  markAsRead: (messageId) => {
    set((state) => ({
      messages: state.messages.map((m) => (m.id === messageId ? { ...m, read: true } : m)),
    }))
  },

  markConversationAsRead: (userId, otherUserId) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.receiverId === userId && m.senderId === otherUserId ? { ...m, read: true } : m,
      ),
    }))
  },

  getConversation: (userId, otherUserId) => {
    const { messages } = get()
    return messages
      .filter(
        (m) =>
          (m.senderId === userId && m.receiverId === otherUserId) ||
          (m.senderId === otherUserId && m.receiverId === userId),
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  },

  getConversations: (userId, userRole) => {
    const { messages } = get()
    const conversationMap = new Map<
      string,
      {
        otherId: string
        otherName: string
        otherRole: UserRole
        otherAvatar: string
        lastMessage: string
        lastMessageAt: string
        unreadCount: number
      }
    >()

    messages.forEach((m) => {
      let otherId: string
      let otherName: string
      let otherRole: UserRole
      let otherAvatar: string

      if (m.senderId === userId) {
        otherId = m.receiverId
        otherName = m.receiverName
        otherRole = m.receiverRole
        otherAvatar = "/placeholder.svg"
      } else if (m.receiverId === userId) {
        otherId = m.senderId
        otherName = m.senderName
        otherRole = m.senderRole
        otherAvatar = m.senderAvatar
      } else {
        return
      }

      const existing = conversationMap.get(otherId)
      const messageTime = new Date(m.createdAt).getTime()
      const existingTime = existing ? new Date(existing.lastMessageAt).getTime() : 0

      if (!existing || messageTime > existingTime) {
        conversationMap.set(otherId, {
          otherId: otherId,
          otherName,
          otherRole,
          otherAvatar,
          lastMessage: m.content,
          lastMessageAt: m.createdAt,
          unreadCount: existing?.unreadCount || 0,
        })
      }

      if (m.receiverId === userId && !m.read) {
        const conv = conversationMap.get(otherId)!
        conv.unreadCount++
      }
    })

    return Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    )
  },

  getUnreadCount: (userId) => {
    const { messages } = get()
    return messages.filter((m) => m.receiverId === userId && !m.read).length
  },
}))
