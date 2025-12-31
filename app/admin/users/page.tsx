"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"
import { DataTable } from "@/components/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Eye, EyeOff, UserPlus, Users, GraduationCap, Shield, Loader2, Copy, Check, Ban, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useNotificationStore } from "@/lib/notification-store"

interface UserAccount {
  id: string
  email: string
  name: string
  role: "admin" | "teacher" | "student"
  created_at: string
  is_active: boolean
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserAccount[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetchingUsers, setFetchingUsers] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [createdUser, setCreatedUser] = useState<{ email: string; password: string } | null>(null)
  const { addNotification } = useNotificationStore()

  // Fetch existing users on mount
  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    // SECURITY FIX: Use secure API endpoint instead of client-side DB query
    try {
      const response = await fetch("/api/admin/get-users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      
      if (data.users) {
        setUsers(data.users.map((u: any) => ({ ...u, is_active: u.is_active ?? true })))
      }
    } catch (error) {
      toast.error("Error fetching users")
      console.error(error)
    } finally {
      setFetchingUsers(false)
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    const supabase = createClient()
    const newStatus = !currentStatus
    
    const { error } = await supabase
      .from("users")
      .update({ is_active: newStatus })
      .eq("id", userId)

    if (error) {
      toast.error("Failed to update user status", { description: error.message })
      return
    }

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: newStatus } : u))
    toast.success(newStatus ? "Account enabled" : "Account disabled")
  }

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    lrn: "",
    password: "",
    role: "",
  })

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
    const array = new Uint32Array(12)
    crypto.getRandomValues(array)
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars[array[i] % chars.length]
    }
    setNewUser({ ...newUser, password })
  }

  const copyCredentials = () => {
    if (createdUser) {
      const loginInfo = newUser.role === "student"
        ? `LRN: ${newUser.lrn}\nPassword: ${createdUser.password}`
        : `Email: ${createdUser.email}\nPassword: ${createdUser.password}`
      navigator.clipboard.writeText(loginInfo)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCreateUser = async () => {
    // Validate based on role
    if (!newUser.name || !newUser.password || !newUser.role) return
    if (newUser.role === "student" && !newUser.lrn) return
    if (newUser.role !== "student" && !newUser.email) return

    // For students, use LRN with DepEd email format
    const emailToUse = newUser.role === "student" 
      ? `${newUser.lrn}@r1.deped.gov.ph` 
      : newUser.email

    setLoading(true)

    try {
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailToUse,
          password: newUser.password,
          name: newUser.name,
          role: newUser.role,
          lrn: newUser.lrn
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user")
      }

      // Add to local list
      setUsers((prev) => [
        ...prev,
        { ...data.user, is_active: true }
      ])

      setCreatedUser({ email: emailToUse, password: newUser.password })

      toast.success("User account created", { description: `Account for ${newUser.name} has been created.` })
      
      // Notify admin (self)
      addNotification({
        userId: "admin",
        userRole: "admin",
        title: "User Created",
        message: `Account for ${newUser.name} has been created successfully.`,
        type: "success",
        read: false,
      })

    } catch (error: any) {
      toast.error("Error creating user", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setNewUser({ name: "", email: "", lrn: "", password: "", role: "" })
    setCreatedUser(null)
    setCopied(false)
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === "all" || user.role === filterRole
    return matchesSearch && matchesRole
  })

  const getRoleCount = (role: string) => users.filter((u) => u.role === role).length
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive"
      case "teacher": return "default"
      case "student": return "secondary"
      default: return "outline"
    }
  }

  const columns = [
    {
      key: "name",
      header: "User",
      render: (user: UserAccount) => (
        <div className="flex items-center gap-2">
          <div>
            <p className={`font-medium ${user.is_active ? 'text-card-foreground' : 'text-muted-foreground line-through'}`}>
              {user.name}
            </p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (user: UserAccount) => (
        <Badge variant={getRoleBadgeVariant(user.role)}>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user: UserAccount) => (
        <Badge variant={user.is_active ? "default" : "secondary"} className={user.is_active ? "bg-green-600" : "bg-red-600"}>
          {user.is_active ? "Active" : "Disabled"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (user: UserAccount) => (
        <span className="text-sm text-muted-foreground">
          {new Date(user.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (user: UserAccount) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => toggleUserStatus(user.id, user.is_active)}
          title={user.is_active ? "Disable account" : "Enable account"}
        >
          {user.is_active ? (
            <Ban className="h-4 w-4 text-destructive" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
        </Button>
      ),
    },
  ]

  return (
    <div className="min-h-screen">
      <DashboardHeader title="User Accounts" subtitle="Create and manage user login accounts" />
      <div className="p-4 lg:p-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-card-foreground">{getRoleCount("admin")}</span>
                <Shield className="h-5 w-5 text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Teachers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-card-foreground">{getRoleCount("teacher")}</span>
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-card-foreground">{getRoleCount("student")}</span>
                <Users className="h-5 w-5 text-primary" />
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
                placeholder="Search users..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{createdUser ? "Account Created" : "Create User Account"}</DialogTitle>
                <DialogDescription>
                  {createdUser 
                    ? "Share these credentials with the user securely." 
                    : "Create a new login account for a user."}
                </DialogDescription>
              </DialogHeader>

              {createdUser ? (
                <div className="space-y-4 py-4">
                  <div className="rounded-lg bg-muted p-4 space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {newUser.role === "student" ? "LRN (Login Username)" : "Email"}
                      </p>
                      <p className="font-mono text-sm">
                        {newUser.role === "student" ? newUser.lrn : createdUser.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Password</p>
                      <p className="font-mono text-sm">{createdUser.password}</p>
                    </div>
                  </div>
                  <Button onClick={copyCredentials} variant="outline" className="w-full">
                    {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                    {copied ? "Copied!" : "Copy Credentials"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    {newUser.role === "student" 
                      ? "Student will login using their 12-digit LRN."
                      : "The user should change their password after first login."}
                  </p>
                  <div className="flex gap-3">
                    <DialogClose asChild>
                      <Button variant="outline" className="flex-1">Done</Button>
                    </DialogClose>
                    <Button className="flex-1" onClick={resetForm}>Create Another</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v, email: "", lrn: "" })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Juan Dela Cruz"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    />
                  </div>
                  {newUser.role === "student" ? (
                    <div className="grid gap-2">
                      <Label htmlFor="lrn">LRN (Learner Reference Number)</Label>
                      <Input
                        id="lrn"
                        placeholder="123456789012"
                        maxLength={12}
                        value={newUser.lrn}
                        onChange={(e) => {
                          const lrn = e.target.value.replace(/\D/g, "").slice(0, 12)
                          setNewUser({ ...newUser, lrn, email: lrn })
                        }}
                      />
                      <p className="text-xs text-muted-foreground">12-digit LRN will be used as login username</p>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="juan@school.edu"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <Button type="button" variant="outline" onClick={generatePassword}>
                        Generate
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button 
                      onClick={handleCreateUser} 
                      disabled={loading || !newUser.name || !newUser.password || !newUser.role || (newUser.role === "student" ? !newUser.lrn : !newUser.email)}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        {fetchingUsers ? (
          <Card className="bg-card border-border">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : users.length > 0 ? (
          <DataTable columns={columns} data={filteredUsers} />
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">No accounts created yet</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Create user accounts for students, teachers, and administrators.
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Account
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}