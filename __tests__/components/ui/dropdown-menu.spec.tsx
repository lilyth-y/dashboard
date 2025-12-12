import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

describe('DropdownMenu', () => {
  test('opens menu on click', async () => {
    const user = userEvent.setup()
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem>Profile</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    // Check Trigger
    expect(screen.getByText('Open Menu')).toBeInTheDocument()

    // Menu Item should not be visible
    expect(screen.queryByText('Profile')).not.toBeInTheDocument()

    // Click trigger
    await user.click(screen.getByText('Open Menu'))

    // Menu Item should be visible
    expect(await screen.findByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('My Account')).toBeInTheDocument()
  })
})
