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

// GET members
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw ApiError.unauthorized()

    const isAdmin = session.user.role === "ADMIN"
    const { id: projectId } = await params
    const allowed = await canView(projectId, session.user.id, isAdmin)
    if (!allowed) throw ApiError.forbidden()

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
    
    if (isApiError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

// POST add member { userId? , email?, role }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw ApiError.unauthorized()

    const isAdmin = session.user.role === "ADMIN"
    const { id: projectId } = await params
    const allowed = await canManage(projectId, session.user.id, isAdmin)
    if (!allowed) throw ApiError.forbidden()

    const body = await req.json()
    const { userId, email, role } = body as { userId?: string; email?: string; role?: "OWNER" | "MANAGER" | "MEMBER" }
    if (!role || !(role === "OWNER" || role === "MANAGER" || role === "MEMBER")) {
      throw ApiError.badRequest("유효하지 않은 역할입니다.", "MEMBER_INVALID_ROLE")
    }

    let targetUserId = userId || ""
    if (!targetUserId && email) {
      const u = await prisma.user.findUnique({ where: { email }, select: { id: true } })
      if (!u) throw ApiError.notFound("해당 이메일의 사용자를 찾을 수 없습니다.")
      targetUserId = u.id
    }
    if (!targetUserId) {
      throw ApiError.badRequest("userId 또는 email이 필요합니다.", "MEMBER_IDENTIFIER_REQUIRED")
    }

    await prisma.projectMember.create({
      data: { userId: targetUserId, projectId, role },
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error: unknown) {
    console.error("Member add error:", error)
    
    if (isApiError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
