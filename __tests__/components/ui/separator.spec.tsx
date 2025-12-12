import { render } from '@testing-library/react'

import { Separator } from '@/components/ui/separator'

describe('Separator', () => {
  test('renders horizontal by default', () => {
    const { container } = render(<Separator />)
    const separator = container.firstChild
    expect(separator).toHaveClass('h-[1px] w-full')
  })

  test('renders vertical', () => {
    const { container } = render(<Separator orientation="vertical" />)
    const separator = container.firstChild
    expect(separator).toHaveClass('h-full w-[1px]')
  })
})
