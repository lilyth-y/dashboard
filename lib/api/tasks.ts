/**
 * Tasks API Service
 */

import { apiClient } from '../api-client'

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  assignedTo: string | null
  dueDate: string | null
  projectId: string
  createdAt: string
  createdBy: string
}

export interface CreateTaskInput {
  title: string
  description?: string
  priority?: Priority
  dueDate?: string | null
  assignedTo?: string | null
}

export interface UpdateTaskInput {
  title?: string
  description?: string | null
  status?: TaskStatus
  priority?: Priority
  assignedTo?: string | null
  dueDate?: string | null
}

// API methods
export const tasksApi = {
  /**
   * Get all tasks for a project
   */
  async list(projectId: string): Promise<{ tasks: Task[] }> {
    return apiClient.get<{ tasks: Task[] }>(`/projects/${projectId}/tasks`)
  },

  /**
   * Get task by ID
   */
  async get(taskId: string): Promise<{ task: Task }> {
    return apiClient.get<{ task: Task }>(`/tasks/${taskId}`)
  },

  /**
   * Create new task
   */
  async create(projectId: string, input: CreateTaskInput): Promise<{ id: string }> {
    return apiClient.post<{ id: string }>(`/projects/${projectId}/tasks`, input)
  },

  /**
   * Update task
   */
  async update(taskId: string, input: UpdateTaskInput): Promise<{ ok: boolean }> {
    return apiClient.put<{ ok: boolean }>(`/tasks/${taskId}`, input)
  },

  /**
   * Delete task
   */
  async delete(taskId: string): Promise<{ ok: boolean }> {
    return apiClient.delete<{ ok: boolean }>(`/tasks/${taskId}`)
  },

  /**
   * Assign task to user
   */
  async assign(taskId: string, userId: string | null): Promise<{ ok: boolean }> {
    return apiClient.put<{ ok: boolean }>(`/tasks/${taskId}`, { assignedTo: userId })
  },

  /**
   * Update task status
   */
  async updateStatus(taskId: string, status: TaskStatus): Promise<{ ok: boolean }> {
    return apiClient.put<{ ok: boolean }>(`/tasks/${taskId}`, { status })
  },
}
