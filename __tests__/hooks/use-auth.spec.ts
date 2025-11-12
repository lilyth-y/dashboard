import { renderHook } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { vi } from 'vitest'

import { useAuth } from '@/hooks/use-auth'

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

describe('useAuth Hook', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns authenticated user data when session exists', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: 'user1',
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER',
        },
        expires: '2025-12-31',
      },
      status: 'authenticated',
      update: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toEqual({
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
    })
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isUser).toBe(true)
    expect(result.current.isLoading).toBe(false)
  })

  test('returns admin flags when user is admin', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          id: 'admin1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'ADMIN',
        },
        expires: '2025-12-31',
      },
      status: 'authenticated',
      update: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const { result } = renderHook(() => useAuth())

    expect(result.current.isAdmin).toBe(true)
    expect(result.current.isUser).toBe(false)
  })

  test('returns unauthenticated state when no session', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const { result } = renderHook(() => useAuth())

    expect(result.current.user).toBeUndefined()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isUser).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  test('returns loading state when session is loading', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'loading',
      update: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const { result } = renderHook(() => useAuth())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
  })
})
