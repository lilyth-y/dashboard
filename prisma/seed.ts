import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 시드 데이터를 생성하고 있습니다...')

  // 관리자 사용자 생성
  const adminPassword = await bcrypt.hash('admin123!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: '관리자',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  // 일반 사용자 생성
  const userPassword = await bcrypt.hash('user123!', 12)
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: '김사용자',
      password: userPassword,
      role: 'USER',
    },
  })

  console.log('👥 사용자 생성 완료')

  // 프로젝트 생성
  const project1 = await prisma.project.create({
    data: {
      name: '웹사이트 리뉴얼 프로젝트',
      description: '회사 웹사이트를 모던한 디자인으로 리뉴얼',
      status: 'IN_PROGRESS',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-06-30'),
      budget: 50000000,
      createdBy: admin.id,
    },
  })

  const project2 = await prisma.project.create({
    data: {
      name: '모바일 앱 개발',
      description: 'iOS/Android 하이브리드 앱 개발',
      status: 'PLANNING',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-12-31'),
      budget: 80000000,
      createdBy: admin.id,
    },
  })

  console.log('📋 프로젝트 생성 완료')

  // 프로젝트 멤버 추가
  await prisma.projectMember.createMany({
    data: [
      {
        userId: admin.id,
        projectId: project1.id,
        role: 'OWNER',
      },
      {
        userId: user.id,
        projectId: project1.id,
        role: 'MEMBER',
      },
      {
        userId: admin.id,
        projectId: project2.id,
        role: 'OWNER',
      },
    ],
  })

  // 마일스톤 생성
  const milestone1 = await prisma.milestone.create({
    data: {
      title: '디자인 시안 완료',
      description: '웹사이트 전체 페이지 디자인 시안 완료',
      status: 'COMPLETED',
      dueDate: new Date('2024-02-15'),
      projectId: project1.id,
    },
  })

  const milestone2 = await prisma.milestone.create({
    data: {
      title: '프론트엔드 개발 완료',
      description: '웹사이트 프론트엔드 개발 완료',
      status: 'IN_PROGRESS',
      dueDate: new Date('2024-04-30'),
      projectId: project1.id,
    },
  })

  console.log('🎯 마일스톤 생성 완료')

  // 태스크 생성
  await prisma.task.createMany({
    data: [
      {
        title: '홈페이지 디자인',
        description: '메인 페이지 UI/UX 디자인',
        status: 'DONE',
        priority: 'HIGH',
        projectId: project1.id,
        milestoneId: milestone1.id,
        dueDate: new Date('2024-01-30'),
      },
      {
        title: '반응형 레이아웃 구현',
        description: '모든 디바이스에서 최적화된 레이아웃',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: project1.id,
        milestoneId: milestone2.id,
        dueDate: new Date('2024-03-15'),
      },
      {
        title: 'API 연동',
        description: '백엔드 API와 프론트엔드 연동',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: project1.id,
        dueDate: new Date('2024-04-15'),
      },
    ],
  })

  console.log('📝 태스크 생성 완료')

  // 재무 거래 데이터 생성
  const transactions = [
    // 수입
    {
      amount: 15000000,
      type: 'INCOME' as const,
      category: 'SALES' as const,
      description: 'Q1 프로젝트 계약금',
      date: new Date('2024-01-15'),
      createdBy: admin.id,
      projectId: project1.id,
    },
    {
      amount: 25000000,
      type: 'INCOME' as const,
      category: 'CONSULTING' as const,
      description: '컨설팅 수익',
      date: new Date('2024-02-10'),
      createdBy: admin.id,
    },
    // 지출
    {
      amount: -3000000,
      type: 'EXPENSE' as const,
      category: 'SALARY' as const,
      description: '직원 급여',
      date: new Date('2024-01-25'),
      createdBy: admin.id,
    },
    {
      amount: -800000,
      type: 'EXPENSE' as const,
      category: 'OFFICE_SUPPLIES' as const,
      description: '사무용품 구매',
      date: new Date('2024-01-10'),
      createdBy: admin.id,
    },
    {
      amount: -500000,
      type: 'EXPENSE' as const,
      category: 'SOFTWARE' as const,
      description: '소프트웨어 라이선스',
      date: new Date('2024-01-05'),
      createdBy: admin.id,
    },
  ]

  await prisma.transaction.createMany({
    data: transactions,
  })

  console.log('💰 거래 내역 생성 완료')

  // 예산 생성
  // 예산 생성: createMany는 중복 시 실패할 수 있으므로 idempotent하게 존재 여부 확인 후 생성합니다.
  type BudgetInput = {
    category: string
    amount: number
    period: string
    year: number
    month: number
    createdBy: string
  }

  const budgets: BudgetInput[] = [
    {
      category: 'SALARY',
      amount: 10000000,
      period: 'MONTHLY',
      year: 2024,
      month: 1,
      createdBy: admin.id,
    },
    {
      category: 'MARKETING',
      amount: 2000000,
      period: 'MONTHLY',
      year: 2024,
      month: 1,
      createdBy: admin.id,
    },
    {
      category: 'OFFICE_SUPPLIES',
      amount: 1000000,
      period: 'MONTHLY',
      year: 2024,
      month: 1,
      createdBy: admin.id,
    },
  ]

  for (const b of budgets) {
    const exists = await prisma.budget.findFirst({
      where: {
        category: b.category,
        period: b.period,
        year: b.year,
        month: b.month,
      },
    })

    if (!exists) {
      await prisma.budget.create({
        data: {
          category: b.category,
          amount: b.amount,
          period: b.period,
          year: b.year,
          month: b.month,
          createdBy: b.createdBy,
        },
      })
    }
  }

  console.log('📊 예산 생성 완료')

  // KPI 지표 생성
  await prisma.kPIMetric.createMany({
    data: [
      {
        name: '월간 매출',
        type: 'MONTHLY_RECURRING_REVENUE',
        value: 40000000,
        unit: '원',
        date: new Date('2024-01-31'),
      },
      {
        name: '수익률',
        type: 'PROFIT_MARGIN',
        value: 0.35,
        unit: '%',
        date: new Date('2024-01-31'),
      },
      {
        name: '성장률',
        type: 'REVENUE_GROWTH',
        value: 0.15,
        unit: '%',
        date: new Date('2024-01-31'),
      },
    ],
  })

  console.log('📈 KPI 지표 생성 완료')

  // 현금흐름 예측 생성
  // 현금흐름 예측 생성: 날짜(date)에 대한 unique 제약이 있으므로 중복 체크 후 생성합니다.
  const cashFlows = [
    {
      date: new Date('2024-02-01'),
      projectedIncome: 35000000,
      projectedExpense: 25000000,
      actualIncome: 33000000,
      actualExpense: 24000000,
    },
    {
      date: new Date('2024-03-01'),
      projectedIncome: 40000000,
      projectedExpense: 28000000,
    },
    {
      date: new Date('2024-04-01'),
      projectedIncome: 45000000,
      projectedExpense: 30000000,
    },
  ]

  for (const cf of cashFlows) {
    const exists = await prisma.cashFlowProjection.findFirst({ where: { date: cf.date } })
    if (!exists) {
      await prisma.cashFlowProjection.create({ data: cf })
    }
  }

  console.log('💹 현금흐름 예측 생성 완료')

  console.log('✅ 시드 데이터 생성이 완료되었습니다!')
  console.log('\n📋 생성된 계정:')
  console.log('👨‍💼 관리자: admin@example.com / admin123!')
  console.log('👤 사용자: user@example.com / user123!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })