import { render, screen } from '@testing-library/react'

import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'

describe('Card', () => {
  test('renders card with all subcomponents', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    )

    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })

  test('applies custom classNames', () => {
     render(
        <Card className="custom-card">
            <CardHeader className="custom-header">Header</CardHeader>
            <CardContent className="custom-content">Content</CardContent>
        </Card>
     )
     // Use a container lookup or direct text lookup
     // Check if the element that contains 'Header' has the class
     expect(screen.getByText('Header')).toHaveClass('custom-header') // If CardHeader renders children directly in div? No, text is child of div.
     // If text is wrapped in div, parent should be it.
     // Let's use getByTestId or just assert on the element that *contains* the text if it's a block.
     // Actually better:
     const header = screen.getByText('Header')
     // If CardHeader is a div, header text is inside it. 
     // If it failed before, maybe CardHeader filters props?
     // Let's debug by checking if custom-header is present anywhere.
     const card = screen.getByText('Header').closest('.custom-card')
     expect(card).toBeInTheDocument()
     
     // Verify specific subcomponent class
     // Valid approach if direct parent doesn't match: find via class
     const headerEl = screen.getByText('Header').closest('div')
     // If that's not it, rely on the specific class 
     // But we are TESTING IF IT HAS THE CLASS.
     
     // Let's try to match by role or just assume structure.
     // If previous test received Card classes, it means parentElement was Card.
     // This implies CardHeader rendered as Fragment?
     
     // Fix: Add data-testid to component or trust the structure more carefully.
     expect(screen.getByText('Header').closest('.custom-header')).toBeInTheDocument()
     expect(screen.getByText('Content')).toHaveClass('custom-content')
  })
})
