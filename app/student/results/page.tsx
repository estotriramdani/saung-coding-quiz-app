"use client"

import { useSession } from "next-auth/react"
import { Role } from "@prisma/client"
import useSWR from "swr"
import Link from "next/link"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface QuizResult {
  id: string
  score: number | null
  totalPoints: number | null
  timeSpent: number | null
  startedAt: string
  completedAt: string | null
  quiz: {
    id: string
    title: string
    description: string | null
  }
}

export default function StudentResultsPage() {
  const { data: session } = useSession()
  const { data: results, error, isLoading } = useSWR<QuizResult[]>(
    session?.user?.role === Role.STUDENT ? "/api/student/results" : null,
    fetcher
  )

  if (!session || session.user.role !== Role.STUDENT) {
    return (
      <div className="alert alert-error">
        <span>You don't have permission to access this page.</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Failed to load quiz results</span>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  const completedResults = results?.filter(r => r.completedAt) || []
  const incompleteResults = results?.filter(r => !r.completedAt) || []

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "N/A"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const calculatePercentage = (score: number | null, totalPoints: number | null) => {
    if (score === null || totalPoints === null || totalPoints === 0) return 0
    return (score / totalPoints) * 100
  }

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "text-success"
    if (percentage >= 80) return "text-info"
    if (percentage >= 70) return "text-warning"
    return "text-error"
  }

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return "A"
    if (percentage >= 80) return "B"
    if (percentage >= 70) return "C"
    if (percentage >= 60) return "D"
    return "F"
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Quiz Results</h1>
        <div className="text-sm breadcrumbs">
          <ul>
            <li><Link href="/student/dashboard">Dashboard</Link></li>
            <li>Results</li>
          </ul>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-title">Total Attempts</div>
          <div className="stat-value text-primary">{results?.length || 0}</div>
        </div>
        
        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-title">Completed</div>
          <div className="stat-value text-success">{completedResults.length}</div>
        </div>
        
        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-title">In Progress</div>
          <div className="stat-value text-warning">{incompleteResults.length}</div>
        </div>
        
        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-title">Average Score</div>
          <div className="stat-value text-accent">
            {completedResults.length > 0 
              ? (completedResults.reduce((acc, result) => {
                  const percentage = calculatePercentage(result.score, result.totalPoints)
                  return acc + percentage
                }, 0) / completedResults.length).toFixed(1) + '%'
              : 'N/A'
            }
          </div>
        </div>
      </div>

      {/* Completed Results */}
      {completedResults.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Completed Quizzes</h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Quiz</th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th>Time Spent</th>
                    <th>Completed</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {completedResults.map((result) => {
                    const percentage = calculatePercentage(result.score, result.totalPoints)
                    return (
                      <tr key={result.id}>
                        <td>
                          <div>
                            <div className="font-bold">{result.quiz.title}</div>
                            {result.quiz.description && (
                              <div className="text-sm opacity-50">{result.quiz.description}</div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col">
                            <span className="font-semibold">
                              {result.score?.toFixed(1) || 0} / {result.totalPoints || 0}
                            </span>
                            <span className={`text-sm ${getGradeColor(percentage)}`}>
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className={`badge badge-lg ${getGradeColor(percentage)}`}>
                            {getGradeLetter(percentage)}
                          </div>
                        </td>
                        <td>{formatTime(result.timeSpent)}</td>
                        <td>{new Date(result.completedAt!).toLocaleString()}</td>
                        <td>
                          <Link 
                            href={`/student/quiz/${result.quiz.id}/result?attemptId=${result.id}`}
                            className="btn btn-sm btn-outline"
                          >
                            View Details
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Incomplete Results */}
      {incompleteResults.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">In Progress Quizzes</h2>
            <div className="space-y-3">
              {incompleteResults.map((result) => (
                <div key={result.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <h4 className="font-semibold">{result.quiz.title}</h4>
                    <p className="text-sm opacity-70">
                      Started: {new Date(result.startedAt).toLocaleString()}
                    </p>
                    {result.quiz.description && (
                      <p className="text-sm opacity-60">{result.quiz.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link 
                      href={`/student/quiz/${result.quiz.id}`}
                      className="btn btn-sm btn-primary"
                    >
                      Continue Quiz
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!results || results.length === 0) && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center py-12">
            <div className="text-6xl opacity-20 mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">No Quiz Results Yet</h3>
            <p className="opacity-70 mb-6">
              You haven't taken any quizzes yet. Start by enrolling in a quiz or browse available quizzes.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/student/quizzes" className="btn btn-primary">
                Browse Quizzes
              </Link>
              <Link href="/student/enroll" className="btn btn-outline">
                Enroll with Code
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
