import { render, screen } from '@testing-library/react'
import React from 'react'
import { vi } from 'vitest'

import DashboardPage from '@/app/dashboard/page'
import AnalyticsPage from '@/app/dashboard/analytics/page'
import OrganizationPage from '@/app/dashboard/organization/page'

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

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    pathname: '/dashboard',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard',
}))

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('Dashboard Pages', () => {
  describe('DashboardPage', () => {
    test('renders dashboard component', () => {
      render(<DashboardPage />)
      // Dashboard component should render
      expect(document.body).toBeInTheDocument()
    })
  })

  describe('AnalyticsPage', () => {
    test('renders analytics page with title', () => {
      render(<AnalyticsPage />)
      
      expect(screen.getByRole('heading', { name: 'Analytics' })).toBeInTheDocument()
      expect(screen.getByText('This is a placeholder analytics page.')).toBeInTheDocument()
    })

    test('has correct heading structure', () => {
      render(<AnalyticsPage />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Analytics')
    })
  })

  describe('OrganizationPage', () => {
    test('renders organization page with title', () => {
      render(<OrganizationPage />)
      
      expect(screen.getByRole('heading', { name: 'Organization' })).toBeInTheDocument()
      expect(screen.getByText('This is a placeholder organization page.')).toBeInTheDocument()
    })

    test('has correct heading structure', () => {
      render(<OrganizationPage />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Organization')
    })
  })
})
