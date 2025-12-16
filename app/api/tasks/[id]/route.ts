import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { ApiError, isApiError } from "@/lib/api-error"
import { authOptions } from "@/lib/auth"
import { getPreferredLocale, t, tApiError } from "@/lib/i18n"
import { prisma } from "@/lib/prisma"

async function canManageByTask(taskId: string, userId: string, isAdmin: boolean) {
  if (isAdmin) return true
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } })
  if (!task) return false
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId: task.projectId } },
    select: { role: true },
  })
  return member?.role === "OWNER" || member?.role === "MANAGER"
}

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const locale = getPreferredLocale(req.headers.get("accept-language"))

    const params = await props.params
    const taskId = params.id

    const session = await getServerSession(authOptions)
    if (!session?.user) throw ApiError.unauthorized()
    const isAdmin = session.user.role === "ADMIN"

    const allowed = await canManageByTask(taskId, session.user.id, isAdmin)
    if (!allowed) throw ApiError.forbidden()

    let body: unknown
    try {
      const text = await req.text()
      body = JSON.parse(text)
    } catch (e) {
      console.error("JSON parse error:", e)
      return NextResponse.json({ error: t(locale, "INVALID_JSON") }, { status: 400 })
    }
    const { title, description, status, priority, assignedTo, dueDate } = body as {
      title?: string
      description?: string | null
      status?: "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE"
      priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
      assignedTo?: string | null
      dueDate?: string | null
    }

    await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(priority !== undefined ? { priority } : {}),
        ...(assignedTo !== undefined ? { assignedTo } : {}),
        ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error("Task update error:", error)
    
    if (isApiError(error)) {
      const locale = getPreferredLocale(req.headers.get("accept-language"))
      return NextResponse.json(
        { error: tApiError(locale, error), code: error.code },
        { status: error.statusCode }
      )
    }
    
    const locale = getPreferredLocale(req.headers.get("accept-language"))
    return NextResponse.json({ error: t(locale, "SERVER_ERROR") }, { status: 500 })
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params
    const taskId = params.id

    const session = await getServerSession(authOptions)
    if (!session?.user) throw ApiError.unauthorized()
    const isAdmin = session.user.role === "ADMIN"

    const allowed = await canManageByTask(taskId, session.user.id, isAdmin)
    if (!allowed) throw ApiError.forbidden()

    await prisma.task.delete({ where: { id: taskId } })
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error("Task delete error:", error)
    
    if (isApiError(error)) {
      const locale = getPreferredLocale(req.headers.get("accept-language"))
      return NextResponse.json(
        { error: tApiError(locale, error), code: error.code },
        { status: error.statusCode }
      )
    }
    
    const locale = getPreferredLocale(req.headers.get("accept-language"))
    return NextResponse.json({ error: t(locale, "SERVER_ERROR") }, { status: 500 })
  }
}
