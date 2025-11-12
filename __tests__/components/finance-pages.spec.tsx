import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { vi } from 'vitest'

import TransactionsPage from '@/app/dashboard/finance/transactions/page'
import InvoicesPage from '@/app/dashboard/finance/invoices/page'
import PaymentsPage from '@/app/dashboard/finance/payments/page'

// Mock dependencies
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'user1', email: 'test@example.com', name: 'Test User', role: 'USER' },
    isAuthenticated: true,
    isAdmin: false,
    isUser: true,
    isLoading: false,
  }),
}))

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    pathname: '/dashboard/finance',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard/finance',
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('Finance Pages', () => {
  describe('TransactionsPage', () => {
    test('renders transactions page with title', () => {
      render(<TransactionsPage />)
      
      expect(screen.getByText('거래 관리')).toBeInTheDocument()
      expect(screen.getByText('수입과 지출을 관리하세요')).toBeInTheDocument()
    })

    test('shows add transaction button', () => {
      render(<TransactionsPage />)
      
      const addButton = screen.getByRole('button', { name: /거래 추가/ })
      expect(addButton).toBeInTheDocument()
    })

    test('opens transaction form dialog when add button is clicked', async () => {
      render(<TransactionsPage />)
      
      const addButton = screen.getByRole('button', { name: /거래 추가/ })
      fireEvent.click(addButton)
      
      await waitFor(() => {
        expect(screen.getByText('새 거래 등록')).toBeInTheDocument()
        expect(screen.getByText('새로운 수입 또는 지출 거래를 등록하세요.')).toBeInTheDocument()
      })
    })

    test('shows recent transactions section', () => {
      render(<TransactionsPage />)
      
      expect(screen.getByText('최근 거래 내역')).toBeInTheDocument()
      expect(screen.getByText('거래 내역은 메인 대시보드에서 확인할 수 있습니다.')).toBeInTheDocument()
    })

    test('has dashboard navigation button', () => {
      render(<TransactionsPage />)
      
      const dashboardButton = screen.getByRole('button', { name: /대시보드로 이동/ })
      expect(dashboardButton).toBeInTheDocument()
    })

    test('navigates to dashboard when button is clicked', () => {
      pushMock.mockClear()

      render(<TransactionsPage />)
      
      const dashboardButton = screen.getByRole('button', { name: /대시보드로 이동/ })
      fireEvent.click(dashboardButton)
      
      expect(pushMock).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('InvoicesPage', () => {
    test('renders invoices page with title', () => {
      render(<InvoicesPage />)
      
      expect(screen.getByRole('heading', { name: 'Invoices' })).toBeInTheDocument()
      expect(screen.getByText('This is a placeholder invoices page.')).toBeInTheDocument()
    })

    test('has correct heading structure', () => {
      render(<InvoicesPage />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Invoices')
    })
  })

  describe('PaymentsPage', () => {
    test('renders payments page with title', () => {
      render(<PaymentsPage />)
      
      expect(screen.getByRole('heading', { name: 'Payments' })).toBeInTheDocument()
      expect(screen.getByText('This is a placeholder payments page.')).toBeInTheDocument()
    })

    test('has correct heading structure', () => {
      render(<PaymentsPage />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Payments')
    })
  })
})
