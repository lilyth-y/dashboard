import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { projectsApi } from '../../../lib/api/projects'
import { apiClient } from '../../../lib/api-client'

describe('projectsApi', () => {
    beforeEach(() => {
        vi.spyOn(apiClient, 'get').mockResolvedValue({})
        vi.spyOn(apiClient, 'post').mockResolvedValue({})
        vi.spyOn(apiClient, 'put').mockResolvedValue({})
        vi.spyOn(apiClient, 'delete').mockResolvedValue({})
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('list', () => {
        it('should call GET /projects', async () => {
            const mockProjects = [{ id: '1', name: 'Test' }]
            vi.mocked(apiClient.get).mockResolvedValue({ projects: mockProjects })

            const result = await projectsApi.list()

            expect(apiClient.get).toHaveBeenCalledWith('/projects')
            expect(result).toEqual({ projects: mockProjects })
        })
    })

    describe('get', () => {
        it('should call GET /projects/:id', async () => {
            const mockProject = { id: '1', name: 'Test' }
            vi.mocked(apiClient.get).mockResolvedValue({ project: mockProject })

            const result = await projectsApi.get('1')

            expect(apiClient.get).toHaveBeenCalledWith('/projects/1')
            expect(result).toEqual({ project: mockProject })
        })
    })

    describe('create', () => {
        it('should call POST /projects', async () => {
            const input = { name: 'New Project' }
            vi.mocked(apiClient.post).mockResolvedValue({ id: '1' })

            const result = await projectsApi.create(input)

            expect(apiClient.post).toHaveBeenCalledWith('/projects', input)
            expect(result).toEqual({ id: '1' })
        })
    })

    describe('update', () => {
        it('should call PUT /projects/:id', async () => {
            const input = { name: 'Updated' }
            vi.mocked(apiClient.put).mockResolvedValue({ ok: true })

            const result = await projectsApi.update('1', input)

            expect(apiClient.put).toHaveBeenCalledWith('/projects/1', input)
            expect(result).toEqual({ ok: true })
        })
    })

    describe('delete', () => {
        it('should call DELETE /projects/:id', async () => {
            vi.mocked(apiClient.delete).mockResolvedValue({ ok: true })

            const result = await projectsApi.delete('1')

            expect(apiClient.delete).toHaveBeenCalledWith('/projects/1')
            expect(result).toEqual({ ok: true })
        })
    })

    describe('getMembers', () => {
        it('should call GET /projects/:id/members', async () => {
            const mockMembers = [{ userId: 'u1', role: 'OWNER' }]
            vi.mocked(apiClient.get).mockResolvedValue({ members: mockMembers })

            const result = await projectsApi.getMembers('p1')

            expect(apiClient.get).toHaveBeenCalledWith('/projects/p1/members')
            expect(result).toEqual({ members: mockMembers })
        })
    })

    describe('addMember', () => {
        it('should call POST /projects/:id/members', async () => {
            const input = { email: 'test@example.com', role: 'MEMBER' as const }
            vi.mocked(apiClient.post).mockResolvedValue({ userId: 'u1' })

            const result = await projectsApi.addMember('p1', input)

            expect(apiClient.post).toHaveBeenCalledWith('/projects/p1/members', input)
            expect(result).toEqual({ userId: 'u1' })
        })
    })

    describe('updateMemberRole', () => {
        it('should call PUT /projects/:id/members/:userId', async () => {
            const input = { role: 'MANAGER' as const }
            vi.mocked(apiClient.put).mockResolvedValue({ ok: true })

            const result = await projectsApi.updateMemberRole('p1', 'u1', input)

            expect(apiClient.put).toHaveBeenCalledWith('/projects/p1/members/u1', input)
            expect(result).toEqual({ ok: true })
        })
    })

    describe('removeMember', () => {
        it('should call DELETE /projects/:id/members/:userId', async () => {
            vi.mocked(apiClient.delete).mockResolvedValue({ ok: true })

            const result = await projectsApi.removeMember('p1', 'u1')

            expect(apiClient.delete).toHaveBeenCalledWith('/projects/p1/members/u1')
            expect(result).toEqual({ ok: true })
        })
    })
})
