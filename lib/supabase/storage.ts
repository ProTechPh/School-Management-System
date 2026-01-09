import { createClient } from "./client"

export const AVATAR_BUCKET = "avatars"
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
export const AVATAR_DIMENSIONS = { width: 256, height: 256 }

// For lesson materials, we assume a 'materials' bucket exists and is PRIVATE
export const MATERIALS_BUCKET = "materials" 

export async function ensureAvatarBucketExists(): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    if (listError) return { success: false, error: listError.message }
    
    const bucketExists = buckets?.some(bucket => bucket.name === AVATAR_BUCKET)
    
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(AVATAR_BUCKET, {
        public: true,
        fileSizeLimit: MAX_AVATAR_SIZE,
        allowedMimeTypes: ALLOWED_IMAGE_TYPES,
      })
      if (createError) return { success: false, error: createError.message }
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: "Please upload a valid image (JPEG, PNG, GIF, WEBP)" }
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return { valid: false, error: "Image must be less than 5MB" }
  }
  return { valid: true }
}

export function generateAvatarPath(userId: string, fileExtension: string): string {
  // Use a random UUID or timestamp to prevent predictable filenames
  const uniqueId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
  return `${userId}/${uniqueId}.${fileExtension}`
}

export async function uploadAvatar(
  userId: string, 
  file: File
): Promise<{ url: string | null; error?: string }> {
  const supabase = createClient()
  
  // 1. Strict Client-Side Validation
  const validation = validateImageFile(file)
  if (!validation.valid) return { url: null, error: validation.error }
  
  // 2. Enforce File Extension based on MIME Type (Trust MIME type over extension)
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
  }
  
  const fileExt = mimeToExt[file.type]
  if (!fileExt) {
    return { url: null, error: "Unsupported file type" }
  }

  const filePath = generateAvatarPath(userId, fileExt)
  
  // 3. Upload with Explicit Content-Type
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, { 
      upsert: true, 
      contentType: file.type // Explicitly set content type to prevent sniffing
    })
  
  if (uploadError) return { url: null, error: "Failed to upload image." }
  
  const { data: { publicUrl } } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(filePath)
  
  return { url: publicUrl }
}

export async function deleteAvatar(filePath: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([filePath])
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// Function to generate a signed URL for private materials
export async function getSignedMaterialUrl(path: string): Promise<string | null> {
  const supabase = createClient()
  // SECURITY FIX: Reduced expiry from 3600s to 300s (5 minutes)
  const { data, error } = await supabase.storage
    .from(MATERIALS_BUCKET)
    .createSignedUrl(path, 300) 

  if (error) {
    console.error("Error creating signed URL:", error)
    return null
  }
  return data.signedUrl
}