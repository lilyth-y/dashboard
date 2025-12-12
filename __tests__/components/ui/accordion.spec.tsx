import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'

describe('Accordion', () => {
    test('renders and toggles content', async () => {
        const user = userEvent.setup()
        render(
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                    <AccordionTrigger>Details</AccordionTrigger>
                    <AccordionContent>Hidden Content</AccordionContent>
                </AccordionItem>
            </Accordion>
        )

        expect(screen.getByText('Details')).toBeInTheDocument()
        
        // Content might be in the DOM but hidden or collapsed.
        // Radix Accordion usually keeps content in DOM but with hidden attribute or height 0.
        // Or it might follow WAIA-ARIA attributes.
        
        await user.click(screen.getByText('Details'))
        
        // Depending on animation/jsdom environment, it might take a moment or need await.
        // Using findByText handles wait.
        const content = await screen.findByText('Hidden Content')
        expect(content).toBeInTheDocument()
    })
})
