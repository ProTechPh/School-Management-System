toast.success("Quiz reopened for student")
    fetchData()
  }

  const handleRemoveReopenEntry = async (quizId: string, studentId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from("quiz_reopens")
      .delete()
      .eq("quiz_id", quizId)
      .eq("student_id", studentId)
    
    if (error) {
      toast.error("Failed to remove reopen entry", { description: error.message })
      return
    }
    toast.success("Reopen entry removed")
    fetchData()
  }

  const isQuizExpired = (quiz: Quiz) => {
    return quiz.due_date ? new Date(quiz.due_date) < new Date() : false
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <DashboardHeader title="Quizzes" subtitle="Create and manage quizzes" />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DashboardHeader title="Quizzes" subtitle="Create and manage quizzes" userId={userId} />
      <div className="p-4 lg:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">My Quizzes</h2>
            <p className="text-sm text-muted-foreground">{quizzes.length} quizzes created</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Create Quiz</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Quiz</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Quiz Title</Label>
                    <Input id="title" placeholder="Enter quiz title" value={newQuiz.title} onChange={(e) => setNewQuiz((prev) => ({ ...prev, title: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class">Class</Label>
                    <Select value={newQuiz.classId} onValueChange={(value) => setNewQuiz((prev) => ({ ...prev, classId: value }))}>
                      <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        {teacherClasses.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input id="duration" type="number" min={5} value={newQuiz.duration} onChange={(e) => setNewQuiz((prev) => ({ ...prev, duration: Number.parseInt(e.target.value) || 30 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input id="dueDate" type="date" value={newQuiz.dueDate} onChange={(e) => setNewQuiz((prev) => ({ ...prev, dueDate: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Brief description of the quiz" value={newQuiz.description} onChange={(e) => setNewQuiz((prev) => ({ ...prev, description: e.target.value }))} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Questions ({newQuiz.questions.length})</Label>
                    <div className="flex items-center gap-2">
                      <Select value={questionType} onValueChange={(v) => setQuestionType(v as QuestionType)}>
                        <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                          <SelectItem value="true-false">True/False</SelectItem>
                          <SelectItem value="identification">Identification</SelectItem>
                          <SelectItem value="essay">Essay</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleAddQuestion()}><Plus className="mr-1 h-3 w-3" />Add</Button>
                    </div>
                  </div>
                  {newQuiz.questions.length > 0 ? (
                    <div className="space-y-4">
                      {newQuiz.questions.map((question, qIndex) => (
                        <div key={question.id} className="rounded-lg border border-border bg-muted/30 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">Question {qIndex + 1}</span>
                              <Badge variant="outline" className="text-xs capitalize">{question.type.replace("-", " ")}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input type="number" min={1} className="w-20" placeholder="Points" value={question.points} onChange={(e) => handleQuestionChange(question.id, "points", Number.parseInt(e.target.value) || 10)} />
                              <span className="text-sm text-muted-foreground">pts</span>
                              <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleRemoveQuestion(question.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </div>
                          <Input className="mb-3" placeholder="Enter question" value={question.question} onChange={(e) => handleQuestionChange(question.id, "question", e.target.value)} />
                          {question.type === "multiple-choice" && question.options && (
                            <div className="space-y-2">
                              {question.options.map((option, oIndex) => (
                                <div key={oIndex} className="flex items-center gap-2">
                                  <input type="radio" name={`correct-${question.id}`} checked={question.correctAnswer === oIndex} onChange={() => handleQuestionChange(question.id, "correctAnswer", oIndex)} className="h-4 w-4 accent-primary" />
                                  <Input placeholder={`Option ${oIndex + 1}`} value={option} onChange={(e) => handleOptionChange(question.id, oIndex, e.target.value)} />
                                </div>
                              ))}
                            </div>
                          )}
                          {question.type === "true-false" && question.options && (
                            <div className="flex gap-4">
                              {question.options.map((option, oIndex) => (
                                <label key={oIndex} className="flex items-center gap-2 cursor-pointer">
                                  <input type="radio" name={`correct-${question.id}`} checked={question.correctAnswer === oIndex} onChange={() => handleQuestionChange(question.id, "correctAnswer", oIndex)} className="h-4 w-4 accent-primary" />
                                  <span className="text-sm">{option}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          {question.type === "identification" && (
                            <div className="space-y-2">
                              <Input placeholder="Correct answer" value={question.correctAnswer as string || ""} onChange={(e) => handleQuestionChange(question.id, "correctAnswer", e.target.value)} />
                              <div className="flex items-center gap-2">
                                <Switch id={`case-${question.id}`} checked={question.caseSensitive || false} onCheckedChange={(checked) => handleQuestionChange(question.id, "caseSensitive", checked)} />
                                <Label htmlFor={`case-${question.id}`} className="text-xs text-muted-foreground">Case sensitive</Label>
                              </div>
                            </div>
                          )}
                          {question.type === "essay" && (
                            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">Essay questions require manual grading by the teacher.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center">
                      <FileQuestion className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Add questions to your quiz</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={handleCreateQuiz} disabled={creating || !newQuiz.title || !newQuiz.classId || newQuiz.questions.length === 0}>
                    {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Create Quiz
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Dialog open={!!viewingQuiz} onOpenChange={() => setViewingQuiz(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{viewingQuiz?.title} - Results</DialogTitle>
            </DialogHeader>
            {viewingQuiz && (
              <div className="py-4">
                <div className="mb-4 grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{getQuizAttempts(viewingQuiz.id).length}</p>
                    <p className="text-xs text-muted-foreground">Submissions</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {getQuizAttempts(viewingQuiz.id).length > 0 ? Math.round(getQuizAttempts(viewingQuiz.id).reduce((sum, a) => sum + a.percentage, 0) / getQuizAttempts(viewingQuiz.id).length) : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground">Average Score</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-2xl font-bold text-foreground">{viewingQuiz.questions?.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Questions</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Student Submissions</h4>
                  {getQuizAttempts(viewingQuiz.id).length > 0 ? (
                    <div className="space-y-2">
                      {getQuizAttempts(viewingQuiz.id).map((attempt) => (
                        <div key={attempt.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{attempt.student?.name}</p>
                              {attempt.needs_grading && <Badge variant="outline" className="text-amber-500 border-amber-500 text-xs">Needs Grading</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">Completed {new Date(attempt.completed_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={attempt.percentage >= 70 ? "default" : "destructive"}>{attempt.score}/{attempt.max_score} ({attempt.percentage}%)</Badge>
                            <Button variant="outline" size="sm" onClick={() => handleOpenGrading(attempt)}><Edit3 className="h-3 w-3 mr-1" />Grade</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No submissions yet</p>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!gradingAttempt} onOpenChange={() => { setGradingAttempt(null); setGradingAnswers([]); setActivityLogs([]); setAttemptActivitySummary(null); }}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Edit3 className="h-5 w-5" />Grade Quiz - {gradingAttempt?.student?.name}</DialogTitle>
            </DialogHeader>
            {gradingLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="py-4 space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm bg-muted/50 rounded-lg p-3">
                  <div><span className="text-muted-foreground">Current Score:</span><span className="ml-2 font-medium">{gradingAnswers.reduce((sum, a) => sum + (a.points_awarded || 0), 0)}</span></div>
                  <div><span className="text-muted-foreground">Max Score:</span><span className="ml-2 font-medium">{gradingAnswers.reduce((sum, a) => sum + (a.question?.points || 0), 0)}</span></div>
                  <div><span className="text-muted-foreground">Percentage:</span><span className="ml-2 font-medium">{gradingAnswers.length > 0 ? Math.round((gradingAnswers.reduce((sum, a) => sum + (a.points_awarded || 0), 0) / gradingAnswers.reduce((sum, a) => sum + (a.question?.points || 0), 0)) * 100) : 0}%</span></div>
                </div>

                {attemptActivitySummary && (attemptActivitySummary.tab_switches > 0 || attemptActivitySummary.copy_paste_count > 0 || attemptActivitySummary.exit_attempts > 0) && (
                  <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="font-medium text-amber-500 text-sm">Unverified Client Metrics (Self-Reported)</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Info className="h-3 w-3" />
                        <span>Metrics are advisory only</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <MousePointer className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Tab Switches:</span>
                        <span className={`font-medium ${attemptActivitySummary.tab_switches > 3 ? "text-red-500" : attemptActivitySummary.tab_switches > 0 ? "text-amber-500" : ""}`}>{attemptActivitySummary.tab_switches}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Copy className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Copy/Paste:</span>
                        <span className={`font-medium ${attemptActivitySummary.copy_paste_count > 3 ? "text-red-500" : attemptActivitySummary.copy_paste_count > 0 ? "text-amber-500" : ""}`}>{attemptActivitySummary.copy_paste_count}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <LogOut className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Exit Attempts:</span>
                        <span className={`font-medium ${attemptActivitySummary.exit_attempts > 0 ? "text-red-500" : ""}`}>{attemptActivitySummary.exit_attempts}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      Note: These flags are captured by the student's browser and can be bypassed. They should be used as supporting evidence rather than definitive proof of academic dishonesty.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {gradingAnswers.map((answer, index) => {
                    const question = answer.question
                    const correctIndex = parseInt(question?.correct_answer || "0", 10)
                    const correctOption = question?.options?.[correctIndex]
                    
                    return (
                      <div key={answer.id} className="rounded-lg border border-border p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">Q{index + 1}.</span>
                              <Badge variant="outline" className="text-xs capitalize">{question?.type?.replace("-", " ")}</Badge>
                              <span className="text-xs text-muted-foreground">({question?.points} pts)</span>
                            </div>
                            <p className="text-sm">{question?.question}</p>
                          </div>
                        </div>
                        <div className="space-y-2 ml-4">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Student's Answer: </span>
                            <span className={answer.is_correct ? "text-green-500 font-medium" : "text-foreground"}>{answer.answer || "(No answer)"}</span>
                          </div>
                          {(question?.type === "multiple-choice" || question?.type === "true-false") && correctOption && (
                            <div className="text-sm"><span className="text-muted-foreground">Correct Answer: </span><span className="text-green-500">{correctOption}</span></div>
                          )}
                          {question?.type === "identification" && question?.correct_answer && (
                            <div className="text-sm"><span className="text-muted-foreground">Expected Answer: </span><span className="text-green-500">{question.correct_answer}</span></div>
                          )}
                          <div className="flex items-center gap-4 pt-2 border-t border-border mt-2">
                            <div className="flex items-center gap-2">
                              <Checkbox id={`correct-${answer.id}`} checked={answer.is_correct} onCheckedChange={(checked) => handleUpdateAnswer(answer.id, "is_correct", !!checked)} />
                              <Label htmlFor={`correct-${answer.id}`} className="text-sm cursor-pointer">Mark as Correct</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">Points:</Label>
                              <Input type="number" min={0} max={question?.points || 100} value={answer.points_awarded} onChange={(e) => handleUpdateAnswer(answer.id, "points_awarded", Number(e.target.value))} className="w-20 h-8" />
                              <span className="text-xs text-muted-foreground">/ {question?.points}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => { setGradingAttempt(null); setGradingAnswers([]); setActivityLogs([]); setAttemptActivitySummary(null); }}>Cancel</Button>
                  <Button onClick={handleSaveGrading} disabled={gradingLoading}>{gradingLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save Grading</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!viewingQuizDetails} onOpenChange={() => setViewingQuizDetails(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{viewingQuizDetails?.title}</DialogTitle></DialogHeader>
            {viewingQuizDetails && (
              <div className="py-4 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Class:</span><span className="ml-2 font-medium">{viewingQuizDetails.class?.name}</span></div>
                  <div><span className="text-muted-foreground">Duration:</span><span className="ml-2 font-medium">{viewingQuizDetails.duration} minutes</span></div>
                  <div><span className="text-muted-foreground">Due Date:</span><span className="ml-2 font-medium">{viewingQuizDetails.due_date || "No due date"}</span></div>
                  <div><span className="text-muted-foreground">Status:</span><Badge className="ml-2" variant={viewingQuizDetails.status === "published" ? "default" : "secondary"}>{viewingQuizDetails.status}</Badge></div>
                </div>
                {viewingQuizDetails.description && (<div><span className="text-sm text-muted-foreground">Description:</span><p className="mt-1 text-sm">{viewingQuizDetails.description}</p></div>)}
                <div className="space-y-3">
                  <h4 className="font-medium">Questions ({viewingQuizDetails.questions?.length || 0})</h4>
                  {viewingQuizDetails.questions && viewingQuizDetails.questions.length > 0 ? (
                    viewingQuizDetails.questions.map((q: any, index: number) => (
                      <div key={q.id} className="rounded-lg border border-border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Question {index + 1}</span>
                          <div className="flex items-center gap-2"><Badge variant="outline" className="text-xs capitalize">{q.type?.replace("-", " ") || "Unknown"}</Badge><span className="text-xs text-muted-foreground">{q.points} pts</span></div>
                        </div>
                        <p className="text-sm mb-2">{q.question}</p>
                        {q.options && Array.isArray(q.options) && (
                          <div className="space-y-1 ml-4">
                            {q.options.map((opt: string, optIndex: number) => (
                              <div key={optIndex} className={`text-sm flex items-center gap-2 ${String(q.correct_answer) === String(optIndex) ? "text-green-500 font-medium" : "text-muted-foreground"}`}>
                                <span>{String.fromCharCode(65 + optIndex)}.</span><span>{opt}</span>{String(q.correct_answer) === String(optIndex) && <Badge variant="default" className="text-xs bg-green-500">Correct</Badge>}
                              </div>
                            ))}
                          </div>
                        )}
                        {q.type === "identification" && q.correct_answer && (<div className="ml-4 text-sm"><span className="text-muted-foreground">Answer: </span><span className="text-green-500 font-medium">{q.correct_answer}</span></div>)}
                        {q.type === "essay" && (<p className="ml-4 text-xs text-muted-foreground italic">Essay - requires manual grading</p>)}
                      </div>
                    ))
                  ) : (<p className="text-sm text-muted-foreground text-center py-4">No questions added</p>)}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!reopenQuiz} onOpenChange={() => setReopenQuiz(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" />Reopen Quiz for Student</DialogTitle></DialogHeader>
            {reopenQuiz && (
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">Allow a specific student to take "{reopenQuiz.title}" after the due date has passed.</p>
                <div className="space-y-2">
                  <Label>Select Student</Label>
                  <Select value={reopenData.studentId} onValueChange={(value) => setReopenData((prev) => ({ ...prev, studentId: value }))}>
                    <SelectTrigger><SelectValue placeholder="Choose a student" /></SelectTrigger>
                    <SelectContent>
                      {getStudentsWhoHaventTaken(reopenQuiz).map((student) => (
                        <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {getStudentsWhoHaventTaken(reopenQuiz).length === 0 && <p className="text-xs text-muted-foreground">All students have already taken this quiz.</p>}
                </div>
                <div className="space-y-2"><Label>New Due Date</Label><Input type="date" value={reopenData.newDueDate} onChange={(e) => setReopenData((prev) => ({ ...prev, newDueDate: e.target.value }))} min={new Date().toISOString().split("T")[0]} /></div>
                <div className="space-y-2"><Label>Reason (Optional)</Label><Textarea placeholder="e.g., Medical excuse, family emergency..." value={reopenData.reason} onChange={(e) => setReopenData((prev) => ({ ...prev, reason: e.target.value }))} /></div>
                {reopenQuiz.reopens && reopenQuiz.reopens.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Currently Reopened For:</Label>
                    <div className="space-y-1">
                      {reopenQuiz.reopens.map((entry) => (
                        <div key={entry.student_id} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-xs">
                          <span>{entry.student?.name} (until {entry.new_due_date})</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveReopenEntry(reopenQuiz.id, entry.student_id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={handleReopenForStudent} disabled={!reopenData.studentId || !reopenData.newDueDate}><UserPlus className="mr-2 h-4 w-4" />Reopen for Student</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => {
            const attempts = getQuizAttempts(quiz.id)
            return (
              <Card key={quiz.id} className="bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div><CardTitle className="text-base">{quiz.title}</CardTitle><p className="text-sm text-muted-foreground">{quiz.class?.name}</p></div>
                    <Badge variant={quiz.status === "published" ? "default" : "secondary"}>{quiz.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground line-clamp-2">{quiz.description}</p>
                  <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1"><FileQuestion className="h-4 w-4" /><span>{quiz.questions?.length || 0} questions</span></div>
                    <div className="flex items-center gap-1"><Clock className="h-4 w-4" /><span>{quiz.duration} min</span></div>
                  </div>
                  <div className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"><Users className="h-4 w-4" /><span>{attempts.length} submissions</span></div>
                  {quiz.reopens && quiz.reopens.length > 0 && (
                    <div className="mb-2"><Badge variant="outline" className="text-xs gap-1"><UserPlus className="h-3 w-3" />Reopened for {quiz.reopens.length} student(s)</Badge></div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${isQuizExpired(quiz) ? "text-destructive" : "text-muted-foreground"}`}>Due: {quiz.due_date || "No due date"} {quiz.due_date && isQuizExpired(quiz) && "(Expired)"}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setReopenQuiz(quiz)} title="Reopen for student"><UserPlus className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingQuiz(quiz)}><BarChart className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingQuizDetails(quiz)} title="View quiz details"><Eye className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        {quizzes.length === 0 && (
          <div className="text-center py-12">
            <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No quizzes created yet. Create your first quiz!</p>
          </div>
        )}
      </div>
    </div>
  )
}