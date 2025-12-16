import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import Sidebar from '@/components/kokonutui/sidebar'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
    <img src={src} alt={alt} className={className} />
  ),
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, onClick }: { children: React.ReactNode; href: string; onClick?: () => void }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}))

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders navigation items', () => {
    render(<Sidebar />)
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
    expect(screen.getByText('Projects')).toBeInTheDocument()
    expect(screen.getByText('Transactions')).toBeInTheDocument()
  })

  test('toggles mobile menu', () => {
    render(<Sidebar />)
    
    const toggleButton = screen.getByLabelText('Toggle navigation menu')
    expect(toggleButton).toBeInTheDocument()
    
    // Initial state: hidden on mobile (controlled by CSS classes, but we can check if button exists)
    // Click to open
    fireEvent.click(toggleButton)
    
    // Check if backdrop exists (logic for isMobileMenuOpen)
    const backdrop = document.querySelector('.bg-black.bg-opacity-50')
    expect(backdrop).toBeInTheDocument()
    
    // Click backdrop to close
    if (backdrop) {
      fireEvent.click(backdrop)
    }
    
    // Backdrop should be gone
    expect(document.querySelector('.bg-black.bg-opacity-50')).not.toBeInTheDocument()
  })
})
