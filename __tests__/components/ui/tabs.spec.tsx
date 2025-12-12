import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

describe('Tabs', () => {
  test('renders and switches tabs', async () => {
    const user = userEvent.setup()
    render(
      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>
        <TabsContent value="account">Account Content</TabsContent>
        <TabsContent value="password">Password Content</TabsContent>
      </Tabs>
    )

    // Initial state
    expect(screen.getByText('Account Content')).toBeInTheDocument()
    expect(screen.queryByText('Password Content')).not.toBeInTheDocument()

    // Switch tab
    await user.click(screen.getByText('Password'))

    // New state
    expect(screen.queryByText('Account Content')).not.toBeInTheDocument()
    expect(screen.getByText('Password Content')).toBeInTheDocument()
  })
})
