import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { ApiError, isApiError } from "@/lib/api-error"
import { authOptions } from "@/lib/auth"
import { extractTextFromGcsWithDocumentAi } from "@/lib/document-ai"
import { getPreferredLocale, t, tApiError } from "@/lib/i18n"
import { prisma } from "@/lib/prisma"

async function canProcess(projectId: string, userId: string, isAdmin: boolean) {
  if (isAdmin) return true
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { role: true },
  })
  return member?.role === "OWNER" || member?.role === "MANAGER"
}

// POST /api/documents/:id/process
// Triggers OCR (Document AI) and stores extractedText/extractedData.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const locale = getPreferredLocale(req.headers.get("accept-language"))
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw ApiError.unauthorized()

    const { id } = await params

    const doc = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        mimeType: true,
        gcsUri: true,
        status: true,
      },
    })

    if (!doc) throw ApiError.notFound(t(locale, "DOCUMENT_NOT_FOUND"), "DOCUMENT_NOT_FOUND")

    const isAdmin = session.user.role === "ADMIN"
    const allowed = await canProcess(doc.projectId, session.user.id, isAdmin)
    if (!allowed) throw ApiError.forbidden()

    await prisma.document.update({
      where: { id: doc.id },
      data: { status: "PROCESSING", errorMessage: null },
      select: { id: true },
    })

    const result = await extractTextFromGcsWithDocumentAi({
      gcsUri: doc.gcsUri,
      mimeType: doc.mimeType,
    })

    await prisma.document.update({
      where: { id: doc.id },
      data: {
        status: "PROCESSED",
        extractedText: result.text,
        extractedData: result.raw as never,
        processedAt: new Date(),
        errorMessage: null,
      },
      select: { id: true },
    })

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error("Document process error:", error)

    // Best-effort mark failed if we can infer a document id.
    try {
      const { id } = await params
      await prisma.document.update({
        where: { id },
        data: {
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        select: { id: true },
      })
    } catch {
      // ignore
    }

    if (isApiError(error)) {
      return NextResponse.json(
        { error: tApiError(locale, error), code: error.code },
        { status: error.statusCode }
      )
    }

    return NextResponse.json(
      { error: t(locale, "DOCUMENT_PROCESS_FAILED") },
      { status: 500 }
    )
  }
}
