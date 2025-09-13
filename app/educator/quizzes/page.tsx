"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
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
  createdAt: string
  createdBy: {
    id: string
    name?: string
    email: string
  }
  _count: {
    questions: number
    attempts: number
    enrollments: number
  }
}

export default function EducatorQuizzesPage() {
  const { data: session } = useSession()
  const { data: quizzes, error, mutate } = useSWR<Quiz[]>(
    session?.user?.role === Role.EDUCATOR ? "/api/quizzes" : null,
    fetcher
  )

  if (!session || session.user.role !== Role.EDUCATOR) {
    return (
      <div className="alert alert-error">
        <span>You don't have permission to view this page.</span>
      </div>
    )
  }

  const toggleQuizStatus = async (quizId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/quizzes/${quizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        mutate()
      }
    } catch (error) {
      console.error("Error updating quiz status:", error)
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Quizzes</h1>
        <Link href="/educator/create-quiz" className="btn btn-primary">
          Create New Quiz
        </Link>
      </div>

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
          <h2 className="text-2xl font-semibold mb-4">No quizzes yet</h2>
          <p className="text-gray-600 mb-6">Create your first quiz to get started!</p>
          <Link href="/educator/create-quiz" className="btn btn-primary">
            Create Quiz
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="card-title text-lg">{quiz.title}</h2>
                  <div className="flex items-center gap-2">
                    <div className={`badge ${quiz.isActive ? 'badge-success' : 'badge-warning'}`}>
                      {quiz.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
                
                {quiz.description && (
                  <p className="text-sm opacity-70 mb-3">{quiz.description}</p>
                )}
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Quiz Code:</span>
                    <span className="font-mono font-bold">{quiz.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Questions:</span>
                    <span>{quiz._count.questions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enrollments:</span>
                    <span>{quiz._count.enrollments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Attempts:</span>
                    <span>{quiz._count.attempts}</span>
                  </div>
                  {quiz.timeLimit && (
                    <div className="flex justify-between">
                      <span>Time Limit:</span>
                      <span>{quiz.timeLimit} min</span>
                    </div>
                  )}
                </div>

                <div className="card-actions justify-end mt-4">
                  <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-sm">
                      Actions
                    </div>
                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                      <li>
                        <Link href={`/educator/quizzes/${quiz.id}`}>
                          View Details
                        </Link>
                      </li>
                      <li>
                        <Link href={`/educator/quizzes/${quiz.id}/edit`}>
                          Edit Quiz
                        </Link>
                      </li>
                      <li>
                        <Link href={`/educator/quizzes/${quiz.id}/results`}>
                          View Results
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={() => toggleQuizStatus(quiz.id, quiz.isActive)}
                          className={quiz.isActive ? 'text-warning' : 'text-success'}
                        >
                          {quiz.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </li>
                      {quiz.materialUrl && (
                        <li>
                          <a href={quiz.materialUrl} target="_blank" rel="noopener noreferrer">
                            Study Material
                          </a>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
