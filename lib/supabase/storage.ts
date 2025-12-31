import { createClient } from "./client"

export const AVATAR_BUCKET = "avatars"
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png"]
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
    return { valid: false, error: "Please upload a JPG or PNG image" }
  }
  if (file.size > MAX_AVATAR_SIZE) {
    return { valid: false, error: "Image must be less than 5MB" }
  }
  return { valid: true }
}

export function generateAvatarPath(userId: string, fileExtension: string): string {
  const timestamp = Date.now()
  return `${userId}-${timestamp}.${fileExtension}`
}

export async function uploadAvatar(
  userId: string, 
  file: File
): Promise<{ url: string | null; error?: string }> {
  const supabase = createClient()
  const validation = validateImageFile(file)
  if (!validation.valid) return { url: null, error: validation.error }
  
  const fileExt = file.name.split(".").pop() || "jpg"
  const filePath = generateAvatarPath(userId, fileExt)
  
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, { upsert: true, contentType: file.type })
  
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
  const { data, error } = await supabase.storage
    .from(MATERIALS_BUCKET)
    .createSignedUrl(path, 3600) // Valid for 1 hour

  if (error) {
    console.error("Error creating signed URL:", error)
    return null
  }
  return data.signedUrl
}