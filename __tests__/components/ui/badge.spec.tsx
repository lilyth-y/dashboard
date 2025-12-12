import { render, screen } from '@testing-library/react'

import { Badge } from '@/components/ui/badge'

describe('Badge', () => {
  test('renders with default props', () => {
    render(<Badge>New</Badge>)
    const badge = screen.getByText('New')
    expect(badge).toBeInTheDocument()
    // Check against part of the default style from cva
    expect(badge).toHaveClass('bg-primary')
  })

  test('renders with destructive variant', () => {
    render(<Badge variant="destructive">Error</Badge>)
    const badge = screen.getByText('Error')
    expect(badge).toHaveClass('bg-destructive')
  })

  test('renders with outline variant', () => {
    render(<Badge variant="outline">Outline</Badge>)
    const badge = screen.getByText('Outline')
    expect(badge).toHaveClass('text-foreground')
  })

  test('applies custom className', () => {
    render(<Badge className="bg-red-500">Custom</Badge>)
    const badge = screen.getByText('Custom')
    expect(badge).toHaveClass('bg-red-500')
  })
})
