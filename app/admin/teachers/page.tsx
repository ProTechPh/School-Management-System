"use client"

import { useState, useEffect } from "react"
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
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Eye, Pencil, Mail, Phone, Building, Calendar, User, BookOpen, Loader2, Link2, KeyRound, UserCheck, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useDepartmentStore } from "@/lib/department-store"

interface Teacher {
  id: string
  name: string
  email: string
  avatar: string | null
  phone: string | null
  address: string | null
  subject: string
  department: string | null
  join_date: string | null
  hasAuthAccount?: boolean
}

interface UnlinkedAccount {
  id: string
  email: string
  name: string
}

interface ClassInfo {
  id: string
  name: string
  grade: string
  section: string
  room: string | null
  schedule: string | null
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterDepartment, setFilterDepartment] = useState<string>("all")
  const [viewTeacher, setViewTeacher] = useState<Teacher | null>(null)
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [linking, setLinking] = useState(false)
  const [userId, setUserId] = useState("")
  const [unlinkedAccounts, setUnlinkedAccounts] = useState<UnlinkedAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState("")
  const [teacherToLink, setTeacherToLink] = useState<Teacher | null>(null)
  
  const { departments: deptList } = useDepartmentStore()

  const [newTeacher, setNewTeacher] = useState({
    name: "",
    email: "",
    subject: "",
    department: "",
    phone: "",
    address: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setUserId(user.id)

    // Fetch teachers from users table
    const { data: teacherData, error: teacherError } = await supabase
      .from("users")
      .select("id, name, email, avatar, phone, address")
      .eq("role", "teacher")
      .order("name")

    if (teacherError) {
      console.error("Error fetching teachers:", teacherError)
      return
    }

    // Fetch all teacher profiles separately
    const { data: profileData, error: profileError } = await supabase
      .from("teacher_profiles")
      .select("id, subject, department, join_date")

    if (profileError) {
      console.error("Error fetching profiles:", profileError)
    }

    // Create a map of profiles by id for quick lookup
    const profileMap = new Map(
      (profileData || []).map(p => [p.id, p])
    )

    if (teacherData) {
      setTeachers(teacherData.map(t => {
        const profile = profileMap.get(t.id)
        return {
          id: t.id,
          name: t.name,
          email: t.email,
          avatar: t.avatar,
          phone: t.phone,
          address: t.address,
          subject: profile?.subject || "N/A",
          department: profile?.department || null,
          join_date: profile?.join_date || null,
        }
      }))
    }

    // Fetch classes
    const { data: classData } = await supabase
      .from("classes")
      .select("id, name, grade, section, room, schedule, teacher_id")
      .order("name")

    if (classData) {
      setClasses(classData)
    }

    setLoading(false)
  }

  const fetchUnlinkedAccounts = async () => {
    const supabase = createClient()
    
    // Get all teacher user accounts that don't have a full teacher profile
    const { data: teacherUsers } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("role", "teacher")
      .order("name")
    
    if (!teacherUsers) return

    // Get all teacher profiles
    const { data: profiles } = await supabase
      .from("teacher_profiles")
      .select("id, subject")
    
    const profileIds = new Set(profiles?.map(p => p.id) || [])
    
    // Filter to accounts that have minimal/no profile data
    const unlinked = teacherUsers.filter(u => {
      if (profileIds.has(u.id)) {
        const profile = profiles?.find(p => p.id === u.id)
        // Consider "unlinked" if profile has generic subject
        return profile?.subject === "General"
      }
      return true
    })
    
    setUnlinkedAccounts(unlinked)
  }

  const handleLinkAccount = async () => {
    if (!selectedAccountId || !teacherToLink) return
    setLinking(true)

    const supabase = createClient()
    
    // Update or insert the profile for the linked account
    const { error: profileError } = await supabase
      .from("teacher_profiles")
      .upsert({
        id: selectedAccountId,
        subject: teacherToLink.subject,
        department: teacherToLink.department,
        join_date: teacherToLink.join_date
      })

    if (profileError) {
      toast.error("Failed to link account", { description: profileError.message })
      setLinking(false)
      return
    }

    // Update the user record with teacher info
    await supabase
      .from("users")
      .update({
        name: teacherToLink.name,
        phone: teacherToLink.phone,
        address: teacherToLink.address
      })
      .eq("id", selectedAccountId)

    toast.success("Account linked successfully", { 
      description: "The teacher profile has been linked to the login account." 
    })
    
    setLinkDialogOpen(false)
    setSelectedAccountId("")
    setTeacherToLink(null)
    setLinking(false)
    fetchData()
  }

  const usedDepartments = [...new Set(teachers.map((t) => t.department).filter(Boolean))]

  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSearch =
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDepartment = filterDepartment === "all" || teacher.department === filterDepartment
    return matchesSearch && matchesDepartment
  })

  const getTeacherClasses = (teacherId: string) => {
    return classes.filter((c: any) => c.teacher_id === teacherId)
  }

  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email || !newTeacher.subject || !newTeacher.department) return
    setSaving(true)

    const supabase = createClient()
    
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        email: newTeacher.email,
        name: newTeacher.name,
        role: "teacher",
        phone: newTeacher.phone || null,
        address: newTeacher.address || null,
      })
      .select()
      .single()

    if (userError) {
      toast.error("Failed to add teacher", { description: userError.message })
      setSaving(false)
      return
    }

    const { error: profileError } = await supabase.from("teacher_profiles").insert({
      id: userData.id,
      subject: newTeacher.subject,
      department: newTeacher.department,
      join_date: new Date().toISOString().split("T")[0],
    })

    if (profileError) {
      toast.error("Failed to create teacher profile", { description: profileError.message })
      setSaving(false)
      return
    }

    setNewTeacher({ name: "", email: "", subject: "", department: "", phone: "", address: "" })
    setAddDialogOpen(false)
    setSaving(false)
    toast.success("Teacher added successfully")
    fetchData()
  }

  const handleSaveEdit = async () => {
    if (!editTeacher) return
    setSaving(true)

    const supabase = createClient()
    
    const { error: userError } = await supabase
      .from("users")
      .update({ 
        name: editTeacher.name, 
        email: editTeacher.email, 
        phone: editTeacher.phone,
        address: editTeacher.address 
      })
      .eq("id", editTeacher.id)

    if (userError) {
      toast.error("Failed to update teacher", { description: userError.message })
      setSaving(false)
      return
    }

    const { error: profileError } = await supabase
      .from("teacher_profiles")
      .update({
        subject: editTeacher.subject,
        department: editTeacher.department,
      })
      .eq("id", editTeacher.id)

    if (profileError) {
      toast.error("Failed to update teacher profile", { description: profileError.message })
      setSaving(false)
      return
    }

    setEditDialogOpen(false)
    setEditTeacher(null)
    setSaving(false)
    toast.success("Teacher updated successfully")
    fetchData()
  }

  const columns = [
    {
      key: "name",
      header: "Teacher",
      render: (teacher: Teacher) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={teacher.avatar || "/placeholder.svg"} alt={teacher.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {teacher.name.split(" ").map((n) => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-card-foreground">{teacher.name}</p>
            <p className="text-xs text-muted-foreground">{teacher.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      render: (teacher: Teacher) => <Badge variant="secondary">{teacher.subject}</Badge>,
    },
    {
      key: "department",
      header: "Department",
      render: (teacher: Teacher) => <span className="text-sm text-card-foreground">{teacher.department || "-"}</span>,
    },
    {
      key: "phone",
      header: "Contact",
      render: (teacher: Teacher) => <span className="text-sm text-muted-foreground">{teacher.phone || "-"}</span>,
    },
    {
      key: "joinDate",
      header: "Join Date",
      render: (teacher: Teacher) => (
        <span className="text-sm text-muted-foreground">
          {teacher.join_date ? new Date(teacher.join_date).toLocaleDateString() : "-"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (teacher: Teacher) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => { setViewTeacher(teacher); setViewDialogOpen(true) }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { setEditTeacher(teacher); setEditDialogOpen(true) }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => { 
              setTeacherToLink(teacher)
              fetchUnlinkedAccounts()
              setLinkDialogOpen(true) 
            }}
            title="Link to login account"
          >
            <Link2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Teachers" subtitle="Manage teaching staff" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Teachers" subtitle="Manage teaching staff" userId={userId} />
      <div className="p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search teachers..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {deptList.map((dept) => (
                  <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Add Teacher</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Teacher</DialogTitle>
                <DialogDescription>Enter the teacher&apos;s information below.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Full Name</Label>
                  <Input value={newTeacher.name} onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })} placeholder="Enter full name" />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" value={newTeacher.email} onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })} placeholder="Enter email" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Subject</Label>
                    <Input value={newTeacher.subject} onChange={(e) => setNewTeacher({ ...newTeacher, subject: e.target.value })} placeholder="e.g., Mathematics" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Department</Label>
                    <Select value={newTeacher.department} onValueChange={(v) => setNewTeacher({ ...newTeacher, department: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {deptList.map((dept) => (
                          <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Phone Number</Label>
                  <Input type="tel" value={newTeacher.phone} onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })} placeholder="Enter phone number" />
                </div>
                <div className="grid gap-2">
                  <Label>Address</Label>
                  <Textarea value={newTeacher.address} onChange={(e) => setNewTeacher({ ...newTeacher, address: e.target.value })} placeholder="Enter full address" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handleAddTeacher} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Add Teacher
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <DataTable columns={columns} data={filteredTeachers} />
        <p className="mt-4 text-sm text-muted-foreground">Showing {filteredTeachers.length} of {teachers.length} teachers</p>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            {viewTeacher && (
              <>
                <DialogHeader>
                  <DialogTitle>Teacher Details</DialogTitle>
                  <DialogDescription>Complete information for {viewTeacher.name}</DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="info" className="mt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="info">Information</TabsTrigger>
                    <TabsTrigger value="classes">Classes</TabsTrigger>
                  </TabsList>
                  <TabsContent value="info" className="mt-4 space-y-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={viewTeacher.avatar || "/placeholder.svg"} alt={viewTeacher.name} />
                        <AvatarFallback className="text-xl bg-primary/10 text-primary">
                          {viewTeacher.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <h3 className="text-xl font-semibold text-card-foreground">{viewTeacher.name}</h3>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{viewTeacher.subject}</Badge>
                          {viewTeacher.department && <Badge variant="outline">{viewTeacher.department}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-muted/30">
                        <CardContent className="pt-4 space-y-3">
                          <h4 className="font-medium text-card-foreground flex items-center gap-2">
                            <User className="h-4 w-4" /> Contact Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {viewTeacher.email}</p>
                            <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {viewTeacher.phone || "-"}</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/30">
                        <CardContent className="pt-4 space-y-3">
                          <h4 className="font-medium text-card-foreground flex items-center gap-2">
                            <Building className="h-4 w-4" /> Work Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p className="flex items-center gap-2 text-muted-foreground"><BookOpen className="h-4 w-4" /> {viewTeacher.subject} Teacher</p>
                            <p className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" /> Joined: {viewTeacher.join_date ? new Date(viewTeacher.join_date).toLocaleDateString() : "-"}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    {viewTeacher.address && (
                      <Card className="bg-muted/30">
                        <CardContent className="pt-4">
                          <h4 className="font-medium text-card-foreground flex items-center gap-2 mb-2">Address</h4>
                          <p className="text-sm text-muted-foreground">{viewTeacher.address}</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                  <TabsContent value="classes" className="mt-4">
                    {(() => {
                      const teacherClasses = getTeacherClasses(viewTeacher.id)
                      if (teacherClasses.length === 0) {
                        return <p className="text-muted-foreground text-center py-8">No classes assigned yet.</p>
                      }
                      return (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {teacherClasses.map((c: any) => (
                            <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                              <div>
                                <p className="font-medium text-card-foreground">{c.name}</p>
                                <p className="text-xs text-muted-foreground">Grade {c.grade}-{c.section} • {c.schedule || "No schedule"}</p>
                              </div>
                              <Badge variant="outline">{c.room || "TBA"}</Badge>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </TabsContent>
                </Tabs>
                <div className="flex justify-end gap-3 mt-4">
                  <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
                  <Button onClick={() => { setViewDialogOpen(false); setEditTeacher(viewTeacher); setEditDialogOpen(true) }}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit Teacher
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            {editTeacher && (
              <>
                <DialogHeader>
                  <DialogTitle>Edit Teacher</DialogTitle>
                  <DialogDescription>Update {editTeacher.name}&apos;s information.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Full Name</Label>
                    <Input value={editTeacher.name} onChange={(e) => setEditTeacher({ ...editTeacher, name: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input type="email" value={editTeacher.email} onChange={(e) => setEditTeacher({ ...editTeacher, email: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Subject</Label>
                      <Input value={editTeacher.subject} onChange={(e) => setEditTeacher({ ...editTeacher, subject: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Department</Label>
                      <Select value={editTeacher.department || ""} onValueChange={(v) => setEditTeacher({ ...editTeacher, department: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {deptList.map((dept) => (
                            <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Phone Number</Label>
                    <Input type="tel" value={editTeacher.phone || ""} onChange={(e) => setEditTeacher({ ...editTeacher, phone: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Address</Label>
                    <Textarea value={editTeacher.address || ""} onChange={(e) => setEditTeacher({ ...editTeacher, address: e.target.value })} />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={handleSaveEdit} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Changes
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Link Account Dialog */}
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5" />
                Link to Login Account
              </DialogTitle>
              <DialogDescription>
                Link {teacherToLink?.name}&apos;s profile to an existing login account.
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
                      <li>Teacher profile data will be copied to the account</li>
                      <li>The account holder can login and access their dashboard</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium">No unlinked accounts found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    All teacher accounts already have profiles. Create a new account in User Accounts first.
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
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
      </div>
    </div>
  )
}
