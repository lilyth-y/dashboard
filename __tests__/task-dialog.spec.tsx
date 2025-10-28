import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react'
import React from 'react'

import { TaskDetailDialog } from '@/app/dashboard/projects/[id]/page'

const dummyTask = {
  id: 't1',
  title: 'Test Task',
  description: '',
  status: 'TODO',
  priority: 'MEDIUM',
  assignedTo: null,
  dueDate: null,
} as const

function Wrapper({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

test('dialog focuses title and supports Enter/Escape', async () => {
  const onOpenChange = vi.fn()
  const onAssign = vi.fn()
  const onDelete = vi.fn()
  const onSaved = vi.fn()
  const onSaveTaskFields = vi.fn().mockResolvedValue(undefined)

  render(
    <Wrapper>
      <TaskDetailDialog
        open
        onOpenChange={onOpenChange}
        task={{ ...dummyTask }}
        canManage={true}
        members={[]}
        onAssign={onAssign}
        onDelete={onDelete}
        onSaved={onSaved}
        onSaveTaskFields={onSaveTaskFields}
      />
    </Wrapper>
  )

  // Focus should be on title input
  const titleInput = screen.getByLabelText('제목') as HTMLInputElement
  expect(titleInput).toBeInTheDocument()
  
  // Wait for focus to be set (happens in useEffect)
  await waitFor(() => {
    expect(document.activeElement).toBe(titleInput)
  })

  // Press Enter to save
  await act(async () => {
    fireEvent.keyDown(titleInput, { key: 'Enter' })
    // allow microtasks to flush
    await Promise.resolve()
  })
  expect(onSaveTaskFields).toHaveBeenCalled()

  // Press Escape to close
  await act(async () => {
    fireEvent.keyDown(titleInput, { key: 'Escape' })
  })
  expect(onOpenChange).toHaveBeenCalledWith(false)
})
