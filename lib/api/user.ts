/**
 * User API Service
 */

import { apiClient } from '../api-client'

export type UserRole = 'USER' | 'ADMIN'

export interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  role: UserRole
}

export interface UpdateUserInput {
  name?: string
  image?: string | null
}

// API methods
export const userApi = {
  /**
   * Get current user
   */
  async getCurrentUser(): Promise<{ user: User }> {
    return apiClient.get<{ user: User }>('/user')
  },

  /**
   * Update current user
   */
  async updateCurrentUser(input: UpdateUserInput): Promise<{ id: string }> {
    return apiClient.put<{ id: string }>('/user', input)
  },
}
