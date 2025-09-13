"use client"

import { useSession } from "next-auth/react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Role } from "@prisma/client"
import { useRouter } from "next/navigation"

const quizSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  materialUrl: z.string().url().optional().or(z.literal("")),
  timeLimit: z.number().min(1, "Time limit must be at least 1 minute").optional(),
  maxAttempts: z.number().min(1, "Max attempts must be at least 1").optional(),
})

type QuizForm = z.infer<typeof quizSchema>

export default function CreateQuizPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuizForm>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      timeLimit: 30,
    }
  })

  if (!session || (session.user.role !== Role.EDUCATOR && session.user.role !== Role.ADMIN)) {
    return (
      <div className="alert alert-error">
        <span>You don't have permission to create quizzes.</span>
      </div>
    )
  }

  const createQuiz = async (data: QuizForm) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const quiz = await response.json()
        router.push(`/educator/quizzes/${quiz.id}`)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create quiz")
      }
    } catch (error) {
      console.error("Error creating quiz:", error)
      alert(error instanceof Error ? error.message : "Failed to create quiz")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Create New Quiz</h1>
        <div className="text-sm breadcrumbs">
          <ul>
            <li>Dashboard</li>
            <li>Educator</li>
            <li>Create Quiz</li>
          </ul>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-6">Quiz Information</h2>
          
          <form onSubmit={handleSubmit(createQuiz)} className="space-y-6">
            {/* Title */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Quiz Title *</span>
              </label>
              <input
                {...register("title")}
                type="text"
                placeholder="Enter quiz title (e.g., JavaScript Fundamentals)"
                className={`input input-bordered w-full ${errors.title ? 'input-error' : ''}`}
              />
              {errors.title && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.title.message}
                  </span>
                </label>
              )}
            </div>

            {/* Description */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Description</span>
                <span className="label-text-alt">Optional</span>
              </label>
              <textarea
                {...register("description")}
                placeholder="Describe what this quiz covers..."
                className="textarea textarea-bordered h-24 resize-none"
              />
              <label className="label">
                <span className="label-text-alt">Help students understand what they'll be tested on</span>
              </label>
            </div>

            {/* Study Material URL */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Study Material URL</span>
                <span className="label-text-alt">Optional</span>
              </label>
              <input
                {...register("materialUrl")}
                type="url"
                placeholder="https://example.com/study-material"
                className={`input input-bordered w-full ${errors.materialUrl ? 'input-error' : ''}`}
              />
              {errors.materialUrl && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.materialUrl.message}
                  </span>
                </label>
              )}
              <label className="label">
                <span className="label-text-alt">Link to resources students should study before taking the quiz</span>
              </label>
            </div>

            {/* Time Limit */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Time Limit</span>
                <span className="label-text-alt">Optional</span>
              </label>
              <div className="input-group">
                <input
                  {...register("timeLimit", { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="300"
                  placeholder="30"
                  className="input input-bordered flex-1"
                />
                <span className="bg-base-200 px-4 flex items-center text-sm">minutes</span>
              </div>
              <label className="label">
                <span className="label-text-alt">Leave empty for no time limit</span>
              </label>
            </div>

            {/* Max Attempts */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Maximum Attempts</span>
                <span className="label-text-alt">Optional</span>
              </label>
              <div className="input-group">
                <input
                  {...register("maxAttempts", { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="20"
                  placeholder="Unlimited"
                  className="input input-bordered flex-1"
                />
                <span className="bg-base-200 px-4 flex items-center text-sm">attempts</span>
              </div>
              <label className="label">
                <span className="label-text-alt">Leave empty for unlimited attempts</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="btn btn-outline flex-1"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Creating Quiz...
                  </>
                ) : (
                  "Create Quiz & Add Questions"
                )}
              </button>
            </div>
          </form>

          <div className="divider"></div>

          {/* Info Section */}
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h3 className="font-bold">Next Steps</h3>
              <div className="text-sm">After creating your quiz, you'll be able to add questions and manage quiz settings.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
