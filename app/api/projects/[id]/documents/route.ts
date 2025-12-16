import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { ApiError, isApiError } from "@/lib/api-error"
import { authOptions } from "@/lib/auth"
import { getPreferredLocale, t, tApiError } from "@/lib/i18n"
import { prisma } from "@/lib/prisma"

async function canView(projectId: string, userId: string, isAdmin: boolean) {
  if (isAdmin) return true
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { id: true },
  })
  return !!member
}

// GET /api/projects/:id/documents
// Optional: ?q=... (content search within extractedText/filename)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const locale = getPreferredLocale(req.headers.get("accept-language"))
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw ApiError.unauthorized()

    const { id: projectId } = await params
    const isAdmin = session.user.role === "ADMIN"
    const allowed = await canView(projectId, session.user.id, isAdmin)
    if (!allowed) throw ApiError.forbidden()

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim()

    const where = {
      projectId,
      ...(q
        ? {
            OR: [
              { filename: { contains: q } },
              { extractedText: { contains: q } },
            ],
          }
        : {}),
    }

    const documents = await prisma.document.findMany({
      where,
      select: {
        id: true,
        projectId: true,
        filename: true,
        mimeType: true,
        sizeBytes: true,
        status: true,
        processedAt: true,
        createdAt: true,
        storageBucket: true,
        storageKey: true,
        gcsUri: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json({ documents })
  } catch (error: unknown) {
    console.error("Documents list/search error:", error)

    if (isApiError(error)) {
      return NextResponse.json(
        { error: tApiError(locale, error), code: error.code },
        { status: error.statusCode }
      )
    }

    return NextResponse.json({ error: t(locale, "SERVER_ERROR") }, { status: 500 })
  }
}
