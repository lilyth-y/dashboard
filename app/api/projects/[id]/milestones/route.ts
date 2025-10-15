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

// GET milestones
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })

    const isAdmin = session.user.role === "ADMIN"
    const projectId = params.id
    const allowed = await canView(projectId, session.user.id, isAdmin)
    if (!allowed) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      orderBy: { dueDate: "asc" },
      select: { id: true, title: true, description: true, status: true, dueDate: true },
    })

    return NextResponse.json({ milestones })
  } catch (error: unknown) {
    console.error("Milestones list error:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

// POST create milestone
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })

    const isAdmin = session.user.role === "ADMIN"
    const projectId = params.id
    const allowed = await canManage(projectId, session.user.id, isAdmin)
    if (!allowed) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

    const body = await req.json()
    const { title, description, dueDate } = body as { title?: string; description?: string | null; dueDate?: string }
    if (!title || !dueDate) return NextResponse.json({ error: "제목과 마감일은 필수입니다." }, { status: 400 })

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
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
