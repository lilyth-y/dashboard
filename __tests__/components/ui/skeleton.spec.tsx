import { render } from '@testing-library/react'

import { Skeleton } from '@/components/ui/skeleton'

describe('Skeleton', () => {
  test('renders with animation class', () => {
    const { container } = render(<Skeleton className="w-[100px] h-[20px]" />)
    const skeleton = container.firstChild
    expect(skeleton).toHaveClass('animate-pulse')
    expect(skeleton).toHaveClass('bg-muted')
    expect(skeleton).toHaveClass('w-[100px]')
  })
})
