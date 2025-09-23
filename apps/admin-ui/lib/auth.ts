import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import Google from "next-auth/providers/google"
import { ALLOWED_DOMAINS, ROLE_PERMISSIONS, SUPERADMIN_EMAIL } from "@prismatic/lib/constants"
import type { UserRole, Permission } from "@prismatic/lib/types"

const prisma = new PrismaClient()

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false

      // Check if email domain is allowed
      const emailDomain = user.email.split("@")[1]
      if (!ALLOWED_DOMAINS.includes(emailDomain)) {
        return false
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email }
      })

      // If user doesn't exist, check for invitation
      if (!existingUser) {
        const invitation = await prisma.invitation.findFirst({
          where: {
            email: user.email,
            status: "PENDING",
            expiresAt: { gt: new Date() }
          }
        })

        if (!invitation && user.email !== SUPERADMIN_EMAIL) {
          return false
        }

        // Create user with appropriate role
        const role: UserRole = user.email === SUPERADMIN_EMAIL ? "SUPERADMIN" : "VIEWER"
        
        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name,
            picture: user.image,
            googleId: account?.providerAccountId,
            role,
            status: "ACTIVE",
            lastLogin: new Date()
          }
        })

        // Mark invitation as accepted if exists
        if (invitation) {
          await prisma.invitation.update({
            where: { id: invitation.id },
            data: {
              status: "ACCEPTED",
              acceptedAt: new Date()
            }
          })
        }
      } else {
        // Update last login
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { lastLogin: new Date() }
        })
      }

      return true
    },
    
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! }
        })
        
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          token.status = dbUser.status
          token.permissions = ROLE_PERMISSIONS[dbUser.role]
        }
      }
      
      if (trigger === "update" && session) {
        // Handle session updates
        return { ...token, ...session.user }
      }
      
      return token
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.permissions = token.permissions as Permission[]
      }
      
      return session
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
})

// Helper function to check permissions
export async function hasPermission(userId: string, permission: Permission): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })
  
  if (!user) return false
  
  const permissions = ROLE_PERMISSIONS[user.role as UserRole]
  return permissions.includes(permission)
}

// Helper function to require auth
export async function requireAuth() {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }
  
  return session
}

// Helper function to require specific permission
export async function requirePermission(permission: Permission) {
  const session = await requireAuth()
  
  if (!session.user?.permissions?.includes(permission)) {
    throw new Error("Insufficient permissions")
  }
  
  return session
}
