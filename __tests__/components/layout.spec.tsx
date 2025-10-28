import { render, screen } from '@testing-library/react'
import React from 'react'
import { vi } from 'vitest'

import Layout from '@/components/kokonutui/layout'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock useAuth
vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'USER' },
    isAuthenticated: true,
    isAdmin: false,
    isLoading: false,
  }),
}))

// Mock usePathname
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

describe('Layout', () => {
  test('renders children', () => {
    render(
      <Layout>
        <div>Page Content</div>
      </Layout>
    )

    expect(screen.getByText('Page Content')).toBeInTheDocument()
  })

  test('renders navigation menu', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    )

    // Check for navigation links
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })

  test('renders logo', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    )

    expect(screen.getByText('KokonutUI')).toBeInTheDocument()
  })
})
