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
  const [quizResult, setQuizResult] = useState<{ score: number; maxScore: number; percentage: number; needsGrading: boolean } | null>(null)
  const [completedQuizzes, setCompletedQuizzes] = useState<Map<string, QuizAttempt>>(new Map())
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  
  const activityLogRef = useRef({
    tabSwitches: 0,
    copyPasteCount: 0,
    exitAttempts: 0,
    rightClicks: 0
  })

  useEffect(() => {
    fetchData()
    
    // Anti-cheating listeners
    const handleVisibilityChange = () => {
      if (document.hidden && takingQuiz && !showResults) {
        activityLogRef.current.tabSwitches++
      }
    }

    const handleCopy = () => {
      if (takingQuiz && !showResults) {
        activityLogRef.current.copyPasteCount++
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("copy", handleCopy)
    document.addEventListener("paste", handleCopy)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("copy", handleCopy)
      document.removeEventListener("paste", handleCopy)
    }
  }, [takingQuiz, showResults])

  useEffect(() => {
    if (!takingQuiz || showResults || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [takingQuiz, showResults, timeRemaining])

  useEffect(() => {
    if (takingQuiz && timeRemaining === 0 && !showResults && !isSubmitting) {
      handleSubmitQuiz()
    }
  }, [timeRemaining, takingQuiz, showResults, isSubmitting])

  const fetchData = async () => {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

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
          questions:quiz_questions (id, question, type, options, points)
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
    const initialAnswers = quiz.questions.map(q => {
      if (q.type === "identification" || q.type === "essay") {
        return ""
      }
      return -1
    })
    setSelectedAnswers(initialAnswers)
    setShowResults(false)
    setQuizResult(null)
    setIsSubmitting(false)
    setTimeRemaining(quiz.duration * 60)
    
    activityLogRef.current = { tabSwitches: 0, copyPasteCount: 0, exitAttempts: 0, rightClicks: 0 }
  }

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
    if (!takingQuiz || isSubmitting) return
    setIsSubmitting(true)

    try {
      // Prepare answers payload
      const answersPayload = takingQuiz.questions.map((question, index) => {
        const answer = selectedAnswers[index]
        let answerValue: string | number = answer

        // For multiple choice/true-false, we send the index
        // For text inputs, we send the string
        
        return {
          questionId: question.id,
          answer: answerValue
        }
      })

      // Call secure API
      const response = await fetch("/api/student/submit-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: takingQuiz.id,
          answers: answersPayload,
          activityLog: activityLogRef.current
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit quiz")
      }

      // Update local state
      setQuizResult({
        score: result.score,
        maxScore: result.maxScore,
        percentage: result.percentage,
        needsGrading: result.needsGrading
      })
      
      setCompletedQuizzes(prev => {
        const newMap = new Map(prev)
        newMap.set(takingQuiz.id, {
          quiz_id: takingQuiz.id,
          score: result.score,
          max_score: result.maxScore,
          percentage: result.percentage,
          completed_at: new Date().toISOString()
        })
        return newMap
      })

      setShowResults(true)
      toast.success("Quiz submitted successfully!")

    } catch (error: any) {
      toast.error("Submission failed", { description: error.message })
      setIsSubmitting(false)
    }
  }

  const handleCloseQuiz = () => {
    if (!showResults && takingQuiz && !isSubmitting) {
      setShowExitConfirm(true)
      return
    }
    doCloseQuiz()
  }

  const doCloseQuiz = () => {
    if (!showResults && takingQuiz) {
      // If closing without submitting, consider logging an "exit attempt"
      // In a real app, you might want to auto-submit here
    }
    
    setTakingQuiz(null)
    setShowResults(false)
    setQuizResult(null)
    setTimeRemaining(0)
    setIsSubmitting(false)
    setShowExitConfirm(false)
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
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Available Quizzes</h2>
          <p className="text-sm text-muted-foreground">{quizzes.length} quizzes available</p>
        </div>

        <Dialog open={!!takingQuiz} onOpenChange={handleCloseQuiz}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
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

            {takingQuiz && showResults && quizResult && (
              <div className="py-8 text-center space-y-6">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                    <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-500" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Quiz Submitted!</h3>
                  <p className="text-muted-foreground mt-2">
                    {quizResult.needsGrading 
                      ? "Your quiz includes questions that need manual grading. Your final score will be updated once the teacher reviews it." 
                      : "Your quiz has been automatically graded."}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className="text-2xl font-bold">{quizResult.score} / {quizResult.maxScore}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Percentage</p>
                    <p className="text-2xl font-bold">{quizResult.percentage}%</p>
                  </div>
                </div>

                <Button onClick={doCloseQuiz} className="w-full max-w-sm">
                  Return to Dashboard
                </Button>
              </div>
            )}

            {takingQuiz && !showResults && takingQuiz.questions.length > 0 && (
              <div className="py-4 flex-1 overflow-y-auto">
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

                <div className="rounded-xl border border-border bg-card p-6 mb-6">
                  <h3 className="mb-6 text-lg font-medium text-foreground leading-relaxed">
                    {takingQuiz.questions[currentQuestion].question}
                  </h3>
                  
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
                  
                  {takingQuiz.questions[currentQuestion].type === "essay" && (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Write your essay answer here..."
                        value={selectedAnswers[currentQuestion] as string || ""}
                        onChange={(e) => handleSelectAnswer(e.target.value)}
                        className="min-h-[180px] text-foreground resize-none"
                      />
                    </div>
                  )}
                </div>

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
                          <span className="text-muted-foreground">Submitted</span>
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
                    Are you sure you want to exit? Your progress will be lost.
                  </AlertDialogDescription>
                </div>
              </div>
            </AlertDialogHeader>
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