"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Role, QuestionType } from "@prisma/client"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Question {
  id: string
  question: string
  type: QuestionType
  options?: string[]
  points: number
}

interface Quiz {
  id: string
  title: string
  description?: string
  timeLimit?: number
  questions: Question[]
}

interface Answer {
  questionId: string
  answer: string
}

export default function TakeQuizPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attemptId, setAttemptId] = useState<string | null>(null)

  const { data: quiz, error } = useSWR<Quiz>(
    session?.user?.role === Role.STUDENT && params.id ? `/api/quizzes/${params.id}/take` : null,
    fetcher
  )

  // Timer logic
  useEffect(() => {
    if (quiz?.timeLimit && timeLeft === null) {
      setTimeLeft(quiz.timeLimit * 60) // Convert minutes to seconds
    }
  }, [quiz, timeLeft])

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  // Start quiz attempt when component mounts
  useEffect(() => {
    if (quiz && !attemptId) {
      startQuizAttempt()
    }
  }, [quiz, attemptId])

  const startQuizAttempt = async () => {
    try {
      const response = await fetch(`/api/quizzes/${params.id}/attempt`, {
        method: "POST",
      })
      
      if (response.ok) {
        const attempt = await response.json()
        setAttemptId(attempt.id)
      }
    } catch (error) {
      console.error("Error starting quiz attempt:", error)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => {
      const existing = prev.find(a => a.questionId === questionId)
      if (existing) {
        return prev.map(a => a.questionId === questionId ? { ...a, answer } : a)
      } else {
        return [...prev, { questionId, answer }]
      }
    })
  }

  const getCurrentAnswer = (questionId: string) => {
    return answers.find(a => a.questionId === questionId)?.answer || ""
  }

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || !attemptId) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/quizzes/${params.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          answers,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        router.push(`/student/quiz/${params.id}/result?attemptId=${attemptId}`)
      } else {
        throw new Error("Failed to submit quiz")
      }
    } catch (error) {
      console.error("Error submitting quiz:", error)
      alert("Failed to submit quiz. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, attemptId, answers, params.id, router])

  if (!session || session.user.role !== Role.STUDENT) {
    return (
      <div className="alert alert-error">
        <span>You don't have permission to take this quiz.</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Error loading quiz. Please make sure you're enrolled.</span>
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

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{quiz.title}</h1>
              <p className="text-sm opacity-70">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </p>
            </div>
            {timeLeft !== null && (
              <div className="text-right">
                <div className={`text-2xl font-mono ${timeLeft < 300 ? 'text-error' : ''}`}>
                  {formatTime(timeLeft)}
                </div>
                <p className="text-sm opacity-70">Time remaining</p>
              </div>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="text-xl font-semibold mb-4">
            {currentQuestion.question}
          </h2>
          
          <div className="space-y-3">
            {currentQuestion.type === QuestionType.MULTIPLE_CHOICE && currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <label key={index} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option}
                      checked={getCurrentAnswer(currentQuestion.id) === option}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      className="radio radio-primary"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === QuestionType.TRUE_FALSE && (
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value="True"
                    checked={getCurrentAnswer(currentQuestion.id) === "True"}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="radio radio-primary"
                  />
                  <span>True</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value="False"
                    checked={getCurrentAnswer(currentQuestion.id) === "False"}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="radio radio-primary"
                  />
                  <span>False</span>
                </label>
              </div>
            )}

            {currentQuestion.type === QuestionType.SHORT_ANSWER && (
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Enter your answer..."
                value={getCurrentAnswer(currentQuestion.id)}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                rows={4}
              />
            )}
          </div>

          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="btn btn-outline"
            >
              Previous
            </button>

            <div className="text-sm opacity-70">
              Points: {currentQuestion.points}
            </div>

            {currentQuestionIndex === quiz.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn btn-primary"
              >
                {isSubmitting ? "Submitting..." : "Submit Quiz"}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(Math.min(quiz.questions.length - 1, currentQuestionIndex + 1))}
                className="btn btn-primary"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="font-semibold mb-4">Question Navigation</h3>
          <div className="grid grid-cols-10 gap-2">
            {quiz.questions.map((_, index) => {
              const isAnswered = answers.some(a => a.questionId === quiz.questions[index].id && a.answer.trim() !== "")
              return (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`btn btn-sm ${
                    index === currentQuestionIndex 
                      ? 'btn-primary' 
                      : isAnswered 
                        ? 'btn-success' 
                        : 'btn-outline'
                  }`}
                >
                  {index + 1}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
