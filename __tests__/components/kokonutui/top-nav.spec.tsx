import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import TopNav from '@/components/kokonutui/top-nav'

// Mock useAuth
const mockUser = {
  id: 'user1',
  name: 'Test User',
  email: 'test@example.com',
  image: '/avatar.png',
}

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAdmin: false,
    isAuthenticated: true,
  }),
}))

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
  }),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
    <img src={src} alt={alt} className={className} />
  ),
}))

// Mock UI components that use context or other complex logic if needed
// For now, DropdownMenu triggers are usually just buttons, so they might render fine.
// But Radix UI primitives sometimes need mocking or special handling in tests.
// Let's try rendering without mocking Radix first, as Jest-DOM + JSDOM usually handles it ok for basic rendering.

describe('TopNav', () => {
  test('renders breadcrumbs', () => {
    render(<TopNav />)
    expect(screen.getByText('kokonutUI')).toBeInTheDocument()
    expect(screen.getByText('dashboard')).toBeInTheDocument()
  })

  test('renders user profile', () => {
    render(<TopNav />)
    // The avatar image alt text
    const avatar = screen.getByAltText('User avatar')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('src', '/avatar.png')
  })
})
