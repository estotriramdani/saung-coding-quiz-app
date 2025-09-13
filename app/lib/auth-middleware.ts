import { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function getSession(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.AUTH_SECRET 
    })
    
    if (!token) return null
    
    return {
      user: {
        id: token.sub!,
        email: token.email!,
        name: token.name,
        role: token.role as string,
        educatorStatus: token.educatorStatus as string | undefined,
      }
    }
  } catch (error) {
    console.error("Session error in middleware:", error)
    return null
  }
}