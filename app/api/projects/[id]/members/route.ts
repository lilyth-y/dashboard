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

// GET members
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })

    const isAdmin = session.user.role === "ADMIN"
    const projectId = params.id
    const allowed = await canView(projectId, session.user.id, isAdmin)
    if (!allowed) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      select: {
        userId: true,
        role: true,
        joinedAt: true,
        user: { select: { name: true, email: true, image: true } },
      },
      orderBy: { joinedAt: "asc" },
    })

    return NextResponse.json({ members })
  } catch (error: unknown) {
    console.error("Members list error:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

// POST add member { userId? , email?, role }
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })

    const isAdmin = session.user.role === "ADMIN"
    const projectId = params.id
    const allowed = await canManage(projectId, session.user.id, isAdmin)
    if (!allowed) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 })

    const body = await req.json()
    const { userId, email, role } = body as { userId?: string; email?: string; role?: "OWNER" | "MANAGER" | "MEMBER" }
    if (!role || !(role === "OWNER" || role === "MANAGER" || role === "MEMBER")) {
      return NextResponse.json({ error: "유효하지 않은 역할입니다." }, { status: 400 })
    }

    let targetUserId = userId || ""
    if (!targetUserId && email) {
      const u = await prisma.user.findUnique({ where: { email }, select: { id: true } })
      if (!u) return NextResponse.json({ error: "해당 이메일의 사용자를 찾을 수 없습니다." }, { status: 404 })
      targetUserId = u.id
    }
    if (!targetUserId) return NextResponse.json({ error: "userId 또는 email이 필요합니다." }, { status: 400 })

    await prisma.projectMember.create({
      data: { userId: targetUserId, projectId, role },
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error: unknown) {
    console.error("Member add error:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
