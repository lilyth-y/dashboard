import bcrypt from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "모든 필드를 입력해주세요." },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "비밀번호는 최소 8자 이상이어야 합니다." },
        { status: 400 }
      )
    }

    // 이미 존재하는 사용자 확인
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "이미 사용 중인 이메일입니다." },
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
        message: "회원가입이 완료되었습니다.",
        user: userWithoutPassword 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}