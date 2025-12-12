import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'

describe('Dialog', () => {
    // Basic render test for trigger
    test('renders trigger', () => {
        render(
            <Dialog>
                <DialogTrigger>Open</DialogTrigger>
                <DialogContent>Content</DialogContent>
            </Dialog>
        )
        expect(screen.getByText('Open')).toBeInTheDocument()
    })

    // Interaction test
    test('opens content when trigger is clicked', async () => {
        const user = userEvent.setup()
        render(
            <Dialog>
                <DialogTrigger>Open</DialogTrigger>
                <DialogContent>
                    <DialogTitle>Title</DialogTitle>
                    <DialogDescription>Description</DialogDescription>
                    <div>Content Body</div>
                </DialogContent>
            </Dialog>
        )
        
        // Content should not be visible initially
        expect(screen.queryByText('Content Body')).not.toBeInTheDocument()

        // Click trigger
        await user.click(screen.getByText('Open'))

        // Content should be visible
        // Note: Radix UI renders in a Portal, so it should appear in the document body
        expect(await screen.findByText('Content Body')).toBeInTheDocument()
        expect(screen.getByText('Title')).toBeInTheDocument()
    })
})
