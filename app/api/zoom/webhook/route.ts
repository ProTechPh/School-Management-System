import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import crypto from "crypto"

// Minimum duration in seconds to count as "present" (15 minutes)
const MIN_ATTENDANCE_DURATION = 15 * 60

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

  const supabase = createAdminClient()
  const meetingId = event.payload?.object?.id?.toString()

  if (!meetingId) {
    return NextResponse.json({ received: true })
  }

  // Find meeting in our database
  const { data: meeting } = await supabase
    .from("zoom_meetings")
    .select("id, class_id, start_time")
    .eq("zoom_meeting_id", meetingId)
    .single()

  if (!meeting) {
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
        
        // Process final attendance when meeting ends
        if (meeting.class_id) {
          await processFinalAttendance(supabase, meeting.id, meeting.class_id, meeting.start_time)
        }
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
        }
        break

      case "meeting.participant_left":
        const leftParticipant = event.payload?.object?.participant
        if (leftParticipant) {
          const { data: existingUser } = await supabase
            .from("users")
            .select("id, role")
            .eq("email", leftParticipant.email)
            .single()

          if (existingUser) {
            const { data: participantRecord } = await supabase
              .from("zoom_participants")
              .select("join_time, duration")
              .eq("meeting_id", meeting.id)
              .eq("user_id", existingUser.id)
              .single()

            let sessionDuration = 0
            if (participantRecord?.join_time && leftParticipant.leave_time) {
              sessionDuration = Math.floor(
                (new Date(leftParticipant.leave_time).getTime() - 
                 new Date(participantRecord.join_time).getTime()) / 1000
              )
            }

            // Accumulate duration (in case of multiple join/leave)
            const totalDuration = (participantRecord?.duration || 0) + sessionDuration

            await supabase
              .from("zoom_participants")
              .update({
                leave_time: leftParticipant.leave_time,
                duration: totalDuration,
                status: "left",
              })
              .eq("meeting_id", meeting.id)
              .eq("user_id", existingUser.id)

            // Update attendance based on duration for students
            if (existingUser.role === "student" && meeting.class_id) {
              await updateStudentAttendance(
                supabase, 
                existingUser.id, 
                meeting.class_id, 
                meeting.start_time, 
                totalDuration
              )
            }
          }
        }
        break
    }
  } catch (error) {
    console.error("Error processing webhook:", error)
  }

  return NextResponse.json({ received: true })
}


/**
 * Update student attendance based on meeting duration
 * Only marks "present" if duration >= 15 minutes
 */
async function updateStudentAttendance(
  supabase: ReturnType<typeof createAdminClient>,
  studentId: string,
  classId: string,
  meetingStartTime: string,
  durationSeconds: number
) {
  // Check if student is enrolled in this class
  const { data: enrollment } = await supabase
    .from("class_students")
    .select("id")
    .eq("class_id", classId)
    .eq("student_id", studentId)
    .single()

  if (!enrollment) return

  const meetingDate = new Date(meetingStartTime).toISOString().split("T")[0]
  const status = durationSeconds >= MIN_ATTENDANCE_DURATION ? "present" : "partial"

  await supabase.from("attendance_records").upsert({
    student_id: studentId,
    class_id: classId,
    date: meetingDate,
    status,
  }, {
    onConflict: "student_id,class_id,date",
    ignoreDuplicates: false,
  })
}

/**
 * Process final attendance when meeting ends
 * - Updates attendance for students who stayed 15+ mins
 * - Marks enrolled students who didn't join as "absent"
 */
async function processFinalAttendance(
  supabase: ReturnType<typeof createAdminClient>,
  meetingId: string,
  classId: string,
  meetingStartTime: string
) {
  const meetingDate = new Date(meetingStartTime).toISOString().split("T")[0]

  // Get all enrolled students in this class
  const { data: enrolledStudents } = await supabase
    .from("class_students")
    .select("student_id")
    .eq("class_id", classId)

  if (!enrolledStudents || enrolledStudents.length === 0) return

  // Get all participants who joined this meeting
  const { data: participants } = await supabase
    .from("zoom_participants")
    .select("user_id, duration")
    .eq("meeting_id", meetingId)
    .not("user_id", "is", null)

  const participantMap = new Map(
    participants?.map(p => [p.user_id, p.duration || 0]) || []
  )

  // Process each enrolled student
  for (const enrollment of enrolledStudents) {
    const studentId = enrollment.student_id
    const duration = participantMap.get(studentId) || 0

    let status: string
    if (duration >= MIN_ATTENDANCE_DURATION) {
      status = "present"
    } else if (duration > 0) {
      status = "partial" // Joined but didn't stay long enough
    } else {
      status = "absent" // Never joined
    }

    await supabase.from("attendance_records").upsert({
      student_id: studentId,
      class_id: classId,
      date: meetingDate,
      status,
    }, {
      onConflict: "student_id,class_id,date",
      ignoreDuplicates: false,
    })
  }
}
