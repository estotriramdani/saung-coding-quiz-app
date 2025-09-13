"use client"

import { useState } from "react"
import useSWR from "swr"
import { Role } from "@prisma/client"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface ReportData {
  totalUsers: number
  totalEducators: number
  totalStudents: number
  pendingEducators: number
  totalQuizzes: number
  publishedQuizzes: number
  totalQuestions: number
  totalAttempts: number
  totalEnrollments: number
  averageScore: number
  recentActivity: {
    newUsers: number
    newQuizzes: number
    newAttempts: number
  }
  topQuizzes: Array<{
    id: string
    title: string
    creator: string
    attempts: number
    averageScore: number
  }>
  userGrowth: Array<{
    date: string
    users: number
    educators: number
    students: number
  }>
}

export default function AdminReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">("30d")

  const { data: reportData, error } = useSWR<ReportData>(
    `/api/admin/reports?period=${selectedPeriod}`,
    fetcher
  )

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Failed to load reports</span>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Reports</h1>
        <div className="text-sm breadcrumbs">
          <ul>
            <li>Dashboard</li>
            <li>Admin</li>
            <li>Reports</li>
          </ul>
        </div>
      </div>

      {/* Period Selector */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center gap-4">
            <span className="font-medium">Report Period:</span>
            <div className="join">
              <button
                className={`btn join-item ${selectedPeriod === "7d" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setSelectedPeriod("7d")}
              >
                Last 7 Days
              </button>
              <button
                className={`btn join-item ${selectedPeriod === "30d" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setSelectedPeriod("30d")}
              >
                Last 30 Days
              </button>
              <button
                className={`btn join-item ${selectedPeriod === "90d" ? "btn-primary" : "btn-outline"}`}
                onClick={() => setSelectedPeriod("90d")}
              >
                Last 90 Days
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat bg-base-100 shadow-xl rounded-box">
          <div className="stat-figure text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div className="stat-title">Total Users</div>
          <div className="stat-value text-primary">{reportData.totalUsers}</div>
          <div className="stat-desc">
            +{reportData.recentActivity.newUsers} this period
          </div>
        </div>

        <div className="stat bg-base-100 shadow-xl rounded-box">
          <div className="stat-figure text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
            </svg>
          </div>
          <div className="stat-title">Total Quizzes</div>
          <div className="stat-value text-secondary">{reportData.totalQuizzes}</div>
          <div className="stat-desc">
            +{reportData.recentActivity.newQuizzes} this period
          </div>
        </div>

        <div className="stat bg-base-100 shadow-xl rounded-box">
          <div className="stat-figure text-accent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
          <div className="stat-title">Total Attempts</div>
          <div className="stat-value text-accent">{reportData.totalAttempts}</div>
          <div className="stat-desc">
            +{reportData.recentActivity.newAttempts} this period
          </div>
        </div>

        <div className="stat bg-base-100 shadow-xl rounded-box">
          <div className="stat-figure text-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <div className="stat-title">Average Score</div>
          <div className="stat-value text-info">
            {reportData.averageScore.toFixed(1)}%
          </div>
          <div className="stat-desc">Platform-wide average</div>
        </div>
      </div>

      {/* User Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">User Breakdown</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Educators</span>
                <div className="flex items-center gap-2">
                  <span className="badge badge-warning">
                    {reportData.totalEducators}
                  </span>
                  {reportData.pendingEducators > 0 && (
                    <span className="badge badge-error">
                      {reportData.pendingEducators} pending
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>Students</span>
                <span className="badge badge-info">
                  {reportData.totalStudents}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Quiz Completion Rate</span>
                <span className="badge badge-success">
                  {reportData.totalAttempts > 0 
                    ? ((reportData.totalAttempts / reportData.totalEnrollments) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Quiz Statistics</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Published Quizzes</span>
                <span className="badge badge-success">
                  {reportData.publishedQuizzes}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Questions</span>
                <span className="badge badge-info">
                  {reportData.totalQuestions}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Enrollments</span>
                <span className="badge badge-primary">
                  {reportData.totalEnrollments}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Quizzes */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Top Performing Quizzes</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Quiz Title</th>
                  <th>Creator</th>
                  <th>Attempts</th>
                  <th>Average Score</th>
                </tr>
              </thead>
              <tbody>
                {reportData.topQuizzes.map((quiz, index) => (
                  <tr key={quiz.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="badge badge-neutral">#{index + 1}</div>
                        {quiz.title}
                      </div>
                    </td>
                    <td>{quiz.creator}</td>
                    <td>
                      <div className="badge badge-outline">
                        {quiz.attempts}
                      </div>
                    </td>
                    <td>
                      <div className={`badge ${
                        quiz.averageScore >= 80 
                          ? "badge-success" 
                          : quiz.averageScore >= 60 
                          ? "badge-warning" 
                          : "badge-error"
                      }`}>
                        {quiz.averageScore.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reportData.topQuizzes.length === 0 && (
              <div className="text-center py-8 opacity-70">
                No quiz data available for this period
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Growth Chart (Placeholder) */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">User Growth</h2>
          <div className="text-center py-8 opacity-70">
            <div className="text-lg mb-2">📈</div>
            <div>User growth chart would be displayed here</div>
            <div className="text-sm">
              (Integration with charting library like Chart.js or Recharts)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
