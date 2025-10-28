import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import React from 'react'
import { vi } from 'vitest'

import ProfilePage from '@/app/dashboard/profile/page'
import { useAuth } from '@/hooks/use-auth'
import { userApi } from '@/lib/api/user'

// Mock dependencies
vi.mock('@/hooks/use-auth')
vi.mock('@/lib/api/user')

const mockUser = {
  id: 'user1',
  email: 'test@example.com',
  name: 'Test User',
  image: 'https://example.com/avatar.jpg',
  role: 'USER' as const,
}

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isAdmin: false,
      isLoading: false,
    })
  })

  test('renders profile page and loads user data', async () => {
    vi.mocked(userApi.getCurrentUser).mockResolvedValue({ user: mockUser })

    render(<ProfilePage />)

    await waitFor(() => {
      expect(userApi.getCurrentUser).toHaveBeenCalledTimes(1)
    })

    // Check if user data is displayed
    await waitFor(() => {
      const emailInputs = screen.getAllByDisplayValue('test@example.com')
      expect(emailInputs.length).toBeGreaterThan(0)
    })
  })

  test('displays user information correctly', async () => {
    vi.mocked(userApi.getCurrentUser).mockResolvedValue({ user: mockUser })

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
      expect(screen.getByDisplayValue('https://example.com/avatar.jpg')).toBeInTheDocument()
    })
  })

  test('allows user to update name', async () => {
    vi.mocked(userApi.getCurrentUser).mockResolvedValue({ user: mockUser })
    vi.mocked(userApi.updateCurrentUser).mockResolvedValue({ user: { ...mockUser, name: 'Updated Name' } })

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
    })

    // Change name
    const nameInput = screen.getByDisplayValue('Test User')
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } })

    // Save
    const saveButton = screen.getByRole('button', { name: /저장/ })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(userApi.updateCurrentUser).toHaveBeenCalledWith({
        name: 'Updated Name',
        image: 'https://example.com/avatar.jpg',
      })
    })
  })

  test('allows user to update image URL', async () => {
    vi.mocked(userApi.getCurrentUser).mockResolvedValue({ user: mockUser })
    vi.mocked(userApi.updateCurrentUser).mockResolvedValue({ 
      user: { ...mockUser, image: 'https://example.com/new-avatar.jpg' } 
    })

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('https://example.com/avatar.jpg')).toBeInTheDocument()
    })

    // Change image URL
    const imageInput = screen.getByDisplayValue('https://example.com/avatar.jpg')
    fireEvent.change(imageInput, { target: { value: 'https://example.com/new-avatar.jpg' } })

    // Save
    const saveButton = screen.getByRole('button', { name: /저장/ })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(userApi.updateCurrentUser).toHaveBeenCalledWith({
        name: 'Test User',
        image: 'https://example.com/new-avatar.jpg',
      })
    })
  })

  test('email and role fields are disabled', async () => {
    vi.mocked(userApi.getCurrentUser).mockResolvedValue({ user: mockUser })

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    })

    const emailInput = screen.getByDisplayValue('test@example.com')
    const roleInput = screen.getByDisplayValue('USER')

    expect(emailInput).toBeDisabled()
    expect(roleInput).toBeDisabled()
  })

  test('shows loading state during save', async () => {
    vi.mocked(userApi.getCurrentUser).mockResolvedValue({ user: mockUser })
    vi.mocked(userApi.updateCurrentUser).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ user: mockUser }), 100))
    )

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument()
    })

    // Click save button
    const saveButton = screen.getByRole('button', { name: /저장/ })
    fireEvent.click(saveButton)

    // Should show loading text
    await waitFor(() => {
      expect(screen.getByText('저장 중...')).toBeInTheDocument()
    })

    // Wait for save to complete
    await waitFor(() => {
      expect(screen.queryByText('저장 중...')).not.toBeInTheDocument()
    }, { timeout: 200 })
  })

  test('handles error when loading user data fails', async () => {
    vi.mocked(userApi.getCurrentUser).mockRejectedValue(new Error('Failed to load'))

    render(<ProfilePage />)

    await waitFor(() => {
      expect(userApi.getCurrentUser).toHaveBeenCalled()
    })

    // Form should still render but with empty data
    expect(screen.getByText('이메일')).toBeInTheDocument()
    expect(screen.getByText('이름')).toBeInTheDocument()
  })

  test('does not load data when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isAdmin: false,
      isLoading: false,
    })

    render(<ProfilePage />)

    // Should not call API
    expect(userApi.getCurrentUser).not.toHaveBeenCalled()
  })
})
