import { cn } from '@/lib/utils'

describe('utils', () => {
    describe('cn', () => {
        test('merges class names correctly', () => {
            expect(cn('c-1', 'c-2')).toBe('c-1 c-2')
        })

        test('handles conditional classes', () => {
            expect(cn('c-1', true && 'c-2', false && 'c-3')).toBe('c-1 c-2')
        })

        test('merges tailwind classes using tailwind-merge', () => {
            // p-4 should override p-2
            expect(cn('p-2', 'p-4')).toBe('p-4')
            // text-red-500 should override text-blue-500
            expect(cn('text-blue-500', 'text-red-500')).toBe('text-red-500')
        })
    })
})
