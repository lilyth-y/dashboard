import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { ApiError, isApiError } from "@/lib/api-error"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
    if (!session?.user) throw ApiError.unauthorized()

    const isAdmin = session.user.role === "ADMIN"
    const projectId = params.id
    const targetUserId = params.userId
    const allowed = await canManage(projectId, session.user.id, isAdmin)
    if (!allowed) throw ApiError.forbidden()

    const body = await req.json()
    const { role } = body as { role?: "OWNER" | "MANAGER" | "MEMBER" }
    if (!role) throw ApiError.badRequest("role이 필요합니다.", "MEMBER_ROLE_REQUIRED")

    await prisma.projectMember.update({
      where: { userId_projectId: { userId: targetUserId, projectId } },
      data: { role },
    })
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error("Member update error:", error)
    
    if (isApiError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string; userId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) throw ApiError.unauthorized()

    const isAdmin = session.user.role === "ADMIN"
    const projectId = params.id
    const targetUserId = params.userId
    const allowed = await canManage(projectId, session.user.id, isAdmin)
    if (!allowed) throw ApiError.forbidden()

    await prisma.projectMember.delete({
      where: { userId_projectId: { userId: targetUserId, projectId } },
    })
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    console.error("Member delete error:", error)
    
    if (isApiError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}
