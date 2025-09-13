"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { EducatorStatus } from "@prisma/client"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface PendingEducator {
  id: string
  name: string | null
  email: string
  bio: string | null
  qualification: string | null
  educatorStatus: EducatorStatus
  createdAt: string
}

export default function EducatorApprovalsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const { data: educators, error } = useSWR<PendingEducator[]>("/api/admin/educators/pending", fetcher)

  const handleApproval = async (educatorId: string, status: EducatorStatus) => {
    try {
      setLoading(educatorId)

      const response = await fetch(`/api/admin/educators/${educatorId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error("Failed to update educator status")
      }

      // Revalidate the data
      await mutate("/api/admin/educators/pending")
    } catch (error) {
      console.error("Error updating educator:", error)
      alert("Failed to update educator status")
    } finally {
      setLoading(null)
    }
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Failed to load pending educators</span>
      </div>
    )
  }

  if (!educators) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Educator Approvals</h1>
        <div className="text-sm breadcrumbs">
          <ul>
            <li>Dashboard</li>
            <li>Admin</li>
            <li>Educator Approvals</li>
          </ul>
        </div>
      </div>

      {educators.length === 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="card-title justify-center">No Pending Approvals</h2>
            <p>There are no educators waiting for approval at this time.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {educators.map((educator) => (
            <div key={educator.id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="card-title">
                      {educator.name || "No name provided"}
                      <div className="badge badge-warning">Pending</div>
                    </h2>
                    <p className="text-sm opacity-70 mb-4">{educator.email}</p>
                    
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-sm">Bio:</h3>
                        <p className="text-sm">{educator.bio || "No bio provided"}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-sm">Qualifications:</h3>
                        <p className="text-sm">{educator.qualification || "No qualifications provided"}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-sm">Applied:</h3>
                        <p className="text-sm">{new Date(educator.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      className={`btn btn-success btn-sm ${
                        loading === educator.id ? "loading" : ""
                      }`}
                      disabled={loading === educator.id}
                      onClick={() => handleApproval(educator.id, EducatorStatus.APPROVED)}
                    >
                      Approve
                    </button>
                    <button
                      className={`btn btn-error btn-sm ${
                        loading === educator.id ? "loading" : ""
                      }`}
                      disabled={loading === educator.id}
                      onClick={() => handleApproval(educator.id, EducatorStatus.REJECTED)}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
