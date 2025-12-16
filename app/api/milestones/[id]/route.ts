import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { ApiError, isApiError } from "@/lib/api-error"
import { authOptions } from "@/lib/auth"
import { getPreferredLocale, t, tApiError } from "@/lib/i18n"
import { prisma } from "@/lib/prisma"

async function canManageByMilestone(milestoneId: string, userId: string, isAdmin: boolean) {
  if (isAdmin) return true
  const ms = await prisma.milestone.findUnique({ where: { id: milestoneId }, select: { projectId: true } })
  if (!ms) return false
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId: ms.projectId } },
    select: { role: true },
  })
  return member?.role === "OWNER" || member?.role === "MANAGER"
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const locale = getPreferredLocale(req.headers.get("accept-language"))
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw ApiError.unauthorized()
    const isAdmin = session.user.role === "ADMIN"

    const milestoneId = params.id
    const allowed = await canManageByMilestone(milestoneId, session.user.id, isAdmin)
    if (!allowed) throw ApiError.forbidden()

    const body = await req.json()
    const { title, description, status, dueDate } = body as {
      title?: string
      description?: string | null
      status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE"
      dueDate?: string
    }

    await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(dueDate !== undefined ? { dueDate: new Date(dueDate) } : {}),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error("Milestone update error:", error)
    
    if (isApiError(error)) {
      return NextResponse.json(
        { error: tApiError(locale, error), code: error.code },
        { status: error.statusCode }
      )
    }
    
    return NextResponse.json({ error: t(locale, "SERVER_ERROR") }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const locale = getPreferredLocale(req.headers.get("accept-language"))
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw ApiError.unauthorized()
    const isAdmin = session.user.role === "ADMIN"

    const milestoneId = params.id
    const allowed = await canManageByMilestone(milestoneId, session.user.id, isAdmin)
    if (!allowed) throw ApiError.forbidden()

    await prisma.milestone.delete({ where: { id: milestoneId } })
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error("Milestone delete error:", error)
    
    if (isApiError(error)) {
      return NextResponse.json(
        { error: tApiError(locale, error), code: error.code },
        { status: error.statusCode }
      )
    }
    
    return NextResponse.json({ error: t(locale, "SERVER_ERROR") }, { status: 500 })
  }
}
