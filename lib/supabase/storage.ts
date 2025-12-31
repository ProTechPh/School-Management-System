import { createClient } from "./client"

// Avatar bucket configuration
export const AVATAR_BUCKET = "avatars"
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"]
export const AVATAR_DIMENSIONS = { width: 256, height: 256 }

/**
 * Ensures the avatars storage bucket exists with public access.
 * This should be called during app initialization or setup.
 * 
 * Note: In production, bucket creation is typically done via Supabase dashboard
 * or migrations. This function provides a programmatic fallback.
 */
export async function ensureAvatarBucketExists(): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  
  try {
    // Check if bucket exists by listing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error("Error listing buckets:", listError)
      return { success: false, error: listError.message }
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === AVATAR_BUCKET)
    
    if (!bucketExists) {
      // Create the bucket with public access
      const { error: createError } = await supabase.storage.createBucket(AVATAR_BUCKET, {
        public: true,
        fileSizeLimit: MAX_AVATAR_SIZE,
        allowedMimeTypes: ALLOWED_IMAGE_TYPES,
      })
      
      if (createError) {
        // Bucket might already exist or user doesn't have permission
        console.error("Error creating bucket:", createError)
        return { success: false, error: createError.message }
      }
      
      console.log("Avatar bucket created successfully")
    }
    
    return { success: true }
  } catch (error) {
    console.error("Error ensuring avatar bucket:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Validates that a file is an acceptable image format for avatars.
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: "Please upload a JPG or PNG image" 
    }
  }
  
  // Check file size
  if (file.size > MAX_AVATAR_SIZE) {
    return { 
      valid: false, 
      error: "Image must be less than 5MB" 
    }
  }
  
  return { valid: true }
}

/**
 * Generates a unique file path for avatar uploads.
 */
export function generateAvatarPath(userId: string, fileExtension: string): string {
  const timestamp = Date.now()
  return `${userId}-${timestamp}.${fileExtension}`
}

/**
 * Uploads an avatar image to Supabase storage.
 */
export async function uploadAvatar(
  userId: string, 
  file: File
): Promise<{ url: string | null; error?: string }> {
  const supabase = createClient()
  
  // Validate file
  const validation = validateImageFile(file)
  if (!validation.valid) {
    return { url: null, error: validation.error }
  }
  
  // Generate file path
  const fileExt = file.name.split(".").pop() || "jpg"
  const filePath = generateAvatarPath(userId, fileExt)
  
  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, { 
      upsert: true,
      contentType: file.type 
    })
  
  if (uploadError) {
    console.error("Upload error:", uploadError)
    return { url: null, error: "Failed to upload image. Please try again." }
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(filePath)
  
  return { url: publicUrl }
}

/**
 * Deletes an avatar from storage.
 */
export async function deleteAvatar(filePath: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove([filePath])
  
  if (error) {
    console.error("Delete error:", error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}
