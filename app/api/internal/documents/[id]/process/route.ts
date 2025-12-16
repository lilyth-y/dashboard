import { NextResponse } from "next/server"

import { ApiError, isApiError } from "@/lib/api-error"
import { extractTextFromGcsWithDocumentAi } from "@/lib/document-ai"
import { getPreferredLocale, t, tApiError } from "@/lib/i18n"
import { prisma } from "@/lib/prisma"

async function verifyCloudTasksOidc(req: Request): Promise<void> {
  const auth = req.headers.get("authorization")
  const token = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null
  if (!token) throw ApiError.unauthorized()

  const audience = process.env.CLOUD_TASKS_OIDC_AUDIENCE
  if (!audience) {
    // Without an audience, we cannot safely verify the token.
    throw ApiError.unauthorized()
  }

  const { OAuth2Client } = await import("google-auth-library")
  const client = new OAuth2Client()

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience,
  })

  const payload = ticket.getPayload()
  if (!payload) throw ApiError.unauthorized()
}

// POST /api/internal/documents/:id/process
// Intended to be called by Cloud Tasks (OIDC).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const locale = getPreferredLocale(req.headers.get("accept-language"))
  try {
    await verifyCloudTasksOidc(req)

    const { id } = await params

    const doc = await prisma.document.findUnique({
      where: { id },
      select: {
        id: true,
        mimeType: true,
        gcsUri: true,
      },
    })

    if (!doc) throw ApiError.notFound(t(locale, "DOCUMENT_NOT_FOUND"), "DOCUMENT_NOT_FOUND")

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
    console.error("Internal document process error:", error)

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

    return NextResponse.json({ error: t(locale, "DOCUMENT_PROCESS_FAILED") }, { status: 500 })
  }
}
