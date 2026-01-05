"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  FileText,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  MessageSquare,
} from "lucide-react"
import { format, isPast, formatDistanceToNow } from "date-fns"
import {
  useAssignmentStore,
  type Assignment,
} from "@/lib/assignment-store"

interface StudentAssignmentListProps {
  studentId: string
  studentName: string
  classIds: string[]
}

export function StudentAssignmentList({ studentId, studentName, classIds }: StudentAssignmentListProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [submissionComment, setSubmissionComment] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const { submitAssignment, getStudentSubmission, getAssignmentsForStudent } = useAssignmentStore()

  const studentAssignments = getAssignmentsForStudent(studentId, classIds)

  const getSubmissionStatus = (assignment: Assignment) => {
    const submission = getStudentSubmission(assignment.id, studentId)
    if (!submission) {
      return isPast(new Date(assignment.dueDate)) ? "overdue" : "pending"
    }
    return submission.status
  }

  const handleSubmit = () => {
    if (!selectedAssignment) return

    submitAssignment({
      assignmentId: selectedAssignment.id,
      studentId,
      studentName,
      files: uploadedFiles.map((f, i) => ({
        id: `file-${i}`,
        name: f.name,
        type: f.type,
        url: URL.createObjectURL(f),
        size: `${(f.size / 1024).toFixed(1)} KB`,
      })),
      comment: submissionComment || undefined,
    })

    setSubmitDialogOpen(false)
    setSelectedAssignment(null)
    setSubmissionComment("")
    setUploadedFiles([])
  }

  const statusConfig = {
    pending: { label: "Not Submitted", variant: "outline" as const, icon: Clock },
    submitted: { label: "Submitted", variant: "secondary" as const, icon: CheckCircle },
    graded: { label: "Graded", variant: "default" as const, icon: CheckCircle },
    late: { label: "Late", variant: "destructive" as const, icon: AlertCircle },
    overdue: { label: "Overdue", variant: "destructive" as const, icon: AlertCircle },
  }

  return (
    <div className="space-y-4">
      {studentAssignments.length === 0 ? (
        <Card className="bg-card">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No assignments available.</p>
          </CardContent>
        </Card>
      ) : (
        studentAssignments.map((assignment) => {
          const status = getSubmissionStatus(assignment)
          const submission = getStudentSubmission(assignment.id, studentId)
          const config = statusConfig[status]
          const StatusIcon = config.icon
          const dueDate = new Date(assignment.dueDate)
          const isOverdue = isPast(dueDate) && !submission

          return (
            <Card key={assignment.id} className="bg-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={config.variant} className="flex items-center gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{assignment.className}</span>
                    </div>
                    <h3 className="font-medium text-card-foreground">{assignment.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {assignment.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due: {format(dueDate, "MMM d, yyyy")}
                        {!isOverdue && !submission && (
                          <span className="text-primary ml-1">
                            ({formatDistanceToNow(dueDate, { addSuffix: true })})
                          </span>
                        )}
                      </span>
                      <span>Max Score: {assignment.maxScore}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {submission?.status === "graded" && (
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{submission.score}</p>
                        <p className="text-xs text-muted-foreground">/ {assignment.maxScore}</p>
                      </div>
                    )}
                    {!submission && !isOverdue && (
                      <Dialog open={submitDialogOpen && selectedAssignment?.id === assignment.id} onOpenChange={(open) => {
                        setSubmitDialogOpen(open)
                        if (open) setSelectedAssignment(assignment)
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Upload className="mr-2 h-4 w-4" />
                            Submit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Submit Assignment</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <h4 className="font-medium">{assignment.title}</h4>
                              <p className="text-sm text-muted-foreground">{assignment.className}</p>
                            </div>
                            <div className="grid gap-2">
                              <Label>Upload Files</Label>
                              <Input
                                type="file"
                                multiple
                                onChange={(e) => setUploadedFiles(Array.from(e.target.files || []))}
                              />
                              {uploadedFiles.length > 0 && (
                                <div className="text-sm text-muted-foreground">
                                  {uploadedFiles.length} file(s) selected
                                </div>
                              )}
                            </div>
                            <div className="grid gap-2">
                              <Label>Comment (optional)</Label>
                              <Textarea
                                value={submissionComment}
                                onChange={(e) => setSubmissionComment(e.target.value)}
                                placeholder="Add a note for your teacher..."
                                rows={3}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button onClick={handleSubmit} disabled={uploadedFiles.length === 0}>
                              Submit Assignment
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    {submission && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Submission Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <h4 className="font-medium">{assignment.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                Submitted {format(new Date(submission.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                              </p>
                            </div>
                            {submission.files.length > 0 && (
                              <div>
                                <Label className="text-sm">Submitted Files</Label>
                                <div className="mt-2 space-y-2">
                                  {submission.files.map((file) => (
                                    <div key={file.id} className="flex items-center justify-between rounded border border-border p-2">
                                      <span className="text-sm">{file.name}</span>
                                      <span className="text-xs text-muted-foreground">{file.size}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {submission.comment && (
                              <div>
                                <Label className="text-sm">Your Comment</Label>
                                <p className="mt-1 text-sm text-muted-foreground">{submission.comment}</p>
                              </div>
                            )}
                            {submission.status === "graded" && (
                              <>
                                <div className="rounded-lg bg-primary/10 p-4">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Score</span>
                                    <span className="text-2xl font-bold text-primary">
                                      {submission.score}/{assignment.maxScore}
                                    </span>
                                  </div>
                                  <Progress value={(submission.score! / assignment.maxScore) * 100} className="mt-2" />
                                </div>
                                {submission.feedback && (
                                  <div>
                                    <Label className="text-sm flex items-center gap-1">
                                      <MessageSquare className="h-3 w-3" />
                                      Teacher Feedback
                                    </Label>
                                    <p className="mt-1 text-sm bg-muted/50 rounded p-3">{submission.feedback}</p>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
