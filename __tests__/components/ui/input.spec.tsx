import { render, screen } from '@testing-library/react'

import { Input } from '@/components/ui/input'

describe('Input', () => {
  test('renders with type text by default', () => {
    render(<Input placeholder="default type" />)
    const input = screen.getByPlaceholderText('default type')
    // When type is not provided, the attribute might be missing but property is text
    expect(input).toHaveProperty('type', 'text')
  })

  test('renders with specific type', () => {
    render(<Input type="email" placeholder="email" />)
    const input = screen.getByPlaceholderText('email')
    expect(input).toHaveAttribute('type', 'email')
  })

  test('applies disabled state', () => {
    render(<Input disabled placeholder="disabled" />)
    const input = screen.getByPlaceholderText('disabled')
    expect(input).toBeDisabled()
    expect(input).toHaveClass('disabled:opacity-50')
  })
})
