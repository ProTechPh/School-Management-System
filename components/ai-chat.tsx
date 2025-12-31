"use client"

import type React from "react"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, Send, User, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
type UserRole = "admin" | "teacher" | "student"
import ReactMarkdown from "react-markdown"

interface AIChatProps {
  userRole: UserRole
  userName: string
}

export function AIChat({ userRole, userName }: AIChatProps) {
  const [inputValue, setInputValue] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        context: `User: ${userName}, Role: ${userRole}`,
      },
    }),
  })

  const isLoading = status === "in_progress"

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return
    sendMessage({ text: inputValue })
    setInputValue("")
  }

  const suggestedQuestions = [
    "How can I improve my study habits?",
    "Explain the Pythagorean theorem",
    "Tips for managing homework",
    "How does photosynthesis work?",
  ]

  return (
    <Card className="flex h-[calc(100vh-10rem)] lg:h-[600px] flex-col overflow-hidden">
      <CardHeader className="border-b border-border px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
          Mira AI - AI Assistant
          <Sparkles className="h-4 w-4 text-yellow-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-0 overflow-hidden min-h-0">
        <ScrollArea className="flex-1 p-4 min-h-0" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Hello, {userName}!</h3>
                <p className="text-sm text-muted-foreground">
                  I'm Mira AI, your AI learning assistant. How can I help you today?
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-4">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="h-auto whitespace-normal text-left text-xs bg-transparent"
                    onClick={() => {
                      sendMessage({ text: question })
                    }}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex gap-3", message.role === "user" ? "flex-row-reverse" : "flex-row")}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback
                      className={cn(
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground",
                      )}
                    >
                      {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm break-words overflow-hidden",
                      message.role === "user" 
                        ? "bg-primary text-primary-foreground max-w-[80%]" 
                        : "bg-muted max-w-[80%]",
                    )}
                  >
                    {message.parts.map((part, index) => {
                      if (part.type === "text") {
                        if (message.role === "user") {
                          return <span key={index}>{part.text}</span>
                        }
                        // Remove <think>...</think> tags and their content
                        const cleanedText = part.text.replace(/<think>[\s\S]*?<\/think>/g, "").trim()
                        return (
                          <div key={index} className="prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-headings:my-2 prose-headings:font-semibold max-w-none">
                            <ReactMarkdown>{cleanedText}</ReactMarkdown>
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border p-4">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
