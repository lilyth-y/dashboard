import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { ApiError, isApiError } from "@/lib/api-error"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      throw ApiError.unauthorized()
    }

    const body = await request.json()
    const { amount, type, category, description, date, projectId } = body

    // 입력 유효성 검사
    if (!amount || !type || !category || !date) {
      throw ApiError.badRequest("필수 항목을 모두 입력해주세요.", "TRANSACTION_REQUIRED_FIELDS")
    }

    if (type !== 'INCOME' && type !== 'EXPENSE') {
      throw ApiError.badRequest("거래 유형이 올바르지 않습니다.", "TRANSACTION_INVALID_TYPE")
    }

    // 지출의 경우 음수로 저장
    const finalAmount = type === 'EXPENSE' ? -Math.abs(amount) : Math.abs(amount)

    const transaction = await prisma.transaction.create({
      data: {
        amount: finalAmount,
        type,
        category,
        description,
        date: new Date(date),
        createdBy: session.user.id,
        projectId: projectId || null,
      },
      include: {
        project: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({
      message: "거래가 성공적으로 등록되었습니다.",
      transaction
    })

  } catch (error) {
    console.error("Transaction creation error:", error)
    
    if (isApiError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      throw ApiError.unauthorized()
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type')
    const category = searchParams.get('category')

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (category) where.category = category

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        project: {
          select: { name: true }
        }
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    const total = await prisma.transaction.count({ where })

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Transaction fetch error:", error)
    
    if (isApiError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      )
    }
    
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    )
  }
}