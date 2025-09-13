"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Role, EducatorStatus } from "@prisma/client"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface User {
  id: string
  name: string | null
  email: string
  role: Role
  educatorStatus: EducatorStatus | null
  createdAt: string
  _count: {
    createdQuizzes: number
    quizAttempts: number
    enrollments: number
  }
}

export default function AdminUsersPage() {
  const [selectedRole, setSelectedRole] = useState<Role | "ALL">("ALL")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState<string | null>(null)

  const { data: users, error } = useSWR<User[]>("/api/admin/users", fetcher)

  const filteredUsers = users?.filter(user => {
    const matchesRole = selectedRole === "ALL" || user.role === selectedRole
    const matchesSearch = searchTerm === "" || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesRole && matchesSearch
  })

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      setLoading(userId)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        throw new Error("Failed to update user role")
      }

      await mutate("/api/admin/users")
    } catch (error) {
      console.error("Error updating user role:", error)
      alert("Failed to update user role")
    } finally {
      setLoading(null)
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return
    }

    try {
      setLoading(userId)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      await mutate("/api/admin/users")
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Failed to delete user")
    } finally {
      setLoading(null)
    }
  }

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case Role.ADMIN: return "badge-error"
      case Role.EDUCATOR: return "badge-warning"
      case Role.STUDENT: return "badge-info"
      default: return "badge-ghost"
    }
  }

  const getEducatorStatusBadgeColor = (status: EducatorStatus | null) => {
    switch (status) {
      case EducatorStatus.APPROVED: return "badge-success"
      case EducatorStatus.PENDING: return "badge-warning"
      case EducatorStatus.REJECTED: return "badge-error"
      default: return "badge-ghost"
    }
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Failed to load users</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="text-sm breadcrumbs">
          <ul>
            <li>Dashboard</li>
            <li>Admin</li>
            <li>Users</li>
          </ul>
        </div>
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Filter by Role</span>
              </label>
              <select
                className="select select-bordered"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role | "ALL")}
              >
                <option value="ALL">All Roles</option>
                <option value={Role.ADMIN}>Admin</option>
                <option value={Role.EDUCATOR}>Educator</option>
                <option value={Role.STUDENT}>Student</option>
              </select>
            </div>

            <div className="form-control flex-1">
              <label className="label">
                <span className="label-text">Search Users</span>
              </label>
              <input
                type="text"
                placeholder="Search by name or email..."
                className="input input-bordered"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {!users ? (
        <div className="flex justify-center items-center min-h-96">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">
                Users ({filteredUsers?.length || 0})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Activity</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers?.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div>
                          <div className="font-bold">{user.name || "No name"}</div>
                          <div className="text-sm opacity-50">{user.email}</div>
                        </div>
                      </td>
                      <td>
                        <div className={`badge ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </div>
                      </td>
                      <td>
                        {user.role === Role.EDUCATOR && user.educatorStatus && (
                          <div className={`badge badge-sm ${getEducatorStatusBadgeColor(user.educatorStatus)}`}>
                            {user.educatorStatus}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="text-sm">
                          {user.role === Role.EDUCATOR && (
                            <div>Quizzes: {user._count.createdQuizzes}</div>
                          )}
                          {user.role === Role.STUDENT && (
                            <>
                              <div>Attempts: {user._count.quizAttempts}</div>
                              <div>Enrolled: {user._count.enrollments}</div>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div className="dropdown dropdown-end">
                          <div tabIndex={0} role="button" className="btn btn-sm">
                            Actions
                          </div>
                          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                            <li className="menu-title">Change Role</li>
                            {Object.values(Role).map((role) => (
                              <li key={role}>
                                <button
                                  onClick={() => handleRoleChange(user.id, role)}
                                  disabled={loading === user.id || user.role === role}
                                  className={user.role === role ? "text-primary" : ""}
                                >
                                  {role}
                                </button>
                              </li>
                            ))}
                            <div className="divider m-0"></div>
                            <li>
                              <button
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                disabled={loading === user.id}
                                className="text-error"
                              >
                                Delete User
                              </button>
                            </li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers?.length === 0 && (
                <div className="text-center py-8 opacity-70">
                  No users found matching your criteria
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
