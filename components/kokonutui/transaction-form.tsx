"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"


interface TransactionFormData {
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category: string
  description: string
  date: string
  projectId?: string
}

interface Project {
  id: string
  name: string
}

const incomeCategories = [
  { value: 'SALES', label: '매출' },
  { value: 'CONSULTING', label: '컨설팅' },
  { value: 'INVESTMENT', label: '투자 수익' },
  { value: 'OTHER_INCOME', label: '기타 수입' },
]

const expenseCategories = [
  { value: 'SALARY', label: '급여' },
  { value: 'OFFICE_SUPPLIES', label: '사무용품' },
  { value: 'MARKETING', label: '마케팅' },
  { value: 'RENT', label: '임대료' },
  { value: 'UTILITIES', label: '공과금' },
  { value: 'TRAVEL', label: '출장비' },
  { value: 'SOFTWARE', label: '소프트웨어' },
  { value: 'EQUIPMENT', label: '장비' },
  { value: 'TAX', label: '세금' },
  { value: 'OTHER_EXPENSE', label: '기타 지출' },
]

interface TransactionFormProps {
  onSuccess?: () => void
}

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [transactionType, setTransactionType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<TransactionFormData>({
    defaultValues: {
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0]
    }
  })

  useEffect(() => {
    // 프로젝트 목록 가져오기
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects')
        if (response.ok) {
          const data = await response.json()
          setProjects(data.projects || [])
        }
      } catch (error) {
        console.error('프로젝트 목록 로딩 실패:', error)
      }
    }

    fetchProjects()
  }, [])

  const onSubmit = async (data: TransactionFormData) => {
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/financial/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          type: transactionType,
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: '거래가 성공적으로 등록되었습니다.' })
        reset({
          amount: 0,
          type: transactionType,
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          projectId: ''
        })
        onSuccess?.()
      } else {
        const errorData = await response.json()
        setMessage({ type: 'error', text: errorData.error || '거래 등록에 실패했습니다.' })
      }
    } catch (error: unknown) {
      console.error('Transaction form error:', error)
      setMessage({ type: 'error', text: '네트워크 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const currentCategories = transactionType === 'INCOME' ? incomeCategories : expenseCategories

  return (
    <Card>
      <CardHeader>
        <CardTitle>거래 등록</CardTitle>
        <CardDescription>새로운 수입 또는 지출을 등록하세요</CardDescription>
      </CardHeader>
      <CardContent>
        {message && (
          <Alert className={`mb-4 ${message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <AlertDescription className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

  <form data-testid="transaction-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 거래 유형 */}
          <div className="space-y-2">
            <Label>거래 유형</Label>
            <RadioGroup
              value={transactionType}
              onValueChange={(value) => {
                setTransactionType(value as 'INCOME' | 'EXPENSE')
                setValue('category', '') // 카테고리 리셋
              }}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="INCOME" id="income" />
                <Label htmlFor="income" className="text-green-600 font-medium">수입</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="EXPENSE" id="expense" />
                <Label htmlFor="expense" className="text-red-600 font-medium">지출</Label>
              </div>
            </RadioGroup>
          </div>

          {/* 금액 */}
          <div className="space-y-2">
            <Label htmlFor="amount">금액 *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="금액을 입력하세요"
              {...register('amount', { 
                required: '금액을 입력해주세요',
                min: { value: 1, message: '1원 이상 입력해주세요' }
              })}
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* 카테고리 */}
          <div className="space-y-2">
            <Label htmlFor="category">카테고리 *</Label>
            <Select onValueChange={(value) => setValue('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {currentCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              placeholder="거래 내용을 설명하세요"
              rows={3}
              {...register('description')}
            />
          </div>

          {/* 날짜 */}
          <div className="space-y-2">
            <Label htmlFor="date">날짜 *</Label>
            <Input
              id="date"
              type="date"
              {...register('date', { required: '날짜를 선택해주세요' })}
            />
            {errors.date && (
              <p className="text-sm text-red-600">{errors.date.message}</p>
            )}
          </div>

          {/* 프로젝트 (선택사항) */}
          {projects.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="project">프로젝트 (선택사항)</Label>
              <Select onValueChange={(value) => setValue('projectId', value === 'none' ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="프로젝트를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">프로젝트 없음</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? '등록 중...' : '거래 등록'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}