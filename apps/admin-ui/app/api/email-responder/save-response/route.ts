import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { emailId, response } = await request.json()

    if (!emailId || typeof response !== "string") {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      )
    }

    // Verify email belongs to user and update response
    const email = await prisma.emailCorrespondence.findFirst({
      where: {
        id: emailId,
        userId: session.user.id
      }
    })

    if (!email) {
      return NextResponse.json(
        { error: "Email not found or unauthorized" },
        { status: 404 }
      )
    }

    // Update the response
    const updatedEmail = await prisma.emailCorrespondence.update({
      where: { id: emailId },
      data: {
        autoResponse: response,
        isEdited: true,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      emailId: updatedEmail.id,
      saved: true
    })
  } catch (error) {
    console.error("Save response error:", error)
    return NextResponse.json(
      { error: "Failed to save response" },
      { status: 500 }
    )
  }
}
