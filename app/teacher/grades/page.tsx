"use client"

import { useState, useMemo, useEffect } from "react"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Plus, Calculator, Settings2, RotateCcw, Loader2 } from "lucide-react"
import { getGradeInfo, getGradeColorVariant, percentageToPhGrade } from "@/lib/grade-utils"
import { Progress } from "@/components/ui/progress"
import { useGradeWeightsStore, defaultGradeWeights, type GradeWeight } from "@/lib/grade-weights-store"
import { Slider } from "@/components/ui/slider"
import { createClient } from "@/lib/supabase/client"

interface ClassData {
  id: string
  name: string
  grade: string
  section: string
  subject: string
}

interface StudentData {
  id: string
  name: string
  email: string
  avatar: string | null
}

interface GradeData {
  id: string
  student_id: string
  class_id: string
  score: number
  max_score: number
  percentage: number
  grade: number
  type: string
  date: string
}

// Custom calculateFinalGrade that uses the store weights
function calculateFinalGradeWithWeights(
  assessments: { type: string; percentage: number }[],
  weights: GradeWeight[]
): number {
  const typeAverages: Record<string, { total: number; count: number }> = {}

  assessments.forEach((a) => {
    if (!typeAverages[a.type]) {
      typeAverages[a.type] = { total: 0, count: 0 }
    }
    typeAverages[a.type].total += a.percentage
    typeAverages[a.type].count++
  })

  let totalWeight = 0
  let weightedSum = 0

  weights.forEach((w) => {
    const typeAvg = typeAverages[w.type]
    if (typeAvg && typeAvg.count > 0) {
      const avg = typeAvg.total / typeAvg.count
      weightedSum += avg * (w.weight / 100)
      totalWeight += w.weight
    }
  })

  if (totalWeight === 0) return 0
  const normalizedPercentage = (weightedSum / totalWeight) * 100
  return percentageToPhGrade(normalizedPercentage)
}

