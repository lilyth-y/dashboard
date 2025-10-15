import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// GET /api/projects - list projects for current user; admins see all
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "인증이 필요합니다." },
        { status: 401 }
      )
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

    const shaped = projects.map((p) => ({
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
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

// POST /api/projects - create a new project; creator becomes OWNER
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 })
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
      return NextResponse.json({ error: "프로젝트 이름은 필수입니다." }, { status: 400 })
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
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
}