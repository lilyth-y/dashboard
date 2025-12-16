import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { ApiError, isApiError } from "@/lib/api-error"
import { authOptions } from "@/lib/auth"
import { getPreferredLocale, t, tApiError } from "@/lib/i18n"
import { prisma } from "@/lib/prisma"

// GET /api/projects - list projects for current user; admins see all
export async function GET(request?: Request) {
  const locale = getPreferredLocale(request?.headers?.get("accept-language"))
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      throw ApiError.unauthorized()
    }

    const isAdmin = session.user.role === "ADMIN"

    const projects = await prisma.project.findMany({
      where: isAdmin
        ? undefined
        : {
            members: {
              some: { userId: session.user.id },
            },
          },
      select: {
        id: true,
        name: true,
        status: true,
        budget: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        createdBy: true,
        // include current user's role in the project if exists
        members: {
          where: { userId: session.user.id },
          select: { role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    const shaped = projects.map((p: {
      id: string
      name: string
      status: string
      budget: number | null
      startDate: Date | null
      endDate: Date | null
      createdAt: Date
      createdBy: string
      members: Array<{ role: string }>
    }) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      budget: p.budget,
      startDate: p.startDate,
      endDate: p.endDate,
      createdAt: p.createdAt,
      createdBy: p.createdBy,
      myRole: isAdmin ? "ADMIN" : p.members[0]?.role ?? null,
    }))

    return NextResponse.json({ projects: shaped })
  } catch (error: unknown) {
    console.error("Projects fetch error:", error)
    
    if (isApiError(error)) {
      return NextResponse.json(
        { error: tApiError(locale, error), code: error.code },
        { status: error.statusCode }
      )
    }
    
    return NextResponse.json(
      { error: t(locale, "SERVER_ERROR") },
      { status: 500 }
    )
  }
}

// POST /api/projects - create a new project; creator becomes OWNER
export async function POST(request: Request) {
  const locale = getPreferredLocale(request.headers.get("accept-language"))
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw ApiError.unauthorized()
    }

    const body = await request.json()
    const { name, description, budget, startDate, endDate } = body as {
      name?: string
      description?: string
      budget?: number
      startDate?: string | null
      endDate?: string | null
    }

    if (!name || name.trim().length === 0) {
      throw ApiError.badRequest("프로젝트 이름은 필수입니다.", "PROJECT_NAME_REQUIRED")
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        budget: typeof budget === "number" ? budget : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        createdBy: session.user.id,
        members: {
          create: [{ userId: session.user.id, role: "OWNER" }],
        },
      },
      select: { id: true },
    })

    return NextResponse.json({ id: project.id }, { status: 201 })
  } catch (error: unknown) {
    console.error("Project create error:", error)
    
    if (isApiError(error)) {
      return NextResponse.json(
        { error: tApiError(locale, error), code: error.code },
        { status: error.statusCode }
      )
    }
    
    return NextResponse.json(
      { error: t(locale, "SERVER_ERROR") },
      { status: 500 }
    )
  }
}