import { render, screen } from '@testing-library/react'

import { Button } from '@/components/ui/button'

describe('Button', () => {
    test('renders with default props', () => {
        render(<Button>Click me</Button>)
        const button = screen.getByRole('button', { name: /click me/i })
        expect(button).toBeInTheDocument()
        expect(button).toHaveClass('bg-primary')
    })

    test('renders with variant', () => {
        render(<Button variant="destructive">Delete</Button>)
        const button = screen.getByRole('button', { name: /delete/i })
        expect(button).toHaveClass('bg-destructive')
    })

    test('renders with size', () => {
        render(<Button size="sm">Small</Button>)
        const button = screen.getByRole('button', { name: /small/i })
        expect(button).toHaveClass('h-9')
    })

    test('renders as child', () => {
        render(
            <Button asChild>
                <a href="/login">Login</a>
            </Button>
        )
        const link = screen.getByRole('link', { name: /login/i })
        expect(link).toBeInTheDocument()
        expect(link).toHaveClass('bg-primary')
    })
})
