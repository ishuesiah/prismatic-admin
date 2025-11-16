import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET comments for an email
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const emailId = searchParams.get("emailId")

    if (!emailId) {
      return NextResponse.json(
        { error: "Email ID required" },
        { status: 400 }
      )
    }

    const comments = await prisma.emailComment.findMany({
      where: {
        emailId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            picture: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Fetch comments error:", error)
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    )
  }
}

// POST - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { emailId, content, isInternal = true } = await request.json()

    if (!emailId || !content) {
      return NextResponse.json(
        { error: "Email ID and content required" },
        { status: 400 }
      )
    }

    // Verify email belongs to this user's organization
    const email = await prisma.emailCorrespondence.findFirst({
      where: {
        id: emailId,
        userId: session.user.id
      }
    })

    if (!email) {
      return NextResponse.json(
        { error: "Email not found" },
        { status: 404 }
      )
    }

    const comment = await prisma.emailComment.create({
      data: {
        emailId,
        userId: session.user.id!,
        content,
        isInternal
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            picture: true
          }
        }
      }
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Create comment error:", error)
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    )
  }
}

// DELETE a comment
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get("commentId")

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID required" },
        { status: 400 }
      )
    }

    // Only allow user to delete their own comments
    const comment = await prisma.emailComment.findFirst({
      where: {
        id: commentId,
        userId: session.user.id
      }
    })

    if (!comment) {
      return NextResponse.json(
        { error: "Comment not found or unauthorized" },
        { status: 404 }
      )
    }

    await prisma.emailComment.delete({
      where: { id: commentId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete comment error:", error)
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    )
  }
}
