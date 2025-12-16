import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { ApiError, isApiError } from "@/lib/api-error"
import { authOptions } from "@/lib/auth"
import { createSignedUploadUrl } from "@/lib/gcs"
import { getPreferredLocale, t, tApiError } from "@/lib/i18n"
import { prisma } from "@/lib/prisma"

async function canUpload(projectId: string, userId: string, isAdmin: boolean) {
  if (isAdmin) return true
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { id: true },
  })
  return !!member
}

// POST /api/projects/:id/documents/upload-url
// Body: { filename: string, contentType: string, sizeBytes?: number }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const locale = getPreferredLocale(req.headers.get("accept-language"))
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw ApiError.unauthorized()

    const { id: projectId } = await params
    const isAdmin = session.user.role === "ADMIN"
    const allowed = await canUpload(projectId, session.user.id, isAdmin)
    if (!allowed) throw ApiError.forbidden()

    const body = (await req.json()) as { filename?: string; contentType?: string; sizeBytes?: number }
    const filename = body.filename?.trim()
    const contentType = body.contentType?.trim()

    if (!filename) throw ApiError.badRequest(t(locale, "DOCUMENT_FILENAME_REQUIRED"), "DOCUMENT_FILENAME_REQUIRED")
    if (!contentType) throw ApiError.badRequest(t(locale, "DOCUMENT_CONTENT_TYPE_REQUIRED"), "DOCUMENT_CONTENT_TYPE_REQUIRED")

    const doc = await prisma.document.create({
      data: {
        projectId,
        createdBy: session.user.id,
        filename,
        mimeType: contentType,
        sizeBytes: typeof body.sizeBytes === "number" ? body.sizeBytes : null,
        // Temporary placeholders; we update with real values after key generation
        storageBucket: "",
        storageKey: "",
        gcsUri: "",
        status: "UPLOADED",
      },
      select: { id: true },
    })

    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120)
    const objectKey = `projects/${projectId}/documents/${doc.id}/${safeFilename}`

    const signed = await createSignedUploadUrl({
      objectKey,
      contentType,
    })

    await prisma.document.update({
      where: { id: doc.id },
      data: {
        storageBucket: signed.bucket,
        storageKey: signed.objectKey,
        gcsUri: signed.gcsUri,
      },
      select: { id: true },
    })

    return NextResponse.json({
      documentId: doc.id,
      upload: {
        url: signed.url,
        headers: signed.headers,
        expiresAt: signed.expiresAt,
      },
      gcs: {
        bucket: signed.bucket,
        objectKey: signed.objectKey,
        uri: signed.gcsUri,
      },
    })
  } catch (error: unknown) {
    console.error("Document upload-url error:", error)

    if (isApiError(error)) {
      return NextResponse.json(
        { error: tApiError(locale, error), code: error.code },
        { status: error.statusCode }
      )
    }

    return NextResponse.json({ error: t(locale, "SERVER_ERROR") }, { status: 500 })
  }
}
