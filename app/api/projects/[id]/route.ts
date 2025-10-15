import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Helper to check if user can manage the project (ADMIN or OWNER/MANAGER member)
async function canManage(projectId: string, userId: string, isAdmin: boolean) {
  if (isAdmin) return true
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { role: true },
  })
  return member?.role === "OWNER" || member?.role === "MANAGER"
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
    }

    const projectId = params.id
    const isAdmin = session.user.role === "ADMIN"
    const allowed = await canManage(projectId, session.user.id, isAdmin)

    if (!allowed) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, status, budget, startDate, endDate } = body as {
      name?: string
      description?: string
      status?: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED"
      budget?: number | null
      startDate?: string | null
      endDate?: string | null
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(budget !== undefined ? { budget } : {}),
        ...(startDate !== undefined ? { startDate: startDate ? new Date(startDate) : null } : {}),
        ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
      },
      select: { id: true },
    })

    return NextResponse.json({ id: updated.id })
  } catch (error: unknown) {
    console.error("Project update error:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
    }

    const projectId = params.id
    const isAdmin = session.user.role === "ADMIN"
    const allowed = await canManage(projectId, session.user.id, isAdmin)

    if (!allowed) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })
    }

    await prisma.project.delete({ where: { id: projectId } })
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error("Project delete error:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
