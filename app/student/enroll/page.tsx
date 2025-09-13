"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"
import { Role } from "@prisma/client"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function StudentEnrollPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [enrollCode, setEnrollCode] = useState("")
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  if (!session || session.user.role !== Role.STUDENT) {
    return (
      <div className="alert alert-error">
        <span>You don't have permission to access this page.</span>
      </div>
    )
  }

  const enrollInQuiz = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!enrollCode.trim()) return

    setIsEnrolling(true)
    setMessage(null)
    
    try {
      const response = await fetch("/api/student/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: enrollCode.trim().toUpperCase() }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: `Successfully enrolled in "${data.quiz.title}"!` })
        setEnrollCode("")
        
        // Redirect to quiz after 2 seconds
        setTimeout(() => {
          router.push(`/student/quiz/${data.quiz.id}`)
        }, 2000)
      } else {
        setMessage({ type: 'error', text: data.error || "Failed to enroll in quiz" })
      }
    } catch (error) {
      console.error("Error enrolling in quiz:", error)
      setMessage({ type: 'error', text: "Failed to enroll in quiz. Please try again." })
    } finally {
      setIsEnrolling(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Enroll in Quiz</h1>
        <div className="text-sm breadcrumbs">
          <ul>
            <li><Link href="/student/dashboard">Dashboard</Link></li>
            <li>Enroll</li>
          </ul>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">Enter Quiz Code</h2>
          <p className="text-sm opacity-70 mb-6">
            Ask your educator for the quiz code and enter it below to enroll.
          </p>

          {message && (
            <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={enrollInQuiz} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Quiz Code</span>
              </label>
              <input
                type="text"
                placeholder="Enter quiz code (e.g., JS001)"
                className="input input-bordered input-lg text-center font-mono"
                value={enrollCode}
                onChange={(e) => setEnrollCode(e.target.value.toUpperCase())}
                disabled={isEnrolling}
                maxLength={10}
              />
              <label className="label">
                <span className="label-text-alt">Codes are usually 3-6 characters long</span>
              </label>
            </div>

            <div className="card-actions justify-end">
              <button
                type="submit"
                disabled={!enrollCode.trim() || isEnrolling}
                className="btn btn-primary btn-lg"
              >
                {isEnrolling ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Enrolling...
                  </>
                ) : (
                  "Enroll in Quiz"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Help Section */}
      <div className="card bg-base-100 shadow-xl mt-6">
        <div className="card-body">
          <h3 className="card-title text-lg">Need Help?</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Where to find quiz codes:</strong> Your educator will provide quiz codes during class, via email, or on your learning platform.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Code format:</strong> Quiz codes are typically 3-6 characters long and may contain letters and numbers (e.g., JS001, WEB101).
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <strong>Already enrolled?</strong> If you're already enrolled in a quiz, you can find it in your <Link href="/student/quizzes" className="link">available quizzes</Link>.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4 mt-6">
        <Link href="/student/quizzes" className="btn btn-outline flex-1">
          Browse Available Quizzes
        </Link>
        <Link href="/student/results" className="btn btn-outline flex-1">
          View My Results
        </Link>
      </div>
    </div>
  )
}
