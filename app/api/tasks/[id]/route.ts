import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

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

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
    const isAdmin = session.user.role === "ADMIN"

    const taskId = params.id
    const allowed = await canManageByTask(taskId, session.user.id, isAdmin)
    if (!allowed) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

    const body = await req.json()
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
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
    const isAdmin = session.user.role === "ADMIN"

    const taskId = params.id
    const allowed = await canManageByTask(taskId, session.user.id, isAdmin)
    if (!allowed) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

    await prisma.task.delete({ where: { id: taskId } })
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error("Task delete error:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
