import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('Tasks API Integration Tests', () => {
  let testUser: { id: string }
  let testProject: { id: string }
  let testTask: { id: string }

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await import('bcryptjs').then(bcrypt => 
      bcrypt.hash('Test123!@#', 10)
    )
    
    testUser = await prisma.user.create({
      data: {
        email: `tasks-test-${Date.now()}@example.com`,
        password: hashedPassword,
        name: 'Tasks Test User',
        role: 'USER'
      }
    })

    // Create test project
    testProject = await prisma.project.create({
      data: {
        name: 'Tasks Integration Test Project',
        status: 'IN_PROGRESS',
        createdBy: testUser.id,
        members: {
          create: {
            userId: testUser.id,
            role: 'OWNER'
          }
        }
      }
    })
  })

  afterAll(async () => {
    // Clean up
    if (testTask?.id) {
      await prisma.task.delete({ where: { id: testTask.id } }).catch(() => {})
    }
    if (testProject?.id) {
      await prisma.project.delete({ where: { id: testProject.id } }).catch(() => {})
    }
    if (testUser?.id) {
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  describe('Task CRUD Operations', () => {
    it('should create a task', async () => {
      const task = await prisma.task.create({
        data: {
          title: 'Integration Test Task',
          description: 'Test task for integration testing',
          status: 'TODO',
          priority: 'MEDIUM',
          projectId: testProject.id
        }
      })

      expect(task.id).toBeDefined()
      expect(task.title).toBe('Integration Test Task')
      expect(task.status).toBe('TODO')
      expect(task.priority).toBe('MEDIUM')
      
      testTask = task
    })

    it('should assign task to user', async () => {
      const updated = await prisma.task.update({
        where: { id: testTask.id },
        data: { 
          assignedTo: testUser.id
        }
      })

      expect(updated.assignedTo).toBe(testUser.id)
    })

    it('should update task status', async () => {
      const updated = await prisma.task.update({
        where: { id: testTask.id },
        data: { status: 'IN_PROGRESS' }
      })

      expect(updated.status).toBe('IN_PROGRESS')
    })

    it('should set task due date', async () => {
      const dueDate = new Date('2025-12-31')
      const updated = await prisma.task.update({
        where: { id: testTask.id },
        data: { dueDate }
      })

      expect(updated.dueDate).toEqual(dueDate)
    })

    it('should complete task', async () => {
      const updated = await prisma.task.update({
        where: { id: testTask.id },
        data: { 
          status: 'DONE'
        }
      })

      expect(updated.status).toBe('DONE')
    })

    it('should fetch tasks by project', async () => {
      const tasks = await prisma.task.findMany({
        where: { projectId: testProject.id }
      })

      expect(tasks.length).toBeGreaterThan(0)
      expect(tasks[0].projectId).toBe(testProject.id)
    })
  })
})
