import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { ApiError, isApiError } from "@/lib/api-error"
import { authOptions } from "@/lib/auth"
import { enqueueDocumentProcess } from "@/lib/cloud-tasks"
import { getPreferredLocale, t, tApiError } from "@/lib/i18n"
import { prisma } from "@/lib/prisma"

async function canManage(projectId: string, userId: string, isAdmin: boolean) {
  if (isAdmin) return true
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { role: true },
  })
  return member?.role === "OWNER" || member?.role === "MANAGER"
}

// POST /api/documents/:id/enqueue
// Enqueues OCR processing via Cloud Tasks.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const locale = getPreferredLocale(req.headers.get("accept-language"))
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw ApiError.unauthorized()

    const { id } = await params

    const doc = await prisma.document.findUnique({
      where: { id },
      select: { id: true, projectId: true, status: true },
    })

    if (!doc) throw ApiError.notFound(t(locale, "DOCUMENT_NOT_FOUND"), "DOCUMENT_NOT_FOUND")

    const isAdmin = session.user.role === "ADMIN"
    const allowed = await canManage(doc.projectId, session.user.id, isAdmin)
    if (!allowed) throw ApiError.forbidden()

    await prisma.document.update({
      where: { id: doc.id },
      data: { status: "PROCESSING", errorMessage: null },
      select: { id: true },
    })

    const task = await enqueueDocumentProcess(doc.id)

    return NextResponse.json({ ok: true, task })
  } catch (error: unknown) {
    console.error("Document enqueue error:", error)

    if (isApiError(error)) {
      return NextResponse.json(
        { error: tApiError(locale, error), code: error.code },
        { status: error.statusCode }
      )
    }

    return NextResponse.json({ error: t(locale, "SERVER_ERROR") }, { status: 500 })
  }
}
