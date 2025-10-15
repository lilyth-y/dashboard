"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"

interface FinancialData {
  recentTransactions: Array<{
    id: string
    amount: number
    type: string
    category: string
    description: string
    date: string
    project?: { name: string }
  }>
  monthlyStats: Array<{
    type: string
    _sum: { amount: number }
  }>
  expensesByCategory: Array<{
    category: string
    type: string
    _sum: { amount: number }
  }>
  dailyTrends: Array<{
    date: string
    type: string
    total: number
  }>
  summary: {
    totalIncome: number
    totalExpense: number
    netProfit: number
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

const categoryNames: Record<string, string> = {
  SALARY: '급여',
  MARKETING: '마케팅',
  OFFICE_SUPPLIES: '사무용품',
  SOFTWARE: '소프트웨어',
  SALES: '매출',
  CONSULTING: '컨설팅',
  RENT: '임대료',
  UTILITIES: '공과금',
  TRAVEL: '출장비',
  EQUIPMENT: '장비',
  TAX: '세금',
  OTHER_INCOME: '기타 수입',
  OTHER_EXPENSE: '기타 지출'
}

export default function FinancialDashboard() {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/financial/dashboard')
        if (response.ok) {
          const result = await response.json()
          setData(result)
        }
      } catch (error) {
        console.error('데이터 로딩 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-500">데이터를 불러올 수 없습니다.</p>
        </CardContent>
      </Card>
    )
  }

  const { summary, expensesByCategory, recentTransactions } = data

  // 카테고리별 지출 데이터 변환
  const expenseChartData = expensesByCategory.map((item) => ({
    name: categoryNames[item.category] || item.category,
    value: Math.abs(item._sum.amount || 0),
    category: item.category
  }))

  return (
    <div className="space-y-6">
      {/* 재무 요약 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 수입</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₩{summary.totalIncome.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 지출</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₩{summary.totalExpense.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">순이익</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₩{summary.netProfit.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 카테고리별 지출 파이 차트 */}
        <Card>
          <CardHeader>
            <CardTitle>카테고리별 지출</CardTitle>
            <CardDescription>최근 6개월 지출 분석</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                expense: {
                  label: "지출",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => 
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [`₩${value.toLocaleString()}`, '지출']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* 최근 거래 내역 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 거래 내역</CardTitle>
            <CardDescription>최근 10건의 거래</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'INCOME' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                    }`}>
                      {transaction.type === 'INCOME' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description || categoryNames[transaction.category]}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString('ko-KR')}
                        {transaction.project && ` • ${transaction.project.name}`}
                      </p>
                    </div>
                  </div>
                  <div className={`font-bold ${
                    transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'INCOME' ? '+' : ''}₩{transaction.amount.toLocaleString()}
                  </div>
                </div>
              ))}
              {recentTransactions.length > 5 && (
                <div className="text-center pt-2">
                  <button className="text-sm text-blue-600 hover:underline">
                    더 보기 ({recentTransactions.length - 5}건)
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}