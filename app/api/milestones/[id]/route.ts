import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

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
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
    const isAdmin = session.user.role === "ADMIN"

    const milestoneId = params.id
    const allowed = await canManageByMilestone(milestoneId, session.user.id, isAdmin)
    if (!allowed) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

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
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
    const isAdmin = session.user.role === "ADMIN"

    const milestoneId = params.id
    const allowed = await canManageByMilestone(milestoneId, session.user.id, isAdmin)
    if (!allowed) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

    await prisma.milestone.delete({ where: { id: milestoneId } })
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error("Milestone delete error:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
