import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    requestProjectDocumentUploadUrl,
    uploadFileToSignedUrl,
    enqueueDocumentProcessing,
    uploadAndEnqueueProjectDocument,
} from '../../lib/documents-client'

describe('Documents Client', () => {
    beforeEach(() => {
        global.fetch = vi.fn()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('requestProjectDocumentUploadUrl', () => {
        it('should request upload url successfully', async () => {
            const mockResponse = {
                documentId: 'doc-123',
                upload: { url: 'http://upload.url', headers: {}, expiresAt: 'future' },
                gcs: { bucket: 'b', objectKey: 'k', uri: 'gs://b/k' }
            }
            vi.mocked(global.fetch).mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            } as any)

            const result = await requestProjectDocumentUploadUrl({
                projectId: 'proj-1',
                filename: 'test.pdf',
                contentType: 'application/pdf',
                sizeBytes: 1000
            })

            expect(result).toEqual(mockResponse)
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/projects/proj-1/documents/upload-url'),
                expect.objectContaining({ method: 'POST' })
            )
        })

        it('should throw error on failure', async () => {
            vi.mocked(global.fetch).mockResolvedValue({
                ok: false,
                json: async () => ({ error: 'Fail' }),
            } as any)

            await expect(requestProjectDocumentUploadUrl({
                projectId: 'p', filename: 'f', contentType: 'c'
            })).rejects.toThrow('Fail')
        })

        it('should throw generic error on failure without message', async () => {
            vi.mocked(global.fetch).mockResolvedValue({
                ok: false,
                json: async () => ({}),
            } as any)

            await expect(requestProjectDocumentUploadUrl({
                projectId: 'p', filename: 'f', contentType: 'c'
            })).rejects.toThrow('Upload URL request failed')
        })
    })

    describe('uploadFileToSignedUrl', () => {
        it('should upload file successfully', async () => {
            vi.mocked(global.fetch).mockResolvedValue({ ok: true } as any)
            const file = new File(['content'], 'test.txt', { type: 'text/plain' })

            await uploadFileToSignedUrl({
                url: 'http://upload.url',
                headers: { 'X-Custom': '1' },
                file
            })

            expect(global.fetch).toHaveBeenCalledWith('http://upload.url', expect.objectContaining({
                method: 'PUT',
                headers: expect.objectContaining({
                    'X-Custom': '1',
                    'Content-Type': 'text/plain'
                }),
                body: file
            }))
        })

        it('should use fallback content type', async () => {
            vi.mocked(global.fetch).mockResolvedValue({ ok: true } as any)
            const file = new File([''], 'test') // no type

            await uploadFileToSignedUrl({
                url: 'u', headers: {}, file
            })

            expect(global.fetch).toHaveBeenCalledWith('u', expect.objectContaining({
                headers: expect.objectContaining({
                    'Content-Type': 'application/octet-stream'
                })
            }))
        })

        it('should throw on upload failure', async () => {
            vi.mocked(global.fetch).mockResolvedValue({ ok: false, status: 500 } as any)
            const file = new File([''], 'f')

            await expect(uploadFileToSignedUrl({
                url: 'u', headers: {}, file
            })).rejects.toThrow('Upload failed (500)')
        })
    })

    describe('enqueueDocumentProcessing', () => {
        it('should enqueue successfully', async () => {
            vi.mocked(global.fetch).mockResolvedValue({ ok: true } as any)

            await enqueueDocumentProcessing('doc-1')

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/documents/doc-1/enqueue'),
                expect.objectContaining({ method: 'POST' })
            )
        })

        it('should throw on failure', async () => {
            vi.mocked(global.fetch).mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => ({ error: 'Bad' })
            } as any)

            await expect(enqueueDocumentProcessing('doc-1')).rejects.toThrow('Bad')
        })

        it('should throw generic error on failure', async () => {
            vi.mocked(global.fetch).mockResolvedValue({
                ok: false,
                status: 400,
                json: async () => Promise.reject()
            } as any)

            await expect(enqueueDocumentProcessing('doc-1')).rejects.toThrow('Enqueue failed (400)')
        })
    })

    describe('uploadAndEnqueueProjectDocument', () => {
        it('should run full flow successfully', async () => {
            // Mock 1: upload url
            vi.mocked(global.fetch).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    documentId: 'doc-id',
                    upload: { url: 'url', headers: {} }
                })
            } as any)

                // Mock 2: upload file (PUT)
                .mockResolvedValueOnce({ ok: true } as any)

                // Mock 3: enqueue (POST)
                .mockResolvedValueOnce({ ok: true } as any)

            const file = new File([''], 'f.txt')
            const result = await uploadAndEnqueueProjectDocument({
                projectId: 'p',
                file
            })

            expect(result.documentId).toBe('doc-id')
            expect(global.fetch).toHaveBeenCalledTimes(3)
        })
    })
})
