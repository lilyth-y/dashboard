import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { ApiError, isApiError } from "@/lib/api-error"
import { authOptions } from "@/lib/auth"
import { getPreferredLocale, t, tApiError } from "@/lib/i18n"
import { prisma } from "@/lib/prisma"

async function canView(projectId: string, userId: string, isAdmin: boolean) {
  if (isAdmin) return true
  const m = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { id: true },
  })
  return !!m
}

async function canManage(projectId: string, userId: string, isAdmin: boolean) {
  if (isAdmin) return true
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { role: true },
  })
  return member?.role === "OWNER" || member?.role === "MANAGER"
}

// GET milestones
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const locale = getPreferredLocale(_req.headers.get("accept-language"))
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw ApiError.unauthorized()

    const isAdmin = session.user.role === "ADMIN"
    const { id: projectId } = await params
    const allowed = await canView(projectId, session.user.id, isAdmin)
    if (!allowed) throw ApiError.forbidden()

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      orderBy: { dueDate: "asc" },
      select: { id: true, title: true, description: true, status: true, dueDate: true },
    })

    return NextResponse.json({ milestones })
  } catch (error: unknown) {
    console.error("Milestones list error:", error)
    
    if (isApiError(error)) {
      return NextResponse.json(
        { error: tApiError(locale, error), code: error.code },
        { status: error.statusCode }
      )
    }
    
    return NextResponse.json({ error: t(locale, "SERVER_ERROR") }, { status: 500 })
  }
}

// POST create milestone
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const locale = getPreferredLocale(req.headers.get("accept-language"))
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw ApiError.unauthorized()

    const isAdmin = session.user.role === "ADMIN"
    const { id: projectId } = await params
    const allowed = await canManage(projectId, session.user.id, isAdmin)
    if (!allowed) throw ApiError.forbidden()

    const body = await req.json()
    const { title, description, dueDate } = body as { title?: string; description?: string | null; dueDate?: string }
    if (!title || !dueDate) {
      throw ApiError.badRequest("제목과 마감일은 필수입니다.", "MILESTONE_REQUIRED_FIELDS")
    }

    const m = await prisma.milestone.create({
      data: {
        title: title.trim(),
        description: description ?? null,
        dueDate: new Date(dueDate),
        projectId,
      },
      select: { id: true },
    })

    return NextResponse.json({ id: m.id }, { status: 201 })
  } catch (error: unknown) {
    console.error("Milestone create error:", error)
    
    if (isApiError(error)) {
      return NextResponse.json(
        { error: tApiError(locale, error), code: error.code },
        { status: error.statusCode }
      )
    }
    
    return NextResponse.json({ error: t(locale, "SERVER_ERROR") }, { status: 500 })
  }
}
