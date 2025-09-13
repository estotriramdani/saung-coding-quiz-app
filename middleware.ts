import { auth } from "@/app/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default async function middleware(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth/signin", "/auth/signup", "/api/auth"]
  
  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  )

  // If trying to access protected route without session
  if (!isPublicRoute && !session) {
    return NextResponse.redirect(new URL("/auth/signin", request.url))
  }

  // Role-based route protection
  if (session) {
    // Admin routes
    if (pathname.startsWith("/admin") && session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Educator routes
    if (pathname.startsWith("/educator")) {
      if (session.user.role !== "EDUCATOR" && session.user.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
      // Check if educator is approved
      if (session.user.role === "EDUCATOR" && session.user.educatorStatus !== "APPROVED") {
        return NextResponse.redirect(new URL("/pending-approval", request.url))
      }
    }

    // Student routes
    if (pathname.startsWith("/student") && session.user.role !== "STUDENT" && session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
