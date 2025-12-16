import { render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import FinancialDashboard from '@/components/kokonutui/financial-dashboard'

// Mock Recharts to avoid sizing issues in JSDOM
vi.mock('recharts', async (importOriginal) => {
  const original = await importOriginal<typeof import('recharts')>()
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 500, height: 300 }}>{children}</div>
    ),
  }
})

// Mock global fetch
const mockFinancialData = {
  summary: {
    totalIncome: 5000000,
    totalExpense: 3000000,
    netProfit: 2000000,
  },
  expensesByCategory: [
    { category: 'SALARY', _sum: { amount: 2000000 } },
    { category: 'RENT', _sum: { amount: 1000000 } },
  ],
  recentTransactions: [
    {
      id: 't1',
      amount: 100000,
      type: 'INCOME',
      category: 'SALES',
      description: 'Test Sale',
      date: '2023-01-01',
      project: { name: 'Project A' },
    },
  ],
  monthlyStats: [], // Add if needed
  dailyTrends: [], // Add if needed
}

describe('FinancialDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  test('renders loading state initially', () => {
    // Mock a pending promise to keep it in loading state
    ;(global.fetch as any).mockReturnValue(new Promise(() => {}))
    render(<FinancialDashboard />)
    // Adjust based on your loading skeleton or text
    // The current implementation renders 3 Cards with skeleton logic, let's check for generic card presence or structure
    // Or check if "총 수입" is NOT present yet
    expect(screen.queryByText('총 수입')).not.toBeInTheDocument()
  })

  test('renders data after fetch', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockFinancialData,
    })

    render(<FinancialDashboard />)

    await waitFor(() => {
      expect(screen.getByText('총 수입')).toBeInTheDocument()
    })

    expect(screen.getByText('₩5,000,000')).toBeInTheDocument()
    expect(screen.getByText('₩3,000,000')).toBeInTheDocument()
    expect(screen.getByText('₩2,000,000')).toBeInTheDocument()
    
    // Check transaction
    expect(screen.getByText('Test Sale')).toBeInTheDocument()
  })

  test('handles error state', async () => {
    ;(global.fetch as any).mockRejectedValue(new Error('Network error'))
    
    // Silence console error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    render(<FinancialDashboard />)
    
    await waitFor(() => {
       // Component might show "데이터를 불러올 수 없습니다." or stay loading?
       // Let's check the source code logic. 
       // catch -> console.error -> setLoading(false).
       // if (!data) return "데이터를 불러올 수 없습니다."
       expect(screen.getByText('데이터를 불러올 수 없습니다.')).toBeInTheDocument()
    })
    
    consoleSpy.mockRestore()
  })
})
