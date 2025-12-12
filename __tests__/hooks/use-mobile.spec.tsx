import { renderHook } from '@testing-library/react'

import { useIsMobile } from '@/hooks/use-mobile'

describe('useIsMobile', () => {
  test('returns false by default (desktop)', () => {
    const { result } = renderHook(() => useIsMobile())
    // Our mock matchMedia defaults to matches: false
    expect(result.current).toBe(false) 
  })

  // Testing the actual media query change might require more complex mocking of matchMedia
  // to trigger the event listener. For basic coverage, ensuring it runs without error is a good start.
  // We can try to mock the window.innerWidth and trigger resize if the hook relies on it,
  // but looking at implementation:
  // It uses matchMedia AND window.innerWidth check inside onChange.
  
  // Implementation recap:
  // setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
  
  test('returns true if window width is small', async () => {
     // Mock window.innerWidth
     Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
     
     // We need to trigger the effect. In many cases, just re-rendering isn't enough if it only runs on mount.
     // But the hook runs setIsMobile(window.innerWidth < ...) inside useEffect on mount.
     
     const { result } = renderHook(() => useIsMobile())
     expect(result.current).toBe(true)
  })
})
