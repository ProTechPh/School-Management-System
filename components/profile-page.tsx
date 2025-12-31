"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Camera, Loader2, Save, User, Mail, Phone, MapPin, Building, Calendar, 
  BookOpen, Heart, Users, GraduationCap, ChevronDown, ChevronRight, Shield,
  X, Upload, AlertCircle
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { DbStudentProfile } from "@/lib/supabase/types"
import { 
  validateImageFile, 
  uploadAvatar, 
  AVATAR_DIMENSIONS,
  ALLOWED_IMAGE_TYPES 
} from "@/lib/supabase/storage"

interface ProfilePageProps {
  role: "admin" | "teacher" | "student"
}

/**
 * Resizes an image to the specified dimensions while maintaining aspect ratio.
 * Returns a Promise that resolves to a Blob of the resized image.
 */
async function resizeImage(
  file: File, 
  maxWidth: number, 
  maxHeight: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
      }
      
      canvas.width = width
      canvas.height = height
      
      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }
      
      // Draw and resize
      ctx.drawImage(img, 0, 0, width, height)
      
      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error("Could not create blob"))
          }
        },
        file.type,
        0.9 // Quality for JPEG
      )
    }
    
    img.onerror = () => reject(new Error("Could not load image"))
    img.src = URL.createObjectURL(file)
  })
}

interface UserProfile {
  id: string
  name: string
  email: string
  avatar: string | null
  phone: string | null
  address: string | null
  role: string
  created_at: string
}

interface TeacherProfile {
  subject: string
  department: string | null
  join_date: string | null
}

// Constants for dropdown options
const PHILIPPINE_REGIONS = [
  "NCR", "CAR", "Region I", "Region II", "Region III", "Region IV-A",
  "Region IV-B", "Region V", "Region VI", "Region VII", "Region VIII",
  "Region IX", "Region X", "Region XI", "Region XII", "BARMM", "CARAGA"
]

// Collapsible section component for organizing profile sections
interface CollapsibleSectionProps {
  title: string
  icon?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

function CollapsibleSection({ title, icon, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Card>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <CardContent className="pt-0 border-t">
          {children}
        </CardContent>
      )}
    </Card>
  )
}

// Read-only field display component
interface ReadOnlyFieldProps {
  label: string
  value: string | null | undefined
  className?: string
}

function ReadOnlyField({ label, value, className }: ReadOnlyFieldProps) {
  return (
    <div className={className}>
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  )
}

