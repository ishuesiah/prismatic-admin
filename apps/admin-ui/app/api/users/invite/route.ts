import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requirePermission } from '@/lib/auth'
import { INVITATION_EXPIRY_MS } from '@prismatic/lib/constants'
import { z } from 'zod'
import crypto from 'crypto'

const prisma = new PrismaClient()

const InviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'STAFF', 'VIEWER']).default('VIEWER'),
})

export async function POST(request: NextRequest) {
  try {
    // Check permissions
    const session = await requirePermission('users:invite')
    
    const body = await request.json()
    const { email, role } = InviteSchema.parse(body)
    
    // Check if email domain is allowed
    const emailDomain = email.split('@')[1]
    if (emailDomain !== 'hemlockandoak.com') {
      return NextResponse.json(
        { error: 'Email domain not allowed' },
        { status: 400 }
      )
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }
    
    // Check if there's already a pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      }
    })
    
    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Invitation already pending' },
        { status: 400 }
      )
    }
    
    // Generate unique invitation token
    const token = crypto.randomBytes(32).toString('hex')
    
    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        email,
        token,
        invitedBy: session.user.id,
        expiresAt: new Date(Date.now() + INVITATION_EXPIRY_MS),
        status: 'PENDING'
      },
      include: {
        inviter: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })
    
    // Log the invitation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_INVITED',
        resourceType: 'invitation',
        resourceId: invitation.id,
        details: {
          email,
          role
        }
      }
    })
    
    // TODO: Send invitation email (implement email service)
    
    return NextResponse.json({
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
        inviterName: invitation.inviter.name
      }
    })
    
  } catch (error) {
    console.error('Error sending invitation:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    if (error instanceof Error && error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
