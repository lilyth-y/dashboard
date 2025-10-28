/**
 * Milestones API Service
 */

import { apiClient } from '../api-client'

export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'

export interface Milestone {
  id: string
  title: string
  description: string | null
  status: MilestoneStatus
  dueDate: string
  projectId: string
  createdAt: string
}

export interface CreateMilestoneInput {
  title: string
  description?: string
  dueDate: string
}

export interface UpdateMilestoneInput {
  title?: string
  description?: string | null
  status?: MilestoneStatus
  dueDate?: string
}

// API methods
export const milestonesApi = {
  /**
   * Get all milestones for a project
   */
  async list(projectId: string): Promise<{ milestones: Milestone[] }> {
    return apiClient.get<{ milestones: Milestone[] }>(`/projects/${projectId}/milestones`)
  },

  /**
   * Get milestone by ID
   */
  async get(milestoneId: string): Promise<{ milestone: Milestone }> {
    return apiClient.get<{ milestone: Milestone }>(`/milestones/${milestoneId}`)
  },

  /**
   * Create new milestone
   */
  async create(projectId: string, input: CreateMilestoneInput): Promise<{ id: string }> {
    return apiClient.post<{ id: string }>(`/projects/${projectId}/milestones`, input)
  },

  /**
   * Update milestone
   */
  async update(milestoneId: string, input: UpdateMilestoneInput): Promise<{ ok: boolean }> {
    return apiClient.put<{ ok: boolean }>(`/milestones/${milestoneId}`, input)
  },

  /**
   * Delete milestone
   */
  async delete(milestoneId: string): Promise<{ ok: boolean }> {
    return apiClient.delete<{ ok: boolean }>(`/milestones/${milestoneId}`)
  },

  /**
   * Update milestone status
   */
  async updateStatus(milestoneId: string, status: MilestoneStatus): Promise<{ ok: boolean }> {
    return apiClient.put<{ ok: boolean }>(`/milestones/${milestoneId}`, { status })
  },
}
