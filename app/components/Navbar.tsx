"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Role } from "@prisma/client"

export default function Navbar() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <Link href="/" className="btn btn-ghost text-xl">
            Saung Coding Quiz
          </Link>
        </div>
        <div className="flex-none">
          <div className="skeleton h-8 w-20"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="navbar bg-base-100 shadow-lg">
      <div className="flex-1">
        <Link href="/" className="btn btn-ghost text-xl">
          Saung Coding Quiz
        </Link>
      </div>
      
      <div className="flex-none">
        {session ? (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                {session.user?.name?.charAt(0) || session.user?.email?.charAt(0)}
              </div>
            </div>
            <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52">
              <li>
                <div className="flex flex-col p-2">
                  <span className="font-semibold">{session.user?.name}</span>
                  <span className="text-sm opacity-70">{session.user?.email}</span>
                  <span className="badge badge-sm badge-primary mt-1">{session.user?.role}</span>
                </div>
              </li>
              <div className="divider m-0"></div>
              <li>
                <Link href="/dashboard">Dashboard</Link>
              </li>
              {session.user?.role === Role.ADMIN && (
                <>
                  <li><Link href="/admin/users">Manage Users</Link></li>
                  <li><Link href="/admin/educators">Educator Approvals</Link></li>
                  <li><Link href="/admin/quizzes">All Quizzes</Link></li>
                  <li><Link href="/admin/reports">Reports</Link></li>
                </>
              )}
              {session.user?.role === Role.EDUCATOR && (
                <>
                  <li><Link href="/educator/quizzes">My Quizzes</Link></li>
                  <li><Link href="/educator/create-quiz">Create Quiz</Link></li>
                </>
              )}
              {session.user?.role === Role.STUDENT && (
                <>
                  <li><Link href="/student/quizzes">Available Quizzes</Link></li>
                  <li><Link href="/student/results">My Results</Link></li>
                </>
              )}
              <div className="divider m-0"></div>
              <li>
                <button 
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-error"
                >
                  Sign Out
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link href="/auth/signin" className="btn btn-ghost">
              Sign In
            </Link>
            <Link href="/auth/signup" className="btn btn-primary">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
