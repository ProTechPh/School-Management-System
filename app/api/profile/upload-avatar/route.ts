import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { AVATAR_BUCKET, generateAvatarPath } from "@/lib/supabase/storage"
import { checkRateLimit } from "@/lib/rate-limit"

// Magic numbers for file type validation
const FILE_SIGNATURES: Record<string, string> = {
  "image/jpeg": "ffd8ff",
  "image/png": "89504e47",
  "image/gif": "47494638",
  "image/webp": "52494646"
}

export async function POST(request: Request) {
  try {
    // SECURITY FIX: Rate Limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    // Limit to 5 uploads per 10 minutes
    const isAllowed = await checkRateLimit(ip, "upload-avatar", 5, 10 * 60 * 1000)
    
    if (!isAllowed) {
      return NextResponse.json({ error: "Too many upload attempts. Please wait." }, { status: 429 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("avatar") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // 1. Validate File Size (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size too large (Max 5MB)" }, { status: 400 })
    }

    // 2. Validate File Type via Magic Numbers
    // SECURITY FIX: Only read the first 4 bytes to prevent OOM on large spoofed files
    const headerBlob = file.slice(0, 4)
    const buffer = await headerBlob.arrayBuffer()
    const header = Array.from(new Uint8Array(buffer))
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("")

    let mimeType = file.type
    let isValid = false

    // Check against known signatures
    for (const [type, signature] of Object.entries(FILE_SIGNATURES)) {
      if (header.startsWith(signature)) {
        isValid = true
        mimeType = type // Trust the signature over the provided MIME type
        break
      }
    }

    // Special check for WebP (RIFF header)
    if (!isValid && header.startsWith("52494646")) {
       if (mimeType === "image/webp") isValid = true
    }

    if (!isValid) {
      return NextResponse.json({ error: "Invalid image file format" }, { status: 400 })
    }

    // 3. Generate Safe Filename
    const fileExt = mimeType.split("/")[1]
    const filePath = generateAvatarPath(user.id, fileExt)

    // 4. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, file, {
        upsert: true,
        contentType: mimeType // Force correct content type
      })

    if (uploadError) {
      throw uploadError
    }

    // 5. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath)

    // 6. Update User Profile with new Avatar URL
    const { error: updateError } = await supabase
      .from("users")
      .update({ avatar: publicUrl })
      .eq("id", user.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true, url: publicUrl })

  } catch (error: any) {
    console.error("Avatar upload error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}