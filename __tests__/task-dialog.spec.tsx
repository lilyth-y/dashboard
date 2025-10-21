import { render, screen, fireEvent } from '@testing-library/react'
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
  expect(document.activeElement).toBe(titleInput)

  // Press Enter to save
  fireEvent.keyDown(titleInput, { key: 'Enter' })
  // onSaveTaskFields is debounced through a click on the save button
  // allow microtasks to flush
  await Promise.resolve()
  expect(onSaveTaskFields).toHaveBeenCalled()

  // Press Escape to close
  fireEvent.keyDown(titleInput, { key: 'Escape' })
  expect(onOpenChange).toHaveBeenCalledWith(false)
})
