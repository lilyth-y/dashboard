import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { ApiError, isApiError } from "@/lib/api-error"
import { authOptions } from "@/lib/auth"
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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw ApiError.unauthorized()
    const isAdmin = session.user.role === "ADMIN"

    const { id: taskId } = await params
    const allowed = await canManageByTask(taskId, session.user.id, isAdmin)
    if (!allowed) throw ApiError.forbidden()

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
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
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw ApiError.unauthorized()
    const isAdmin = session.user.role === "ADMIN"

    const { id: taskId } = await params
    const allowed = await canManageByTask(taskId, session.user.id, isAdmin)
    if (!allowed) throw ApiError.forbidden()

    await prisma.task.delete({ where: { id: taskId } })
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error("Task delete error:", error)
    
    if (isApiError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
