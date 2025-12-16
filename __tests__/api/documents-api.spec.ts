import { describe, it, expect, beforeEach, vi } from "vitest"

import { GET as DocumentsGET } from "@/app/api/projects/[id]/documents/route"
import { POST as UploadUrlPOST } from "@/app/api/projects/[id]/documents/upload-url/route"
import { POST as ProcessPOST } from "@/app/api/documents/[id]/process/route"
import { POST as EnqueuePOST } from "@/app/api/documents/[id]/enqueue/route"
import { POST as InternalProcessPOST } from "@/app/api/internal/documents/[id]/process/route"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    projectMember: {
      findUnique: vi.fn(),
    },
    document: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}))

vi.mock("@/lib/gcs", () => ({
  createSignedUploadUrl: vi.fn(async ({ objectKey, contentType }: { objectKey: string; contentType: string }) => ({
    bucket: "test-bucket",
    objectKey,
    gcsUri: `gs://test-bucket/${objectKey}`,
    url: "https://signed-upload-url.example",
    headers: { "content-type": contentType },
    expiresAt: new Date(Date.now() + 600_000).toISOString(),
  })),
}))

vi.mock("@/lib/document-ai", () => ({
  extractTextFromGcsWithDocumentAi: vi.fn(async () => ({ text: "TOTAL 12345", raw: { ok: true } })),
}))

vi.mock("@/lib/cloud-tasks", () => ({
  enqueueDocumentProcess: vi.fn(async () => ({ taskName: "task-1" })),
}))

vi.mock("google-auth-library", () => ({
  OAuth2Client: class {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async verifyIdToken(_opts: any) {
      return {
        getPayload() {
          return { sub: "svc" }
        },
      }
    }
  },
}))

describe("Documents API", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma = vi.mocked(prisma)
  })

  it("upload-url returns 401 when unauthenticated", async () => {
    ;(getServerSession as any).mockResolvedValue(null)

    const req = new Request("http://localhost/api/projects/proj-1/documents/upload-url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filename: "a.jpg", contentType: "image/jpeg" }),
    })

    const res = await UploadUrlPOST(req, { params: Promise.resolve({ id: "proj-1" }) })
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe("인증이 필요합니다.")
  })

  it("upload-url returns signed URL for project member", async () => {
    ;(getServerSession as any).mockResolvedValue({ user: { id: "user-1", role: "USER" } })
    mockPrisma.projectMember.findUnique.mockResolvedValue({ id: "pm-1" })
    mockPrisma.document.create.mockResolvedValue({ id: "doc-1" })
    mockPrisma.document.update.mockResolvedValue({ id: "doc-1" })

    const req = new Request("http://localhost/api/projects/proj-1/documents/upload-url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filename: "receipt.jpg", contentType: "image/jpeg" }),
    })

    const res = await UploadUrlPOST(req, { params: Promise.resolve({ id: "proj-1" }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.documentId).toBe("doc-1")
    expect(data.upload.url).toBe("https://signed-upload-url.example")
    expect(mockPrisma.document.create).toHaveBeenCalled()
    expect(mockPrisma.document.update).toHaveBeenCalled()
  })

  it("documents search returns only project docs", async () => {
    ;(getServerSession as any).mockResolvedValue({ user: { id: "user-1", role: "USER" } })
    mockPrisma.projectMember.findUnique.mockResolvedValue({ id: "pm-1" })
    mockPrisma.document.findMany.mockResolvedValue([{ id: "doc-1" }])

    const req = new Request("http://localhost/api/projects/proj-1/documents?q=TOTAL", {
      method: "GET",
    })

    const res = await DocumentsGET(req, { params: Promise.resolve({ id: "proj-1" }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(data.documents)).toBe(true)
    expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ projectId: "proj-1" }) })
    )
  })

  it("process returns 404 for unknown doc", async () => {
    ;(getServerSession as any).mockResolvedValue({ user: { id: "user-1", role: "USER" } })
    mockPrisma.document.findUnique.mockResolvedValue(null)

    const req = new Request("http://localhost/api/documents/doc-x/process", { method: "POST" })

    const res = await ProcessPOST(req, { params: Promise.resolve({ id: "doc-x" }) })
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.code).toBe("DOCUMENT_NOT_FOUND")
  })

  it("enqueue returns 403 for non-manager/owner", async () => {
    ;(getServerSession as any).mockResolvedValue({ user: { id: "user-1", role: "USER" } })
    mockPrisma.document.findUnique.mockResolvedValue({ id: "doc-1", projectId: "proj-1", status: "UPLOADED" })
    mockPrisma.projectMember.findUnique.mockResolvedValue({ role: "MEMBER" })

    const req = new Request("http://localhost/api/documents/doc-1/enqueue", { method: "POST" })
    const res = await EnqueuePOST(req, { params: Promise.resolve({ id: "doc-1" }) })
    const data = await res.json()

    expect(res.status).toBe(403)
    expect(data.error).toBe("권한이 없습니다.")
  })

  it("internal process returns 401 without OIDC token", async () => {
    process.env.CLOUD_TASKS_OIDC_AUDIENCE = "https://service.example"
    mockPrisma.document.findUnique.mockResolvedValue({ id: "doc-1", mimeType: "image/jpeg", gcsUri: "gs://b/k" })

    const req = new Request("http://localhost/api/internal/documents/doc-1/process", { method: "POST" })
    const res = await InternalProcessPOST(req, { params: Promise.resolve({ id: "doc-1" }) })
    expect(res.status).toBe(401)
  })
})
