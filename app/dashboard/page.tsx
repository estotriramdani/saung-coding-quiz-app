import { auth } from "@/app/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  // Redirect to role-specific dashboard
  switch (session.user.role) {
    case "ADMIN":
      redirect("/admin/dashboard")
    case "EDUCATOR":
      redirect("/educator/dashboard")
    case "STUDENT":
      redirect("/student/dashboard")
    default:
      redirect("/auth/signin")
  }
}
