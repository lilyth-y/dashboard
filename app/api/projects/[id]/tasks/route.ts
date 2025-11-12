import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { ApiError, isApiError } from "@/lib/api-error"
import { authOptions } from "@/lib/auth"
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

// GET tasks
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw ApiError.unauthorized()

    const isAdmin = session.user.role === "ADMIN"
    const { id: projectId } = await params
    const allowed = await canView(projectId, session.user.id, isAdmin)
    if (!allowed) throw ApiError.forbidden()

    const tasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true, title: true, description: true, status: true, priority: true, assignedTo: true, dueDate: true,
      }
    })

    return NextResponse.json({ tasks })
  } catch (error: unknown) {
    console.error("Tasks list error:", error)
    
    if (isApiError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

// POST create task
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw ApiError.unauthorized()

    const isAdmin = session.user.role === "ADMIN"
    const { id: projectId } = await params
    const allowed = await canManage(projectId, session.user.id, isAdmin)
    if (!allowed) throw ApiError.forbidden()

    const body = await req.json()
    const { title, description, priority, assignedTo, dueDate } = body as {
      title?: string
      description?: string | null
      priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
      assignedTo?: string | null
      dueDate?: string | null
    }
    if (!title || !title.trim()) {
      throw ApiError.badRequest("제목은 필수입니다.", "TASK_TITLE_REQUIRED")
    }

    const t = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ?? null,
        priority: priority ?? "MEDIUM",
        assignedTo: assignedTo ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
      },
      select: { id: true },
    })

    return NextResponse.json({ id: t.id }, { status: 201 })
  } catch (error: unknown) {
    console.error("Task create error:", error)
    
    if (isApiError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
