"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Search, Loader2, X, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useDebouncedCallback } from "use-debounce"

interface ChatUser {
  id: string
  name: string
  avatar: string | null
  role: string
  lastMessage?: string
  lastMessageAt?: string
  unreadCount?: number
}

interface Message {
  id: string
  sender_id: string
  sender_name: string
  sender_avatar: string | null
  receiver_id: string
  content: string
  created_at: string
}

interface ChatPageProps {
  searchPlaceholder?: string
  searchRoleFilter?: string[] // Only search these roles (e.g., ["teacher"] for students)
}

export function ChatPage({ searchPlaceholder = "Search users to chat...", searchRoleFilter }: ChatPageProps) {
  const [conversations, setConversations] = useState<ChatUser[]>([])
  const [searchResults, setSearchResults] = useState<ChatUser[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar: string | null } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const selectedUserRef = useRef<ChatUser | null>(null)

  // Keep ref in sync with state for use in subscription callback
  useEffect(() => {
    selectedUserRef.current = selectedUser
  }, [selectedUser])

  useEffect(() => {
    fetchData()
  }, [])

  // Setup realtime subscription
  useEffect(() => {
    if (!currentUser) return

    const supabase = createClient()
    
    const channel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `receiver_id=eq.${currentUser.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as any
          
          // Fetch sender info
          const { data: senderData } = await supabase
            .from("users")
            .select("id, name, avatar, role")
            .eq("id", newMsg.sender_id)
            .single()

          if (!senderData) return

          const message: Message = {
            id: newMsg.id,
            sender_id: newMsg.sender_id,
            sender_name: senderData.name,
            sender_avatar: senderData.avatar,
            receiver_id: newMsg.receiver_id,
            content: newMsg.content,
            created_at: newMsg.created_at,
          }

          // Add message to list
          setMessages(prev => [...prev, message])

          // Update or add conversation
          setConversations(prev => {
            const existing = prev.find(c => c.id === senderData.id)
            if (existing) {
              return prev.map(c => 
                c.id === senderData.id 
                  ? { 
                      ...c, 
                      lastMessage: newMsg.content, 
                      lastMessageAt: newMsg.created_at,
                      // Only increment unread if not currently viewing this conversation
                      unreadCount: selectedUserRef.current?.id === senderData.id 
                        ? 0 
                        : (c.unreadCount || 0) + 1
                    }
                  : c
              ).sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime())
            } else {
              return [{
                id: senderData.id,
                name: senderData.name,
                avatar: senderData.avatar,
                role: senderData.role,
                lastMessage: newMsg.content,
                lastMessageAt: newMsg.created_at,
                unreadCount: selectedUserRef.current?.id === senderData.id ? 0 : 1,
              }, ...prev]
            }
          })

          // If currently viewing this conversation, mark as read
          if (selectedUserRef.current?.id === senderData.id) {
            await supabase
              .from("chat_messages")
              .update({ read: true })
              .eq("id", newMsg.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, selectedUser])

  const fetchData = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from("users")
      .select("id, name, avatar")
      .eq("id", user.id)
      .single()
    if (userData) setCurrentUser(userData)

    // Fetch existing conversations
    const { data: msgData } = await supabase
      .from("chat_messages")
      .select(`
        id, sender_id, receiver_id, content, created_at, read,
        sender:users!chat_messages_sender_id_fkey (id, name, avatar, role),
        receiver:users!chat_messages_receiver_id_fkey (id, name, avatar, role)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })

    if (msgData) {
      const convMap = new Map<string, ChatUser>()
      
      msgData.forEach(m => {
        const otherUser = m.sender_id === user.id 
          ? m.receiver as any 
          : m.sender as any
        
        if (!otherUser) return
        
        if (!convMap.has(otherUser.id)) {
          convMap.set(otherUser.id, {
            id: otherUser.id,
            name: otherUser.name,
            avatar: otherUser.avatar,
            role: otherUser.role,
            lastMessage: m.content,
            lastMessageAt: m.created_at,
            unreadCount: 0,
          })
        }
        
        if (m.receiver_id === user.id && !m.read) {
          const conv = convMap.get(otherUser.id)!
          conv.unreadCount = (conv.unreadCount || 0) + 1
        }
      })
      
      setConversations(Array.from(convMap.values()))
      
      setMessages(msgData.map(m => ({
        id: m.id,
        sender_id: m.sender_id,
        sender_name: (m.sender as any)?.name || "Unknown",
        sender_avatar: (m.sender as any)?.avatar,
        receiver_id: m.receiver_id,
        content: m.content,
        created_at: m.created_at,
      })).reverse())
    }

    setLoading(false)
  }

  const searchUsers = useDebouncedCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    const supabase = createClient()
    
    let queryBuilder = supabase
      .from("users")
      .select("id, name, avatar, role")
      .neq("id", currentUser?.id || "")
      .ilike("name", `%${query}%`)
      .limit(10)

    // Apply role filter if specified
    if (searchRoleFilter && searchRoleFilter.length > 0) {
      queryBuilder = queryBuilder.in("role", searchRoleFilter)
    }

    const { data } = await queryBuilder

    if (data) {
      setSearchResults(data.map(u => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        role: u.role,
      })))
    }
    setSearching(false)
  }, 300)

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (value.trim()) {
      searchUsers(value)
    } else {
      setSearchResults([])
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
  }

  const conversation = selectedUser && currentUser
    ? messages.filter(m => 
        (m.sender_id === currentUser.id && m.receiver_id === selectedUser.id) ||
        (m.sender_id === selectedUser.id && m.receiver_id === currentUser.id)
      )
    : []

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedUser || !currentUser) return

    const content = messageInput.trim()
    setMessageInput("")

    const tempId = `temp-${Date.now()}`
    const newMessage: Message = {
      id: tempId,
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      sender_avatar: currentUser.avatar,
      receiver_id: selectedUser.id,
      content,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, newMessage])

    if (!conversations.find(c => c.id === selectedUser.id)) {
      setConversations(prev => [{
        ...selectedUser,
        lastMessage: content,
        lastMessageAt: new Date().toISOString(),
      }, ...prev])
    } else {
      setConversations(prev => prev.map(c => 
        c.id === selectedUser.id 
          ? { ...c, lastMessage: content, lastMessageAt: new Date().toISOString() }
          : c
      ).sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()))
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        content,
        read: false,
      })
      .select("id")
      .single()

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
      console.error("Failed to send message:", error.message)
    } else if (data) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...newMessage, id: data.id } : m))
    }
  }

  const handleSelectUser = async (user: ChatUser) => {
    setSelectedUser(user)
    clearSearch()
    
    if (currentUser && user.unreadCount) {
      const supabase = createClient()
      await supabase
        .from("chat_messages")
        .update({ read: true })
        .eq("sender_id", user.id)
        .eq("receiver_id", currentUser.id)
        .eq("read", false)
      
      setConversations(prev => prev.map(c => 
        c.id === user.id ? { ...c, unreadCount: 0 } : c
      ))
    }
  }

  const displayList = searchQuery.trim() ? searchResults : conversations

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="grid h-[calc(100vh-8rem)] lg:h-[600px] grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className={cn("flex flex-col", selectedUser ? "hidden lg:flex" : "")}>
          <CardHeader className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder={searchPlaceholder}
                value={searchQuery} 
                onChange={(e) => handleSearchChange(e.target.value)} 
                className="pl-9 pr-9" 
              />
              {searchQuery && (
                <button 
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {searchQuery && (
              <p className="text-xs text-muted-foreground mt-2">
                {searching ? "Searching..." : `${searchResults.length} results`}
              </p>
            )}
          </CardHeader>
          <ScrollArea className="flex-1">
            <CardContent className="p-2">
              {displayList.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {searchQuery ? "No users found" : "No conversations yet. Search for users to start chatting."}
                </p>
              ) : (
                displayList.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-accent",
                      selectedUser?.id === user.id && "bg-accent"
                    )}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{user.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="truncate font-medium">{user.name}</p>
                        {user.unreadCount ? (
                          <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                            {user.unreadCount}
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {user.lastMessage || (user.role === "student" ? "Student" : user.role === "admin" ? "Administrator" : "Teacher")}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </ScrollArea>
        </Card>

        <Card className={cn("lg:col-span-2 flex flex-col", !selectedUser ? "hidden lg:flex" : "")}>
          {selectedUser ? (
            <>
              <CardHeader className="border-b border-border p-4">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="lg:hidden shrink-0" 
                    onClick={() => setSelectedUser(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedUser.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{selectedUser.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{selectedUser.name}</CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">{selectedUser.role}</p>
                  </div>
                </div>
              </CardHeader>
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {conversation.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      No messages yet. Start the conversation!
                    </p>
                  ) : (
                    conversation.map((msg) => (
                      <div key={msg.id} className={cn("flex gap-3", msg.sender_id === currentUser?.id ? "flex-row-reverse" : "flex-row")}>
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={msg.sender_avatar || "/placeholder.svg"} />
                          <AvatarFallback>{msg.sender_name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "max-w-[70%] rounded-lg px-3 py-2",
                          msg.sender_id === currentUser?.id ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          <p className="text-sm">{msg.content}</p>
                          <p className={cn(
                            "mt-1 text-xs",
                            msg.sender_id === currentUser?.id ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {format(new Date(msg.created_at), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              <div className="border-t border-border p-4">
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage() }} className="flex gap-2">
                  <Input value={messageInput} onChange={(e) => setMessageInput(e.target.value)} placeholder="Type a message..." className="flex-1" />
                  <Button type="submit" disabled={!messageInput.trim()}><Send className="h-4 w-4" /></Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a conversation or search for users
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
