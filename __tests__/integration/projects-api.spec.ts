import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('Projects API Integration Tests', () => {
  let testUser: { id: string; email: string }
  let testProject: { id: string }

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await import('bcryptjs').then(bcrypt => 
      bcrypt.hash('Test123!@#', 10)
    )
    
    testUser = await prisma.user.create({
      data: {
        email: `projects-test-${Date.now()}@example.com`,
        password: hashedPassword,
        name: 'Projects Test User',
        role: 'USER'
      }
    })

    // Note: In real integration tests, you'd need to authenticate first
    // This is a simplified version
  })

  afterAll(async () => {
    // Clean up
    if (testProject?.id) {
      await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {})
    }
    if (testUser?.id) {
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  describe('Database Operations', () => {
    it('should create a project in database', async () => {
      const project = await prisma.project.create({
        data: {
          name: 'Integration Test Project',
          description: 'Test project for integration testing',
          status: 'PLANNING',
          createdBy: testUser.id,
          members: {
            create: {
              userId: testUser.id,
              role: 'OWNER'
            }
          }
        }
      })

      expect(project.id).toBeDefined()
      expect(project.name).toBe('Integration Test Project')
      expect(project.status).toBe('PLANNING')
      
      testProject = project
    })

    it('should fetch project with members', async () => {
      const project = await prisma.project.findUnique({
        where: { id: testProject.id },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })

      expect(project).toBeDefined()
      expect(project?.members).toHaveLength(1)
      expect(project?.members[0].userId).toBe(testUser.id)
      expect(project?.members[0].role).toBe('OWNER')
    })

    it('should update project status', async () => {
      const updated = await prisma.project.update({
        where: { id: testProject.id },
        data: { status: 'IN_PROGRESS' }
      })

      expect(updated.status).toBe('IN_PROGRESS')
    })

    it('should add budget to project', async () => {
      const updated = await prisma.project.update({
        where: { id: testProject.id },
        data: { 
          budget: 50000,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31')
        }
      })

      expect(updated.budget).toBe(50000)
      expect(updated.startDate).toBeDefined()
      expect(updated.endDate).toBeDefined()
    })
  })
})
