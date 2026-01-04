import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/blog/[id] - Get single blog post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            name: true,
            email: true,
            id: true,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error("Error fetching blog post:", error)
    return NextResponse.json(
      { error: "Failed to fetch blog post" },
      { status: 500 }
    )
  }
}

// PUT /api/blog/[id] - Update blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    // Check if user is the author or has admin permissions
    const isAuthor = existingPost.userId === session.user.id
    const isAdmin = session.user.role === "SUPERADMIN" || session.user.role === "ADMIN"

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to edit this post" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      seo,
      status,
      publishedAt,
      shopifyArticleId,
    } = body

    // If slug is being changed, check for conflicts
    if (slug && slug !== existingPost) {
      const slugConflict = await prisma.blogPost.findUnique({
        where: { slug },
      })

      if (slugConflict && slugConflict.id !== id) {
        return NextResponse.json(
          { error: "A post with this slug already exists" },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}

    if (title !== undefined) updateData.title = title
    if (slug !== undefined) updateData.slug = slug
    if (content !== undefined) updateData.content = content
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage
    if (seo !== undefined) updateData.seo = seo
    if (status !== undefined) updateData.status = status
    if (publishedAt !== undefined) {
      updateData.publishedAt = publishedAt ? new Date(publishedAt) : null
    }
    if (shopifyArticleId !== undefined) updateData.shopifyArticleId = shopifyArticleId

    const post = await prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error("Error updating blog post:", error)
    return NextResponse.json(
      { error: "Failed to update blog post" },
      { status: 500 }
    )
  }
}

// DELETE /api/blog/[id] - Delete blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const existingPost = await prisma.blogPost.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      )
    }

    // Check if user is the author or has admin permissions
    const isAuthor = existingPost.userId === session.user.id
    const isAdmin = session.user.role === "SUPERADMIN" || session.user.role === "ADMIN"

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to delete this post" },
        { status: 403 }
      )
    }

    await prisma.blogPost.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting blog post:", error)
    return NextResponse.json(
      { error: "Failed to delete blog post" },
      { status: 500 }
    )
  }
}
