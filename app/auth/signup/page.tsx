"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { Role, EducatorStatus } from "@prisma/client"

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum([Role.STUDENT, Role.EDUCATOR]),
  // Educator specific fields
  bio: z.string().optional(),
  qualification: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === Role.EDUCATOR) {
    return data.bio && data.qualification
  }
  return true
}, {
  message: "Bio and qualification are required for educators",
  path: ["bio"],
})

type SignUpFormData = z.infer<typeof signUpSchema>

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      role: Role.STUDENT,
    },
  })

  const selectedRole = watch("role")

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setIsLoading(true)
      setError("")

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Registration failed")
      }

      setSuccess(true)
      setTimeout(() => {
        if (data.role === Role.EDUCATOR) {
          router.push("/auth/signin?message=educator-pending")
        } else {
          router.push("/auth/signin?message=registration-success")
        }
      }, 2000)
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <div className="text-success text-6xl mb-4">✓</div>
            <h2 className="card-title justify-center text-2xl mb-2">
              Registration Successful!
            </h2>
            <p className="text-center">
              {selectedRole === Role.EDUCATOR
                ? "Your educator account is pending approval. You will receive an email once approved."
                : "Your account has been created successfully. Redirecting to sign in..."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-center justify-center text-2xl mb-4">
            Sign Up
          </h2>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Role</span>
              </label>
              <select
                className="select select-bordered"
                {...register("role")}
              >
                <option value={Role.STUDENT}>Student</option>
                <option value={Role.EDUCATOR}>Educator</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Full Name</span>
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                className={`input input-bordered ${errors.name ? 'input-error' : ''}`}
                {...register("name")}
              />
              {errors.name && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.name.message}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className={`input input-bordered ${errors.email ? 'input-error' : ''}`}
                {...register("email")}
              />
              {errors.email && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.email.message}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className={`input input-bordered ${errors.password ? 'input-error' : ''}`}
                {...register("password")}
              />
              {errors.password && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.password.message}
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Confirm Password</span>
              </label>
              <input
                type="password"
                placeholder="Confirm your password"
                className={`input input-bordered ${errors.confirmPassword ? 'input-error' : ''}`}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <label className="label">
                  <span className="label-text-alt text-error">
                    {errors.confirmPassword.message}
                  </span>
                </label>
              )}
            </div>

            {selectedRole === Role.EDUCATOR && (
              <>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Bio</span>
                  </label>
                  <textarea
                    placeholder="Tell us about yourself"
                    className={`textarea textarea-bordered ${errors.bio ? 'textarea-error' : ''}`}
                    {...register("bio")}
                  />
                  {errors.bio && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.bio.message}
                      </span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Qualifications</span>
                  </label>
                  <textarea
                    placeholder="Your educational background and experience"
                    className={`textarea textarea-bordered ${errors.qualification ? 'textarea-error' : ''}`}
                    {...register("qualification")}
                  />
                  {errors.qualification && (
                    <label className="label">
                      <span className="label-text-alt text-error">
                        {errors.qualification.message}
                      </span>
                    </label>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="divider">OR</div>

          <div className="text-center">
            <p className="text-sm">
              Already have an account?{" "}
              <Link href="/auth/signin" className="link link-primary">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
