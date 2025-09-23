import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"
import { UserRole, Permission } from "@prismatic/lib/types"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      picture?: string | null
      role: UserRole
      permissions: Permission[]
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    picture?: string | null
    role: UserRole
    permissions: Permission[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: UserRole
    status: string
    permissions: Permission[]
  }
}
