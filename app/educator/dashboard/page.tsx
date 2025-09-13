"use client"

import { useSession } from "next-auth/react"
import useSWR from "swr"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const errorData = await res.json()
    const error = new Error('An error occurred while fetching the data.') as any
    error.info = errorData
    error.status = res.status
    throw error
  }
  return res.json()
}

interface EducatorStats {
  totalQuizzes: number
  totalStudents: number
  totalAttempts: number
  averageScore: number
}

export default function EducatorDashboard() {
  const { data: session } = useSession()
  const { data: stats, error } = useSWR<EducatorStats>("/api/educator/stats", fetcher)

  if (error) {
    // Check if it's an approval issue
    if ((error as any)?.status === 403) {
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Educator Dashboard</h1>
          </div>
          <div className="alert alert-warning">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <div>
              <h3 className="font-bold">Educator Approval Pending</h3>
              <div className="text-sm">Your educator account is pending approval. Please wait for an admin to approve your account.</div>
            </div>
          </div>
        </div>
      )
    }
    
    console.error('Educator dashboard error:', error)
    return (
      <div className="alert alert-error">
        <span>Failed to load dashboard data. Please check your connection and try again.</span>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Educator Dashboard</h1>
        <div className="text-sm breadcrumbs">
          <ul>
            <li>Dashboard</li>
            <li>Educator</li>
          </ul>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="alert alert-info">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>Welcome back, {session?.user?.name}! Ready to create some quizzes?</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-figure text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <div className="stat-title">My Quizzes</div>
          <div className="stat-value text-primary">{stats.totalQuizzes}</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-figure text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          <div className="stat-title">Students Enrolled</div>
          <div className="stat-value text-secondary">{stats.totalStudents}</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-figure text-accent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <div className="stat-title">Quiz Attempts</div>
          <div className="stat-value text-accent">{stats.totalAttempts}</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-figure text-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <div className="stat-title">Average Score</div>
          <div className="stat-value text-info">{stats.averageScore.toFixed(1)}%</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/educator/create-quiz" className="btn btn-primary">
              Create New Quiz
            </a>
            <a href="/educator/quizzes" className="btn btn-outline">
              Manage My Quizzes
            </a>
            <a href="/educator/results" className="btn btn-outline">
              View Results
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
