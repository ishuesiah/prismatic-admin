import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const groups = await prisma.emailGroup.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        emails: true
      },
      orderBy: {
        priority: 'asc'
      }
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error("Fetch groups error:", error)
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    )
  }
}
