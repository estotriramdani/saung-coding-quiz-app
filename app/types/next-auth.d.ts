import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"
import { Role, EducatorStatus } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      educatorStatus?: EducatorStatus
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: Role
    educatorStatus?: EducatorStatus
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role
    educatorStatus?: EducatorStatus
  }
}
