import bcrypt from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"

import { getPreferredLocale, t } from "@/lib/i18n"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const locale = getPreferredLocale(request.headers.get("accept-language"))
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: t(locale, "REGISTER_FIELDS_REQUIRED") },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: t(locale, "REGISTER_PASSWORD_MIN") },
        { status: 400 }
      )
    }

    // 이미 존재하는 사용자 확인
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: t(locale, "REGISTER_EMAIL_IN_USE") },
        { status: 400 }
      )
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 12)

    // 사용자 생성
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER", // 기본값은 일반 사용자
      },
    })

    // 비밀번호는 응답에서 제외
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { 
        message: t(locale, "REGISTER_SUCCESS"),
        user: userWithoutPassword 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { message: t(locale, "SERVER_ERROR") },
      { status: 500 }
    )
  }
}