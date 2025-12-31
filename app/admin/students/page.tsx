"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Search, Users, GraduationCap, Eye, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { StudentForm, type StudentFormData } from "@/components/student-form"

interface Student {
  id: string
  name: string
  email: string
  avatar: string | null
  grade: string
  section: string
  lrn: string | null
  parent_name: string | null
  parent_phone: string | null
  address: string | null
  enrollment_date: string | null
}

export default function StudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterGrade, setFilterGrade] = useState<string>("all")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState("")

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    try {
      // Use secure API route
      const response = await fetch("/api/admin/students")
      if (!response.ok) throw new Error("Failed to fetch students")
      
      const { students: data } = await response.json()

      if (data) {
        setStudents(data.map((s: any) => {
          const profile = (s.student_profiles as any)?.[0] || (s.student_profiles as any)
          // Determine parent/guardian name and phone from available contacts
          const parentName = profile?.father_name || profile?.mother_name || profile?.guardian_name || null
          const parentPhone = profile?.father_contact || profile?.mother_contact || profile?.guardian_contact || null
          
          return {
            id: s.id,
            name: s.name,
            email: s.email,
            avatar: s.avatar,
            address: s.address,
            grade: profile?.grade || "N/A",
            section: profile?.section || "N/A",
            lrn: profile?.lrn || null,
            parent_name: parentName,
            parent_phone: parentPhone,
            enrollment_date: profile?.enrollment_date,
          }
        }))
      }
    } catch (error: any) {
      toast.error("Error loading students", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.lrn && student.lrn.includes(searchQuery))
    const matchesGrade = filterGrade === "all" || student.grade === filterGrade
    return matchesSearch && matchesGrade
  })

  const getGradeCount = (grade: string) => students.filter((s) => s.grade === grade).length

  const handleAddStudent = async (formData: StudentFormData) => {
    if (!formData.first_name || !formData.last_name) return
    setSaving(true)

    const supabase = createClient()
    
    // Construct full name from parts
    const fullName = [
      formData.first_name,
      formData.middle_name,
      formData.last_name,
      formData.name_extension
    ].filter(Boolean).join(" ")
    
    // Create user record
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        email: formData.email || `${formData.first_name.toLowerCase()}.${formData.last_name.toLowerCase()}@student.edu`,
        name: fullName,
        role: "student",
        address: formData.current_house_street 
          ? `${formData.current_house_street}, ${formData.current_barangay || ''}, ${formData.current_city || ''}, ${formData.current_province || ''}`
          : null,
      })
      .select()
      .single()

    if (userError) {
      toast.error("Failed to add student", { description: userError.message })
      setSaving(false)
      return
    }

    // Create student profile with all DepEd fields
    const { error: profileError } = await supabase.from("student_profiles").insert({
      id: userData.id,
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
      enrollment_date: new Date().toISOString().split("T")[0],
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

    if (profileError) {
      toast.error("Failed to create student profile", { description: profileError.message })
      // Rollback user creation if profile fails
      await supabase.from("users").delete().eq("id", userData.id)
      setSaving(false)
      return
    }

    setAddDialogOpen(false)
    setSaving(false)
    toast.success("Student added successfully")
    fetchStudents()
  }

  const handleViewDetails = (studentId: string) => {
    router.push(`/admin/students/${studentId}`)
  }

  const columns = [
    {
      key: "name",
      header: "Student",
      render: (student: Student) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {student.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-card-foreground">{student.name}</p>
            <p className="text-xs text-muted-foreground">{student.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "lrn",
      header: "LRN",
      render: (student: Student) => (
        <span className="text-sm font-mono text-muted-foreground">
          {student.lrn || "-"}
        </span>
      ),
    },
    {
      key: "grade",
      header: "Grade",
      render: (student: Student) => (
        <Badge variant="outline">Grade {student.grade} - {student.section}</Badge>
      ),
    },
    {
      key: "parentName",
      header: "Parent/Guardian",
      render: (student: Student) => (
        <div>
          <p className="text-sm text-card-foreground">{student.parent_name || "-"}</p>
          <p className="text-xs text-muted-foreground">{student.parent_phone || "-"}</p>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (student: Student) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => handleViewDetails(student.id)}
            className="gap-1"
          >
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Students" subtitle="Manage student records" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Students" subtitle="Manage student records" userId={userId} />
      <div className="p-4 lg:p-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Grade 10</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-card-foreground">{getGradeCount("10")}</span>
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Grade 11</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-card-foreground">{getGradeCount("11")}</span>
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Grade 12</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-card-foreground">{getGradeCount("12")}</span>
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search by name, email, or LRN..." 
                className="pl-9" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="7">Grade 7</SelectItem>
                <SelectItem value="8">Grade 8</SelectItem>
                <SelectItem value="9">Grade 9</SelectItem>
                <SelectItem value="10">Grade 10</SelectItem>
                <SelectItem value="11">Grade 11</SelectItem>
                <SelectItem value="12">Grade 12</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Student</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Enter the student's information below. Fields marked with * are required.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
                <StudentForm
                  mode="create"
                  onSubmit={handleAddStudent}
                  onCancel={() => setAddDialogOpen(false)}
                  isLoading={saving}
                />
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable columns={columns} data={filteredStudents} />
      </div>
    </div>
  )
}