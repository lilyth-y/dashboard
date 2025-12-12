import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Checkbox } from '@/components/ui/checkbox'

describe('Checkbox', () => {
  test('toggles check state', async () => {
     const user = userEvent.setup()
     render(<Checkbox aria-label="Accept terms" />)

     const checkbox = screen.getByRole('checkbox', { name: "Accept terms" })
     expect(checkbox).toBeInTheDocument()
     expect(checkbox).toHaveAttribute('aria-checked', 'false')

     await user.click(checkbox)
     expect(checkbox).toHaveAttribute('aria-checked', 'true')
     
     await user.click(checkbox)
     expect(checkbox).toHaveAttribute('aria-checked', 'false')
  })
})
