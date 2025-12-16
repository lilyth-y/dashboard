import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import React from 'react'
import { vi } from 'vitest'

import ProjectsPage from '@/app/dashboard/projects/page'
import { useAuth } from '@/hooks/use-auth'
import { projectsApi } from '@/lib/api/projects'

// Mock dependencies
vi.mock('@/hooks/use-auth')
vi.mock('@/lib/api/projects')
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    pathname: '/dashboard/projects',
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard/projects',
}))

const mockProjects = [
  {
    id: 'p1',
    name: 'Test Project 1',
    status: 'ACTIVE' as const,
    budget: 10000,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    createdAt: '2025-01-01T00:00:00Z',
    createdBy: 'user1',
    myRole: 'OWNER' as const,
  },
  {
    id: 'p2',
    name: 'Test Project 2',
    status: 'PLANNING' as const,
    budget: null,
    startDate: null,
    endDate: null,
    createdAt: '2025-01-02T00:00:00Z',
    createdBy: 'user1',
    myRole: 'MEMBER' as const,
  },
]

describe('ProjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user1', email: 'test@example.com', name: 'Test User', role: 'USER' },
      isAuthenticated: true,
      isAdmin: false,
      isUser: true,
      isLoading: false,
    })
  })

  test('renders projects list successfully', async () => {
    vi.mocked(projectsApi.list).mockResolvedValue({ projects: mockProjects })

    render(<ProjectsPage />)

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument()
      expect(screen.getByText('Test Project 2')).toBeInTheDocument()
    })

    expect(projectsApi.list).toHaveBeenCalledTimes(1)
  }, 15000)

  test('displays project details correctly', async () => {
    vi.mocked(projectsApi.list).mockResolvedValue({ projects: mockProjects })

    render(<ProjectsPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument()
    })

    // Check status is displayed
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
    expect(screen.getByText('PLANNING')).toBeInTheDocument()

    // Check budget is displayed
    expect(screen.getByText(/예산: 10000/)).toBeInTheDocument()
    expect(screen.getByText(/예산: -/)).toBeInTheDocument()
  })

  test('shows manage buttons for owner/manager roles', async () => {
    vi.mocked(projectsApi.list).mockResolvedValue({ projects: mockProjects })

    render(<ProjectsPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument()
    })

    // Should show edit/delete buttons for OWNER role project
    const editButtons = screen.getAllByText('편집')
    const deleteButtons = screen.getAllByText('삭제')
    
    // Project 1 (OWNER) should have edit and delete buttons
    expect(editButtons.length).toBeGreaterThan(0)
    expect(deleteButtons.length).toBeGreaterThan(0)
  })

  test('handles loading state', async () => {
    vi.mocked(projectsApi.list).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ projects: mockProjects }), 100))
    )

    render(<ProjectsPage />)

    // Should show loading text
    expect(screen.getByText('로딩 중...')).toBeInTheDocument()

    // Wait for projects to load
    await waitFor(() => {
      expect(screen.queryByText('로딩 중...')).not.toBeInTheDocument()
    })
  })

  test('handles error when loading projects fails', async () => {
    vi.mocked(projectsApi.list).mockRejectedValue(new Error('Failed to load'))

    render(<ProjectsPage />)

    await waitFor(() => {
      expect(projectsApi.list).toHaveBeenCalled()
    })

    // Projects list should be empty
    expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument()
  })

  test('admin can manage all projects', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'admin1', email: 'admin@example.com', name: 'Admin User', role: 'ADMIN' },
      isAuthenticated: true,
      isAdmin: true,
      isUser: false,
      isLoading: false,
    })
    vi.mocked(projectsApi.list).mockResolvedValue({ projects: mockProjects })

    render(<ProjectsPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument()
    })

    // Admin should see manage buttons for all projects
    const editButtons = screen.getAllByText('편집')
    const deleteButtons = screen.getAllByText('삭제')
    
    // Should have buttons for both projects
    expect(editButtons.length).toBeGreaterThanOrEqual(2)
    expect(deleteButtons.length).toBeGreaterThanOrEqual(2)
  })

  test('creates new project successfully', async () => {
    vi.mocked(projectsApi.list).mockResolvedValue({ projects: [] })
    vi.mocked(projectsApi.create).mockResolvedValue({ id: 'p3' })

    render(<ProjectsPage />)

    // Open create dialog
    const createButton = screen.getByText('새 프로젝트')
    fireEvent.click(createButton)

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText('프로젝트 생성')).toBeInTheDocument()
    })

    // Fill in project name - use getByPlaceholderText or find by role
    const inputs = screen.getAllByRole('textbox')
    const nameInput = inputs[0] // First textbox in the dialog
    fireEvent.change(nameInput, { target: { value: 'New Project' } })

    // Submit
    const submitButton = screen.getByRole('button', { name: /생성$/ })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(projectsApi.create).toHaveBeenCalledWith({
        name: 'New Project',
        description: '',
        budget: undefined,
        startDate: undefined,
        endDate: undefined,
      })
    })
  })

  test('deletes project successfully', async () => {
    vi.mocked(projectsApi.list).mockResolvedValue({ projects: mockProjects })
    vi.mocked(projectsApi.delete).mockResolvedValue({ ok: true })

    render(<ProjectsPage />)

    await waitFor(() => {
      expect(screen.getByText('Test Project 1')).toBeInTheDocument()
    })

    // Click delete button for first project
    const deleteButtons = screen.getAllByText('삭제')
    fireEvent.click(deleteButtons[0])

    await waitFor(() => {
      expect(projectsApi.delete).toHaveBeenCalledWith('p1')
    })
  })
})
