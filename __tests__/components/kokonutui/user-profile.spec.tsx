import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Profile01 from '../../../components/kokonutui/user-profile'
import { signOut } from 'next-auth/react'

// Mock next-auth
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, className }: any) => (
    <img src={src} alt={alt} className={className} />
  ),
}))

describe('Profile01', () => {
  const defaultProps = {
    avatar: '/avatar.jpg',
    userName: 'Test User',
    userEmail: 'test@example.com',
    userRole: 'USER',
  }

  it('renders user information correctly', () => {
    render(<Profile01 {...defaultProps} />)

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByText('USER')).toBeInTheDocument()
    expect(screen.getByAltText('Test User profile picture')).toHaveAttribute('src', '/avatar.jpg')
  })

  it('renders fallback name if userName is missing', () => {
    const props = { ...defaultProps, userName: null }
    render(<Profile01 {...props} />)

    expect(screen.getByText('사용자')).toBeInTheDocument()
  })

  it('renders admin badge correctly', () => {
    const props = { ...defaultProps, userRole: '관리자' }
    render(<Profile01 {...props} />)

    expect(screen.getByText('관리자')).toBeInTheDocument()
    // Check for orange color class which indicates Shield icon for admin
    // This is a bit implicit but verifying the role text is primary
  })

  it('handles logout click', async () => {
    render(<Profile01 {...defaultProps} />)

    const logoutButton = screen.getByText('로그아웃')
    fireEvent.click(logoutButton)

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/auth/signin' })
  })

  it('renders navigation links', () => {
    render(<Profile01 {...defaultProps} />)
    
    expect(screen.getByText('프로필').closest('a')).toHaveAttribute('href', '/dashboard/profile')
    expect(screen.getByText('설정').closest('a')).toHaveAttribute('href', '/dashboard/settings')
    expect(screen.getByText('결제').closest('a')).toHaveAttribute('href', '/dashboard/billing')
  })
})
