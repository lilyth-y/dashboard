import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { ApiError, isApiError } from "@/lib/api-error"
import { authOptions } from "@/lib/auth"
import { getPreferredLocale, t, tApiError } from "@/lib/i18n"
import { prisma } from "@/lib/prisma"

export async function GET(request?: Request) {
  const locale = getPreferredLocale(request?.headers.get("accept-language"))
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw ApiError.unauthorized()
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true, role: true },
    })

    return NextResponse.json({ user })
  } catch (error: unknown) {
    console.error("User fetch error:", error)
    
    if (isApiError(error)) {
      return NextResponse.json(
        { error: tApiError(locale, error), code: error.code },
        { status: error.statusCode }
      )
    }
    
    return NextResponse.json({ error: t(locale, "SERVER_ERROR") }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const locale = getPreferredLocale(request.headers.get("accept-language"))
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw ApiError.unauthorized()
    }

    const body = await request.json()
    const { name, image } = body as { name?: string; image?: string | null }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(image !== undefined ? { image } : {}),
      },
      select: { id: true },
    })

    return NextResponse.json({ id: updated.id })
  } catch (error: unknown) {
    console.error("User update error:", error)
    
    if (isApiError(error)) {
      return NextResponse.json(
        { error: tApiError(locale, error), code: error.code },
        { status: error.statusCode }
      )
    }
    
    return NextResponse.json({ error: t(locale, "SERVER_ERROR") }, { status: 500 })
  }
}
