import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

async function canManage(projectId: string, userId: string, isAdmin: boolean) {
  if (isAdmin) return true
  const member = await prisma.projectMember.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { role: true },
  })
  return member?.role === "OWNER" || member?.role === "MANAGER"
}

export async function PUT(req: Request, { params }: { params: { id: string; userId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })

    const isAdmin = session.user.role === "ADMIN"
    const projectId = params.id
    const targetUserId = params.userId
    const allowed = await canManage(projectId, session.user.id, isAdmin)
    if (!allowed) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

    const body = await req.json()
    const { role } = body as { role?: "OWNER" | "MANAGER" | "MEMBER" }
    if (!role) return NextResponse.json({ error: "role이 필요합니다." }, { status: 400 })

    await prisma.projectMember.update({
      where: { userId_projectId: { userId: targetUserId, projectId } },
      data: { role },
    })
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error("Member update error:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string; userId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })

    const isAdmin = session.user.role === "ADMIN"
    const projectId = params.id
    const targetUserId = params.userId
    const allowed = await canManage(projectId, session.user.id, isAdmin)
    if (!allowed) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId: targetUserId, projectId } },
    })
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error("Member delete error:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
