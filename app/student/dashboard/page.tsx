"use client"

import { useSession } from "next-auth/react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface StudentStats {
  totalEnrollments: number
  completedQuizzes: number
  averageScore: number
  totalTimeSpent: number
}

interface RecentQuiz {
  id: string
  quizId: string
  title: string
  score: number | null
  completedAt: string | null
  totalPoints: number | null
  maxAttempts: number | null
  attemptCount: number
  canRetake: boolean
}

export default function StudentDashboard() {
  const { data: session } = useSession()
  const { data: stats, error: statsError } = useSWR<StudentStats>("/api/student/stats", fetcher)
  const { data: recentQuizzes, error: quizzesError } = useSWR<RecentQuiz[]>("/api/student/recent-quizzes", fetcher)

  if (statsError || quizzesError) {
    return (
      <div className="alert alert-error">
        <span>Failed to load dashboard data</span>
      </div>
    )
  }

  if (!stats || !recentQuizzes) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Student Dashboard</h1>
        <div className="text-sm breadcrumbs">
          <ul>
            <li>Dashboard</li>
            <li>Student</li>
          </ul>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="alert alert-success">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Hello {session?.user?.name}! Keep up the great work with your studies!</span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-figure text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          <div className="stat-title">Enrolled Quizzes</div>
          <div className="stat-value text-primary">{stats?.totalEnrollments || 0}</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-figure text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div className="stat-title">Completed</div>
          <div className="stat-value text-secondary">{stats?.completedQuizzes || 0}</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-figure text-accent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <div className="stat-title">Average Score</div>
          <div className="stat-value text-accent">
            {stats?.averageScore !== undefined ? stats.averageScore.toFixed(1) : '0.0'}%
          </div>
        </div>

        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-figure text-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div className="stat-title">Time Studied</div>
          <div className="stat-value text-info">
            {Math.round((stats?.totalTimeSpent || 0) / 60)}m
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Recent Quiz Activity</h2>
            {recentQuizzes.length === 0 ? (
              <p className="text-center py-8 opacity-70">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentQuizzes.slice(0, 5).map((quiz) => (
                  <div key={quiz.id} className="flex justify-between items-center p-3 border rounded">
                    <div>
                      <h4 className="font-medium">{quiz.title}</h4>
                      <p className="text-sm opacity-70">
                        {quiz.completedAt ? new Date(quiz.completedAt).toLocaleDateString() : "Not completed"}
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs opacity-60">
                          Attempts: {quiz.attemptCount}{quiz.maxAttempts ? `/${quiz.maxAttempts}` : '/∞'}
                        </span>
                        {!quiz.canRetake && (
                          <span className="text-xs text-error">Max attempts reached</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {quiz.score !== null && quiz.totalPoints ? (
                        <div className="badge badge-success">
                          {((quiz.score / quiz.totalPoints) * 100).toFixed(0)}%
                        </div>
                      ) : quiz.canRetake ? (
                        <a href={`/student/quiz/${quiz.quizId}`} className="badge badge-warning">
                          {quiz.attemptCount > 0 ? 'Retake' : 'Take Quiz'}
                        </a>
                      ) : (
                        <div className="badge badge-error">Completed</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Quick Actions</h2>
            <div className="space-y-3">
              <a href="/student/quizzes" className="btn btn-primary w-full">
                Browse Available Quizzes
              </a>
              <a href="/student/enroll" className="btn btn-outline w-full">
                Enroll with Code
              </a>
              <a href="/student/results" className="btn btn-outline w-full">
                View All Results
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
