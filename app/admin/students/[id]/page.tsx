"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  ArrowLeft, 
  Pencil, 
  Loader2, 
  User, 
  MapPin, 
  Users, 
  GraduationCap, 
  FileText, 
  Heart,
  Check,
  Link2,
  KeyRound,
  UserCheck,
  AlertCircle,
  BookOpen,
  Plus,
  X
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { StudentForm, type StudentFormData } from "@/components/student-form"
import type { DbStudentProfile } from "@/lib/supabase/types"

// ... (Keep existing interfaces)
interface StudentData {
  id: string
  name: string
  email: string
  avatar: string | null
  address: string | null
  profile: DbStudentProfile | null
  hasAuthAccount: boolean
}

interface EnrolledClass {
  id: string
  class_id: string
  class_name: string
  subject: string
  teacher_name: string | null
  schedule: string | null
}

interface AvailableClass {
  id: string
  name: string
  subject: string
  teacher_name: string | null
}

interface UnlinkedAccount {
  id: string
  email: string
  name: string
}

interface InfoItemProps {
  label: string
  value: string | null | undefined
  className?: string
}

function InfoItem({ label, value, className }: InfoItemProps) {
  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  )
}

interface InfoSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}

function InfoSection({ title, icon, children }: InfoSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [student, setStudent] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [linking, setLinking] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [userId, setUserId] = useState("")
  const [unlinkedAccounts, setUnlinkedAccounts] = useState<UnlinkedAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState("")
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([])
  const [availableClasses, setAvailableClasses] = useState<AvailableClass[]>([])
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false)
  const [selectedClassId, setSelectedClassId] = useState("")
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    fetchStudent()
    fetchEnrolledClasses()
  }, [id])

  const fetchEnrolledClasses = async () => {
    const supabase = createClient()
    
    const { data } = await supabase
      .from("class_students")
      .select(`
        id, class_id,
        class:classes (name, subject, schedule, teacher:users!classes_teacher_id_fkey (name))
      `)
      .eq("student_id", id)

    if (data) {
      setEnrolledClasses(data.map(e => ({
        id: e.id,
        class_id: e.class_id,
        class_name: (e.class as any)?.name || "Unknown",
        subject: (e.class as any)?.subject || "Unknown",
        teacher_name: (e.class as any)?.teacher?.name || null,
        schedule: (e.class as any)?.schedule || null,
      })))
    }
  }

  const fetchAvailableClasses = async () => {
    const supabase = createClient()
    
    // Get all classes
    const { data: allClasses } = await supabase
      .from("classes")
      .select(`id, name, subject, teacher:users!classes_teacher_id_fkey (name)`)
      .order("name")

    // Get enrolled class IDs
    const enrolledIds = new Set(enrolledClasses.map(e => e.class_id))

    if (allClasses) {
      setAvailableClasses(
        allClasses
          .filter(c => !enrolledIds.has(c.id))
          .map(c => ({
            id: c.id,
            name: c.name,
            subject: c.subject,
            teacher_name: (c.teacher as any)?.name || null,
          }))
      )
    }
  }

  const handleEnrollClass = async () => {
    if (!selectedClassId) return
    setEnrolling(true)

    try {
      // SECURITY FIX: Use secure API for enrollment
      const response = await fetch("/api/admin/enroll-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: id,
          classId: selectedClassId,
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to enroll student")
      }

      toast.success("Student enrolled successfully")
      setEnrollDialogOpen(false)
      setSelectedClassId("")
      fetchEnrolledClasses()
    } catch (error: any) {
      toast.error("Enrollment failed", { description: error.message })
    } finally {
      setEnrolling(false)
    }
  }

  const handleUnenrollClass = async (enrollmentId: string, className: string) => {
    try {
      // SECURITY FIX: Use secure API for unenrollment
      const response = await fetch("/api/admin/unenroll-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to unenroll student")
      }

      toast.success(`Unenrolled from ${className}`)
      fetchEnrolledClasses()
    } catch (error: any) {
      toast.error("Unenrollment failed", { description: error.message })
    }
  }

  const fetchUnlinkedAccounts = async () => {
    try {
      const response = await fetch("/api/admin/unlinked-accounts")
      if (response.ok) {
        const { accounts } = await response.json()
        // Filter out current student
        const unlinked = accounts.filter((u: any) => u.id !== id)
        setUnlinkedAccounts(unlinked)
      } else {
        toast.error("Failed to load accounts")
      }
    } catch (error) {
      console.error("Error fetching accounts:", error)
    }
  }

  const handleLinkAccount = async () => {
    if (!selectedAccountId || !student?.profile) return
    setLinking(true)

    try {
      const response = await fetch("/api/admin/link-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: selectedAccountId,
          profileData: student.profile,
          role: "student"
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to link account")
      }

      toast.success("Account linked successfully", { 
        description: "The student profile has been linked to the login account." 
      })
      
      setLinkDialogOpen(false)
      setSelectedAccountId("")
      
      router.push(`/admin/students/${selectedAccountId}`)
    } catch (error: any) {
      toast.error("Failed to link account", { description: error.message })
    } finally {
      setLinking(false)
    }
  }

  const fetchStudent = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    // SECURITY FIX: Use secure API route instead of direct DB query
    try {
      const response = await fetch(`/api/admin/students/${id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch student details")
      }
      
      const { student: studentData } = await response.json()

      let hasAuth = false
      try {
        const res = await fetch("/api/check-auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: id })
        })
        const { hasAuth: authResult } = await res.json()
        hasAuth = authResult
      } catch {
        hasAuth = false
      }

      setStudent({
        ...studentData,
        hasAuthAccount: hasAuth
      })
    } catch (error: any) {
      console.error("Error fetching student:", error)
      toast.error("Error loading student details")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveEdit = async (formData: StudentFormData) => {
    if (!student) return
    setSaving(true)

    const supabase = createClient()
    
    const fullName = [
      formData.first_name,
      formData.middle_name,
      formData.last_name,
      formData.name_extension
    ].filter(Boolean).join(" ")
    
    const { error: userError } = await supabase
      .from("users")
      .update({
        name: fullName,
        email: formData.email || student.email,
        address: formData.current_house_street 
          ? `${formData.current_house_street}, ${formData.current_barangay || ''}, ${formData.current_city || ''}, ${formData.current_province || ''}`
          : null,
      })
      .eq("id", student.id)

    if (userError) {
      toast.error("Failed to update student", { description: userError.message })
      setSaving(false)
      return
    }

    const { error: profileError } = await supabase
      .from("student_profiles")
      .update({
        // Basic Info
        lrn: formData.lrn || null,
        first_name: formData.first_name,
        middle_name: formData.middle_name || null,
        last_name: formData.last_name,
        name_extension: formData.name_extension || null,
        birthdate: formData.birthdate || null,
        sex: formData.sex || null,
        birthplace_city: formData.birthplace_city || null,
        birthplace_province: formData.birthplace_province || null,
        // Contact/Address
        current_house_street: formData.current_house_street || null,
        current_barangay: formData.current_barangay || null,
        current_city: formData.current_city || null,
        current_province: formData.current_province || null,
        current_region: formData.current_region || null,
        permanent_same_as_current: formData.permanent_same_as_current ?? true,
        permanent_house_street: formData.permanent_house_street || null,
        permanent_barangay: formData.permanent_barangay || null,
        permanent_city: formData.permanent_city || null,
        permanent_province: formData.permanent_province || null,
        permanent_region: formData.permanent_region || null,
        contact_number: formData.contact_number || null,
        email: formData.email || null,
        // Parent/Guardian
        father_name: formData.father_name || null,
        father_contact: formData.father_contact || null,
        father_occupation: formData.father_occupation || null,
        mother_name: formData.mother_name || null,
        mother_contact: formData.mother_contact || null,
        mother_occupation: formData.mother_occupation || null,
        guardian_name: formData.guardian_name || null,
        guardian_relationship: formData.guardian_relationship || null,
        guardian_contact: formData.guardian_contact || null,
        // Academic
        grade: formData.grade,
        section: formData.section,
        school_year: formData.school_year || null,
        enrollment_status: formData.enrollment_status || null,
        last_school_attended: formData.last_school_attended || null,
        last_school_year: formData.last_school_year || null,
        track: formData.track || null,
        strand: formData.strand || null,
        // DepEd Required
        psa_birth_cert_no: formData.psa_birth_cert_no || null,
        is_4ps_beneficiary: formData.is_4ps_beneficiary ?? false,
        household_4ps_id: formData.household_4ps_id || null,
        is_indigenous: formData.is_indigenous ?? false,
        indigenous_group: formData.indigenous_group || null,
        mother_tongue: formData.mother_tongue || null,
        religion: formData.religion || null,
        // Health/Special Needs
        disability_type: formData.disability_type || null,
        disability_details: formData.disability_details || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_number: formData.emergency_contact_number || null,
        blood_type: formData.blood_type || null,
        medical_conditions: formData.medical_conditions || null,
      })
      .eq("id", student.id)

    if (profileError) {
      toast.error("Failed to update student profile", { description: profileError.message })
      setSaving(false)
      return
    }

    setEditDialogOpen(false)
    setSaving(false)
    toast.success("Student information updated successfully")
    fetchStudent()
  }
  
  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Student Details" subtitle="Loading..." />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Student Details" subtitle="Student not found" />
        <div className="p-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Button>
          <p className="mt-4 text-muted-foreground">The requested student could not be found.</p>
        </div>
      </div>
    )
  }

  const profile = student.profile
  const fullName = profile 
    ? [profile.first_name, profile.middle_name, profile.last_name, profile.name_extension].filter(Boolean).join(" ")
    : student.name

  return (
    <div className="min-h-screen">
      <DashboardHeader 
        title="Student Details" 
        subtitle={fullName}
        userId={userId}
      />
      <div className="p-6">
        {/* Header with back button and edit */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push("/admin/students")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => { fetchUnlinkedAccounts(); setLinkDialogOpen(true) }}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Link Account
            </Button>
            <Button onClick={() => setEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Student
            </Button>
          </div>
        </div>

        {/* ... (Rest of UI) */}
        {/* Student Header Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={student.avatar || "/placeholder.svg"} alt={fullName} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {fullName.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{fullName}</h2>
                <p className="text-muted-foreground">{student.email}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile?.lrn && (
                    <Badge variant="secondary" className="font-mono">
                      LRN: {profile.lrn}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    Grade {profile?.grade || "N/A"} - Section {profile?.section || "N/A"}
                  </Badge>
                  {profile?.enrollment_status && (
                    <Badge>{profile.enrollment_status}</Badge>
                  )}
                  {student.hasAuthAccount ? (
                    <Badge variant="default" className="bg-green-600">
                      <UserCheck className="mr-1 h-3 w-3" />
                      Has Login Account
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-500 border-amber-500">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      No Login Account
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Information Sections */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <InfoSection title="Basic Information" icon={<User className="h-5 w-5" />}>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="First Name" value={profile?.first_name} />
              <InfoItem label="Middle Name" value={profile?.middle_name} />
              <InfoItem label="Last Name" value={profile?.last_name} />
              <InfoItem label="Name Extension" value={profile?.name_extension} />
              <InfoItem label="Birthdate" value={profile?.birthdate} />
              <InfoItem label="Sex" value={profile?.sex} />
              <InfoItem label="Birthplace (City)" value={profile?.birthplace_city} />
              <InfoItem label="Birthplace (Province)" value={profile?.birthplace_province} />
            </div>
          </InfoSection>

          {/* Contact & Address */}
          <InfoSection title="Contact & Address" icon={<MapPin className="h-5 w-5" />}>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Current Address</p>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="House/Street" value={profile?.current_house_street} />
                  <InfoItem label="Barangay" value={profile?.current_barangay} />
                  <InfoItem label="City/Municipality" value={profile?.current_city} />
                  <InfoItem label="Province" value={profile?.current_province} />
                  <InfoItem label="Region" value={profile?.current_region} />
                </div>
              </div>
              {!profile?.permanent_same_as_current && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Permanent Address</p>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoItem label="House/Street" value={profile?.permanent_house_street} />
                      <InfoItem label="Barangay" value={profile?.permanent_barangay} />
                      <InfoItem label="City/Municipality" value={profile?.permanent_city} />
                      <InfoItem label="Province" value={profile?.permanent_province} />
                      <InfoItem label="Region" value={profile?.permanent_region} />
                    </div>
                  </div>
                </>
              )}
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Contact Number" value={profile?.contact_number} />
                <InfoItem label="Email" value={profile?.email || student.email} />
              </div>
            </div>
          </InfoSection>

          {/* Parent/Guardian Information */}
          <InfoSection title="Parent/Guardian Information" icon={<Users className="h-5 w-5" />}>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Father's Information</p>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Full Name" value={profile?.father_name} />
                  <InfoItem label="Contact" value={profile?.father_contact} />
                  <InfoItem label="Occupation" value={profile?.father_occupation} className="col-span-2" />
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Mother's Information</p>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Full Name (Maiden)" value={profile?.mother_name} />
                  <InfoItem label="Contact" value={profile?.mother_contact} />
                  <InfoItem label="Occupation" value={profile?.mother_occupation} className="col-span-2" />
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Guardian's Information</p>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Full Name" value={profile?.guardian_name} />
                  <InfoItem label="Relationship" value={profile?.guardian_relationship} />
                  <InfoItem label="Contact" value={profile?.guardian_contact} className="col-span-2" />
                </div>
              </div>
            </div>
          </InfoSection>

          {/* Academic Information */}
          <InfoSection title="Academic Information" icon={<GraduationCap className="h-5 w-5" />}>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Grade Level" value={profile?.grade ? `Grade ${profile.grade}` : null} />
              <InfoItem label="Section" value={profile?.section ? `Section ${profile.section}` : null} />
              <InfoItem label="School Year" value={profile?.school_year} />
              <InfoItem label="Enrollment Status" value={profile?.enrollment_status} />
              <InfoItem label="Enrollment Date" value={profile?.enrollment_date} />
              {(profile?.grade === "11" || profile?.grade === "12") && (
                <>
                  <InfoItem label="Track" value={profile?.track} />
                  <InfoItem label="Strand" value={profile?.strand} />
                </>
              )}
              {(profile?.enrollment_status === "Transferee" || profile?.enrollment_status === "Balik-Aral") && (
                <>
                  <InfoItem label="Last School Attended" value={profile?.last_school_attended} className="col-span-2" />
                  <InfoItem label="Last School Year" value={profile?.last_school_year} />
                </>
              )}
            </div>
          </InfoSection>

          {/* Class Enrollment */}
          <InfoSection title="Class Enrollment" icon={<BookOpen className="h-5 w-5" />}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {enrolledClasses.length} class{enrolledClasses.length !== 1 ? "es" : ""} enrolled
                </p>
                <Button 
                  size="sm" 
                  onClick={() => { fetchAvailableClasses(); setEnrollDialogOpen(true); }}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Enroll in Class
                </Button>
              </div>
              {enrolledClasses.length > 0 ? (
                <div className="space-y-2">
                  {enrolledClasses.map((enrollment) => (
                    <div 
                      key={enrollment.id} 
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="font-medium">{enrollment.class_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {enrollment.subject} • {enrollment.teacher_name || "No teacher"}
                        </p>
                        {enrollment.schedule && (
                          <p className="text-xs text-muted-foreground">{enrollment.schedule}</p>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleUnenrollClass(enrollment.id, enrollment.class_name)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                  <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Not enrolled in any classes yet</p>
                </div>
              )}
            </div>
          </InfoSection>

          {/* DepEd Required Information */}
          <InfoSection title="DepEd Required Information" icon={<FileText className="h-5 w-5" />}>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="PSA Birth Certificate No." value={profile?.psa_birth_cert_no} />
              <InfoItem label="4Ps Beneficiary" value={profile?.is_4ps_beneficiary ? "Yes" : "No"} />
              {profile?.is_4ps_beneficiary && (
                <InfoItem label="4Ps Household ID" value={profile?.household_4ps_id} />
              )}
              <InfoItem label="Indigenous Peoples" value={profile?.is_indigenous ? "Yes" : "No"} />
              {profile?.is_indigenous && (
                <InfoItem label="IP Group" value={profile?.indigenous_group} />
              )}
              <InfoItem label="Mother Tongue" value={profile?.mother_tongue} />
              <InfoItem label="Religion" value={profile?.religion} />
            </div>
          </InfoSection>

          {/* Health & Special Needs */}
          <InfoSection title="Health & Special Needs" icon={<Heart className="h-5 w-5" />}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Disability/Special Needs" value={profile?.disability_type} />
                {profile?.disability_type && profile.disability_type !== "None" && (
                  <InfoItem label="Disability Details" value={profile?.disability_details} className="col-span-2" />
                )}
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Emergency Contact</p>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Name" value={profile?.emergency_contact_name} />
                  <InfoItem label="Contact Number" value={profile?.emergency_contact_number} />
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Medical Information</p>
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Blood Type" value={profile?.blood_type} />
                  <InfoItem label="Medical Conditions/Allergies" value={profile?.medical_conditions} className="col-span-2" />
                </div>
              </div>
            </div>
          </InfoSection>
        </div>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Edit Student Information</DialogTitle>
              <DialogDescription>
                Update the student's information below. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
              <StudentForm
                mode="edit"
                initialData={profile || undefined}
                onSubmit={handleSaveEdit}
                onCancel={() => setEditDialogOpen(false)}
                isLoading={saving}
              />
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Success Dialog */}
        <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Changes Saved Successfully
              </AlertDialogTitle>
              <AlertDialogDescription>
                The student's information has been updated successfully.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Link Account Dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Link to Login Account
              </DialogTitle>
              <DialogDescription>
                Link this student profile to an existing login account. This will copy the student's information to the selected account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {unlinkedAccounts.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <Label>Select Account to Link</Label>
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an account..." />
                      </SelectTrigger>
                      <SelectContent>
                        {unlinkedAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <div className="flex flex-col">
                              <span>{account.name}</span>
                              <span className="text-xs text-muted-foreground">{account.email}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <p className="font-medium mb-1">What happens when you link:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>Student profile data will be copied to the account</li>
                      <li>The account holder can login and see their info</li>
                      <li>You'll be redirected to the linked profile</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium">No unlinked accounts found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    All student accounts already have profiles. Create a new account in User Accounts first.
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
                Cancel
              </Button>
              {unlinkedAccounts.length > 0 && (
                <Button 
                  onClick={handleLinkAccount} 
                  disabled={!selectedAccountId || linking}
                >
                  {linking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Linking...
                    </>
                  ) : (
                    <>
                      <Link2 className="mr-2 h-4 w-4" />
                      Link Account
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Enroll in Class Dialog */}
        <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Enroll in Class
              </DialogTitle>
              <DialogDescription>
                Select a class to enroll this student in.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {availableClasses.length > 0 ? (
                <div className="space-y-2">
                  <Label>Select Class</Label>
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableClasses.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          <div className="flex flex-col">
                            <span>{cls.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {cls.subject} • {cls.teacher_name || "No teacher"}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="text-center py-4">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium">No available classes</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    This student is already enrolled in all available classes.
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setEnrollDialogOpen(false); setSelectedClassId(""); }}>
                Cancel
              </Button>
              {availableClasses.length > 0 && (
                <Button 
                  onClick={handleEnrollClass} 
                  disabled={!selectedClassId || enrolling}
                >
                  {enrolling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enrolling...
                    </>
                  ) : (
                    "Enroll Student"
                  )}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}