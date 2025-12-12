import { render, screen } from '@testing-library/react'

import { Label } from '@/components/ui/label'

describe('Label', () => {
  test('renders correctly', () => {
    render(<Label htmlFor="email">Email</Label>)
    // Label is easier to find by text usually
    const label = screen.getByText('Email')
    expect(label).toBeInTheDocument()
    expect(label).toHaveAttribute('for', 'email')
    expect(label).toHaveClass('text-sm font-medium')
  })
})
