import { render, screen } from '@testing-library/react'
import React from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

describe('UI Components', () => {
  describe('Button', () => {
    test('renders button with text', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    test('renders button with variant', () => {
      render(<Button variant="destructive">Delete</Button>)
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })
  })

  describe('Input', () => {
    test('renders input with value', () => {
      render(<Input value="test" readOnly />)
      expect(screen.getByDisplayValue('test')).toBeInTheDocument()
    })

    test('renders input with placeholder', () => {
      render(<Input placeholder="Enter text" />)
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })
  })

  describe('Label', () => {
    test('renders label with text', () => {
      render(<Label>Username</Label>)
      expect(screen.getByText('Username')).toBeInTheDocument()
    })
  })

  describe('Card', () => {
    test('renders card with all parts', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>Card Content</CardContent>
          <CardFooter>Card Footer</CardFooter>
        </Card>
      )

      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card Description')).toBeInTheDocument()
      expect(screen.getByText('Card Content')).toBeInTheDocument()
      expect(screen.getByText('Card Footer')).toBeInTheDocument()
    })
  })
})
