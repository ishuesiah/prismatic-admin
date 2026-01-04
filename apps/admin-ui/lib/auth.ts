import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { ALLOWED_DOMAINS, ROLE_PERMISSIONS, SUPERADMIN_EMAIL } from "@prismatic/lib/constants"
import type { UserRole, Permission } from "@prismatic/lib/types"
import { prisma } from "./prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Temporary Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const tempPassword = process.env.TEMP_LOGIN_PASSWORD
        if (!tempPassword) return null

        const email = credentials?.email as string
        const password = credentials?.password as string

        if (!email || !password) return null
        if (password !== tempPassword) return null

        // Check domain
        const emailDomain = email.split("@")[1]
        if (!ALLOWED_DOMAINS.includes(emailDomain)) return null

        // Find or create user
        let user = await prisma.user.findUnique({ where: { email } })

        if (!user) {
          // Only allow superadmin email for temp login creation
          if (email !== SUPERADMIN_EMAIL) return null

          user = await prisma.user.create({
            data: {
              email,
              name: email.split("@")[0],
              role: "SUPERADMIN",
              status: "ACTIVE"
            }
          })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.picture,
          role: user.role as UserRole,
          permissions: ROLE_PERMISSIONS[user.role as UserRole]
        }
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[AUTH] Sign in attempt:', { email: user.email, provider: account?.provider })
      
      if (!user.email) {
        console.log('[AUTH] No email provided')
        return false
      }

      // Check if email domain is allowed
      const emailDomain = user.email.split("@")[1]
      console.log('[AUTH] Checking domain:', emailDomain)
      
      if (!ALLOWED_DOMAINS.includes(emailDomain)) {
        console.log('[AUTH] Domain not allowed:', emailDomain)
        return false
      }

      try {
        // Check if user exists
        let existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        })
        
        console.log('[AUTH] Existing user:', existingUser ? 'Found' : 'Not found')

        // If user doesn't exist, check for invitation or if it's superadmin
        if (!existingUser) {
          const invitation = await prisma.invitation.findFirst({
            where: {
              email: user.email,
              status: "PENDING",
              expiresAt: { gt: new Date() }
            }
          })

          if (!invitation && user.email !== SUPERADMIN_EMAIL) {
            console.log('[AUTH] No invitation found and not superadmin')
            return false
          }

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
          
          console.log('[AUTH] User will be created by adapter')
        } else {
          // Update last login and link Google account if not already linked
          console.log('[AUTH] Updating existing user')
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { 
              lastLogin: new Date(),
              googleId: account?.providerAccountId || existingUser.googleId,
              picture: user.image || existingUser.picture,
              name: user.name || existingUser.name
            }
          })
        }

        console.log('[AUTH] Sign in approved')
        return true
      } catch (error) {
        console.error('[AUTH] Error during sign in:', error)
        return false
      }
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
