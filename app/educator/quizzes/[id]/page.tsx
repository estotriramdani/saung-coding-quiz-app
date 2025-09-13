"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Role } from "@prisma/client"
import { useRouter } from "next/navigation"
import useSWR, { mutate } from "swr"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

// Define QuestionType locally since it might not be available from Prisma yet
enum QuestionType {
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  TRUE_FALSE = "TRUE_FALSE",
  SHORT_ANSWER = "SHORT_ANSWER"
}

const questionSchema = z.object({
  question: z.string().min(1, "Question is required"),
  type: z.nativeEnum(QuestionType),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  explanation: z.string().optional(),
  points: z.number().min(1, "Points must be at least 1"),
})

const quizEditSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  materialUrl: z.string().url().optional().or(z.literal("")),
  timeLimit: z.number().min(1, "Time limit must be at least 1 minute").optional(),
  maxAttempts: z.number().min(1, "Max attempts must be at least 1").optional(),
})

type QuestionForm = z.infer<typeof questionSchema>
type QuizEditForm = z.infer<typeof quizEditSchema>

interface Quiz {
  id: string
  title: string
  description: string | null
  code: string
  materialUrl: string | null
  timeLimit: number | null
  maxAttempts: number | null
  isActive: boolean
  createdAt: string
  questions: Array<{
    id: string
    question: string
    type: keyof typeof QuestionType
    options: string[] | null
    correctAnswer: string
    explanation: string | null
    points: number
  }>
  _count: {
    questions: number
    attempts: number
    enrollments: number
  }
}

