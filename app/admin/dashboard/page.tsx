"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface DashboardStats {
  totalUsers: number
  totalEducators: number
  pendingEducators: number
  totalStudents: number
  totalQuizzes: number
  totalAttempts: number
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const { data: stats, error } = useSWR<DashboardStats>("/api/admin/stats", fetcher)

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Failed to load dashboard data</span>
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
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="text-sm breadcrumbs">
          <ul>
            <li>Dashboard</li>
            <li>Admin</li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Users */}
        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-figure text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <div className="stat-title">Total Users</div>
          <div className="stat-value text-primary">{stats.totalUsers}</div>
        </div>

        {/* Total Students */}
        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-figure text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          <div className="stat-title">Students</div>
          <div className="stat-value text-secondary">{stats.totalStudents}</div>
        </div>

        {/* Total Educators */}
        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-figure text-accent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.29 1.51 4.04 3 5.5l7 7z"></path>
            </svg>
          </div>
          <div className="stat-title">Educators</div>
          <div className="stat-value text-accent">{stats.totalEducators}</div>
          <div className="stat-desc">{stats.pendingEducators} pending approval</div>
        </div>

        {/* Total Quizzes */}
        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-figure text-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <div className="stat-title">Total Quizzes</div>
          <div className="stat-value text-info">{stats.totalQuizzes}</div>
        </div>

        {/* Total Attempts */}
        <div className="stat bg-base-100 shadow rounded-box">
          <div className="stat-figure text-warning">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          <div className="stat-title">Quiz Attempts</div>
          <div className="stat-value text-warning">{stats.totalAttempts}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="/admin/users" className="btn btn-outline">
              Manage Users
            </a>
            <a href="/admin/educators" className="btn btn-outline">
              Educator Approvals
              {stats.pendingEducators > 0 && (
                <div className="badge badge-error badge-sm">
                  {stats.pendingEducators}
                </div>
              )}
            </a>
            <a href="/admin/quizzes" className="btn btn-outline">
              Manage Quizzes
            </a>
            <a href="/admin/reports" className="btn btn-outline">
              View Reports
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
