import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Switch } from '@/components/ui/switch'

describe('Switch', () => {
  test('toggles state', async () => {
    const user = userEvent.setup()
    render(<Switch aria-label="Toggle mode" />)
    
    const switchEl = screen.getByRole('switch', { name: "Toggle mode" })
    expect(switchEl).toBeInTheDocument()
    expect(switchEl).toHaveAttribute('aria-checked', 'false')

    await user.click(switchEl)
    expect(switchEl).toHaveAttribute('aria-checked', 'true')
    
    await user.click(switchEl)
    expect(switchEl).toHaveAttribute('aria-checked', 'false')
  })
})
