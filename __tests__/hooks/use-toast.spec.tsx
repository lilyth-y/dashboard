import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast, toast } from '@/hooks/use-toast'

describe('useToast', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('should add toast', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        toast({ title: 'Test Toast' })
      })

      expect(result.current.toasts).toHaveLength(1)
      expect(result.current.toasts[0].title).toBe('Test Toast')
      expect(result.current.toasts[0].open).toBe(true)
    })
    
    it('should update toast', () => {
      const { result } = renderHook(() => useToast())
      let id: string
      
      act(() => {
         const t = toast({ title: 'Original' })
         id = t.id
         t.update({ id, title: 'Updated' })
      })
      
      expect(result.current.toasts[0].title).toBe('Updated')
    })

    it('should dismiss toast', () => {
      const { result } = renderHook(() => useToast())
      let dismiss: () => void

      act(() => {
        const t = toast({ title: 'To Dismiss' })
        dismiss = t.dismiss
      })

      act(() => {
        dismiss()
      })

      expect(result.current.toasts[0].open).toBe(false)
      
      // Fast forward to remove
      act(() => {
          vi.runAllTimers()
      })
      
      expect(result.current.toasts).toHaveLength(0)
    })
    
     it('should dismiss toast via hook', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        toast({ title: 'To Dismiss Hook' })
      })
      
      const id = result.current.toasts[0].id

      act(() => {
        result.current.dismiss(id)
      })

      expect(result.current.toasts[0].open).toBe(false)
    })
    
     it('should dismiss all toasts via hook without id', () => {
      const { result } = renderHook(() => useToast())

      act(() => {
        toast({ title: 'T1' })
        toast({ title: 'T2' })
      })
      
      // Note: TOAST_LIMIT is 1 in the code, so we might only have 1 toast actually.
      // Checking limit
       expect(result.current.toasts).toHaveLength(1)

      act(() => {
        result.current.dismiss()
      })

       expect(result.current.toasts[0].open).toBe(false)
    })
    
    it('should handle onOpenChange callback', () => {
        const { result } = renderHook(() => useToast())
        
        act(() => {
            const { id } = toast({ title: 'Callback Test' })
             // Find the toast and manually trigger onOpenChange (simulating UI interaction)
             // But we can't easily access the internal function created in useToast...
             // Wait, toast() returns { id, dismiss, update }.
             
             // The toast object in state has onOpenChange.
        })
        
        const t = result.current.toasts[0]
        expect(typeof t.onOpenChange).toBe('function')
        
        act(() => {
            t.onOpenChange?.(false)
        })
        
        expect(result.current.toasts[0].open).toBe(false)
    })
})
