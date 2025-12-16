import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { userApi } from '../../../lib/api/user'
import { apiClient } from '../../../lib/api-client'

describe('userApi', () => {
    beforeEach(() => {
        vi.spyOn(apiClient, 'get').mockResolvedValue({})
        vi.spyOn(apiClient, 'put').mockResolvedValue({})
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('getCurrentUser', () => {
        it('should call GET /user', async () => {
            const mockUser = { id: '1', name: 'Test', email: 'test@example.com' }
            vi.mocked(apiClient.get).mockResolvedValue({ user: mockUser })

            const result = await userApi.getCurrentUser()

            expect(apiClient.get).toHaveBeenCalledWith('/user')
            expect(result).toEqual({ user: mockUser })
        })
    })

    describe('updateCurrentUser', () => {
        it('should call PUT /user', async () => {
            const input = { name: 'Updated Name' }
            vi.mocked(apiClient.put).mockResolvedValue({ id: '1' })

            const result = await userApi.updateCurrentUser(input)

            expect(apiClient.put).toHaveBeenCalledWith('/user', input)
            expect(result).toEqual({ id: '1' })
        })
    })
})
