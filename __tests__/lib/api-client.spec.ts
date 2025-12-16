import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiClient, apiClient } from '../../lib/api-client'
import { ApiError } from '../../lib/api-error'

describe('ApiClient', () => {
    const baseUrl = '/api'
    let client: ApiClient

    beforeEach(() => {
        client = new ApiClient(baseUrl)
        global.fetch = vi.fn()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('constructor', () => {
        it('should create instance with default base url', () => {
            const defaultClient = new ApiClient()
            expect(defaultClient).toBeInstanceOf(ApiClient)
        })

        it('should use provided base url', () => {
            expect(client).toBeInstanceOf(ApiClient)
        })
    })

    describe('HTTP Methods', () => {
        const mockData = { id: 1, name: 'Test' }
        const mockResponse = {
            ok: true,
            headers: { get: () => 'application/json' },
            json: async () => mockData,
        }

        it('GET: should make correct request and return data', async () => {
            vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

            const result = await client.get('/test')

            expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/test`, {
                method: 'GET',
            })
            expect(result).toEqual(mockData)
        })

        it('POST: should send body and return data', async () => {
            vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)
            const body = { name: 'New Item' }

            const result = await client.post('/test', body)

            expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            })
            expect(result).toEqual(mockData)
        })

        it('PUT: should update data', async () => {
            vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)
            const body = { name: 'Updated Item' }

            const result = await client.put('/test', body)

            expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/test`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            })
            expect(result).toEqual(mockData)
        })

        it('PATCH: should partial update data', async () => {
            vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)
            const body = { name: 'Patched Item' }

            const result = await client.patch('/test', body)

            expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/test`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            })
            expect(result).toEqual(mockData)
        })

        it('DELETE: should delete resource', async () => {
            vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)

            const result = await client.delete('/test')

            expect(global.fetch).toHaveBeenCalledWith(`${baseUrl}/test`, {
                method: 'DELETE',
            })
            expect(result).toEqual(mockData)
        })

        it('should handle custom headers', async () => {
            vi.mocked(global.fetch).mockResolvedValue(mockResponse as any)
            const headers = { 'X-Custom': 'value' }

            await client.get('/test', { headers })

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/test'),
                expect.objectContaining({
                    headers: expect.objectContaining(headers),
                })
            )
        })
    })

    describe('Error Handling', () => {
        it('should throw ApiError on non-ok json response', async () => {
            const errorResponse = {
                ok: false,
                status: 400,
                headers: { get: () => 'application/json' },
                json: async () => ({ error: 'Bad Request', code: 'INVALID_INPUT' }),
            }
            vi.mocked(global.fetch).mockResolvedValue(errorResponse as any)

            await expect(client.get('/test')).rejects.toThrow('Bad Request')
            await expect(client.get('/test')).rejects.toMatchObject({
                statusCode: 400,
                code: 'INVALID_INPUT',
            })
        })

        it('should use default error message if json error is empty', async () => {
            const errorResponse = {
                ok: false,
                status: 500,
                headers: { get: () => 'application/json' },
                json: async () => ({}),
            }
            vi.mocked(global.fetch).mockResolvedValue(errorResponse as any)

            await expect(client.get('/test')).rejects.toThrow('요청 처리 중 오류가 발생했습니다.')
        })

        it('should throw ApiError on non-ok text response', async () => {
            const errorResponse = {
                ok: false,
                status: 404,
                statusText: 'Not Found',
                headers: { get: () => 'text/plain' },
            }
            vi.mocked(global.fetch).mockResolvedValue(errorResponse as any)

            await expect(client.get('/test')).rejects.toThrow('Not Found')
        })

        it('should throw default error if non-ok text response statusText is missing', async () => {
            const errorResponse = {
                ok: false,
                status: 404,
                statusText: '',
                headers: { get: () => 'text/plain' },
            }
            vi.mocked(global.fetch).mockResolvedValue(errorResponse as any)

            await expect(client.get('/test')).rejects.toThrow('요청 처리 중 오류가 발생했습니다.')
        })

        it('should handle json parsing error in error response', async () => {
            const errorResponse = {
                ok: false,
                status: 500,
                headers: { get: () => 'application/json' },
                json: async () => { throw new Error('Parse error') },
            }
            vi.mocked(global.fetch).mockResolvedValue(errorResponse as any)

            await expect(client.get('/test')).rejects.toThrow('요청 처리 중 오류가 발생했습니다.')
        })

        it('should rethrow if error parsing throws ApiError (edge case)', async () => {
            // This is unlikely in real fetch usage but covers the "if (e instanceof ApiError) throw e" line
            // if we decide to mock .json() to throw an ApiError for some reason
            const innerError = new ApiError(418, 'I am a teapot')
            const errorResponse = {
                ok: false,
                status: 500,
                headers: { get: () => 'application/json' },
                json: async () => { throw innerError },
            }
            vi.mocked(global.fetch).mockResolvedValue(errorResponse as any)

            await expect(client.get('/test')).rejects.toThrow('I am a teapot')
        })
    })

    describe('Response Handling', () => {
        it('should return empty object for non-json successful response', async () => {
            const response = {
                ok: true,
                status: 204,
                headers: { get: () => null },
            }
            vi.mocked(global.fetch).mockResolvedValue(response as any)

            const result = await client.get('/test')
            expect(result).toEqual({})
        })
    })

    describe('Singleton Instance', () => {
        it('should export a singleton instance', () => {
            expect(apiClient).toBeInstanceOf(ApiClient)
        })
    })
})
