"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  Users,
  Download,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  useAssignmentStore,
  type Assignment,
  type AssignmentSubmission,
  type AssignmentStatus,
} from "@/lib/assignment-store"

interface TeacherAssignmentManagerProps {
  teacherId: string
  teacherName: string
  classes: { id: string; name: string }[]
}

export function TeacherAssignmentManager({ teacherId, teacherName, classes }: TeacherAssignmentManagerProps) {
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id || "")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [gradeScore, setGradeScore] = useState("")
  const [gradeFeedback, setGradeFeedback] = useState("")
  const [saving, setSaving] = useState(false)

  const [newAssignment, setNewAssignment] = useState<Partial<Assignment>>({
    status: "draft",
    maxScore: 100,
    allowLateSubmission: true,
    attachments: [],
  })

  const {
    assignments,
    submissions,
    createAssignment,
    updateAssignment,
    gradeSubmission,
    getAssignmentsByClass,
    getSubmissionsByAssignment,
  } = useAssignmentStore()

  const classAssignments = getAssignmentsByClass(selectedClass)
  const selectedClassName = classes.find((c) => c.id === selectedClass)?.name || ""

  const handleCreateAssignment = () => {
    if (!newAssignment.title || !newAssignment.dueDate) return
    setSaving(true)

    createAssignment({
      title: newAssignment.title,
      description: newAssignment.description || "",
      classId: selectedClass,
      className: selectedClassName,
      teacherId,
      teacherName,
      dueDate: newAssignment.dueDate,
      maxScore: newAssignment.maxScore || 100,
      allowLateSubmission: newAssignment.allowLateSubmission || false,
      attachments: [],
      status: newAssignment.status as AssignmentStatus,
    })

    toast.success("Assignment created successfully")
    setCreateDialogOpen(false)
    setNewAssignment({
      status: "draft",
      maxScore: 100,
      allowLateSubmission: true,
      attachments: [],
    })
    setSaving(false)
  }

  const handleGradeSubmission = () => {
    if (!selectedSubmission || !gradeScore) return
    setSaving(true)

    gradeSubmission(selectedSubmission.id, parseInt(gradeScore), gradeFeedback, teacherId)

    toast.success("Submission graded successfully")
    setGradeDialogOpen(false)
    setSelectedSubmission(null)
    setGradeScore("")
    setGradeFeedback("")
    setSaving(false)
  }

  const handlePublish = (assignmentId: string) => {
    updateAssignment(assignmentId, { status: "published" })
    toast.success("Assignment published")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Title</Label>
                <Input
                  value={newAssignment.title || ""}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  placeholder="Assignment title"
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={newAssignment.description || ""}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  placeholder="Assignment instructions..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={newAssignment.dueDate || ""}
                    onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Max Score</Label>
                  <Input
                    type="number"
                    value={newAssignment.maxScore || 100}
                    onChange={(e) => setNewAssignment({ ...newAssignment, maxScore: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={newAssignment.allowLateSubmission}
                  onCheckedChange={(checked) => setNewAssignment({ ...newAssignment, allowLateSubmission: checked })}
                />
                <Label>Allow late submissions</Label>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={newAssignment.status}
                  onValueChange={(v) => setNewAssignment({ ...newAssignment, status: v as AssignmentStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreateAssignment} disabled={saving || !newAssignment.title || !newAssignment.dueDate}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="assignments">
        <TabsList>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="submissions">Pending Grading</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4 mt-4">
          {classAssignments.length === 0 ? (
            <Card className="bg-card">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No assignments for this class yet.</p>
              </CardContent>
            </Card>
          ) : (
            classAssignments.map((assignment) => {
              const assignmentSubmissions = getSubmissionsByAssignment(assignment.id)
              const gradedCount = assignmentSubmissions.filter((s) => s.status === "graded").length
              const pendingCount = assignmentSubmissions.filter((s) => s.status === "submitted").length

              return (
                <Card key={assignment.id} className="bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={assignment.status === "published" ? "default" : "secondary"}>
                            {assignment.status}
                          </Badge>
                          {pendingCount > 0 && (
                            <Badge variant="outline" className="text-amber-500 border-amber-500">
                              {pendingCount} pending
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-medium text-card-foreground">{assignment.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {assignment.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due: {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {gradedCount}/{assignmentSubmissions.length} graded
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {assignment.status === "draft" && (
                          <Button size="sm" onClick={() => handlePublish(assignment.id)}>
                            Publish
                          </Button>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAssignment(assignment)}
                            >
                              View Submissions
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{assignment.title} - Submissions</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 py-4">
                              {assignmentSubmissions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                  No submissions yet
                                </p>
                              ) : (
                                assignmentSubmissions.map((submission) => (
                                  <div
                                    key={submission.id}
                                    className="flex items-center justify-between rounded-lg border border-border p-3"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                          {submission.studentName.split(" ").map((n) => n[0]).join("")}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <p className="font-medium text-sm">{submission.studentName}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {format(new Date(submission.submittedAt), "MMM d 'at' h:mm a")}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {submission.status === "graded" ? (
                                        <Badge variant="default">
                                          {submission.score}/{assignment.maxScore}
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary">{submission.status}</Badge>
                                      )}
                                      {submission.status !== "graded" && (
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            setSelectedSubmission(submission)
                                            setGradeDialogOpen(true)
                                          }}
                                        >
                                          Grade
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4 mt-4">
          {(() => {
            const pendingSubmissions = submissions.filter((s) => {
              const assignment = assignments.find((a) => a.id === s.assignmentId)
              return assignment?.teacherId === teacherId && s.status === "submitted"
            })

            if (pendingSubmissions.length === 0) {
              return (
                <Card className="bg-card">
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p className="text-muted-foreground">All submissions have been graded!</p>
                  </CardContent>
                </Card>
              )
            }

            return pendingSubmissions.map((submission) => {
              const assignment = assignments.find((a) => a.id === submission.assignmentId)
              if (!assignment) return null

              return (
                <Card key={submission.id} className="bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {submission.studentName.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{submission.studentName}</p>
                          <p className="text-sm text-muted-foreground">{assignment.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Submitted {format(new Date(submission.submittedAt), "MMM d 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          setSelectedSubmission(submission)
                          setSelectedAssignment(assignment)
                          setGradeDialogOpen(true)
                        }}
                      >
                        Grade
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          })()}
        </TabsContent>
      </Tabs>

      {/* Grade Dialog */}
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
          </DialogHeader>
          {selectedSubmission && selectedAssignment && (
            <div className="space-y-4 py-4">
              <div>
                <p className="font-medium">{selectedSubmission.studentName}</p>
                <p className="text-sm text-muted-foreground">{selectedAssignment.title}</p>
              </div>
              {selectedSubmission.files.length > 0 && (
                <div>
                  <Label className="text-sm">Submitted Files</Label>
                  <div className="mt-2 space-y-2">
                    {selectedSubmission.files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between rounded border border-border p-2">
                        <span className="text-sm">{file.name}</span>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedSubmission.comment && (
                <div>
                  <Label className="text-sm">Student Comment</Label>
                  <p className="mt-1 text-sm bg-muted/50 rounded p-2">{selectedSubmission.comment}</p>
                </div>
              )}
              <div className="grid gap-2">
                <Label>Score (out of {selectedAssignment.maxScore})</Label>
                <Input
                  type="number"
                  max={selectedAssignment.maxScore}
                  min={0}
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  placeholder="Enter score"
                />
              </div>
              <div className="grid gap-2">
                <Label>Feedback</Label>
                <Textarea
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="Provide feedback for the student..."
                  rows={4}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleGradeSubmission} disabled={saving || !gradeScore}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Grade
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
