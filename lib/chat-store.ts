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
  // Memoization cache for expensive calculations
  _conversationCache: Map<string, ChatMessage[]>
  _conversationsCache: Map<string, any[]>
  _cacheTimestamp: number
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
  _invalidateCache: () => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  _conversationCache: new Map(),
  _conversationsCache: new Map(),
  _cacheTimestamp: Date.now(),

  _invalidateCache: () => {
    set({
      _conversationCache: new Map(),
      _conversationsCache: new Map(),
      _cacheTimestamp: Date.now(),
    })
  },

  sendMessage: (message) => {
    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(), // Use UUID
      createdAt: new Date().toISOString(),
      read: false,
    }
    set((state) => ({
      messages: [...state.messages, newMessage],
    }))
    get()._invalidateCache()
  },

  markAsRead: (messageId) => {
    set((state) => ({
      messages: state.messages.map((m) => (m.id === messageId ? { ...m, read: true } : m)),
    }))
    get()._invalidateCache()
  },

  markConversationAsRead: (userId, otherUserId) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.receiverId === userId && m.senderId === otherUserId ? { ...m, read: true } : m,
      ),
    }))
    get()._invalidateCache()
  },

  getConversation: (userId, otherUserId) => {
    const cacheKey = `${userId}-${otherUserId}`
    const cached = get()._conversationCache.get(cacheKey)
    
    if (cached) {
      return cached
    }

    const { messages } = get()
    const result = messages
      .filter(
        (m) =>
          (m.senderId === userId && m.receiverId === otherUserId) ||
          (m.senderId === otherUserId && m.receiverId === userId),
      )
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    
    // Cache the result
    get()._conversationCache.set(cacheKey, result)
    return result
  },

  getConversations: (userId, userRole) => {
    const cacheKey = `${userId}-${userRole}`
    const cached = get()._conversationsCache.get(cacheKey)
    
    if (cached) {
      return cached
    }

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

    const result = Array.from(conversationMap.values()).sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    )
    
    // Cache the result
    get()._conversationsCache.set(cacheKey, result)
    return result
  },

  getUnreadCount: (userId) => {
    const { messages } = get()
    return messages.filter((m) => m.receiverId === userId && !m.read).length
  },
}))