"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { Role } from "@prisma/client"

export default function Home() {
  const { data: session } = useSession()

  if (session) {
    return (
      <div className="hero min-h-96">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">Welcome back!</h1>
            <p className="py-6">
              {session.user?.name}, ready to continue your learning journey?
            </p>
            <Link 
              href="/dashboard" 
              className="btn btn-primary"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="hero min-h-96">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">Saung Coding Quiz</h1>
          <p className="py-6">
            Test your programming knowledge with interactive quizzes. 
            Join as a student to take quizzes or as an educator to create them.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/signin" className="btn btn-primary">
              Sign In
            </Link>
            <Link href="/auth/signup" className="btn btn-outline">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
