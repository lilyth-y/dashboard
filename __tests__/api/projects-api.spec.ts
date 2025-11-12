import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/projects/route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

describe('/api/projects API Routes', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSession: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockSession = null
    mockPrisma = vi.mocked(prisma)
  })

  describe('GET /api/projects', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('인증이 필요합니다.')
    })

    it('should return projects for admin user', async () => {
      const mockProjects = [
        {
          id: '1',
          name: 'Test Project',
          status: 'ACTIVE',
          budget: 100000,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          createdAt: new Date(),
          createdBy: 'admin-id',
          members: [],
        },
      ]

      mockSession = {
        user: { id: 'admin-id', role: 'ADMIN' },
      }

      ;(getServerSession as any).mockResolvedValue(mockSession)
      mockPrisma.project.findMany.mockResolvedValue(mockProjects)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.projects).toHaveLength(1)
      expect(data.projects[0].myRole).toBe('ADMIN')
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: undefined,
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should return only user projects for regular user', async () => {
      const mockProjects = [
        {
          id: '1',
          name: 'My Project',
          status: 'ACTIVE',
          budget: null,
          startDate: null,
          endDate: null,
          createdAt: new Date(),
          createdBy: 'user-id',
          members: [{ role: 'OWNER' }],
        },
      ]

      mockSession = {
        user: { id: 'user-id', role: 'USER' },
      }

      ;(getServerSession as any).mockResolvedValue(mockSession)
      mockPrisma.project.findMany.mockResolvedValue(mockProjects)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.projects[0].myRole).toBe('OWNER')
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith({
        where: {
          members: {
            some: { userId: 'user-id' },
          },
        },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
    })

    it('should handle database errors gracefully', async () => {
      mockSession = {
        user: { id: 'user-id', role: 'USER' },
      }

      ;(getServerSession as any).mockResolvedValue(mockSession)
      mockPrisma.project.findMany.mockRejectedValue(new Error('Database error'))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('서버 오류가 발생했습니다.')
    })
  })

  describe('POST /api/projects', () => {
    it('should return 401 when user is not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Project' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('인증이 필요합니다.')
    })

    it('should return 400 when project name is missing', async () => {
      mockSession = {
        user: { id: 'user-id', role: 'USER' },
      }

      ;(getServerSession as any).mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe('PROJECT_NAME_REQUIRED')
    })

    it('should return 400 when project name is empty', async () => {
      mockSession = {
        user: { id: 'user-id', role: 'USER' },
      }

      ;(getServerSession as any).mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name: '   ' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe('PROJECT_NAME_REQUIRED')
    })

    it('should create project successfully', async () => {
      const mockCreatedProject = { id: 'new-project-id' }

      mockSession = {
        user: { id: 'user-id', role: 'USER' },
      }

      ;(getServerSession as any).mockResolvedValue(mockSession)
      mockPrisma.project.create.mockResolvedValue(mockCreatedProject)

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Project',
          description: 'Project description',
          budget: 50000,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('new-project-id')
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: {
          name: 'New Project',
          description: 'Project description',
          budget: 50000,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          createdBy: 'user-id',
          members: {
            create: [{ userId: 'user-id', role: 'OWNER' }],
          },
        },
        select: { id: true },
      })
    })

    it('should create project with minimal data', async () => {
      const mockCreatedProject = { id: 'minimal-project-id' }

      mockSession = {
        user: { id: 'user-id', role: 'USER' },
      }

      ;(getServerSession as any).mockResolvedValue(mockSession)
      mockPrisma.project.create.mockResolvedValue(mockCreatedProject)

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Minimal Project',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe('minimal-project-id')
      expect(mockPrisma.project.create).toHaveBeenCalledWith({
        data: {
          name: 'Minimal Project',
          description: null,
          budget: null,
          startDate: null,
          endDate: null,
          createdBy: 'user-id',
          members: {
            create: [{ userId: 'user-id', role: 'OWNER' }],
          },
        },
        select: { id: true },
      })
    })

    it('should handle database creation errors', async () => {
      mockSession = {
        user: { id: 'user-id', role: 'USER' },
      }

      ;(getServerSession as any).mockResolvedValue(mockSession)
      mockPrisma.project.create.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Project',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('서버 오류가 발생했습니다.')
    })
  })
})
