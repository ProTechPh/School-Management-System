import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { consumeStream, convertToModelMessages, streamText, type UIMessage } from "ai"
import { createClient } from "@/lib/supabase/server"

export const maxDuration = 30

const provider = createOpenAICompatible({
  baseURL: process.env.OPENAI_BASE_URL || "http://localhost:8045/v1",
  name: "local-llm",
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY || ""}`,
  },
})

export async function POST(req: Request) {
  // SECURITY FIX: Verify authentication and fetch user details server-side
  // instead of trusting client-provided context
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }

  // Fetch user role and name from database
  const { data: userData } = await supabase
    .from("users")
    .select("name, role")
    .eq("id", user.id)
    .single()

  const safeContext = `User: ${userData?.name || "Unknown"}, Role: ${userData?.role || "student"}`

  const { messages }: { messages: UIMessage[] } = await req.json()

  const systemPrompt = `You are Mira AI, an AI assistant for a School Management System called LessonGo. 
You help students, teachers, and administrators with:
- Answering questions about school policies and procedures
- Helping with academic subjects and homework
- Providing study tips and learning strategies
- Explaining concepts across various subjects
- Assisting with scheduling and organization
- Answering general educational questions

Current user context: ${safeContext}

Be friendly, helpful, and educational. Keep responses concise but informative.
If asked about specific student records or grades, remind users that you can only provide general guidance and they should check the actual system for specific data.`

  const prompt = convertToModelMessages(messages)

  const result = streamText({
    model: provider.chatModel("auto"),
    system: systemPrompt,
    messages: prompt,
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    consumeSseStream: consumeStream,
  })
}