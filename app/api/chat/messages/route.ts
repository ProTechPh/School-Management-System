import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Securely fetch messages where the user is either sender or receiver
    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select(`
        id, sender_id, receiver_id, content, created_at, read,
        sender:users!chat_messages_sender_id_fkey (id, name, avatar, role),
        receiver:users!chat_messages_receiver_id_fkey (id, name, avatar, role)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ messages })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}