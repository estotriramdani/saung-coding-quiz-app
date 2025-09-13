"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"
import Link from "next/link"
import { Role } from "@prisma/client"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Quiz {
  id: string
  title: string
  description?: string
  code: string
  materialUrl?: string
  timeLimit?: number
  isActive: boolean
  createdBy: {
    name?: string
    email: string
  }
  _count: {
    questions: number
    enrollments: number
  }
  isEnrolled?: boolean
  hasAttempted?: boolean
}

export default function StudentQuizzesPage() {
  const { data: session } = useSession()
  const [enrollCode, setEnrollCode] = useState("")
  const [isEnrolling, setIsEnrolling] = useState(false)
  
  const { data: quizzes, error, mutate } = useSWR<Quiz[]>(
    session?.user?.role === Role.STUDENT ? "/api/quizzes/available" : null,
    fetcher
  )

  if (!session || session.user.role !== Role.STUDENT) {
    return (
      <div className="alert alert-error">
        <span>You don't have permission to view this page.</span>
      </div>
    )
  }

  const enrollInQuiz = async (code: string) => {
    setIsEnrolling(true)
    try {
      const response = await fetch("/api/quizzes/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })

      if (response.ok) {
        mutate()
        setEnrollCode("")
        alert("Successfully enrolled in quiz!")
      } else {
        const data = await response.json()
        alert(data.error || "Failed to enroll")
      }
    } catch (error) {
      console.error("Error enrolling in quiz:", error)
      alert("Failed to enroll in quiz")
    } finally {
      setIsEnrolling(false)
    }
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Error loading quizzes. Please try again.</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Available Quizzes</h1>

      {/* Enroll with Code */}
      <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <h2 className="card-title">Enroll in Quiz</h2>
          <p className="text-sm opacity-70">Enter the quiz code provided by your educator</p>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Enter quiz code"
              className="input input-bordered flex-1"
              value={enrollCode}
              onChange={(e) => setEnrollCode(e.target.value.toUpperCase())}
            />
            <button
              onClick={() => enrollInQuiz(enrollCode)}
              disabled={!enrollCode || isEnrolling}
              className="btn btn-primary"
            >
              {isEnrolling ? "Enrolling..." : "Enroll"}
            </button>
          </div>
        </div>
      </div>

      {/* Available Quizzes */}
      {!quizzes ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="skeleton h-4 w-3/4 mb-2"></div>
                <div className="skeleton h-3 w-full mb-2"></div>
                <div className="skeleton h-3 w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">No quizzes available</h2>
          <p className="text-gray-600">Ask your educator for quiz codes to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">{quiz.title}</h2>
                
                {quiz.description && (
                  <p className="text-sm opacity-70 mb-3">{quiz.description}</p>
                )}
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Educator:</span>
                    <span>{quiz.createdBy.name || quiz.createdBy.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Questions:</span>
                    <span>{quiz._count.questions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Students:</span>
                    <span>{quiz._count.enrollments}</span>
                  </div>
                  {quiz.timeLimit && (
                    <div className="flex justify-between">
                      <span>Time Limit:</span>
                      <span>{quiz.timeLimit} min</span>
                    </div>
                  )}
                </div>

                {quiz.materialUrl && (
                  <div className="mt-3">
                    <a
                      href={quiz.materialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline w-full"
                    >
                      Study Material
                    </a>
                  </div>
                )}

                <div className="card-actions justify-end mt-4">
                  {quiz.hasAttempted ? (
                    <button className="btn btn-disabled">
                      Already Attempted
                    </button>
                  ) : quiz.isEnrolled ? (
                    <Link
                      href={`/student/quiz/${quiz.id}`}
                      className="btn btn-primary"
                    >
                      Take Quiz
                    </Link>
                  ) : (
                    <button
                      onClick={() => enrollInQuiz(quiz.code)}
                      disabled={isEnrolling}
                      className="btn btn-secondary"
                    >
                      {isEnrolling ? "Enrolling..." : "Enroll"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
