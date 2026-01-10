import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

/**
 * Zoom Webhook Handler
 * 
 * Handles events from Zoom:
 * - meeting.started
 * - meeting.ended
 * - meeting.participant_joined
 * - meeting.participant_left
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const webhookSecret = process.env.ZOOM_WEBHOOK_SECRET
  
  let event: { event: string; payload?: { plainToken?: string; object?: { id?: string | number; participant?: { user_id?: string; user_name?: string; email?: string; join_time?: string; leave_time?: string } } } }
  
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Handle URL validation challenge FIRST (before signature check)
  if (event.event === "endpoint.url_validation") {
    const plainToken = event.payload?.plainToken
    if (!plainToken) {
      return NextResponse.json({ error: "Missing plainToken" }, { status: 400 })
    }
    
    const hashForValidation = crypto
      .createHmac("sha256", webhookSecret || "")
      .update(plainToken)
      .digest("hex")

    return NextResponse.json({
      plainToken: plainToken,
      encryptedToken: hashForValidation,
    })
  }

  // Log incoming webhook for debugging
  console.log("Zoom webhook received:", {
    event: event.event,
    meetingId: event.payload?.object?.id,
    participant: event.payload?.object?.participant,
  })

  // Verify webhook signature for all other events
  const signature = request.headers.get("x-zm-signature")
  const timestamp = request.headers.get("x-zm-request-timestamp")
  
  if (webhookSecret && signature && timestamp) {
    const message = `v0:${timestamp}:${body}`
    const expectedSignature = `v0=${crypto
      .createHmac("sha256", webhookSecret)
      .update(message)
      .digest("hex")}`

    if (signature !== expectedSignature) {
      console.error("Invalid webhook signature", { signature, expectedSignature })
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
  }

  const supabase = await createClient()
  const meetingId = event.payload?.object?.id?.toString()

  console.log("Looking for meeting with zoom_meeting_id:", meetingId)

  if (!meetingId) {
    console.log("No meeting ID in webhook payload")
    return NextResponse.json({ received: true })
  }

  // Find meeting in our database
  const { data: meeting, error: meetingError } = await supabase
    .from("zoom_meetings")
    .select("id")
    .eq("zoom_meeting_id", meetingId)
    .single()

  console.log("Meeting lookup result:", { meeting, error: meetingError })

  if (!meeting) {
    console.log(`Meeting ${meetingId} not found in database`)
    return NextResponse.json({ received: true })
  }

  try {
    switch (event.event) {
      case "meeting.started":
        await supabase
          .from("zoom_meetings")
          .update({ status: "started", updated_at: new Date().toISOString() })
          .eq("id", meeting.id)
        break

      case "meeting.ended":
        await supabase
          .from("zoom_meetings")
          .update({ status: "ended", updated_at: new Date().toISOString() })
          .eq("id", meeting.id)
        break

      case "meeting.participant_joined":
        const joinedParticipant = event.payload?.object?.participant
        if (joinedParticipant) {
          // Try to match with existing user by email
          const { data: existingUser } = await supabase
            .from("users")
            .select("id, role")
            .eq("email", joinedParticipant.email)
            .single()

          await supabase.from("zoom_participants").upsert({
            meeting_id: meeting.id,
            user_id: existingUser?.id,
            zoom_participant_id: joinedParticipant.user_id,
            name: joinedParticipant.user_name,
            email: joinedParticipant.email,
            join_time: joinedParticipant.join_time,
            status: "joined",
          }, {
            onConflict: "meeting_id,user_id",
          })

          // Auto-mark attendance for students if meeting is linked to a class
          if (existingUser?.id && existingUser.role === "student") {
            const { data: meetingData } = await supabase
              .from("zoom_meetings")
              .select("class_id, start_time")
              .eq("id", meeting.id)
              .single()

            if (meetingData?.class_id) {
              // Check if student is enrolled in this class
              const { data: enrollment } = await supabase
                .from("class_students")
                .select("id")
                .eq("class_id", meetingData.class_id)
                .eq("student_id", existingUser.id)
                .single()

              if (enrollment) {
                const meetingDate = new Date(meetingData.start_time).toISOString().split("T")[0]
                
                // Create or update attendance record
                await supabase.from("attendance_records").upsert({
                  student_id: existingUser.id,
                  class_id: meetingData.class_id,
                  date: meetingDate,
                  status: "present",
                }, {
                  onConflict: "student_id,class_id,date",
                  ignoreDuplicates: false,
                })
              }
            }
          }
        }
        break

      case "meeting.participant_left":
        const leftParticipant = event.payload?.object?.participant
        if (leftParticipant) {
          const { data: existingUser } = await supabase
            .from("users")
            .select("id")
            .eq("email", leftParticipant.email)
            .single()

          if (existingUser) {
            const { data: participantRecord } = await supabase
              .from("zoom_participants")
              .select("join_time")
              .eq("meeting_id", meeting.id)
              .eq("user_id", existingUser.id)
              .single()

            let duration = 0
            if (participantRecord?.join_time && leftParticipant.leave_time) {
              duration = Math.floor(
                (new Date(leftParticipant.leave_time).getTime() - 
                 new Date(participantRecord.join_time).getTime()) / 1000
              )
            }

            await supabase
              .from("zoom_participants")
              .update({
                leave_time: leftParticipant.leave_time,
                duration,
                status: "left",
              })
              .eq("meeting_id", meeting.id)
              .eq("user_id", existingUser.id)
          }
        }
        break
    }
  } catch (error) {
    console.error("Error processing webhook:", error)
  }

  return NextResponse.json({ received: true })
}
