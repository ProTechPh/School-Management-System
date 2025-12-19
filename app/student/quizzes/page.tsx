"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Clock, FileQuestion, CheckCircle, XCircle, AlertCircle, Loader2, HelpCircle, AlertTriangle, Timer } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface QuizQuestion {
  id: string
  question: string
  type: string
  options: string[] | null
  correct_answer: string | null
  points: number
}

interface Quiz {
  id: string
  title: string
  description: string | null
  duration: number
  due_date: string | null
  class_id: string
  class_name: string
  teacher_id: string | null
  questions: QuizQuestion[]
}

interface QuizAttempt {
  quiz_id: string
  score: number
  max_score: number
  percentage: number
  completed_at: string
}

export default function StudentQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState("")
  const [takingQuiz, setTakingQuiz] = useState<Quiz | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<(number | string)[]>([])
  const [showResults, setShowResults] = useState(false)
  const [quizResult, setQuizResult] = useState<{ score: number; maxScore: number; percentage: number } | null>(null)
  const [completedQuizzes, setCompletedQuizzes] = useState<Map<string, QuizAttempt>>(new Map())
  const [timeRemaining, setTimeRemaining] = useState(0) // in seconds
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [currentAttemptId, setCurrentAttemptId] = useState<string | null>(null)
  
  // Activity tracking for anti-cheating - use ref to avoid stale closure issues
  const activityLogRef = useRef({
    tabSwitches: 0,
    copyPasteCount: 0,
    exitAttempts: 0,
    rightClicks: 0
  })
  const [activityLog, setActivityLog] = useState({
    tabSwitches: 0,
    copyPasteCount: 0,
    exitAttempts: 0,
    rightClicks: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  // Timer countdown effect
  useEffect(() => {
    if (!takingQuiz || showResults || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Time's up - auto submit
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [takingQuiz, showResults, timeRemaining])

  // Auto-submit when time runs out
  useEffect(() => {
    if (takingQuiz && timeRemaining === 0 && !showResults && !isSubmitting) {
      handleSubmitQuiz()
    }
  }, [timeRemaining, takingQuiz, showResults, isSubmitting])

  // Anti-cheating: Track tab switches, copy/paste, right-click
  useEffect(() => {
    if (!takingQuiz || showResults) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        activityLogRef.current.tabSwitches += 1
        setActivityLog({ ...activityLogRef.current })
        console.log("Tab switch detected:", activityLogRef.current.tabSwitches)
      }
    }

    const handleBlur = () => {
      // Only count blur if not already hidden (avoid double counting)
      if (!document.hidden) {
        activityLogRef.current.tabSwitches += 1
        setActivityLog({ ...activityLogRef.current })
        console.log("Window blur detected:", activityLogRef.current.tabSwitches)
      }
    }

    const handleCopy = (e: ClipboardEvent) => {
      activityLogRef.current.copyPasteCount += 1
      setActivityLog({ ...activityLogRef.current })
      console.log("Copy detected:", activityLogRef.current.copyPasteCount)
      e.preventDefault()
    }

    const handlePaste = (e: ClipboardEvent) => {
      activityLogRef.current.copyPasteCount += 1
      setActivityLog({ ...activityLogRef.current })
      console.log("Paste detected:", activityLogRef.current.copyPasteCount)
    }

    const handleContextMenu = (e: MouseEvent) => {
      activityLogRef.current.rightClicks += 1
      setActivityLog({ ...activityLogRef.current })
      console.log("Right-click detected:", activityLogRef.current.rightClicks)
      e.preventDefault()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect Ctrl+C, Ctrl+V, Ctrl+A
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "c" || e.key === "v" || e.key === "a") {
          activityLogRef.current.copyPasteCount += 1
          setActivityLog({ ...activityLogRef.current })
          console.log(`Ctrl+${e.key.toUpperCase()} detected:`, activityLogRef.current.copyPasteCount)
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleBlur)
    document.addEventListener("copy", handleCopy)
    document.addEventListener("paste", handlePaste)
    document.addEventListener("contextmenu", handleContextMenu)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleBlur)
      document.removeEventListener("copy", handleCopy)
      document.removeEventListener("paste", handlePaste)
      document.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [takingQuiz, showResults, currentAttemptId])

  // Log activity to database
  const logActivity = async (eventType: string, details: string) => {
    if (!currentAttemptId || !takingQuiz) return
    
    const supabase = createClient()
    await supabase.from("quiz_activity_logs").insert({
      attempt_id: currentAttemptId,
      student_id: userId,
      quiz_id: takingQuiz.id,
      event_type: eventType,
      details
    })
  }

  const fetchData = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    // Get student's enrolled classes
    const { data: enrollments } = await supabase
      .from("class_students")
      .select("class_id")
      .eq("student_id", user.id)

    if (enrollments && enrollments.length > 0) {
      const classIds = enrollments.map(e => e.class_id)

      const { data: quizData } = await supabase
        .from("quizzes")
        .select(`
          id, title, description, duration, due_date, teacher_id, class_id,
          class:classes (name),
          questions:quiz_questions (id, question, type, options, correct_answer, points)
        `)
        .in("class_id", classIds)
        .eq("status", "published")
        .order("created_at", { ascending: false })

      if (quizData) {
        setQuizzes(quizData.map(q => ({
          id: q.id,
          title: q.title,
          description: q.description,
          duration: q.duration,
          due_date: q.due_date,
          class_id: q.class_id,
          class_name: (q.class as any)?.name || "Unknown",
          teacher_id: q.teacher_id,
          questions: ((q.questions as any) || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
        })))
      }
    }

    // Fetch existing completed quiz attempts for this student
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("quiz_id, score, max_score, percentage, completed_at")
      .eq("student_id", user.id)
      .not("completed_at", "is", null)

    if (attempts) {
      const attemptsMap = new Map<string, QuizAttempt>()
      attempts.forEach(attempt => {
        attemptsMap.set(attempt.quiz_id, attempt)
      })
      setCompletedQuizzes(attemptsMap)
    }

    setLoading(false)
  }

  const handleStartQuiz = async (quiz: Quiz) => {
    setTakingQuiz(quiz)
    setCurrentQuestion(0)
    // Initialize answers based on question type
    const initialAnswers = quiz.questions.map(q => {
      if (q.type === "identification" || q.type === "essay") {
        return "" // Text answer
      }
      return -1 // Index for multiple choice / true-false
    })
    setSelectedAnswers(initialAnswers)
    setShowResults(false)
    setQuizResult(null)
    setIsSubmitting(false)
    // Set timer based on quiz duration (convert minutes to seconds)
    setTimeRemaining(quiz.duration * 60)
    
    // Reset activity tracking
    activityLogRef.current = { tabSwitches: 0, copyPasteCount: 0, exitAttempts: 0, rightClicks: 0 }
    setActivityLog({ tabSwitches: 0, copyPasteCount: 0, exitAttempts: 0, rightClicks: 0 })
    
    // Create attempt record immediately so we can log activities
    const supabase = createClient()
    const { data: attemptData } = await supabase
      .from("quiz_attempts")
      .insert({
        quiz_id: quiz.id,
        student_id: userId,
        score: 0,
        max_score: 0,
        percentage: 0,
        needs_grading: false,
        completed_at: null, // Will be set on submit
        tab_switches: 0,
        copy_paste_count: 0,
        exit_attempts: 0
      })
      .select()
      .single()
    
    if (attemptData) {
      setCurrentAttemptId(attemptData.id)
    }
  }

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleSelectAnswer = (answer: number | string) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = answer
    setSelectedAnswers(newAnswers)
  }

  const handleSubmitQuiz = async () => {
    if (!takingQuiz || isSubmitting || !currentAttemptId) return
    setIsSubmitting(true)

    let score = 0
    let maxScore = 0
    let needsGrading = false
    
    takingQuiz.questions.forEach((question, index) => {
      maxScore += question.points
      const answer = selectedAnswers[index]
      
      if (question.type === "multiple-choice" || question.type === "true-false") {
        // For multiple choice/true-false, correct_answer is the index as string
        if (question.options && answer !== -1) {
          const correctIndex = parseInt(question.correct_answer || "0", 10)
          if (answer === correctIndex) {
            score += question.points
          }
        }
      } else if (question.type === "identification") {
        // For identification, compare text (case sensitivity based on question settings)
        const studentAnswer = String(answer).trim()
        const correctAnswer = (question.correct_answer || "").trim()
        // Default to case-insensitive comparison
        if (studentAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
          score += question.points
        }
      } else if (question.type === "essay") {
        // Essay questions need manual grading
        needsGrading = true
      }
    })

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
    
    // Update existing attempt with final scores and activity counts
    const supabase = createClient()
    console.log("Submitting with activity:", activityLogRef.current)
    const { data: attemptData, error } = await supabase
      .from("quiz_attempts")
      .update({
        score,
        max_score: maxScore,
        percentage,
        needs_grading: needsGrading,
        completed_at: new Date().toISOString(),
        tab_switches: activityLogRef.current.tabSwitches,
        copy_paste_count: activityLogRef.current.copyPasteCount,
        exit_attempts: activityLogRef.current.exitAttempts
      })
      .eq("id", currentAttemptId)
      .select()
      .single()

    if (error || !attemptData) {
      toast.error("Failed to save quiz attempt", { description: error?.message })
    } else {
      // Save individual question answers
      const answersToInsert = takingQuiz.questions.map((question, index) => {
        const answer = selectedAnswers[index]
        let isCorrect = false
        let pointsAwarded = 0
        let answerText = ""

        if (question.type === "multiple-choice" || question.type === "true-false") {
          const correctIndex = parseInt(question.correct_answer || "0", 10)
          isCorrect = answer === correctIndex
          pointsAwarded = isCorrect ? question.points : 0
          answerText = question.options?.[answer as number] || String(answer)
        } else if (question.type === "identification") {
          const studentAnswer = String(answer).trim()
          const correctAnswer = (question.correct_answer || "").trim()
          isCorrect = studentAnswer.toLowerCase() === correctAnswer.toLowerCase()
          pointsAwarded = isCorrect ? question.points : 0
          answerText = studentAnswer
        } else if (question.type === "essay") {
          // Essay - no auto grading
          answerText = String(answer)
          isCorrect = false
          pointsAwarded = 0
        }

        return {
          attempt_id: attemptData.id,
          question_id: question.id,
          answer: answerText,
          is_correct: isCorrect,
          points_awarded: pointsAwarded
        }
      })

      await supabase.from("quiz_attempt_answers").insert(answersToInsert)

      // Auto-sync quiz score to grades table
      // Calculate the grade (Philippine grading: percentage maps to grade)
      const gradeValue = Math.round(percentage * 0.25 + 75) // Simple conversion: 0% = 75, 100% = 100
      const finalGrade = Math.min(100, Math.max(60, gradeValue)) // Clamp between 60-100
      
      await supabase.from("grades").insert({
        student_id: userId,
        class_id: takingQuiz.class_id,
        type: "quiz",
        score: score,
        max_score: maxScore,
        percentage: percentage,
        grade: finalGrade,
        date: new Date().toISOString().split("T")[0]
      })

      // Update local state to mark quiz as completed
      setCompletedQuizzes(prev => {
        const newMap = new Map(prev)
        newMap.set(takingQuiz.id, {
          quiz_id: takingQuiz.id,
          score,
          max_score: maxScore,
          percentage,
          completed_at: new Date().toISOString()
        })
        return newMap
      })
    }

    setQuizResult({ score, maxScore, percentage })
    setShowResults(true)
    
    if (percentage >= 75) {
      toast.success("Great job!", { description: `You scored ${percentage}%` })
    } else {
      toast.info("Quiz completed", { description: `You scored ${percentage}%` })
    }
  }

  const handleCloseQuiz = () => {
    // Only allow closing if showing results or not taking quiz
    if (!showResults && takingQuiz && !isSubmitting) {
      // Show confirmation dialog
      setShowExitConfirm(true)
      return
    }
    doCloseQuiz()
  }

  const doCloseQuiz = async () => {
    // Log exit attempt if quiz was in progress
    if (currentAttemptId && takingQuiz && !showResults) {
      setActivityLog(prev => ({ ...prev, exitAttempts: prev.exitAttempts + 1 }))
      await logActivity("exit_attempt", "User exited quiz without submitting")
      
      // Delete the incomplete attempt
      const supabase = createClient()
      await supabase.from("quiz_attempts").delete().eq("id", currentAttemptId)
    }
    
    setTakingQuiz(null)
    setShowResults(false)
    setQuizResult(null)
    setTimeRemaining(0)
    setIsSubmitting(false)
    setShowExitConfirm(false)
    setCurrentAttemptId(null)
    activityLogRef.current = { tabSwitches: 0, copyPasteCount: 0, exitAttempts: 0, rightClicks: 0 }
    setActivityLog({ tabSwitches: 0, copyPasteCount: 0, exitAttempts: 0, rightClicks: 0 })
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Quizzes" subtitle="View and take your class quizzes" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Quizzes" subtitle="View and take your class quizzes" userId={userId} />
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Available Quizzes</h2>
          <p className="text-sm text-muted-foreground">{quizzes.length} quizzes available</p>
        </div>

        <Dialog open={!!takingQuiz} onOpenChange={handleCloseQuiz}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Quiz Header with Timer */}
            {!showResults && takingQuiz && (
              <>
                <DialogHeader className="sr-only">
                  <DialogTitle>{takingQuiz.title}</DialogTitle>
                </DialogHeader>
                <div className={`-mx-6 -mt-6 px-6 py-4 border-b ${
                  timeRemaining <= 60 ? "bg-red-500/10 border-red-500/30" : 
                  timeRemaining <= 300 ? "bg-amber-500/10 border-amber-500/30" : 
                  "bg-primary/5 border-primary/20"
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">{takingQuiz.title}</h2>
                      <p className="text-sm text-muted-foreground">{takingQuiz.class_name}</p>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-lg font-mono font-bold ${
                      timeRemaining <= 60 ? "bg-red-500/20 text-red-500 animate-pulse" : 
                      timeRemaining <= 300 ? "bg-amber-500/20 text-amber-500" : 
                      "bg-primary/20 text-primary"
                    }`}>
                      <Clock className="h-5 w-5" />
                      {formatTime(timeRemaining)}
                    </div>
                  </div>
                </div>
              </>
            )}

            {showResults && (
              <DialogHeader>
                <DialogTitle>Quiz Results</DialogTitle>
              </DialogHeader>
            )}

            {takingQuiz && !showResults && takingQuiz.questions.length > 0 && (
              <div className="py-4 flex-1 overflow-y-auto">
                {/* Question Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono">
                        Q{currentQuestion + 1}/{takingQuiz.questions.length}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {takingQuiz.questions[currentQuestion].type?.replace("-", " ")}
                      </Badge>
                    </div>
                    <Badge className="bg-primary/20 text-primary border-0">
                      {takingQuiz.questions[currentQuestion].points} points
                    </Badge>
                  </div>
                  <Progress value={((currentQuestion + 1) / takingQuiz.questions.length) * 100} className="h-2" />
                </div>

                {/* Question Card */}
                <div className="rounded-xl border border-border bg-card p-6 mb-6">
                  <h3 className="mb-6 text-lg font-medium text-foreground leading-relaxed">
                    {takingQuiz.questions[currentQuestion].question}
                  </h3>
                  
                  {/* Multiple Choice / True-False */}
                  {(takingQuiz.questions[currentQuestion].type === "multiple-choice" || 
                    takingQuiz.questions[currentQuestion].type === "true-false") && 
                    takingQuiz.questions[currentQuestion].options && (
                    <div className="space-y-3">
                      {takingQuiz.questions[currentQuestion].options!.map((option, index) => (
                        <button
                          key={index}
                          className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                            selectedAnswers[currentQuestion] === index
                              ? "border-primary bg-primary/10 text-foreground shadow-md shadow-primary/20"
                              : "border-border hover:border-primary/50 hover:bg-muted/50 text-foreground"
                          }`}
                          onClick={() => handleSelectAnswer(index)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              selectedAnswers[currentQuestion] === index
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {String.fromCharCode(65 + index)}
                            </div>
                            <span className="flex-1">{option}</span>
                            {selectedAnswers[currentQuestion] === index && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Identification */}
                  {takingQuiz.questions[currentQuestion].type === "identification" && (
                    <div className="space-y-2">
                      <Input
                        placeholder="Type your answer here..."
                        value={selectedAnswers[currentQuestion] as string || ""}
                        onChange={(e) => handleSelectAnswer(e.target.value)}
                        className="text-foreground text-lg p-4 h-14"
                      />
                    </div>
                  )}
                  
                  {/* Essay */}
                  {takingQuiz.questions[currentQuestion].type === "essay" && (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Write your essay answer here..."
                        value={selectedAnswers[currentQuestion] as string || ""}
                        onChange={(e) => handleSelectAnswer(e.target.value)}
                        className="min-h-[180px] text-foreground resize-none"
                      />
                      <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 px-3 py-2 rounded-lg">
                        <HelpCircle className="h-4 w-4" />
                        Essay questions will be graded manually by your teacher.
                      </div>
                    </div>
                  )}
                </div>

                {/* Question Navigation Dots */}
                <div className="flex items-center justify-center gap-1 mb-4">
                  {takingQuiz.questions.map((_, idx) => {
                    const isAnswered = typeof selectedAnswers[idx] === "number" 
                      ? selectedAnswers[idx] !== -1 
                      : selectedAnswers[idx] !== ""
                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentQuestion(idx)}
                        className={`h-2 rounded-full transition-all ${
                          idx === currentQuestion 
                            ? "w-6 bg-primary" 
                            : isAnswered 
                              ? "w-2 bg-green-500" 
                              : "w-2 bg-muted-foreground/30"
                        }`}
                      />
                    )
                  })}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))} 
                    disabled={currentQuestion === 0}
                    className="flex-1"
                  >
                    Previous
                  </Button>
                  {currentQuestion < takingQuiz.questions.length - 1 ? (
                    <Button 
                      onClick={() => setCurrentQuestion((prev) => prev + 1)} 
                      disabled={
                        (typeof selectedAnswers[currentQuestion] === "number" && selectedAnswers[currentQuestion] === -1) ||
                        (typeof selectedAnswers[currentQuestion] === "string" && selectedAnswers[currentQuestion] === "")
                      }
                      className="flex-1"
                    >
                      Next Question
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSubmitQuiz} 
                      disabled={isSubmitting || selectedAnswers.some((a) => 
                        (typeof a === "number" && a === -1) || 
                        (typeof a === "string" && a === "")
                      )}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Quiz"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {showResults && quizResult && takingQuiz && (
              <div className="py-4">
                <div className="mb-6 text-center">
                  <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${quizResult.percentage >= 75 ? "bg-green-500/10" : "bg-red-500/10"}`}>
                    {quizResult.percentage >= 75 ? (
                      <CheckCircle className="h-10 w-10 text-green-500" />
                    ) : (
                      <XCircle className="h-10 w-10 text-red-500" />
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">{quizResult.percentage}%</h3>
                  <p className="text-muted-foreground">{quizResult.score} out of {quizResult.maxScore} points</p>
                </div>

                <div className="mb-6 space-y-3">
                  <h4 className="font-medium text-foreground">Review Answers</h4>
                  {takingQuiz.questions.map((question, index) => {
                    const answer = selectedAnswers[index]
                    let isCorrect = false
                    let studentAnswer = ""
                    let correctAnswer = ""
                    let needsManualGrading = false

                    if (question.type === "multiple-choice" || question.type === "true-false") {
                      const correctIndex = parseInt(question.correct_answer || "0", 10)
                      studentAnswer = question.options?.[answer as number] || "Not answered"
                      correctAnswer = question.options?.[correctIndex] || ""
                      isCorrect = answer === correctIndex
                    } else if (question.type === "identification") {
                      studentAnswer = String(answer || "Not answered")
                      correctAnswer = question.correct_answer || ""
                      isCorrect = studentAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
                    } else if (question.type === "essay") {
                      studentAnswer = String(answer || "Not answered")
                      needsManualGrading = true
                    }

                    return (
                      <div key={question.id} className="rounded-lg border border-border p-3">
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{index + 1}. {question.question}</p>
                            <Badge variant="outline" className="text-xs capitalize">
                              {question.type?.replace("-", " ")}
                            </Badge>
                          </div>
                          {needsManualGrading ? (
                            <HelpCircle className="h-5 w-5 shrink-0 text-amber-500" />
                          ) : isCorrect ? (
                            <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 shrink-0 text-red-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Your answer: <span className={needsManualGrading ? "text-foreground" : isCorrect ? "text-green-500" : "text-red-500"}>
                            {studentAnswer.length > 100 ? studentAnswer.substring(0, 100) + "..." : studentAnswer}
                          </span>
                        </p>
                        {needsManualGrading && (
                          <p className="text-xs text-amber-500 mt-1">This answer will be graded by your teacher</p>
                        )}
                        {!needsManualGrading && !isCorrect && correctAnswer && (
                          <p className="text-sm text-green-500">Correct: {correctAnswer}</p>
                        )}
                      </div>
                    )
                  })}
                </div>

                <Button className="w-full" onClick={handleCloseQuiz}>Close</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {quizzes.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => {
              const isPastDue = quiz.due_date && new Date(quiz.due_date) < new Date()
              const attempt = completedQuizzes.get(quiz.id)
              const isCompleted = !!attempt

              return (
                <Card key={quiz.id} className="bg-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{quiz.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{quiz.class_name}</p>
                      </div>
                      {isCompleted ? (
                        <Badge variant="default" className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>
                      ) : isPastDue ? (
                        <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" />Past Due</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{quiz.description || "No description"}</p>

                    <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileQuestion className="h-4 w-4" />
                        <span>{quiz.questions.length} questions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{quiz.duration} min</span>
                      </div>
                    </div>

                    {isCompleted && attempt ? (
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className={`font-medium ${attempt.percentage >= 75 ? "text-green-500" : "text-red-500"}`}>
                            Score: {attempt.percentage}%
                          </span>
                          <span className="text-muted-foreground ml-2">({attempt.score}/{attempt.max_score})</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(attempt.completed_at).toLocaleDateString()}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Due: {quiz.due_date ? new Date(quiz.due_date).toLocaleDateString() : "No due date"}
                        </span>
                        <Button size="sm" onClick={() => handleStartQuiz(quiz)} disabled={isPastDue || quiz.questions.length === 0}>
                          Start Quiz
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card className="bg-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileQuestion className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No quizzes available yet</p>
            </CardContent>
          </Card>
        )}

        {/* Exit Confirmation Dialog */}
        <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <AlertDialogTitle>Exit Quiz?</AlertDialogTitle>
                  <AlertDialogDescription className="mt-1">
                    Are you sure you want to exit? Your progress will be lost and this will count as an incomplete attempt.
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                <span>Time remaining: {formatTime(timeRemaining)}</span>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Quiz</AlertDialogCancel>
              <AlertDialogAction 
                onClick={doCloseQuiz}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Exit Quiz
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
