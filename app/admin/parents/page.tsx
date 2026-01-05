"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"
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
import { Card, CardContent } from "@/components/ui/card"
import { Search, Loader2, UserPlus, Users, Trash2, Link as LinkIcon } from "lucide-react"

interface Parent {
  id: string
  name: string
  email: string
  children: Array<{ id: string; name: string; relationship: string }>
}

interface Student {
  id: string
  name: string
  email: string
}

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [selectedParent, setSelectedParent] = useState<string>("")
  const [selectedStudent, setSelectedStudent] = useState<string>("")
  const [relationship, setRelationship] = useState<string>("guardian")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setFetchingData(true)
    try {
      const [parentsRes, studentsRes] = await Promise.all([
        fetch("/api/admin/parents"),
        fetch("/api/admin/students")
      ])

      if (parentsRes.ok) {
        const data = await parentsRes.json()
        setParents(data.parents || [])
      }

      if (studentsRes.ok) {
        const data = await studentsRes.json()
        setStudents(data.students || [])
      }
    } catch (error) {
      toast.error("Error loading data")
      console.error(error)
    } finally {
      setFetchingData(false)
    }
  }

  const handleLinkChild = async () => {
    if (!selectedParent || !selectedStudent) {
      toast.error("Please select both parent and student")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/admin/link-parent-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: selectedParent,
          studentId: selectedStudent,
          relationship
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to link parent and child")
      }

      toast.success("Parent and child linked successfully")
      setLinkDialogOpen(false)
      setSelectedParent("")
      setSelectedStudent("")
      setRelationship("guardian")
      fetchData()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlinkChild = async (parentId: string, studentId: string) => {
    if (!confirm("Are you sure you want to unlink this parent-child relationship?")) {
      return
    }

    try {
      const response = await fetch("/api/admin/unlink-parent-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId, studentId })
      })

      if (!response.ok) {
        throw new Error("Failed to unlink")
      }

      toast.success("Relationship removed")
      fetchData()
    } catch (error) {
      toast.error("Error removing relationship")
    }
  }

  const filteredParents = parents.filter((parent) =>
    parent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    parent.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen">
      <DashboardHeader 
        title="Parent Management" 
        subtitle="Manage parent accounts and link them to students" 
      />
      <div className="p-4 lg:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search parents..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <LinkIcon className="mr-2 h-4 w-4" />
                Link Parent to Child
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Link Parent to Student</DialogTitle>
                <DialogDescription>
                  Connect a parent account to a student account
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="parent">Parent</Label>
                  <Select value={selectedParent} onValueChange={setSelectedParent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent" />
                    </SelectTrigger>
                    <SelectContent>
                      {parents.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.name} ({parent.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="student">Student</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="relationship">Relationship</Label>
                  <Select value={relationship} onValueChange={setRelationship}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mother">Mother</SelectItem>
                      <SelectItem value="father">Father</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleLinkChild} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Linking...
                      </>
                    ) : (
                      "Link"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {fetchingData ? (
          <Card className="bg-card border-border">
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : filteredParents.length > 0 ? (
          <div className="grid gap-4">
            {filteredParents.map((parent) => (
              <Card key={parent.id} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-card-foreground">{parent.name}</h3>
                      <p className="text-sm text-muted-foreground">{parent.email}</p>
                    </div>
                    <Badge variant="secondary">
                      <Users className="mr-1 h-3 w-3" />
                      {parent.children.length} {parent.children.length === 1 ? "child" : "children"}
                    </Badge>
                  </div>

                  {parent.children.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Children:</p>
                      {parent.children.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                        >
                          <div>
                            <p className="font-medium text-sm">{child.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{child.relationship}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUnlinkChild(parent.id, child.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No children linked yet</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">No parents found</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Create parent accounts in the Users page first, then link them to students here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
