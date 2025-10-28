import { render, screen } from '@testing-library/react'
import React from 'react'
import { vi } from 'vitest'

import { AuthProvider } from '@/components/auth-provider'


// Mock next-auth
vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('AuthProvider', () => {
  test('renders children', () => {
    render(
      <AuthProvider>
        <div>Test Content</div>
      </AuthProvider>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
})
