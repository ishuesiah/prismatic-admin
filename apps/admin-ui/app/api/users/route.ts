import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requirePermission } from '@/lib/auth'
import { z } from 'zod'

const prisma = new PrismaClient()

const GetUsersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['SUPERADMIN', 'ADMIN', 'STAFF', 'VIEWER']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'INVITED', 'SUSPENDED']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    // Check permissions
    await requirePermission('users:read')
    
    const { searchParams } = new URL(request.url)
    const { page, limit, search, role, status } = GetUsersSchema.parse(
      Object.fromEntries(searchParams)
    )
    
    const skip = (page - 1) * limit
    
    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (role) {
      where.role = role
    }
    
    if (status) {
      where.status = status
    }
    
    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          picture: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true,
          _count: {
            select: {
              auditLogs: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ])
    
    const totalPages = Math.ceil(totalCount / limit)
    
    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
    
  } catch (error) {
    console.error('Error fetching users:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
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
