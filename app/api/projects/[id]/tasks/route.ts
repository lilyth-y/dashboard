import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

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
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })

    const isAdmin = session.user.role === "ADMIN"
    const projectId = params.id
    const allowed = await canView(projectId, session.user.id, isAdmin)
    if (!allowed) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

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
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

// POST create task
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })

    const isAdmin = session.user.role === "ADMIN"
    const projectId = params.id
    const allowed = await canManage(projectId, session.user.id, isAdmin)
    if (!allowed) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

    const body = await req.json()
    const { title, description, priority, assignedTo, dueDate } = body as {
      title?: string
      description?: string | null
      priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
      assignedTo?: string | null
      dueDate?: string | null
    }
    if (!title || !title.trim()) return NextResponse.json({ error: "제목은 필수입니다." }, { status: 400 })

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
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