export default function QuizDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "questions" | "settings">("overview")
  const [quizId, setQuizId] = useState<string | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importPreview, setImportPreview] = useState<any[] | null>(null)
  const [isEditingQuiz, setIsEditingQuiz] = useState(false)

  // Await params
  useEffect(() => {
    params.then(({ id }) => setQuizId(id))
  }, [params])

  const { data: quiz, error } = useSWR<Quiz>(quizId ? `/api/quizzes/${quizId}` : null, fetcher)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<QuestionForm>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      type: QuestionType.MULTIPLE_CHOICE,
      points: 1,
      options: ["", "", "", ""],
    }
  })

  const {
    register: registerQuiz,
    handleSubmit: handleSubmitQuiz,
    reset: resetQuiz,
    formState: { errors: quizErrors },
  } = useForm<QuizEditForm>({
    resolver: zodResolver(quizEditSchema),
  })

  const watchQuestionType = watch("type")

  if (!session || (session.user.role !== Role.EDUCATOR && session.user.role !== Role.ADMIN)) {
    return (
      <div className="alert alert-error">
        <span>You don't have permission to access this quiz.</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Failed to load quiz details</span>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  const addQuestion = async (data: QuestionForm) => {
    if (!quizId) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/quizzes/${quizId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await mutate(`/api/quizzes/${quizId}`)
        reset({
          type: QuestionType.MULTIPLE_CHOICE,
          points: 1,
          options: ["", "", "", ""],
        })
      } else {
        throw new Error("Failed to add question")
      }
    } catch (error) {
      console.error("Error adding question:", error)
      alert("Failed to add question")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteQuestion = async (questionId: string) => {
    if (!quizId || !confirm("Are you sure you want to delete this question?")) return

    try {
      const response = await fetch(`/api/quizzes/${quizId}/questions/${questionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await mutate(`/api/quizzes/${quizId}`)
      } else {
        throw new Error("Failed to delete question")
      }
    } catch (error) {
      console.error("Error deleting question:", error)
      alert("Failed to delete question")
    }
  }

  const editQuestion = async (data: QuestionForm) => {
    if (!quizId || !editingQuestion) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/quizzes/${quizId}/questions/${editingQuestion}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        await mutate(`/api/quizzes/${quizId}`)
        setEditingQuestion(null)
        reset({
          type: QuestionType.MULTIPLE_CHOICE,
          points: 1,
          options: ["", "", "", ""],
        })
      } else {
        throw new Error("Failed to edit question")
      }
    } catch (error) {
      console.error("Error editing question:", error)
      alert("Failed to edit question")
    } finally {
      setIsLoading(false)
    }
  }

  const startEditing = (question: Quiz['questions'][0]) => {
    setEditingQuestion(question.id)
    reset({
      question: question.question,
      type: QuestionType[question.type as keyof typeof QuestionType],
      options: question.options || ["", "", "", ""],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || "",
      points: question.points,
    })
  }

  const cancelEditing = () => {
    setEditingQuestion(null)
    reset({
      type: QuestionType.MULTIPLE_CHOICE,
      points: 1,
      options: ["", "", "", ""],
    })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "application/json") {
      alert("Please select a valid JSON file")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const jsonData = JSON.parse(content)
        
        if (!jsonData.questions || !Array.isArray(jsonData.questions)) {
          alert("Invalid JSON format. Expected 'questions' array.")
          return
        }

        setImportPreview(jsonData.questions)
      } catch (error) {
        alert("Invalid JSON file. Please check the format.")
      }
    }
    reader.readAsText(file)
  }

  const importQuestions = async () => {
    if (!quizId || !importPreview) return

    setIsImporting(true)
    try {
      const response = await fetch(`/api/quizzes/${quizId}/questions/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: importPreview }),
      })

      if (response.ok) {
        const result = await response.json()
        await mutate(`/api/quizzes/${quizId}`)
        setImportPreview(null)
        alert(`Successfully imported ${result.questions.length} questions!`)
        // Reset file input
        const fileInput = document.getElementById('jsonFileInput') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        const error = await response.json()
        alert(`Failed to import questions: ${error.error}`)
      }
    } catch (error) {
      console.error("Error importing questions:", error)
      alert("Failed to import questions")
    } finally {
      setIsImporting(false)
    }
  }

  const cancelImport = () => {
    setImportPreview(null)
    // Reset file input
    const fileInput = document.getElementById('jsonFileInput') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const toggleQuizStatus = async () => {
    if (!quizId) return
    
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !quiz.isActive }),
      })

      if (response.ok) {
        await mutate(`/api/quizzes/${quizId}`)
      } else {
        throw new Error("Failed to update quiz status")
      }
    } catch (error) {
      console.error("Error updating quiz status:", error)
      alert("Failed to update quiz status")
    }
  }

  const startEditingQuiz = () => {
    setIsEditingQuiz(true)
    resetQuiz({
      title: quiz.title,
      description: quiz.description || "",
      materialUrl: quiz.materialUrl || "",
      timeLimit: quiz.timeLimit || undefined,
      maxAttempts: quiz.maxAttempts || undefined,
    })
  }

  const cancelEditingQuiz = () => {
    setIsEditingQuiz(false)
    resetQuiz()
  }

  const updateQuiz = async (data: QuizEditForm) => {
    if (!quizId) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description || null,
          materialUrl: data.materialUrl || null,
          timeLimit: data.timeLimit || null,
          maxAttempts: data.maxAttempts || null,
        }),
      })

      if (response.ok) {
        await mutate(`/api/quizzes/${quizId}`)
        setIsEditingQuiz(false)
        alert("Quiz updated successfully!")
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to update quiz")
      }
    } catch (error) {
      console.error("Error updating quiz:", error)
      alert("Failed to update quiz")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteQuiz = async () => {
    if (!quizId) return
    
    const confirmed = confirm(
      "Are you sure you want to delete this quiz? This action cannot be undone and will remove all questions, attempts, and enrollments."
    )
    
    if (!confirmed) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        alert("Quiz deleted successfully!")
        router.push("/educator/quizzes")
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete quiz")
      }
    } catch (error) {
      console.error("Error deleting quiz:", error)
      alert("Failed to delete quiz")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="text-sm breadcrumbs mb-2">
            <ul>
              <li><Link href="/educator/dashboard">Dashboard</Link></li>
              <li><Link href="/educator/quizzes">My Quizzes</Link></li>
              <li>{quiz.title}</li>
            </ul>
          </div>
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleQuizStatus}
            className={`btn ${quiz.isActive ? "btn-warning" : "btn-success"}`}
          >
            {quiz.isActive ? "Deactivate" : "Activate"}
          </button>
          <Link href={`/student/quiz/${quiz.id}`} className="btn btn-outline" target="_blank">
            Preview
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-8">
        <button
          className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === "questions" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("questions")}
        >
          Questions ({quiz._count.questions})
        </button>
        <button
          className={`tab ${activeTab === "settings" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stat bg-base-100 shadow-xl rounded-box">
              <div className="stat-title">Questions</div>
              <div className="stat-value text-primary">{quiz._count.questions}</div>
            </div>
            <div className="stat bg-base-100 shadow-xl rounded-box">
              <div className="stat-title">Enrollments</div>
              <div className="stat-value text-secondary">{quiz._count.enrollments}</div>
            </div>
            <div className="stat bg-base-100 shadow-xl rounded-box">
              <div className="stat-title">Attempts</div>
              <div className="stat-value text-accent">{quiz._count.attempts}</div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Quiz Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <strong>Enrollment Code:</strong> {quiz.code}
                </div>
                <div>
                  <strong>Status:</strong> {quiz.isActive ? "Active" : "Inactive"}
                </div>
                <div>
                  <strong>Time Limit:</strong> {quiz.timeLimit ? `${quiz.timeLimit} minutes` : "No limit"}
                </div>
                <div>
                  <strong>Max Attempts:</strong> {quiz.maxAttempts ? `${quiz.maxAttempts} attempt${quiz.maxAttempts > 1 ? 's' : ''}` : "Unlimited"}
                </div>
                <div>
                  <strong>Created:</strong> {new Date(quiz.createdAt).toLocaleDateString()}
                </div>
              </div>
              {quiz.description && (
                <div className="mt-4">
                  <strong>Description:</strong>
                  <p className="mt-2">{quiz.description}</p>
                </div>
              )}
              {quiz.materialUrl && (
                <div className="mt-4">
                  <strong>Study Material:</strong>
                  <a href={quiz.materialUrl} target="_blank" rel="noopener noreferrer" className="link link-primary ml-2">
                    {quiz.materialUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === "questions" && (
        <div className="space-y-6">
          {/* Import Questions Section */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Import Questions from JSON</h2>
              <p className="text-sm opacity-70 mb-4">
                Upload a JSON file to import multiple questions at once. 
                <button 
                  className="link link-primary ml-1"
                  onClick={() => {
                    const example = {
                      questions: [
                        {
                          question: "What is the capital of France?",
                          type: "MULTIPLE_CHOICE",
                          options: ["London", "Berlin", "Paris", "Madrid"],
                          correctAnswer: "Paris",
                          explanation: "Paris is the capital and most populous city of France.",
                          points: 1
                        },
                        {
                          question: "JavaScript is a compiled language",
                          type: "TRUE_FALSE",
                          correctAnswer: "False",
                          explanation: "JavaScript is an interpreted language, not compiled.",
                          points: 1
                        }
                      ]
                    }
                    navigator.clipboard.writeText(JSON.stringify(example, null, 2))
                    alert("Example JSON format copied to clipboard!")
                  }}
                >
                  See example format
                </button>
              </p>
              
              {!importPreview ? (
                <div className="form-control">
                  <input
                    id="jsonFileInput"
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="file-input file-input-bordered"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="alert alert-info">
                    <span>Preview: {importPreview.length} questions ready to import</span>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {importPreview.slice(0, 3).map((q, index) => (
                      <div key={index} className="p-3 bg-base-200 rounded">
                        <p className="font-medium">{index + 1}. {q.question}</p>
                        <p className="text-sm opacity-70">Type: {q.type} | Points: {q.points}</p>
                      </div>
                    ))}
                    {importPreview.length > 3 && (
                      <p className="text-sm opacity-70 text-center">
                        ... and {importPreview.length - 3} more questions
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={cancelImport}
                      className="btn btn-ghost"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={importQuestions}
                      className="btn btn-primary"
                      disabled={isImporting}
                    >
                      {isImporting ? "Importing..." : `Import ${importPreview.length} Questions`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Add/Edit Question Form */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center">
                <h2 className="card-title">
                  {editingQuestion ? "Edit Question" : "Add New Question"}
                </h2>
                {editingQuestion && (
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="btn btn-ghost btn-sm"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              
              <form onSubmit={handleSubmit(editingQuestion ? editQuestion : addQuestion)} className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Question *</span>
                  </label>
                  <textarea
                    {...register("question")}
                    className={`textarea textarea-bordered ${errors.question ? 'textarea-error' : ''}`}
                    placeholder="Enter your question..."
                    rows={3}
                  />
                  {errors.question && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.question.message}
                      </span>
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Question Type</span>
                    </label>
                    <select
                      {...register("type")}
                      className="select select-bordered"
                    >
                      <option value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</option>
                      <option value={QuestionType.TRUE_FALSE}>True/False</option>
                      <option value={QuestionType.SHORT_ANSWER}>Short Answer</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Points</span>
                    </label>
                    <input
                      {...register("points", { valueAsNumber: true })}
                      type="number"
                      min="1"
                      className="input input-bordered"
                    />
                  </div>
                </div>

                {watchQuestionType === QuestionType.MULTIPLE_CHOICE && (
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Options</span>
                    </label>
                    <div className="space-y-2">
                      {[0, 1, 2, 3].map((index) => (
                        <input
                          key={index}
                          {...register(`options.${index}`)}
                          className="input input-bordered"
                          placeholder={`Option ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Correct Answer *</span>
                  </label>
                  <input
                    {...register("correctAnswer")}
                    className={`input input-bordered ${errors.correctAnswer ? 'input-error' : ''}`}
                    placeholder="Enter the correct answer"
                  />
                  {errors.correctAnswer && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.correctAnswer.message}
                      </span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Explanation</span>
                    <span className="label-text-alt">Optional</span>
                  </label>
                  <textarea
                    {...register("explanation")}
                    className="textarea textarea-bordered"
                    placeholder="Explain why this is the correct answer..."
                    rows={2}
                  />
                </div>

                <div className="card-actions justify-end">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (editingQuestion ? "Updating..." : "Adding...") : (editingQuestion ? "Update Question" : "Add Question")}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Questions ({quiz.questions.length})</h3>
            
            {quiz.questions.length === 0 ? (
              <div className="alert alert-info">
                <span>No questions added yet. Add your first question above!</span>
              </div>
            ) : (
              quiz.questions.map((question, index) => (
                <div key={question.id} className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">
                          {index + 1}. {question.question}
                        </h4>
                        <div className="mt-2 text-sm opacity-70">
                          <span className="badge badge-outline mr-2">
                            {question.type.replace('_', ' ')}
                          </span>
                          <span className="badge badge-primary">
                            {question.points} {question.points === 1 ? 'point' : 'points'}
                          </span>
                        </div>
                        
                        {question.type === QuestionType.MULTIPLE_CHOICE && question.options && (
                          <div className="mt-3">
                            <strong className="text-sm">Options:</strong>
                            <ul className="list-disc list-inside mt-1 ml-4">
                              {question.options.map((option, optIndex) => (
                                <li key={optIndex} className="text-sm">
                                  {option}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="mt-3">
                          <strong className="text-sm">Correct Answer:</strong>
                          <span className="ml-2 font-medium text-success">
                            {question.correctAnswer}
                          </span>
                        </div>
                        
                        {question.explanation && (
                          <div className="mt-2">
                            <strong className="text-sm">Explanation:</strong>
                            <p className="text-sm mt-1">{question.explanation}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(question)}
                          className="btn btn-sm btn-outline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteQuestion(question.id)}
                          className="btn btn-sm btn-error"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">Quiz Settings</h2>
                {!isEditingQuiz ? (
                  <button
                    onClick={startEditingQuiz}
                    className="btn btn-primary"
                  >
                    Edit Quiz Details
                  </button>
                ) : (
                  <button
                    onClick={cancelEditingQuiz}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {!isEditingQuiz ? (
                // View Mode
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="label">
                        <span className="label-text font-medium">Quiz Title</span>
                      </label>
                      <div className="p-3 bg-base-200 rounded-lg">
                        {quiz.title}
                      </div>
                    </div>
                    
                    <div>
                      <label className="label">
                        <span className="label-text font-medium">Enrollment Code</span>
                      </label>
                      <div className="p-3 bg-base-200 rounded-lg">
                        {quiz.code}
                      </div>
                    </div>

                    <div>
                      <label className="label">
                        <span className="label-text font-medium">Time Limit</span>
                      </label>
                      <div className="p-3 bg-base-200 rounded-lg">
                        {quiz.timeLimit ? `${quiz.timeLimit} minutes` : "No limit"}
                      </div>
                    </div>

                    <div>
                      <label className="label">
                        <span className="label-text font-medium">Maximum Attempts</span>
                      </label>
                      <div className="p-3 bg-base-200 rounded-lg">
                        {quiz.maxAttempts ? `${quiz.maxAttempts} attempt${quiz.maxAttempts > 1 ? 's' : ''}` : "Unlimited"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-medium">Description</span>
                    </label>
                    <div className="p-3 bg-base-200 rounded-lg min-h-[100px]">
                      {quiz.description || "No description provided"}
                    </div>
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-medium">Study Material URL</span>
                    </label>
                    <div className="p-3 bg-base-200 rounded-lg">
                      {quiz.materialUrl ? (
                        <a href={quiz.materialUrl} target="_blank" rel="noopener noreferrer" className="link link-primary">
                          {quiz.materialUrl}
                        </a>
                      ) : (
                        "No study material provided"
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <form onSubmit={handleSubmitQuiz(updateQuiz)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-medium">Quiz Title *</span>
                      </label>
                      <input
                        {...registerQuiz("title")}
                        type="text"
                        placeholder="Enter quiz title"
                        className={`input input-bordered w-full ${quizErrors.title ? 'input-error' : ''}`}
                      />
                      {quizErrors.title && (
                        <label className="label">
                          <span className="label-text-alt text-error">
                            {quizErrors.title.message}
                          </span>
                        </label>
                      )}
                    </div>

                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-medium">Time Limit</span>
                        <span className="label-text-alt">Optional</span>
                      </label>
                      <div className="input-group">
                        <input
                          {...registerQuiz("timeLimit", { valueAsNumber: true })}
                          type="number"
                          min="1"
                          max="300"
                          placeholder="30"
                          className="input input-bordered flex-1"
                        />
                        <span className="bg-base-200 px-4 flex items-center text-sm">minutes</span>
                      </div>
                      <label className="label">
                        <span className="label-text-alt">Leave empty for no time limit</span>
                      </label>
                    </div>

                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-medium">Maximum Attempts</span>
                        <span className="label-text-alt">Optional</span>
                      </label>
                      <div className="input-group">
                        <input
                          {...registerQuiz("maxAttempts", { valueAsNumber: true })}
                          type="number"
                          min="1"
                          max="20"
                          placeholder="Unlimited"
                          className="input input-bordered flex-1"
                        />
                        <span className="bg-base-200 px-4 flex items-center text-sm">attempts</span>
                      </div>
                      <label className="label">
                        <span className="label-text-alt">Leave empty for unlimited attempts</span>
                      </label>
                    </div>

                    <div className="form-control w-full">
                      <label className="label">
                        <span className="label-text font-medium">Study Material URL</span>
                        <span className="label-text-alt">Optional</span>
                      </label>
                      <input
                        {...registerQuiz("materialUrl")}
                        type="url"
                        placeholder="https://example.com/study-material"
                        className={`input input-bordered w-full ${quizErrors.materialUrl ? 'input-error' : ''}`}
                      />
                      {quizErrors.materialUrl && (
                        <label className="label">
                          <span className="label-text-alt text-error">
                            {quizErrors.materialUrl.message}
                          </span>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-medium">Description</span>
                      <span className="label-text-alt">Optional</span>
                    </label>
                    <textarea
                      {...registerQuiz("description")}
                      className="textarea textarea-bordered h-24"
                      placeholder="Describe what this quiz covers..."
                    />
                  </div>

                  <div className="card-actions justify-end">
                    <button
                      type="button"
                      onClick={cancelEditingQuiz}
                      className="btn btn-ghost"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isLoading}
                    >
                      {isLoading ? <span className="loading loading-spinner"></span> : "Save Changes"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card bg-base-100 shadow-xl border border-error">
            <div className="card-body">
              <h3 className="card-title text-error">Danger Zone</h3>
              <p className="text-sm opacity-70">
                These actions are irreversible. Please be certain before proceeding.
              </p>
              
              <div className="flex justify-between items-center pt-4">
                <div>
                  <h4 className="font-medium">Delete Quiz</h4>
                  <p className="text-sm opacity-70">
                    Permanently delete this quiz and all associated data.
                  </p>
                </div>
                <button
                  onClick={deleteQuiz}
                  className="btn btn-error"
                  disabled={isLoading}
                >
                  {isLoading ? <span className="loading loading-spinner"></span> : "Delete Quiz"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
