"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

type QuizStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED"

interface Quiz {
  id: string
  title: string
  description: string | null
  status: QuizStatus
  code: string
  timeLimit: number | null
  createdAt: string
  createdBy: {
    name: string | null
    email: string
  }
  _count: {
    questions: number
    attempts: number
    enrollments: number
  }
}

export default function AdminQuizzesPage() {
  const [selectedStatus, setSelectedStatus] = useState<QuizStatus | "ALL">("ALL")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState<string | null>(null)

  const { data: quizzes, error } = useSWR<Quiz[]>("/api/admin/quizzes", fetcher)

  const filteredQuizzes = quizzes?.filter(quiz => {
    const matchesStatus = selectedStatus === "ALL" || quiz.status === selectedStatus
    const matchesSearch = searchTerm === "" || 
      quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.createdBy.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.createdBy.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleStatusChange = async (quizId: string, newStatus: QuizStatus) => {
    try {
      setLoading(quizId)
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error("Failed to update quiz status")
      }

      await mutate("/api/admin/quizzes")
    } catch (error) {
      console.error("Error updating quiz status:", error)
      alert("Failed to update quiz status")
    } finally {
      setLoading(null)
    }
  }

  const handleDeleteQuiz = async (quizId: string, quizTitle: string) => {
    if (!confirm(`Are you sure you want to delete quiz "${quizTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      setLoading(quizId)
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete quiz")
      }

      await mutate("/api/admin/quizzes")
    } catch (error) {
      console.error("Error deleting quiz:", error)
      alert("Failed to delete quiz")
    } finally {
      setLoading(null)
    }
  }

  const getStatusBadgeColor = (status: QuizStatus) => {
    switch (status) {
      case "PUBLISHED": return "badge-success"
      case "DRAFT": return "badge-warning"
      case "ARCHIVED": return "badge-error"
      default: return "badge-ghost"
    }
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Failed to load quizzes</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Quiz Management</h1>
        <div className="text-sm breadcrumbs">
          <ul>
            <li>Dashboard</li>
            <li>Admin</li>
            <li>Quizzes</li>
          </ul>
        </div>
      </div>

      {/* Stats Cards */}
      {quizzes && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat bg-base-100 shadow-xl rounded-box">
            <div className="stat-title">Total Quizzes</div>
            <div className="stat-value text-primary">{quizzes.length}</div>
          </div>
          <div className="stat bg-base-100 shadow-xl rounded-box">
            <div className="stat-title">Published</div>
            <div className="stat-value text-success">
              {quizzes.filter(q => q.status === "PUBLISHED").length}
            </div>
          </div>
          <div className="stat bg-base-100 shadow-xl rounded-box">
            <div className="stat-title">Total Attempts</div>
            <div className="stat-value text-info">
              {quizzes.reduce((sum, quiz) => sum + quiz._count.attempts, 0)}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Filter by Status</span>
              </label>
              <select
                className="select select-bordered"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as QuizStatus | "ALL")}
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            <div className="form-control flex-1">
              <label className="label">
                <span className="label-text">Search Quizzes</span>
              </label>
              <input
                type="text"
                placeholder="Search by title or creator..."
                className="input input-bordered"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quizzes Table */}
      {!quizzes ? (
        <div className="flex justify-center items-center min-h-96">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">
                Quizzes ({filteredQuizzes?.length || 0})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Quiz</th>
                    <th>Creator</th>
                    <th>Status</th>
                    <th>Questions</th>
                    <th>Enrollments</th>
                    <th>Attempts</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuizzes?.map((quiz) => (
                    <tr key={quiz.id}>
                      <td>
                        <div>
                          <div className="font-bold">{quiz.title}</div>
                          <div className="text-sm opacity-50">
                            Code: {quiz.code}
                          </div>
                          {quiz.timeLimit && (
                            <div className="text-sm opacity-50">
                              Time: {quiz.timeLimit} min
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="font-medium">
                            {quiz.createdBy.name || "No name"}
                          </div>
                          <div className="text-sm opacity-50">
                            {quiz.createdBy.email}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={`badge ${getStatusBadgeColor(quiz.status)}`}>
                          {quiz.status}
                        </div>
                      </td>
                      <td>
                        <div className="text-center font-medium">
                          {quiz._count.questions}
                        </div>
                      </td>
                      <td>
                        <div className="text-center font-medium">
                          {quiz._count.enrollments}
                        </div>
                      </td>
                      <td>
                        <div className="text-center font-medium">
                          {quiz._count.attempts}
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          {new Date(quiz.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div className="dropdown dropdown-end">
                          <div tabIndex={0} role="button" className="btn btn-sm">
                            Actions
                          </div>
                          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                            <li>
                              <Link href={`/student/quiz/${quiz.id}`} target="_blank">
                                Preview Quiz
                              </Link>
                            </li>
                            <li className="menu-title">Change Status</li>
                            {(["DRAFT", "PUBLISHED", "ARCHIVED"] as QuizStatus[]).map((status) => (
                              <li key={status}>
                                <button
                                  onClick={() => handleStatusChange(quiz.id, status)}
                                  disabled={loading === quiz.id || quiz.status === status}
                                  className={quiz.status === status ? "text-primary" : ""}
                                >
                                  {status}
                                </button>
                              </li>
                            ))}
                            <div className="divider m-0"></div>
                            <li>
                              <button
                                onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                                disabled={loading === quiz.id}
                                className="text-error"
                              >
                                Delete Quiz
                              </button>
                            </li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredQuizzes?.length === 0 && (
                <div className="text-center py-8 opacity-70">
                  No quizzes found matching your criteria
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