export function ProfilePage({ role }: ProfilePageProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [studentProfile, setStudentProfile] = useState<DbStudentProfile | null>(null)
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null)
  
  // Photo upload preview state
  const [showPhotoPreview, setShowPhotoPreview] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  
  // Form data for editable fields (students can only edit limited fields)
  const [formData, setFormData] = useState({
    // User fields
    name: "",
    phone: "",
    address: "",
    // Student editable fields
    contact_number: "",
    current_house_street: "",
    current_barangay: "",
    current_city: "",
    current_province: "",
    current_region: "",
    permanent_same_as_current: true,
    permanent_house_street: "",
    permanent_barangay: "",
    permanent_city: "",
    permanent_province: "",
    permanent_region: "",
    father_contact: "",
    mother_contact: "",
    guardian_contact: "",
    emergency_contact_name: "",
    emergency_contact_number: "",
    // Teacher fields
    subject: "",
    department: "",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return

    // Fetch user data
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single()

    if (userData) {
      setUser(userData)
      setFormData(prev => ({
        ...prev,
        name: userData.name || "",
        phone: userData.phone || "",
        address: userData.address || "",
      }))

      // Fetch role-specific profile
      if (role === "student") {
        const { data: profile } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("id", authUser.id)
          .single()
        if (profile) {
          setStudentProfile(profile as DbStudentProfile)
          // Set editable fields for students
          setFormData(prev => ({
            ...prev,
            contact_number: profile.contact_number || "",
            current_house_street: profile.current_house_street || "",
            current_barangay: profile.current_barangay || "",
            current_city: profile.current_city || "",
            current_province: profile.current_province || "",
            current_region: profile.current_region || "",
            permanent_same_as_current: profile.permanent_same_as_current ?? true,
            permanent_house_street: profile.permanent_house_street || "",
            permanent_barangay: profile.permanent_barangay || "",
            permanent_city: profile.permanent_city || "",
            permanent_province: profile.permanent_province || "",
            permanent_region: profile.permanent_region || "",
            father_contact: profile.father_contact || "",
            mother_contact: profile.mother_contact || "",
            guardian_contact: profile.guardian_contact || "",
            emergency_contact_name: profile.emergency_contact_name || "",
            emergency_contact_number: profile.emergency_contact_number || "",
          }))
        }
      } else if (role === "teacher") {
        const { data: profile } = await supabase
          .from("teacher_profiles")
          .select("*")
          .eq("id", authUser.id)
          .single()
        if (profile) {
          setTeacherProfile(profile)
          setFormData(prev => ({
            ...prev,
            subject: profile.subject || "",
            department: profile.department || "",
          }))
        }
      }
    }
    setLoading(false)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)

    const supabase = createClient()

    // Update user table
    const { error: userError } = await supabase
      .from("users")
      .update({
        name: formData.name,
        phone: formData.phone || null,
        address: formData.address || null,
      })
      .eq("id", user.id)

    if (userError) {
      toast.error("Failed to save profile", { description: userError.message })
      setSaving(false)
      return
    }

    // Update role-specific profile
    if (role === "student") {
      // Students can only update limited fields
      const { error } = await supabase
        .from("student_profiles")
        .update({
          contact_number: formData.contact_number || null,
          current_house_street: formData.current_house_street || null,
          current_barangay: formData.current_barangay || null,
          current_city: formData.current_city || null,
          current_province: formData.current_province || null,
          current_region: formData.current_region || null,
          permanent_same_as_current: formData.permanent_same_as_current,
          permanent_house_street: formData.permanent_house_street || null,
          permanent_barangay: formData.permanent_barangay || null,
          permanent_city: formData.permanent_city || null,
          permanent_province: formData.permanent_province || null,
          permanent_region: formData.permanent_region || null,
          father_contact: formData.father_contact || null,
          mother_contact: formData.mother_contact || null,
          guardian_contact: formData.guardian_contact || null,
          emergency_contact_name: formData.emergency_contact_name || null,
          emergency_contact_number: formData.emergency_contact_number || null,
        })
        .eq("id", user.id)
      
      if (error) {
        toast.error("Failed to save profile", { description: error.message })
        setSaving(false)
        return
      }
    } else if (role === "teacher") {
      const { error } = await supabase
        .from("teacher_profiles")
        .update({
          subject: formData.subject,
          department: formData.department || null,
        })
        .eq("id", user.id)
      
      if (error) {
        toast.error("Failed to save profile", { description: error.message })
        setSaving(false)
        return
      }
    }

    await fetchProfile()
    setSaving(false)
    toast.success("Profile saved successfully")
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  // Handle file selection - show preview dialog
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Reset previous state
    setUploadError(null)
    
    // Validate file format
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setUploadError(validation.error || "Invalid file")
      return
    }
    
    // Create preview URL
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setSelectedFile(file)
    setShowPhotoPreview(true)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }
  
  // Cancel photo upload
  const handleCancelUpload = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setShowPhotoPreview(false)
    setSelectedFile(null)
    setPreviewUrl(null)
    setUploadError(null)
  }, [previewUrl])
  
  // Confirm and upload photo
  const handleConfirmUpload = async () => {
    if (!selectedFile || !user) return
    
    setUploading(true)
    setUploadError(null)
    
    try {
      // Resize image before upload
      const resizedBlob = await resizeImage(
        selectedFile, 
        AVATAR_DIMENSIONS.width, 
        AVATAR_DIMENSIONS.height
      )
      
      // Create a new File from the resized blob
      const resizedFile = new File(
        [resizedBlob], 
        selectedFile.name, 
        { type: selectedFile.type }
      )
      
      // Upload to Supabase storage
      const { url, error } = await uploadAvatar(user.id, resizedFile)
      
      if (error || !url) {
        // Fallback: convert to base64 and store in database
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64 = reader.result as string
          const supabase = createClient()
          await supabase
            .from("users")
            .update({ avatar: base64 })
            .eq("id", user.id)
          await fetchProfile()
          handleCancelUpload()
          setUploading(false)
          toast.success("Profile photo updated")
        }
        reader.readAsDataURL(resizedFile)
        return
      }
      
      // Update user avatar URL in database
      const supabase = createClient()
      await supabase
        .from("users")
        .update({ avatar: url })
        .eq("id", user.id)
      
      await fetchProfile()
      handleCancelUpload()
      toast.success("Profile photo updated")
    } catch (err) {
      console.error("Upload error:", err)
      setUploadError("Failed to upload image. Please try again.")
      toast.error("Failed to upload photo")
    } finally {
      setUploading(false)
    }
  }

  const getRoleLabel = () => {
    switch (role) {
      case "admin": return "Administrator"
      case "teacher": return "Teacher"
      case "student": return "Student"
    }
  }

  const getRoleBadgeVariant = () => {
    switch (role) {
      case "admin": return "destructive" as const
      case "teacher": return "default" as const
      case "student": return "secondary" as const
    }
  }

  // Format full name from student profile
  const getStudentFullName = () => {
    if (!studentProfile) return user?.name || ""
    const parts = [
      studentProfile.first_name,
      studentProfile.middle_name,
      studentProfile.last_name,
      studentProfile.name_extension
    ].filter(Boolean)
    return parts.join(" ") || user?.name || ""
  }

  // Format address for display
  const formatAddress = (
    street: string | null,
    barangay: string | null,
    city: string | null,
    province: string | null,
    region: string | null
  ) => {
    const parts = [street, barangay, city, province, region].filter(Boolean)
    return parts.join(", ") || "—"
  }

  // Check if student is Senior High (Grades 11-12)
  const isSeniorHigh = studentProfile?.grade === "11" || studentProfile?.grade === "12"

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="My Profile" subtitle="Manage your personal information" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="My Profile" subtitle="Manage your personal information" userId={user?.id} />
      <div className="p-4 lg:p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Profile Header Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 cursor-pointer" onClick={handleAvatarClick}>
                    <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {(role === "student" ? getStudentFullName() : user?.name)?.split(" ").map(n => n[0]).join("") || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={handleAvatarClick}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-lg hover:bg-primary/90 disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold">
                    {role === "student" ? getStudentFullName() : user?.name}
                  </h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                  {role === "student" && studentProfile?.lrn && (
                    <p className="text-sm text-muted-foreground">LRN: {studentProfile.lrn}</p>
                  )}
                  <Badge variant={getRoleBadgeVariant()} className="mt-2">
                    {getRoleLabel()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Profile Sections */}
          {role === "student" && studentProfile && (
            <>
              {/* Basic Information Section - Read Only */}
              <CollapsibleSection 
                title="Basic Information" 
                icon={<User className="h-5 w-5" />}
                defaultOpen={true}
              >
                <div className="grid gap-4 pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ReadOnlyField label="LRN" value={studentProfile.lrn} />
                    <ReadOnlyField label="First Name" value={studentProfile.first_name} />
                    <ReadOnlyField label="Middle Name" value={studentProfile.middle_name} />
                    <ReadOnlyField label="Last Name" value={studentProfile.last_name} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ReadOnlyField label="Name Extension" value={studentProfile.name_extension} />
                    <ReadOnlyField 
                      label="Birthdate" 
                      value={studentProfile.birthdate ? new Date(studentProfile.birthdate).toLocaleDateString() : null} 
                    />
                    <ReadOnlyField label="Sex" value={studentProfile.sex} />
                    <ReadOnlyField 
                      label="Birthplace" 
                      value={[studentProfile.birthplace_city, studentProfile.birthplace_province].filter(Boolean).join(", ") || null} 
                    />
                  </div>
                </div>
              </CollapsibleSection>

              {/* Contact & Address Section - Editable */}
              <CollapsibleSection 
                title="Contact & Address" 
                icon={<MapPin className="h-5 w-5" />}
                defaultOpen={true}
              >
                <div className="grid gap-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_number">Contact Number</Label>
                    <Input
                      id="contact_number"
                      type="tel"
                      value={formData.contact_number}
                      onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                      placeholder="09XX XXX XXXX"
                    />
                  </div>
                  
                  <ReadOnlyField label="Email Address" value={studentProfile.email || user?.email} />
                  
                  <Separator />
                  <h4 className="font-medium text-sm">Current Address</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="current_house_street">House No./Street</Label>
                    <Input
                      id="current_house_street"
                      value={formData.current_house_street}
                      onChange={(e) => setFormData({ ...formData, current_house_street: e.target.value })}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_barangay">Barangay</Label>
                      <Input
                        id="current_barangay"
                        value={formData.current_barangay}
                        onChange={(e) => setFormData({ ...formData, current_barangay: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="current_city">City/Municipality</Label>
                      <Input
                        id="current_city"
                        value={formData.current_city}
                        onChange={(e) => setFormData({ ...formData, current_city: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="current_province">Province</Label>
                      <Input
                        id="current_province"
                        value={formData.current_province}
                        onChange={(e) => setFormData({ ...formData, current_province: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="current_region">Region</Label>
                      <Select
                        value={formData.current_region}
                        onValueChange={(v) => setFormData({ ...formData, current_region: v })}
                      >
                        <SelectTrigger id="current_region">
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          {PHILIPPINE_REGIONS.map((region) => (
                            <SelectItem key={region} value={region}>{region}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="permanent_same"
                      checked={formData.permanent_same_as_current}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, permanent_same_as_current: checked as boolean })
                      }
                    />
                    <Label htmlFor="permanent_same" className="font-normal">
                      Permanent address is the same as current address
                    </Label>
                  </div>

                  {/* Permanent Address - shown only when not same as current */}
                  {!formData.permanent_same_as_current && (
                    <>
                      <Separator />
                      <h4 className="font-medium text-sm">Permanent Address</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="permanent_house_street">House No./Street</Label>
                        <Input
                          id="permanent_house_street"
                          value={formData.permanent_house_street}
                          onChange={(e) => setFormData({ ...formData, permanent_house_street: e.target.value })}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="permanent_barangay">Barangay</Label>
                          <Input
                            id="permanent_barangay"
                            value={formData.permanent_barangay}
                            onChange={(e) => setFormData({ ...formData, permanent_barangay: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="permanent_city">City/Municipality</Label>
                          <Input
                            id="permanent_city"
                            value={formData.permanent_city}
                            onChange={(e) => setFormData({ ...formData, permanent_city: e.target.value })}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="permanent_province">Province</Label>
                          <Input
                            id="permanent_province"
                            value={formData.permanent_province}
                            onChange={(e) => setFormData({ ...formData, permanent_province: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="permanent_region">Region</Label>
                          <Select
                            value={formData.permanent_region}
                            onValueChange={(v) => setFormData({ ...formData, permanent_region: v })}
                          >
                            <SelectTrigger id="permanent_region">
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                            <SelectContent>
                              {PHILIPPINE_REGIONS.map((region) => (
                                <SelectItem key={region} value={region}>{region}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CollapsibleSection>

              {/* Parent/Guardian Section - Partially Editable (contacts only) */}
              <CollapsibleSection 
                title="Parent/Guardian Information" 
                icon={<Users className="h-5 w-5" />}
              >
                <div className="grid gap-4 pt-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Father's Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ReadOnlyField label="Full Name" value={studentProfile.father_name} />
                    <div className="space-y-2">
                      <Label htmlFor="father_contact">Contact Number</Label>
                      <Input
                        id="father_contact"
                        type="tel"
                        value={formData.father_contact}
                        onChange={(e) => setFormData({ ...formData, father_contact: e.target.value })}
                      />
                    </div>
                    <ReadOnlyField label="Occupation" value={studentProfile.father_occupation} />
                  </div>
                  
                  <Separator />
                  <h4 className="font-medium text-sm text-muted-foreground">Mother's Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ReadOnlyField label="Full Name (Maiden Name)" value={studentProfile.mother_name} />
                    <div className="space-y-2">
                      <Label htmlFor="mother_contact">Contact Number</Label>
                      <Input
                        id="mother_contact"
                        type="tel"
                        value={formData.mother_contact}
                        onChange={(e) => setFormData({ ...formData, mother_contact: e.target.value })}
                      />
                    </div>
                    <ReadOnlyField label="Occupation" value={studentProfile.mother_occupation} />
                  </div>
                  
                  <Separator />
                  <h4 className="font-medium text-sm text-muted-foreground">Guardian's Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ReadOnlyField label="Full Name" value={studentProfile.guardian_name} />
                    <ReadOnlyField label="Relationship" value={studentProfile.guardian_relationship} />
                    <div className="space-y-2">
                      <Label htmlFor="guardian_contact">Contact Number</Label>
                      <Input
                        id="guardian_contact"
                        type="tel"
                        value={formData.guardian_contact}
                        onChange={(e) => setFormData({ ...formData, guardian_contact: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              {/* Academic Information Section - Read Only */}
              <CollapsibleSection 
                title="Academic Information" 
                icon={<GraduationCap className="h-5 w-5" />}
              >
                <div className="grid gap-4 pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ReadOnlyField label="Grade Level" value={studentProfile.grade ? `Grade ${studentProfile.grade}` : null} />
                    <ReadOnlyField label="Section" value={studentProfile.section ? `Section ${studentProfile.section}` : null} />
                    <ReadOnlyField label="School Year" value={studentProfile.school_year} />
                    <ReadOnlyField label="Enrollment Status" value={studentProfile.enrollment_status} />
                  </div>
                  
                  {(studentProfile.enrollment_status === "Transferee" || 
                    studentProfile.enrollment_status === "Balik-Aral") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ReadOnlyField label="Last School Attended" value={studentProfile.last_school_attended} />
                      <ReadOnlyField label="Last School Year Completed" value={studentProfile.last_school_year} />
                    </div>
                  )}
                  
                  {isSeniorHigh && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ReadOnlyField label="Track" value={studentProfile.track} />
                      <ReadOnlyField label="Strand" value={studentProfile.strand} />
                    </div>
                  )}
                  
                  {studentProfile.enrollment_date && (
                    <ReadOnlyField 
                      label="Enrollment Date" 
                      value={new Date(studentProfile.enrollment_date).toLocaleDateString()} 
                    />
                  )}
                </div>
              </CollapsibleSection>

              {/* DepEd Required Information Section - Read Only */}
              <CollapsibleSection 
                title="DepEd Required Information" 
                icon={<Shield className="h-5 w-5" />}
              >
                <div className="grid gap-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ReadOnlyField label="PSA Birth Certificate Number" value={studentProfile.psa_birth_cert_no} />
                    <ReadOnlyField 
                      label="4Ps Beneficiary" 
                      value={studentProfile.is_4ps_beneficiary ? "Yes" : "No"} 
                    />
                  </div>
                  
                  {studentProfile.is_4ps_beneficiary && (
                    <ReadOnlyField label="4Ps Household ID" value={studentProfile.household_4ps_id} />
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ReadOnlyField 
                      label="Indigenous Peoples (IP)" 
                      value={studentProfile.is_indigenous ? "Yes" : "No"} 
                    />
                    {studentProfile.is_indigenous && (
                      <ReadOnlyField label="IP Community/Group" value={studentProfile.indigenous_group} />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ReadOnlyField label="Mother Tongue" value={studentProfile.mother_tongue} />
                    <ReadOnlyField label="Religion" value={studentProfile.religion} />
                  </div>
                </div>
              </CollapsibleSection>

              {/* Health & Special Needs Section - Partially Editable (emergency contact) */}
              <CollapsibleSection 
                title="Health & Special Needs" 
                icon={<Heart className="h-5 w-5" />}
              >
                <div className="grid gap-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ReadOnlyField label="Disability/Special Needs" value={studentProfile.disability_type || "None"} />
                    {studentProfile.disability_type && studentProfile.disability_type !== "None" && (
                      <ReadOnlyField label="Disability Details" value={studentProfile.disability_details} />
                    )}
                  </div>
                  
                  <Separator />
                  <h4 className="font-medium text-sm text-muted-foreground">Emergency Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                      <Input
                        id="emergency_contact_name"
                        value={formData.emergency_contact_name}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergency_contact_number">Emergency Contact Number</Label>
                      <Input
                        id="emergency_contact_number"
                        type="tel"
                        value={formData.emergency_contact_number}
                        onChange={(e) => setFormData({ ...formData, emergency_contact_number: e.target.value })}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  <h4 className="font-medium text-sm text-muted-foreground">Medical Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ReadOnlyField label="Blood Type" value={studentProfile.blood_type} />
                    <ReadOnlyField label="Medical Conditions/Allergies" value={studentProfile.medical_conditions} />
                  </div>
                </div>
              </CollapsibleSection>
            </>
          )}

          {/* Admin/Teacher Personal Information */}
          {role !== "student" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
                    </div>
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="joined">Member Since</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="joined"
                        value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ""}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-3" />
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Enter your address"
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Teacher-specific fields */}
          {role === "teacher" && teacherProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Professional Information
                </CardTitle>
                <CardDescription>Your teaching details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject Specialization</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Enter your subject"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="Enter department"
                    />
                  </div>
                </div>
                {teacherProfile.join_date && (
                  <div className="space-y-2">
                    <Label>Join Date</Label>
                    <Input
                      value={new Date(teacherProfile.join_date).toLocaleDateString()}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg">
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      </div>
      
      {/* Photo Preview Dialog */}
      <Dialog open={showPhotoPreview} onOpenChange={(open) => !open && handleCancelUpload()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Profile Photo</DialogTitle>
            <DialogDescription>
              Preview your photo before uploading. The image will be resized to {AVATAR_DIMENSIONS.width}x{AVATAR_DIMENSIONS.height} pixels.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center gap-4 py-4">
            {/* Preview Image */}
            {previewUrl && (
              <div className="relative">
                <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-primary/20">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            
            {/* File Info */}
            {selectedFile && (
              <div className="text-center text-sm text-muted-foreground">
                <p className="font-medium">{selectedFile.name}</p>
                <p>{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            )}
            
            {/* Error Message */}
            {uploadError && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-md">
                <AlertCircle className="h-4 w-4" />
                {uploadError}
              </div>
            )}
          </div>
          
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={handleCancelUpload}
              disabled={uploading}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmUpload}
              disabled={uploading || !selectedFile}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
