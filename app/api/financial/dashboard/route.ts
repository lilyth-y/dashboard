import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { ApiError, isApiError } from "@/lib/api-error"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      throw ApiError.unauthorized()
    }

    // 최근 거래 내역 (최대 10개)
    const recentTransactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: { date: 'desc' },
      include: {
        project: {
          select: { name: true }
        }
      }
    })

    // 월별 수입/지출 통계 (최근 6개월)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const monthlyStats = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        date: {
          gte: sixMonthsAgo
        }
      },
      _sum: {
        amount: true
      }
    })

    // 카테고리별 지출 통계
    const expensesByCategory = await prisma.transaction.groupBy({
      by: ['category', 'type'],
      where: {
        type: 'EXPENSE',
        date: {
          gte: sixMonthsAgo
        }
      },
      _sum: {
        amount: true
      }
    })

    // 일별 거래 추세 (최근 30일)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyTrends = await prisma.$queryRaw`
      SELECT 
        DATE(date) as date,
        type,
        SUM(amount) as total
      FROM "Transaction" 
      WHERE date >= ${thirtyDaysAgo}
      GROUP BY DATE(date), type
      ORDER BY date DESC
    `

    // 총 수입/지출 계산
    const totalIncome = await prisma.transaction.aggregate({
      where: { type: 'INCOME' },
      _sum: { amount: true }
    })

    const totalExpense = await prisma.transaction.aggregate({
      where: { type: 'EXPENSE' },
      _sum: { amount: true }
    })

    return NextResponse.json({
      recentTransactions,
      monthlyStats,
      expensesByCategory,
      dailyTrends,
      summary: {
        totalIncome: totalIncome._sum.amount || 0,
        totalExpense: Math.abs(totalExpense._sum.amount || 0),
        netProfit: (totalIncome._sum.amount || 0) + (totalExpense._sum.amount || 0)
      }
    })

  } catch (error) {
    console.error("Financial data fetch error:", error)
    
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