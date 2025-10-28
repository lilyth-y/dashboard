/**
 * Projects API Service
 */

import { apiClient } from '../api-client'

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
export type ProjectMemberRole = 'OWNER' | 'MANAGER' | 'MEMBER'

export interface Project {
  id: string
  name: string
  description?: string | null
  status: ProjectStatus
  budget?: number | null
  startDate?: string | null
  endDate?: string | null
  createdAt: string
  createdBy: string
  myRole?: ProjectMemberRole
}

export interface ProjectMember {
  userId: string
  role: ProjectMemberRole
  joinedAt: string
  user: {
    name: string | null
    email: string
    image: string | null
  } | null
}

export interface CreateProjectInput {
  name: string
  description?: string
  budget?: number
  startDate?: string
  endDate?: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  status?: ProjectStatus
  budget?: number
  startDate?: string
  endDate?: string
}

export interface AddMemberInput {
  email: string
  role: ProjectMemberRole
}

export interface UpdateMemberRoleInput {
  role: ProjectMemberRole
}

// API methods
export const projectsApi = {
  /**
   * Get all projects
   */
  async list(): Promise<{ projects: Project[] }> {
    return apiClient.get<{ projects: Project[] }>('/projects')
  },

  /**
   * Get project by ID
   */
  async get(id: string): Promise<{ project: Project }> {
    return apiClient.get<{ project: Project }>(`/projects/${id}`)
  },

  /**
   * Create new project
   */
  async create(input: CreateProjectInput): Promise<{ id: string }> {
    return apiClient.post<{ id: string }>('/projects', input)
  },

  /**
   * Update project
   */
  async update(id: string, input: UpdateProjectInput): Promise<{ ok: boolean }> {
    return apiClient.put<{ ok: boolean }>(`/projects/${id}`, input)
  },

  /**
   * Delete project
   */
  async delete(id: string): Promise<{ ok: boolean }> {
    return apiClient.delete<{ ok: boolean }>(`/projects/${id}`)
  },

  /**
   * Get project members
   */
  async getMembers(projectId: string): Promise<{ members: ProjectMember[] }> {
    return apiClient.get<{ members: ProjectMember[] }>(`/projects/${projectId}/members`)
  },

  /**
   * Add member to project
   */
  async addMember(projectId: string, input: AddMemberInput): Promise<{ userId: string }> {
    return apiClient.post<{ userId: string }>(`/projects/${projectId}/members`, input)
  },

  /**
   * Update member role
   */
  async updateMemberRole(
    projectId: string,
    userId: string,
    input: UpdateMemberRoleInput
  ): Promise<{ ok: boolean }> {
    return apiClient.put<{ ok: boolean }>(`/projects/${projectId}/members/${userId}`, input)
  },

  /**
   * Remove member from project
   */
  async removeMember(projectId: string, userId: string): Promise<{ ok: boolean }> {
    return apiClient.delete<{ ok: boolean }>(`/projects/${projectId}/members/${userId}`)
  },
}
