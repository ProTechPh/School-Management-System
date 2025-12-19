import { createOpenAICompatible } from "@ai-sdk/openai-compatible"
import { consumeStream, convertToModelMessages, streamText, type UIMessage } from "ai"

export const maxDuration = 30

const provider = createOpenAICompatible({
  baseURL: process.env.OPENAI_BASE_URL || "http://localhost:8045/v1",
  name: "local-llm",
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY || ""}`,
  },
})

export async function POST(req: Request) {
  const { messages, context }: { messages: UIMessage[]; context?: string } = await req.json()

  const systemPrompt = `You are Mira AI, an AI assistant for a School Management System called LessonGo. 
You help students, teachers, and administrators with:
- Answering questions about school policies and procedures
- Helping with academic subjects and homework
- Providing study tips and learning strategies
- Explaining concepts across various subjects
- Assisting with scheduling and organization
- Answering general educational questions

${context ? `Current user context: ${context}` : ""}

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