export default function TeacherGradesPage() {
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")
  const [teacherClasses, setTeacherClasses] = useState<ClassData[]>([])
  const [classStudents, setClassStudents] = useState<StudentData[]>([])
  const [classGrades, setClassGrades] = useState<GradeData[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [newGradeScore, setNewGradeScore] = useState("")
  const [newGradeType, setNewGradeType] = useState<string>("")
  const [newGradeStudent, setNewGradeStudent] = useState<string>("")
  const [weightsDialogOpen, setWeightsDialogOpen] = useState(false)
  const [tempWeights, setTempWeights] = useState<GradeWeight[]>(defaultGradeWeights)
  const [saving, setSaving] = useState(false)

  const { getWeightsForClass, setWeightsForClass, resetWeightsForClass } = useGradeWeightsStore()
  const classWeights = getWeightsForClass(selectedClass)

  useEffect(() => {
    fetchTeacherData()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      fetchClassStudents()
      fetchClassGrades()
    }
  }, [selectedClass])

  const fetchTeacherData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setUserId(user.id)

    // Fetch teacher's classes
    const { data: classes } = await supabase
      .from("classes")
      .select("id, name, grade, section, subject")
      .eq("teacher_id", user.id)
      .order("name")

    if (classes && classes.length > 0) {
      setTeacherClasses(classes)
      setSelectedClass(classes[0].id)
    }
    setLoading(false)
  }

  const fetchClassStudents = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("class_students")
      .select(`
        student:users!class_students_student_id_fkey (id, name, email, avatar)
      `)
      .eq("class_id", selectedClass)

    if (data) {
      setClassStudents(data.map(d => d.student as unknown as StudentData))
    }
  }

  const fetchClassGrades = async () => {
    const supabase = createClient()
    
    // Fetch regular grades
    const { data: grades } = await supabase
      .from("grades")
      .select("*")
      .eq("class_id", selectedClass)

    // Fetch quiz attempts for this class
    const { data: quizAttempts } = await supabase
      .from("quiz_attempts")
      .select(`
        *,
        quiz:quizzes!inner (class_id)
      `)
      .eq("quiz.class_id", selectedClass)

    const allGrades: GradeData[] = grades || []

    // Convert quiz attempts to grade format
    if (quizAttempts) {
      quizAttempts.forEach(attempt => {
        // Avoid duplicates
        const exists = allGrades.some(g => 
          g.type === "quiz" && 
          g.student_id === attempt.student_id && 
          g.date === attempt.completed_at
        )
        if (!exists) {
          allGrades.push({
            id: `quiz-${attempt.id}`,
            student_id: attempt.student_id,
            class_id: selectedClass,
            score: attempt.score,
            max_score: attempt.max_score,
            percentage: attempt.percentage,
            grade: percentageToPhGrade(attempt.percentage),
            type: "quiz",
            date: attempt.completed_at,
          })
        }
      })
    }

    setClassGrades(allGrades)
  }

  const handleAddGrade = async () => {
    if (!newGradeStudent || !newGradeType || !newGradeScore) return
    setSaving(true)

    try {
      const response = await fetch("/api/teacher/grades/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: newGradeStudent,
          classId: selectedClass,
          score: Number.parseInt(newGradeScore),
          maxScore: 100, // Assuming 100 for manual entry for now
          type: newGradeType,
          date: new Date().toISOString().split("T")[0],
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add grade")
      }

      setNewGradeScore("")
      setNewGradeType("")
      setNewGradeStudent("")
      toast.success("Grade added successfully")
      fetchClassGrades()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const selectedClassData = teacherClasses.find((c) => c.id === selectedClass)

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Manage Grades" subtitle="Enter and view student grades (Philippine Grading System)" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Manage Grades" subtitle="Enter and view student grades (Philippine Grading System)" userId={userId} />
      <div className="p-4 lg:p-6">
        {/* Grade Scale Reference */}
        <div className="grid gap-6 mb-6 md:grid-cols-2">
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Philippine Grading Scale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="default">96-100: Excellent</Badge>
                <Badge variant="default">90-95: Outstanding</Badge>
                <Badge variant="secondary">85-89: Very Satisfactory</Badge>
                <Badge variant="secondary">80-84: Satisfactory</Badge>
                <Badge variant="outline">75-79: Fairly Satisfactory</Badge>
                <Badge variant="destructive">Below 75: Failed</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Current Grade Weights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 text-xs">
                {classWeights.map((w) => (
                  <Badge key={w.type} variant="outline">
                    {w.label}: {w.weight}%
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Class Selection */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {teacherClasses.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} - Grade {cls.grade}{cls.section}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Dialog open={weightsDialogOpen} onOpenChange={(open) => {
              setWeightsDialogOpen(open)
              if (open) setTempWeights([...classWeights])
            }}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Grade Weights
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Configure Grade Weights</DialogTitle>
                  <DialogDescription>
                    Customize how each assessment type contributes to the final grade. Total must equal 100%.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {tempWeights.map((weight, index) => (
                    <div key={weight.type} className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label className="capitalize">{weight.label}</Label>
                        <span className="text-sm font-medium">{weight.weight}%</span>
                      </div>
                      <Slider
                        value={[weight.weight]}
                        onValueChange={(value: number[]) => {
                          const newWeights = [...tempWeights]
                          newWeights[index] = { ...weight, weight: value[0] }
                          setTempWeights(newWeights)
                        }}
                        max={100}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  ))}
                  <div className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className={`text-sm font-bold ${tempWeights.reduce((sum, w) => sum + w.weight, 0) === 100 ? "text-green-500" : "text-destructive"}`}>
                        {tempWeights.reduce((sum, w) => sum + w.weight, 0)}%
                      </span>
                    </div>
                    {tempWeights.reduce((sum, w) => sum + w.weight, 0) !== 100 && (
                      <p className="text-xs text-destructive mt-1">Weights must total 100%</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      resetWeightsForClass(selectedClass)
                      setTempWeights([...defaultGradeWeights])
                    }}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to Default
                  </Button>
                  <div className="flex gap-2">
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      onClick={() => {
                        if (tempWeights.reduce((sum, w) => sum + w.weight, 0) === 100) {
                          setWeightsForClass(selectedClass, tempWeights)
                          setWeightsDialogOpen(false)
                        }
                      }}
                      disabled={tempWeights.reduce((sum, w) => sum + w.weight, 0) !== 100}
                    >
                      Save Weights
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Grade Entry
                </Button>
              </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Grade</DialogTitle>
                <DialogDescription>
                  Enter a score (0-100). The Philippine grade will be auto-computed.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="student">Student</Label>
                  <Select value={newGradeStudent} onValueChange={setNewGradeStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      {classStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Assessment Type</Label>
                    <Select value={newGradeType} onValueChange={setNewGradeType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {classWeights.map((w) => (
                          <SelectItem key={w.type} value={w.type}>
                            {w.label} ({w.weight}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="score">Score (%)</Label>
                    <Input
                      id="score"
                      type="number"
                      placeholder="0-100"
                      max={100}
                      min={0}
                      value={newGradeScore}
                      onChange={(e) => setNewGradeScore(e.target.value)}
                    />
                  </div>
                </div>
                {newGradeScore && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-sm text-muted-foreground">Auto-computed Philippine Grade:</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-bold">
                        {percentageToPhGrade(Number.parseInt(newGradeScore) || 0)}
                      </span>
                      <Badge
                        variant={getGradeColorVariant(
                          getGradeInfo(percentageToPhGrade(Number.parseInt(newGradeScore) || 0)).status,
                        )}
                      >
                        {getGradeInfo(percentageToPhGrade(Number.parseInt(newGradeScore) || 0)).remarks}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddGrade} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Grade
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Students and Grades */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              {selectedClassData?.name || "Select a Class"} - Student Grades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {classStudents.map((student) => {
                const studentGrades = classGrades.filter((g) => g.student_id === student.id)

                // Calculate final grade
                const assessments = studentGrades.map((g) => ({
                  type: g.type,
                  percentage: g.percentage,
                }))
                const finalGrade = calculateFinalGradeWithWeights(assessments, classWeights)
                const gradeInfo = getGradeInfo(finalGrade)

                return (
                  <div key={student.id} className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-card-foreground">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                      {studentGrades.length > 0 && (
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Final Grade</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold">{finalGrade}</span>
                            <Badge variant={getGradeColorVariant(gradeInfo.status)}>{gradeInfo.remarks}</Badge>
                          </div>
                        </div>
                      )}
                    </div>
                    {studentGrades.length > 0 ? (
                      <>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {studentGrades.map((grade) => {
                            const info = getGradeInfo(grade.grade)
                            return (
                              <div key={grade.id} className="rounded border border-border bg-background px-3 py-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground capitalize">{grade.type}</span>
                                  <Badge variant={getGradeColorVariant(info.status)} className="text-xs">
                                    {grade.grade}
                                  </Badge>
                                  <span className="text-sm font-medium">
                                    {grade.score}/{grade.max_score}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        <Progress value={finalGrade} className="h-1.5" />
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No grades recorded yet</p>
                    )}
                  </div>
                )
              })}

              {classStudents.length === 0 && (
                <p className="py-8 text-center text-muted-foreground">
                  No students found for this class. Select a different class.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}