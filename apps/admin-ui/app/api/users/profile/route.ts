import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/lib/auth'
import { z } from 'zod'

const prisma = new PrismaClient()

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  picture: z.string().url().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ user })
    
  } catch (error) {
    console.error('Error fetching user profile:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()
    const { name, picture } = UpdateProfileSchema.parse(body)
    
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name && { name }),
        ...(picture && { picture }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        picture: true,
        role: true,
        status: true,
        updatedAt: true
      }
    })
    
    // Log the profile update
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PROFILE_UPDATED',
        resourceType: 'user',
        resourceId: session.user.id,
        details: {
          updatedFields: Object.keys({ name, picture }).filter(key => 
            body[key] !== undefined
          )
        }
      }
    })
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser
    })
    
  } catch (error) {
    console.error('Error updating user profile:', error)
    
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
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
